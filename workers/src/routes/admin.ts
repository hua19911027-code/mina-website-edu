/* GET  /api/v1/admin/settings  — 讀取 Admin 設定（從 KV）
   PUT  /api/v1/admin/settings  — 寫入 Admin 設定（至 KV）
   所有路由需 X-Admin-Secret header */

import { Hono } from 'hono';
import type { Bindings } from '../types';

const KV_KEY = 'admin_settings';

interface AdminSettings {
  reviewModeEnabled: boolean;
  notionPracticeDbId: string;
}

const DEFAULT_SETTINGS: AdminSettings = {
  reviewModeEnabled: false,
  notionPracticeDbId: '',
};

const route = new Hono<{ Bindings: Bindings }>();

/* ── Auth middleware ── */
route.use('*', async (c, next) => {
  const secret = c.req.header('X-Admin-Secret');
  if (!secret || secret !== c.env.ADMIN_SECRET) {
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
    notionPracticeDbId: typeof body.notionPracticeDbId === 'string' ? body.notionPracticeDbId.trim() : current.notionPracticeDbId,
  };

  await c.env.KV_SETTINGS.put(KV_KEY, JSON.stringify(updated));
  return c.json({ ok: true, data: updated });
});

export default route;
