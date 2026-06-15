/* POST /api/v1/bookings — 預約試聽：寫入 Notion，通知由 n8n webhook 處理 */

import { Hono } from 'hono';
import type { Bindings, BookingPayload } from '../types';

const CONTACT_PHONE = '04-2336-6868';
const RATE_LIMIT = 5;
const RATE_WINDOW_SECS = 3600;

const route = new Hono<{ Bindings: Bindings }>();

async function checkRateLimit(ip: string, kv: KVNamespace): Promise<boolean> {
  const key = `ratelimit:booking:${ip}`;
  const raw = await kv.get(key);
  const count = raw ? parseInt(raw, 10) : 0;
  if (count >= RATE_LIMIT) return false;
  await kv.put(key, String(count + 1), { expirationTtl: RATE_WINDOW_SECS });
  return true;
}

async function writeToNotion(
  body: BookingPayload,
  env: Bindings,
  submittedAt: Date,
): Promise<{ id: string } | null> {
  const response = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + env.NOTION_API_KEY,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      parent: { database_id: env.NOTION_BOOKING_DB_ID },
      properties: {
        'Name': { title: [{ text: { content: body.parentName.trim() } }] },
        '姓名': { rich_text: [{ text: { content: body.studentName?.trim() || '' } }] },
        '電話': { phone_number: body.phone.trim() },
        '服務項目': { rich_text: [{ text: { content: (body.courses ?? []).join('、') } }] },
        '備註': { rich_text: [{ text: { content: [
          `年級：${body.grade}`,
          `希望時段：${body.preferredTime || '不限'}`,
          body.note?.trim() ? `備注：${body.note.trim()}` : '',
        ].filter(Boolean).join('\n') } }] },
        '狀態': { select: { name: '待確認' } },
        '預約日期': { date: { start: submittedAt.toISOString() } },
      },
    }),
  });
  if (!response.ok) {
    const err = await response.text();
    console.error('Notion booking failed:', response.status, err);
    return null;
  }
  return (await response.json()) as { id: string };
}

route.post('/', async (c) => {
  const ip = c.req.header('CF-Connecting-IP') ?? 'unknown';
  const allowed = await checkRateLimit(ip, c.env.KV_RATE_LIMIT);
  if (!allowed) {
    return c.json({ ok: false, error: { code: 'RATE_LIMITED', message: '提交次數過多，請 1 小時後再試' } }, 429);
  }

  const body = await c.req.json<BookingPayload>().catch(() => null);

  if (!body) {
    return c.json({ ok: false, error: { code: 'BAD_REQUEST', message: 'Invalid JSON body' } }, 400);
  }

  if (!body.parentName?.trim()) {
    return c.json({ ok: false, error: { code: 'VALIDATION', message: '家長姓名為必填' } }, 422);
  }
  if (!body.phone?.trim()) {
    return c.json({ ok: false, error: { code: 'VALIDATION', message: '聯絡電話為必填' } }, 422);
  }
  if (!body.grade) {
    return c.json({ ok: false, error: { code: 'VALIDATION', message: '年級為必填' } }, 422);
  }
  const courses = body.courses?.length ? body.courses : (body.subjects ?? []);
  if (courses.length === 0) {
    return c.json({ ok: false, error: { code: 'VALIDATION', message: '請選擇至少一個課程' } }, 422);
  }

  const submittedAt = new Date();
  const notionPage = await writeToNotion({ ...body, courses }, c.env, submittedAt);

  if (!notionPage) {
    return c.json({
      ok: false,
      error: { code: 'SUBMIT_FAILED', message: `預約送出失敗，請直接來電 ${CONTACT_PHONE} 或稍後再試` },
    }, 500);
  }

  if (c.env.N8N_BOOKING_WEBHOOK) {
    c.executionCtx.waitUntil(
      fetch(c.env.N8N_BOOKING_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, bookingId: notionPage.id }),
      }).catch(() => {}),
    );
  }

  return c.json({
    ok: true,
    data: { bookingId: notionPage.id },
  }, 201);
});

export default route;
