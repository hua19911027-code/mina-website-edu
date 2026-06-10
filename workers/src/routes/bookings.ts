/* POST /api/v1/bookings — 預約試聽：寫入 Notion + Email 通知 */

import { Hono } from 'hono';
import type { Bindings, BookingPayload } from '../types';

const NOTIFY_EMAIL = 'monina1051208@gmail.com';

const route = new Hono<{ Bindings: Bindings }>();

/* ── Email via MailChannels ── */
async function sendNotifyEmail(booking: BookingPayload): Promise<boolean> {
  const now = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
  const text = [
    '【新試聽預約通知】',
    '',
    `家長姓名：${booking.parentName}`,
    `聯絡電話：${booking.phone}`,
    `學生姓名：${booking.studentName}`,
    `年級：${booking.grade}`,
    `有興趣課程：${booking.courses.join('、')}`,
    `希望時段：${booking.preferredTime || '不限'}`,
    `備注：${booking.note?.trim() || '無'}`,
    '',
    `預約時間：${now}`,
    '',
    '─────────────────────',
    '此信由 Mina 預約系統自動發送',
  ].join('\n');

  try {
    const res = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: NOTIFY_EMAIL, name: '卓越國際文理補習班' }] }],
        from: { email: 'booking@mina-api.hua19911027.workers.dev', name: 'Mina 預約系統' },
        subject: `【新試聽預約】${booking.parentName} / ${booking.grade} / ${booking.phone}`,
        content: [{ type: 'text/plain', value: text }],
      }),
    });
    return res.status === 202;
  } catch (e) {
    console.error('sendNotifyEmail error:', e);
    return false;
  }
}

route.post('/', async (c) => {
  const body = await c.req.json<BookingPayload>().catch(() => null);

  if (!body) {
    return c.json({ ok: false, error: { code: 'BAD_REQUEST', message: 'Invalid JSON body' } }, 400);
  }

  /* Validate required fields */
  if (!body.parentName?.trim()) {
    return c.json({ ok: false, error: { code: 'VALIDATION', message: '家長姓名為必填' } }, 422);
  }
  if (!body.phone?.trim()) {
    return c.json({ ok: false, error: { code: 'VALIDATION', message: '聯絡電話為必填' } }, 422);
  }
  if (!body.studentName?.trim()) {
    return c.json({ ok: false, error: { code: 'VALIDATION', message: '學生姓名為必填' } }, 422);
  }
  if (!body.grade) {
    return c.json({ ok: false, error: { code: 'VALIDATION', message: '年級為必填' } }, 422);
  }
  if (!body.courses || body.courses.length === 0) {
    return c.json({ ok: false, error: { code: 'VALIDATION', message: '請選擇至少一個課程' } }, 422);
  }

  /* Run Notion write + Email in parallel */
  const [notionResult, emailOk] = await Promise.allSettled([
    (async () => {
      const response = await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + c.env.NOTION_API_KEY,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parent: { database_id: c.env.NOTION_BOOKING_DB_ID },
          properties: {
            '家長姓名': { title: [{ text: { content: body.parentName.trim() } }] },
            '聯絡電話': { phone_number: body.phone.trim() },
            '學生姓名': { rich_text: [{ text: { content: body.studentName.trim() } }] },
            '年級': { select: { name: body.grade } },
            '有興趣課程': { multi_select: body.courses.map((name) => ({ name })) },
            '希望時段': { rich_text: [{ text: { content: body.preferredTime || '不限' } }] },
            '備注': { rich_text: [{ text: { content: body.note?.trim() || '' } }] },
            '狀態': { select: { name: '待聯繫' } },
            '預約時間': { date: { start: new Date().toISOString() } },
          },
        }),
      });
      if (!response.ok) {
        const err = await response.text();
        console.error('Notion booking failed:', response.status, err);
        return null;
      }
      return (await response.json()) as { id: string };
    })(),
    sendNotifyEmail(body),
  ]);

  const notionPage = notionResult.status === 'fulfilled' ? notionResult.value : null;
  const emailSent = emailOk.status === 'fulfilled' ? emailOk.value : false;

  if (!notionPage && !emailSent) {
    console.error('Both Notion and email failed');
    return c.json({
      ok: false,
      error: { code: 'SUBMIT_FAILED', message: '預約送出失敗，請直接來電 04-2336-6868 或稍後再試' },
    }, 500);
  }

  return c.json({
    ok: true,
    data: {
      bookingId: notionPage?.id ?? 'email-only',
      notionOk: !!notionPage,
      emailOk: emailSent,
    },
  }, 201);
});

export default route;
