/* GET /api/v1/practice              — 已發布題庫（is_published=true, not archived）
   GET /api/v1/practice/archive      — 已封存題目（上限 36 題）
   GET /api/v1/practice/exam-review  — 考前複習 */

import { Hono } from 'hono';
import type { Bindings, PracticeQuestion, PracticeList } from '../types';
import * as notion from '../adapters/notion';

/* Static fallback imports — used only when ENVIRONMENT=development */
import en12 from '../../../data/practice/en/grade1-2.json';
import en34 from '../../../data/practice/en/grade3-4.json';
import en56 from '../../../data/practice/en/grade5-6.json';
import ma12 from '../../../data/practice/ma/grade1-2.json';
import ma34 from '../../../data/practice/ma/grade3-4.json';
import ma56 from '../../../data/practice/ma/grade5-6.json';

const PAGE_SIZE = 12;
const ARCHIVE_HARD_LIMIT = 36;

const route = new Hono<{ Bindings: Bindings }>();

/* ── helpers ── */

function now(): Date { return new Date(); }

function buildPublishedFilter(grade?: string, subject?: string, type?: string): unknown {
  const and: unknown[] = [
    { property: '是否發布', checkbox: { equals: true } },
    { property: '已封存', checkbox: { equals: false } },
  ];
  if (grade) and.push({ property: '年級', select: { equals: grade } });
  if (subject) and.push({ property: '科目', select: { equals: subject } });
  if (type) and.push({ property: '題型', select: { equals: type } });
  return { and };
}

function buildArchivedFilter(grade?: string, subject?: string, type?: string): unknown {
  const and: unknown[] = [
    { property: '已封存', checkbox: { equals: true } },
  ];
  if (grade) and.push({ property: '年級', select: { equals: grade } });
  if (subject) and.push({ property: '科目', select: { equals: subject } });
  if (type) and.push({ property: '題型', select: { equals: type } });
  return { and };
}

function mapNotionToQuestion(page: unknown): PracticeQuestion {
  const p = page as Record<string, unknown>;
  const props = p.properties as Record<string, unknown>;

  function getRichText(name: string): string {
    const prop = (props[name] as Record<string, unknown>) || {};
    const arr = prop['rich_text'] as Array<{ plain_text: string }> | undefined;
    return arr ? arr.map(t => t.plain_text).join('') : '';
  }
  function getSelect(name: string): string {
    const prop = (props[name] as Record<string, unknown>) || {};
    const sel = prop['select'] as Record<string, unknown> | null | undefined;
    return sel ? (sel['name'] as string) || '' : '';
  }
  function getTitle(): string {
    const entries = Object.values(props) as Array<Record<string, unknown>>;
    const titleProp = entries.find(e => e['type'] === 'title');
    if (!titleProp) return '';
    const arr = titleProp['title'] as Array<{ plain_text: string }> | undefined;
    return arr ? arr.map(t => t.plain_text).join('') : '';
  }
  function getDate(name: string): string {
    const prop = (props[name] as Record<string, unknown>) || {};
    const d = prop['date'] as Record<string, unknown> | null | undefined;
    return d ? (d['start'] as string) || '' : '';
  }

  return {
    id: getTitle(),
    grade: getSelect('年級'),
    subject: getSelect('科目'),
    type: getSelect('題型'),
    unit: getRichText('單元'),
    question: getRichText('題目'),
    options: [
      getRichText('選項A'),
      getRichText('選項B'),
      getRichText('選項C'),
      getRichText('選項D'),
    ],
    answer: getSelect('答案'),
    explanation: {
      concept: getRichText('正確觀念'),
      commonMistake: getRichText('常見錯誤'),
      memoryTip: getRichText('記憶提示'),
    },
    publishedAt: getDate('發布日期'),
  };
}

/* ── Development fallback ── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fallbackAll: PracticeQuestion[] = ([...en12.questions, ...en34.questions, ...en56.questions,
  ...ma12.questions, ...ma34.questions, ...ma56.questions] as any[])
  .map((q) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = q as any;
    const exp = typeof raw.explanation === 'object' && raw.explanation !== null
      ? raw.explanation
      : { concept: String(raw.explanation || ''), commonMistake: '', memoryTip: '' };
    return {
      id: raw.id,
      grade: raw.grade || '小三',
      subject: raw.subject === 'en' ? '英文' : '數學',
      type: raw.type || '標準題型',
      unit: raw.chapter || raw.unit || '',
      question: raw.question,
      options: raw.options,
      answer: raw.answer,
      explanation: exp,
      publishedAt: raw.publishedAt || '2026-06-01T01:00:00.000Z',
    } as PracticeQuestion;
  });

/* ── GET / — 近三個月 ── */

route.get('/', async (c) => {
  const grade = c.req.query('grade');
  const subject = c.req.query('subject');
  const type = c.req.query('type');
  const page = Math.max(1, parseInt(c.req.query('page') || '1', 10));

  if (c.env.ENVIRONMENT === 'development') {
    const filtered = fallbackAll.filter(q =>
      (!grade || q.grade === grade) &&
      (!subject || q.subject === subject) &&
      (!type || q.type === type)
    );
    const start = (page - 1) * PAGE_SIZE;
    const slice = filtered.slice(start, start + PAGE_SIZE);
    const result: PracticeList = {
      questions: slice,
      total: filtered.length,
      page,
      limit: PAGE_SIZE,
      hasMore: start + PAGE_SIZE < filtered.length,
      lastUpdated: slice[0]?.publishedAt || new Date().toISOString(),
    };
    return c.json({ ok: true, data: result }, 200, {
      'Cache-Control': 'public, max-age=300',
    });
  }

  try {
    const n = now();
    const filter = buildPublishedFilter(grade, subject, type);
    const total_page_size = page * PAGE_SIZE + 1;
    const result = await notion.queryDatabase(c.env.NOTION_API_KEY, c.env.NOTION_PRACTICE_DB_ID, {
      filter,
      sorts: [{ property: '發布日期', direction: 'descending' }],
      page_size: total_page_size,
    });

    const all = (result.results as unknown[]).map(mapNotionToQuestion);
    const start = (page - 1) * PAGE_SIZE;
    const slice = all.slice(start, start + PAGE_SIZE);
    const hasMore = all.length > start + PAGE_SIZE;
    const lastUpdated = slice[0]?.publishedAt || n.toISOString();

    const data: PracticeList = {
      questions: slice,
      total: all.length,
      page,
      limit: PAGE_SIZE,
      hasMore,
      lastUpdated,
    };
    return c.json({ ok: true, data }, 200, { 'Cache-Control': 'public, max-age=300' });
  } catch (e) {
    console.error('practice / error:', e);
    return c.json({ ok: false, error: { code: 'NOTION_ERROR', message: 'Failed to fetch questions' } }, 500);
  }
});

/* ── GET /archive — 三個月以前，上限 36 ── */

route.get('/archive', async (c) => {
  const grade = c.req.query('grade');
  const subject = c.req.query('subject');
  const type = c.req.query('type');
  const page = Math.max(1, parseInt(c.req.query('page') || '1', 10));

  if (page >= 4) {
    return c.json(
      { ok: false, error: { code: 'LIMIT_REACHED', message: '已達查詢上限 36 題' } },
      400
    );
  }

  if (c.env.ENVIRONMENT === 'development') {
    const filtered = fallbackAll.filter(q =>
      (!grade || q.grade === grade) &&
      (!subject || q.subject === subject) &&
      (!type || q.type === type)
    );
    const limited = filtered.slice(0, ARCHIVE_HARD_LIMIT);
    const start = (page - 1) * PAGE_SIZE;
    const slice = limited.slice(start, start + PAGE_SIZE);
    const reachedLimit = start + PAGE_SIZE >= ARCHIVE_HARD_LIMIT;
    return c.json({
      ok: true,
      data: {
        questions: slice,
        total: Math.min(filtered.length, ARCHIVE_HARD_LIMIT),
        page,
        limit: PAGE_SIZE,
        hasMore: !reachedLimit && start + PAGE_SIZE < limited.length,
        reachedLimit,
        lastUpdated: slice[0]?.publishedAt || new Date().toISOString(),
      },
    }, 200, { 'Cache-Control': 'public, max-age=3600' });
  }

  try {
    const filter = buildArchivedFilter(grade, subject, type);
    const fetchSize = ARCHIVE_HARD_LIMIT + 1;
    const result = await notion.queryDatabase(c.env.NOTION_API_KEY, c.env.NOTION_PRACTICE_DB_ID, {
      filter,
      sorts: [{ property: '發布日期', direction: 'descending' }],
      page_size: fetchSize,
    });

    const all = (result.results.slice(0, ARCHIVE_HARD_LIMIT) as unknown[]).map(mapNotionToQuestion);
    const start = (page - 1) * PAGE_SIZE;
    const slice = all.slice(start, start + PAGE_SIZE);
    const reachedLimit = start + PAGE_SIZE >= ARCHIVE_HARD_LIMIT || start + PAGE_SIZE >= all.length;

    const data: PracticeList & { reachedLimit: boolean } = {
      questions: slice,
      total: all.length,
      page,
      limit: PAGE_SIZE,
      hasMore: !reachedLimit && start + PAGE_SIZE < all.length,
      reachedLimit,
      lastUpdated: slice[0]?.publishedAt || new Date().toISOString(),
    };
    return c.json({ ok: true, data }, 200, { 'Cache-Control': 'public, max-age=3600' });
  } catch (e) {
    console.error('practice /archive error:', e);
    return c.json({ ok: false, error: { code: 'NOTION_ERROR', message: 'Failed to fetch archive' } }, 500);
  }
});

/* ── GET /exam-review ── */

route.get('/exam-review', async (c) => {
  const grade = c.req.query('grade');
  if (!grade) {
    return c.json({ ok: false, error: { code: 'MISSING_PARAM', message: 'grade is required' } }, 400);
  }

  if (c.env.ENVIRONMENT === 'development') {
    return c.json({ ok: true, data: { active: false, grade, items: [] } }, 200, {
      'Cache-Control': 'no-store',
    });
  }

  try {
    const n = now();
    // 只過濾啟用狀態和年級；時間比對在 JS 端用「展示時間」欄位的 start/end 進行
    const filter = {
      and: [
        { property: '是否啟用', checkbox: { equals: true } },
        { property: '年級', select: { equals: grade } },
      ],
    };

    const result = await notion.queryDatabase(c.env.NOTION_API_KEY, c.env.NOTION_EXAM_REVIEW_DB_ID, {
      filter,
      sorts: [{ property: '科目', direction: 'ascending' }],
      page_size: 20,
    });

    const items = (result.results as unknown[])
      .map(page => {
        const p = page as Record<string, unknown>;
        const props = p.properties as Record<string, unknown>;

        function getTitle(): string {
          const entries = Object.values(props) as Array<Record<string, unknown>>;
          const titleProp = entries.find(e => e['type'] === 'title');
          if (!titleProp) return '';
          const arr = titleProp['title'] as Array<{ plain_text: string }> | undefined;
          return arr ? arr.map(t => t.plain_text).join('') : '';
        }
        function getSelect(name: string): string {
          const prop = (props[name] as Record<string, unknown>) || {};
          const sel = prop['select'] as Record<string, unknown> | null | undefined;
          return sel ? (sel['name'] as string) || '' : '';
        }

        const pdfProp = props['PDF'] as { type: string; files: Array<{ type: string; file?: { url: string }; external?: { url: string } }> } | undefined;
        const pdfUrl = pdfProp?.files?.[0]
          ? (pdfProp.files[0].type === 'file' ? pdfProp.files[0].file?.url : pdfProp.files[0].external?.url) ?? ''
          : '';

        if (!pdfUrl) return null;

        // 時間比對：「展示時間」欄位（Date 型別，開啟結束日期）
        // 若欄位不存在（schema 尚未更新）則不做時間過濾，保持向下相容
        const displayTimeProp = (props['展示時間'] as Record<string, unknown>) || {};
        const dateRange = displayTimeProp['date'] as { start?: string; end?: string } | null | undefined;
        if (dateRange?.start && dateRange?.end) {
          const displayStart = new Date(dateRange.start);
          const displayEnd   = new Date(dateRange.end);
          if (n < displayStart || n > displayEnd) return null;
        }

        return {
          id: (p.id as string) || '',
          name: getTitle(),
          subject: getSelect('科目'),
          grade: getSelect('年級'),
          pdfUrl,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    const active = items.length > 0;
    return c.json({ ok: true, data: { active, grade, items } }, 200, {
      'Cache-Control': 'no-store',
    });
  } catch (e) {
    console.error('practice /exam-review error:', e);
    return c.json({ ok: false, error: { code: 'NOTION_ERROR', message: 'Failed to fetch exam review' } }, 500);
  }
});

export default route;
