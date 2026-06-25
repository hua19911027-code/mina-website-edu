/* GET /api/v1/calendar — 學年行事曆（Notion DB 驅動） */

import { Hono } from 'hono';
import type { Bindings } from '../types';
import * as notion from '../adapters/notion';

const TYPE_MAP: Record<string, string> = {
  '課程':       'en',   // Notion 新名稱
  '學期・課程': 'en',   // 舊名稱相容
  '段考':       'ex',
  '學測評量':   'ex',
  '段考・評量': 'ex',   // 舊名稱相容
  '營隊':       'camp',
  '報名':       'reg',  // Notion 新名稱
  '報名・活動': 'reg',  // 舊名稱相容
  '節慶・活動': 'fest',
};

interface CalendarEvent {
  date: string;
  title: string;
  desc?: string;
  type: string;
  icon?: string;
  link?: string;
}

const route = new Hono<{ Bindings: Bindings }>();

route.get('/', async (c) => {
  const cacheKey = 'cache:calendar:events';
  const cached = await c.env.KV_CACHE.get(cacheKey);
  if (cached) return c.json(JSON.parse(cached), 200, { 'Cache-Control': 'public, max-age=300' });

  try {
    const result = await notion.queryDatabase(
      c.env.NOTION_API_KEY,
      c.env.NOTION_CALENDAR_DB_ID,
      {
        filter: { property: '顯示', checkbox: { equals: true } },
        sorts: [{ property: '日期', direction: 'ascending' }],
        page_size: 100,
      }
    );

    const events: CalendarEvent[] = (result.results as unknown[]).map((page) => {
      const props = (page as Record<string, unknown>).properties as Record<string, unknown>;

      function getText(name: string): string {
        const prop = (props[name] as Record<string, unknown>) || {};
        const arr = (prop['rich_text'] || prop['title']) as Array<{ plain_text: string }> | undefined;
        return arr ? arr.map(t => t.plain_text).join('') : '';
      }
      function getSelect(name: string): string {
        const prop = (props[name] as Record<string, unknown>) || {};
        const sel = prop['select'] as Record<string, unknown> | null | undefined;
        return sel ? (sel['name'] as string) || '' : '';
      }
      function getDate(name: string): string {
        const prop = (props[name] as Record<string, unknown>) || {};
        const d = prop['date'] as Record<string, unknown> | null | undefined;
        return d ? (d['start'] as string) || '' : '';
      }

      function getUrl(name: string): string {
        const prop = (props[name] as Record<string, unknown>) || {};
        // URL 類型欄位
        if (typeof prop['url'] === 'string' && prop['url']) return prop['url'];
        // 富文字 / 文字類型欄位（用戶可能建成此類型）
        const arr = prop['rich_text'] as Array<{ plain_text: string }> | undefined;
        if (arr && arr.length) return arr.map(t => t.plain_text).join('');
        return '';
      }
      const desc = getText('說明');
      const icon = getText('圖示');
      const link = getUrl('連結');
      const ev: CalendarEvent = {
        date:  getDate('日期'),
        title: getText('名稱'),
        type:  TYPE_MAP[getSelect('分類')] || 'en',
      };
      if (desc) ev.desc = desc;
      if (icon) ev.icon = icon;
      if (link) ev.link = link;
      return ev;
    }).filter(e => e.date && e.title);

    const payload = { ok: true, data: events };
    c.executionCtx.waitUntil(
      c.env.KV_CACHE.put(cacheKey, JSON.stringify(payload), { expirationTtl: 300 })
    );
    return c.json(payload, 200, { 'Cache-Control': 'public, max-age=300' });
  } catch (e) {
    console.error('calendar error:', e);
    return c.json({ ok: false, error: { code: 'NOTION_ERROR', message: 'Failed to fetch calendar' } }, 500);
  }
});

export default route;
