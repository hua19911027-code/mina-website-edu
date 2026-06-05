import { Hono } from 'hono';
import { cors } from 'hono/cors';
import bookingsRoute from './routes/bookings';
import newsRoute from './routes/news';
import faqRoute from './routes/faq';
import practiceRoute from './routes/practice';
import minaRoute from './routes/mina';
import type { Bindings } from './types';

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', cors({
  origin: [
    'https://mina-website-edu.pages.dev',
    'http://localhost:3000',
    'http://127.0.0.1:5500',
  ],
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
  maxAge: 86400,
}));

app.route('/api/v1/bookings', bookingsRoute);
app.route('/api/v1/news', newsRoute);
app.route('/api/v1/faq', faqRoute);
app.route('/api/v1/practice', practiceRoute);
app.route('/api/v1/mina', minaRoute);

app.get('/health', (c) => c.json({ status: 'ok', env: c.env.ENVIRONMENT }));

app.get('/debug/notion', async (c) => {
  try {
    const url = `https://api.notion.com/v1/databases/${c.env.NOTION_NEWS_DB_ID}/query`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${c.env.NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ page_size: 1 }),
    });
    const data = await res.json();
    return c.json({ status: res.status, data });
  } catch (e) {
    return c.json({ error: String(e) });
  }
});

/* 404 fallback */
app.notFound((c) => c.json({ ok: false, error: { code: 'NOT_FOUND', message: 'Route not found' } }, 404));

/* Error handler */
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, 500);
});

export default app;
