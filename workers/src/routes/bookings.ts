/* POST /api/v1/bookings — 預約試聽，寫入 Notion */

import { Hono } from 'hono';
import type { Bindings, BookingPayload } from '../types';
import * as notion from '../adapters/notion';

const route = new Hono<{ Bindings: Bindings }>();

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

  try {
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
          '家長姓名': {
            title: [{ text: { content: body.parentName.trim() } }],
          },
          '聯絡電話': {
            phone_number: body.phone.trim(),
          },
          '學生姓名': {
            rich_text: [{ text: { content: body.studentName.trim() } }],
          },
          '年級': {
            select: { name: body.grade },
          },
          '有興趣課程': {
            multi_select: body.courses.map((c) => ({ name: c })),
          },
          '希望時段': {
            rich_text: [{ text: { content: body.preferredTime || '不限' } }],
          },
          '備注': {
            rich_text: [{ text: { content: body.note?.trim() || '' } }],
          },
          '狀態': {
            select: { name: '待聯繫' },
          },
          '預約時間': {
            date: { start: new Date().toISOString() },
          },
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Notion booking create failed:', response.status, err);
      return c.json({ ok: false, error: { code: 'NOTION_ERROR', message: '預約記錄建立失敗，請稍後再試' } }, 500);
    }

    const page = (await response.json()) as { id: string };

    return c.json({ ok: true, data: { bookingId: page.id } }, 201);
  } catch (e) {
    console.error('Booking error:', e);
    return c.json({ ok: false, error: { code: 'INTERNAL_ERROR', message: '伺服器錯誤，請稍後再試' } }, 500);
  }
});

export default route;
