/* GET /api/v1/faq */

import { Hono } from 'hono';
import type { Bindings, FaqList } from '../types';
import faqData from '../../../data/faq/faq.json';

const route = new Hono<{ Bindings: Bindings }>();

route.get('/', async (c) => {
  /* V1: serve static JSON directly.
     V2 will query Notion FAQ database when NOTION_FAQ_DB_ID is configured. */
  return c.json<{ ok: true; data: FaqList }>({
    ok: true,
    data: faqData as FaqList,
  });
});

export default route;
