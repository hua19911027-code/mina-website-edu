/* GET    /api/v1/admin/settings              — 讀取 Admin 設定（從 KV）
   PUT    /api/v1/admin/settings              — 寫入 Admin 設定（至 KV）
   POST   /api/v1/admin/practice/regenerate  — 觸發 n8n 重新出題 webhook
   DELETE /api/v1/admin/cache                — 清除 KV_CACHE 所有快取
   DELETE /api/v1/admin/cache/:prefix        — 清除指定前綴快取（news/practice）
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
