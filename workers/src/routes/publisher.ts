/* POST /api/v1/admin/publisher/analyze
   接受教科書封面/目錄圖片（PDF/JPG/PNG），轉為 base64 後觸發 n8n AI 分析 webhook
   需 X-Admin-Secret header */

import { Hono } from 'hono';
import type { Bindings } from '../types';

const route = new Hono<{ Bindings: Bindings }>();

route.use('*', async (c, next) => {
  const secret = c.req.header('X-Admin-Secret');
  if (!secret || secret !== c.env.ADMIN_SECRET) {
    return c.json({ ok: false, error: { code: 'UNAUTHORIZED', message: 'Invalid admin secret' } }, 401);
  }
  return next();
});

route.post('/analyze', async (c) => {
  const webhookUrl = c.env.N8N_PUBLISHER_WEBHOOK;
  if (!webhookUrl) {
    return c.json({ ok: false, error: { code: 'NOT_CONFIGURED', message: 'N8N_PUBLISHER_WEBHOOK not set' } }, 503);
  }

  let formData: FormData;
  try {
    formData = await c.req.formData();
  } catch {
    return c.json({ ok: false, error: { code: 'BAD_REQUEST', message: 'Invalid form data' } }, 400);
  }

  const file = formData.get('file') as File | null;
  const grade = (formData.get('grade') as string | null)?.trim();
  const subject = (formData.get('subject') as string | null)?.trim();
  const academicYear = ((formData.get('academicYear') as string | null)?.trim()) || '114學年度';

  if (!file || !grade || !subject) {
    return c.json({ ok: false, error: { code: 'BAD_REQUEST', message: 'file, grade, subject are required' } }, 400);
  }

  const allowedMimes = ['image/jpeg', 'image/png', 'application/pdf'];
  if (!allowedMimes.includes(file.type)) {
    return c.json({ ok: false, error: { code: 'BAD_REQUEST', message: 'Only JPG, PNG, PDF files are supported' } }, 400);
  }

  const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
  if (file.size > MAX_BYTES) {
    return c.json({ ok: false, error: { code: 'BAD_REQUEST', message: 'File too large (max 10 MB)' } }, 400);
  }

  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const base64 = btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join(''));

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grade,
        subject,
        academicYear,
        fileName: file.name,
        mimeType: file.type,
        fileBase64: base64,
        triggeredAt: new Date().toISOString(),
      }),
    });

    if (res.ok || res.status === 202) {
      return c.json({ ok: true, data: { message: 'Analysis triggered', grade, subject, academicYear } });
    }
    return c.json({ ok: false, error: { code: 'WEBHOOK_ERROR', message: `n8n responded with ${res.status}` } }, 502);
  } catch (e) {
    return c.json({ ok: false, error: { code: 'FETCH_ERROR', message: String(e) } }, 502);
  }
});

export default route;
