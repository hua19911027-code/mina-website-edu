/* GET    /api/v1/admin/settings              — 讀取 Admin 設定（從 KV）
   PUT    /api/v1/admin/settings              — 寫入 Admin 設定（至 KV）
   POST   /api/v1/admin/practice/regenerate  — 觸發 n8n 重新出題 webhook
   POST   /api/v1/admin/exam-review/generate — 生成考前複習卷並存入 KV
   DELETE /api/v1/admin/cache                — 清除 KV_CACHE 所有快取
   DELETE /api/v1/admin/cache/:prefix        — 清除指定前綴快取（news/practice）
   所有路由需 X-Admin-Secret header */

import { Hono } from 'hono';
import type { Bindings, ExamQuestion, ExamReviewState } from '../types';
import * as notion from '../adapters/notion';

const KV_KEY = 'admin_settings';

interface AdminSettings {
  reviewModeEnabled: boolean;
  notionPracticeDbId: string;    // 網站讀題用（A3 每年 8/1 切換）
  notionPracticeGenDbId: string; // A1 出題寫入用（A2 每年 7/10 切換）
}

const DEFAULT_SETTINGS: AdminSettings = {
  reviewModeEnabled: false,
  notionPracticeDbId: '',
  notionPracticeGenDbId: '',
};

const ADMIN_RATE_LIMIT = 10;
const ADMIN_RATE_WINDOW_SECS = 3600;

const route = new Hono<{ Bindings: Bindings }>();

/* ── Auth middleware（含 IP 限流） ── */
route.use('*', async (c, next) => {
  const ip = c.req.header('CF-Connecting-IP') ?? 'unknown';
  const rlKey = `ratelimit:admin:${ip}`;
  const raw = await c.env.KV_RATE_LIMIT.get(rlKey);
  const failures = raw ? parseInt(raw, 10) : 0;

  if (failures >= ADMIN_RATE_LIMIT) {
    return c.json({ ok: false, error: { code: 'RATE_LIMITED', message: '嘗試次數過多，請 1 小時後再試' } }, 429);
  }

  const secret = c.req.header('X-Admin-Secret');
  if (!secret || secret !== c.env.ADMIN_SECRET) {
    await c.env.KV_RATE_LIMIT.put(rlKey, String(failures + 1), { expirationTtl: ADMIN_RATE_WINDOW_SECS });
    return c.json({ ok: false, error: { code: 'UNAUTHORIZED', message: 'Invalid admin secret' } }, 401);
  }

  return next();
});

/* GET /settings */
route.get('/settings', async (c) => {
  const raw = await c.env.KV_SETTINGS.get(KV_KEY);
  const settings: AdminSettings = raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
  return c.json({ ok: true, data: settings });
});

/* PUT /settings */
route.put('/settings', async (c) => {
  let body: Partial<AdminSettings>;
  try {
    body = await c.req.json<Partial<AdminSettings>>();
  } catch {
    return c.json({ ok: false, error: { code: 'BAD_REQUEST', message: 'Invalid JSON body' } }, 400);
  }

  const raw = await c.env.KV_SETTINGS.get(KV_KEY);
  const current: AdminSettings = raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };

  const updated: AdminSettings = {
    reviewModeEnabled: typeof body.reviewModeEnabled === 'boolean' ? body.reviewModeEnabled : current.reviewModeEnabled,
    notionPracticeDbId: (typeof body.notionPracticeDbId === 'string' && body.notionPracticeDbId.trim())
      ? body.notionPracticeDbId.trim() : current.notionPracticeDbId,
    notionPracticeGenDbId: (typeof body.notionPracticeGenDbId === 'string' && body.notionPracticeGenDbId.trim())
      ? body.notionPracticeGenDbId.trim() : current.notionPracticeGenDbId,
  };

  await c.env.KV_SETTINGS.put(KV_KEY, JSON.stringify(updated));
  return c.json({ ok: true, data: updated });
});

/* POST /practice/regenerate */
route.post('/practice/regenerate', async (c) => {
  const webhookUrl = c.env.N8N_REGEN_WEBHOOK;
  if (!webhookUrl) {
    return c.json({ ok: false, error: { code: 'NOT_CONFIGURED', message: 'N8N_REGEN_WEBHOOK secret not set' } }, 503);
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ triggeredAt: new Date().toISOString(), source: 'admin-panel' }),
    });

    if (res.ok || res.status === 202) {
      return c.json({ ok: true, data: { message: 'Regeneration triggered', status: res.status } });
    }
    return c.json({ ok: false, error: { code: 'WEBHOOK_ERROR', message: `n8n responded with ${res.status}` } }, 502);
  } catch (e) {
    return c.json({ ok: false, error: { code: 'FETCH_ERROR', message: String(e) } }, 502);
  }
});

/* POST /exam-review/generate */

const GRADES = ['小一','小二','小三','小四','小五','小六'];
const EXAM_SUBJECTS = ['英文','數學'] as const;
const QUESTIONS_PER_PAPER = 20;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function extractExamQuestions(results: unknown[]): ExamQuestion[] {
  return (results as Record<string, unknown>[])
    .map((page) => {
      const props = page['properties'] as Record<string, unknown>;
      function text(name: string): string {
        const p = (props[name] as Record<string, unknown>) || {};
        const arr = (p['rich_text'] ?? p['title']) as Array<{ plain_text: string }> | undefined;
        return arr ? arr.map((t) => t.plain_text).join('') : '';
      }
      function sel(name: string): string {
        const p = (props[name] as Record<string, unknown>) || {};
        const s = p['select'] as Record<string, unknown> | null | undefined;
        return s ? (s['name'] as string) || '' : '';
      }
      const q: ExamQuestion = {
        id: (page['id'] as string) || '',
        question: text('題目'),
        optionA: text('選項A'),
        optionB: text('選項B'),
        optionC: text('選項C'),
        optionD: text('選項D'),
        answer: sel('答案'),
      };
      return q;
    })
    .filter((q) => q.question && q.optionA);
}

function buildNotionBlocks(questions: ExamQuestion[]): unknown[] {
  const blocks: unknown[] = [];
  questions.forEach((q, i) => {
    blocks.push({
      type: 'paragraph',
      paragraph: { rich_text: [{ type: 'text', text: { content: `${i + 1}. ${q.question}` }, annotations: { bold: true } }] },
    });
    ['A','B','C','D'].forEach((opt) => {
      blocks.push({
        type: 'bulleted_list_item',
        bulleted_list_item: { rich_text: [{ type: 'text', text: { content: `(${opt}) ${q[`option${opt}` as keyof ExamQuestion]}` } }] },
      });
    });
    blocks.push({
      type: 'paragraph',
      paragraph: { rich_text: [{ type: 'text', text: { content: `答案：${q.answer}` }, annotations: { color: 'gray' as const } }] },
    });
    blocks.push({ type: 'divider', divider: {} });
  });
  return blocks;
}

route.post('/exam-review/generate', async (c) => {
  let body: { examName: string; openAt: string; closeAt: string; rangeStart: string; rangeEnd: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ ok: false, error: { code: 'BAD_REQUEST', message: 'Invalid JSON' } }, 400);
  }
  const { examName, openAt, closeAt, rangeStart, rangeEnd } = body;
  if (!examName || !openAt || !closeAt || !rangeStart || !rangeEnd) {
    return c.json({ ok: false, error: { code: 'MISSING_PARAMS', message: '缺少必要欄位' } }, 400);
  }

  const papers: ExamReviewState['papers'] = {};

  for (const grade of GRADES) {
    papers[grade] = {};
    for (const subject of EXAM_SUBJECTS) {
      /* 1. 優先抓範圍內 */
      const rangeFilter = {
        and: [
          { property: '年級', select: { equals: grade } },
          { property: '科目', select: { equals: subject } },
          { property: '發布日期', date: { on_or_after: rangeStart } },
          { property: '發布日期', date: { on_or_before: rangeEnd } },
        ],
      };
      const rangeResult = await notion.queryDatabase(
        c.env.NOTION_API_KEY, c.env.NOTION_PRACTICE_DB_ID,
        { filter: rangeFilter, page_size: 100 }
      );
      let questions = extractExamQuestions(rangeResult.results as unknown[]);

      /* 2. 不足時往前補 */
      if (questions.length < QUESTIONS_PER_PAPER) {
        const needed = QUESTIONS_PER_PAPER - questions.length;
        const fallbackFilter = {
          and: [
            { property: '年級', select: { equals: grade } },
            { property: '科目', select: { equals: subject } },
            { property: '發布日期', date: { before: rangeStart } },
          ],
        };
        const fallbackResult = await notion.queryDatabase(
          c.env.NOTION_API_KEY, c.env.NOTION_PRACTICE_DB_ID,
          { filter: fallbackFilter, sorts: [{ property: '發布日期', direction: 'descending' }], page_size: needed }
        );
        questions = [...questions, ...extractExamQuestions(fallbackResult.results as unknown[])];
      }

      papers[grade][subject] = shuffle(questions).slice(0, QUESTIONS_PER_PAPER);
    }
  }

  /* 3. 建立 Notion 審核頁面 */
  let notionParentUrl = '';
  const parentPageId = c.env.NOTION_EXAM_REVIEW_PARENT_PAGE_ID;
  if (parentPageId) {
    try {
      const parent = await notion.createPage(c.env.NOTION_API_KEY, parentPageId, `${examName}　考前複習卷`);
      notionParentUrl = parent.url;
      for (const grade of GRADES) {
        for (const subject of EXAM_SUBJECTS) {
          const blocks = buildNotionBlocks(papers[grade][subject]);
          /* Notion API 每次最多 100 個 blocks，分批送 */
          const chunks: unknown[][] = [];
          for (let i = 0; i < blocks.length; i += 100) chunks.push(blocks.slice(i, i + 100));
          let subPageId = '';
          const first = chunks.shift()!;
          const sub = await notion.createPage(c.env.NOTION_API_KEY, parent.id, `${grade} ${subject}`, first);
          subPageId = sub.id;
          for (const chunk of chunks) {
            await fetch(`https://api.notion.com/v1/blocks/${subPageId}/children`, {
              method: 'PATCH',
              headers: { Authorization: `Bearer ${c.env.NOTION_API_KEY}`, 'Notion-Version': '2022-06-28', 'Content-Type': 'application/json' },
              body: JSON.stringify({ children: chunk }),
            });
          }
        }
      }
    } catch (e) {
      console.error('Notion page creation error:', e);
    }
  }

  /* 4. 寫入 KV */
  const state: ExamReviewState = {
    examName, openAt, closeAt, notionParentUrl,
    generatedAt: new Date().toISOString(),
    papers,
  };
  await c.env.KV_SETTINGS.put('exam_review_state', JSON.stringify(state));

  /* 5. 各年級科目實際題數（可能因題庫不足而低於 QUESTIONS_PER_PAPER），供通知訊息使用 */
  const paperCounts: Record<string, Record<string, number>> = {};
  let totalQuestions = 0;
  for (const grade of GRADES) {
    paperCounts[grade] = {};
    for (const subject of EXAM_SUBJECTS) {
      const n = papers[grade][subject].length;
      paperCounts[grade][subject] = n;
      totalQuestions += n;
    }
  }

  return c.json({
    ok: true,
    data: { examName, notionParentUrl, generatedAt: state.generatedAt, paperCounts, totalQuestions, questionsPerPaper: QUESTIONS_PER_PAPER },
  });
});

/* DELETE /cache                — 清除所有快取
   DELETE /cache/:prefix        — 只清 news 或 practice */
async function purgeKvCache(kv: KVNamespace, prefix: string): Promise<number> {
  const kvPrefix = prefix ? `cache:${prefix}:` : 'cache:';
  let deleted = 0;
  let cursor: string | undefined;
  do {
    const list = await kv.list({ prefix: kvPrefix, cursor, limit: 1000 });
    await Promise.all(list.keys.map((k) => kv.delete(k.name)));
    deleted += list.keys.length;
    cursor = list.list_complete ? undefined : list.cursor;
  } while (cursor);
  return deleted;
}

route.delete('/cache', async (c) => {
  const deleted = await purgeKvCache(c.env.KV_CACHE, '');
  return c.json({ ok: true, data: { deleted } });
});

route.delete('/cache/:prefix', async (c) => {
  const prefix = c.req.param('prefix');
  const deleted = await purgeKvCache(c.env.KV_CACHE, prefix);
  return c.json({ ok: true, data: { deleted, prefix } });
});

export default route;
