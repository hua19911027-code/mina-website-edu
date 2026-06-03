/* POST /api/v1/mina/query  — 取得 Mina QA tree 節點
   GET  /api/v1/mina/data   — 回傳完整 QA tree（供前端 widget 使用） */

import { Hono } from 'hono';
import type { Bindings, MinaTree } from '../types';
import qaTree from '../../../data/mina/qa-tree.json';

const tree = qaTree as MinaTree;

const route = new Hono<{ Bindings: Bindings }>();

/* Return the full QA tree for the frontend Mina widget */
route.get('/data', (c) => {
  return c.json({ ok: true, data: tree });
});

/* Query a specific node (for server-side rendering if needed) */
route.post('/query', async (c) => {
  const body = await c.req.json<{ nodeId?: string }>().catch(() => null);
  const nodeId = body?.nodeId || 'root';

  const node = tree.nodes[nodeId];
  if (!node) {
    return c.json({
      ok: false,
      error: { code: 'NOT_FOUND', message: `Node '${nodeId}' not found` },
    }, 404);
  }

  return c.json({
    ok: true,
    data: {
      node,
      handoffMessage: tree.handoffMessage,
      handoffCta: tree.handoffCta,
    },
  });
});

export default route;
