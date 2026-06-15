import { Hono } from 'hono';
import { cors } from 'hono/cors';
import bookingsRoute from './routes/bookings';
import newsRoute from './routes/news';
import faqRoute from './routes/faq';
import practiceRoute from './routes/practice';
import minaRoute from './routes/mina';
import adminRoute from './routes/admin';
import publisherRoute from './routes/publisher';
import type { Bindings } from './types';

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', cors({
  origin: [
    'https://mina-website-edu.pages.dev',
    'http://localhost:3000',
    'http://127.0.0.1:5500',
  ],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'X-Admin-Secret'],
  maxAge: 86400,
}));

app.route('/api/v1/bookings', bookingsRoute);
app.route('/api/v1/news', newsRoute);
app.route('/api/v1/faq', faqRoute);
app.route('/api/v1/practice', practiceRoute);
app.route('/api/v1/mina', minaRoute);
app.route('/api/v1/admin', adminRoute);
app.route('/api/v1/admin/publisher', publisherRoute);

app.get('/health', (c) => c.json({ status: 'ok', env: c.env.ENVIRONMENT }));

/* 404 fallback */
app.notFound((c) => c.json({ ok: false, error: { code: 'NOT_FOUND', message: 'Route not found' } }, 404));

/* Error handler */
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, 500);
});

export default app;
