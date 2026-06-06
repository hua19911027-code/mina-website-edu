/* GET /api/v1/news, GET /api/v1/news/:slug */

import { Hono } from 'hono';
import type { Bindings, Article, ArticleList } from '../types';
import * as notion from '../adapters/notion';
import sampleNews from '../../../data/news/sample-news.json';

const route = new Hono<{ Bindings: Bindings }>();

/* ── Transform Notion page → Article ── */

function transformPage(page: { id: string; properties: Record<string, unknown> }): Article {
  const p = page as Parameters<typeof notion.getPropText>[0];
  const coverFiles = notion.getPropFiles(p, 'Cover Image');

  return {
    id: page.id,
    slug: notion.getPropText(p, 'slug'),
    title: notion.getPropText(p, '粗體摘要'),
    category: notion.getPropText(p, '分類'),
    excerpt: notion.getPropText(p, '內容摘要'),
    coverImage: notion.extractFileUrls(coverFiles)[0] || '',
    photos: [],
    publishedAt: notion.getPropText(p, '發布日期'),
    tags: notion.getPropTags(p, 'Tags'),
  };
}

/* ── GET list ── */

route.get('/', async (c) => {
  const category = c.req.query('category') || '';
  const page = Math.max(1, parseInt(c.req.query('page') || '1', 10));
  const limit = Math.min(30, Math.max(1, parseInt(c.req.query('limit') || '9', 10)));

  /* Use sample data in development when Notion is not configured */
  if (c.env.ENVIRONMENT !== 'production' && c.env.ENVIRONMENT !== 'staging') {
    let articles: typeof sampleNews.articles = sampleNews.articles;
    if (category) {
      articles = articles.filter((a) => a.category === category);
    }
    const total = articles.length;
    const start = (page - 1) * limit;
    const slice = articles.slice(start, start + limit);
    return c.json<{ ok: true; data: ArticleList }>({
      ok: true,
      data: {
        articles: slice,
        total,
        page,
        limit,
        hasMore: start + limit < total,
      },
    });
  }

  try {
    const filter: Record<string, unknown> = {
      and: [
        { property: '狀態', select: { equals: '已發布' } },
        ...(category ? [{ property: '分類', select: { equals: category } }] : []),
      ],
    };

    const sorts = [{ property: '發布日期', direction: 'descending' }];
    const pageSize = limit * page + 1;

    const result = await notion.queryDatabase(c.env.NOTION_API_KEY, c.env.NOTION_NEWS_DB_ID, {
      filter,
      sorts,
      page_size: Math.min(pageSize, 100),
    });

    const all = result.results.map(transformPage);
    const total = all.length;
    const start = (page - 1) * limit;
    const articles = all.slice(start, start + limit);

    return c.json<{ ok: true; data: ArticleList }>({
      ok: true,
      data: {
        articles,
        total,
        page,
        limit,
        hasMore: start + limit < total,
      },
    });
  } catch (e) {
    console.error('News list error:', e);
    return c.json<{ ok: true; data: ArticleList }>({
      ok: true,
      data: { articles: [], total: 0, page, limit, hasMore: false },
    });
  }
});

/* ── GET single ── */

route.get('/:slug', async (c) => {
  const slug = c.req.param('slug');

  /* Development: serve from sample data */
  if (c.env.ENVIRONMENT !== 'production' && c.env.ENVIRONMENT !== 'staging') {
    const found = sampleNews.articles.find((a) => a.slug === slug);
    if (!found) {
      return c.json({ ok: false, error: { code: 'NOT_FOUND', message: 'Article not found' } }, 404);
    }
    return c.json({ ok: true, data: { ...found, related: [] } });
  }

  try {
    /* Query by slug */
    const result = await notion.queryDatabase(c.env.NOTION_API_KEY, c.env.NOTION_NEWS_DB_ID, {
      filter: {
        and: [
          { property: '狀態', select: { equals: '已發布' } },
          { property: 'slug', rich_text: { equals: slug } },
        ],
      },
      page_size: 1,
    });

    if (!result.results.length) {
      return c.json({ ok: false, error: { code: 'NOT_FOUND', message: 'Article not found' } }, 404);
    }

    const page = result.results[0];
    const article = transformPage(page);

    /* Fetch content blocks */
    const blocks = await notion.getPageBlocks(c.env.NOTION_API_KEY, page.id);
    article.content = notion.blocksToHtml(blocks);

    /* Fetch activity photos if applicable */
    if (article.category === '活動') {
      const photoFiles = notion.getPropFiles(
        page as Parameters<typeof notion.getPropFiles>[0],
        '活動照片'
      );
      article.photos = notion.extractFileUrls(photoFiles).slice(0, 20);
    }

    return c.json({ ok: true, data: { ...article, related: [] } });
  } catch (e) {
    console.error('News single error:', e);
    return c.json({ ok: false, error: { code: 'INTERNAL_ERROR', message: '伺服器錯誤' } }, 500);
  }
});

export default route;
