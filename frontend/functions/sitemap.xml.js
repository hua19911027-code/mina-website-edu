const API_BASE = "https://api.minaedu.tw/api/v1";
const SITE = "https://minaedu.tw";
const PAGE_LIMIT = 30;   // 伺服器上限
const MAX_PAGES = 20;    // 安全上限，避免無限迴圈

const STATIC_PAGES = [
  { loc: "/",         priority: "1.0", changefreq: "weekly"  },
  { loc: "/about",    priority: "0.8", changefreq: "monthly" },
  { loc: "/courses",  priority: "0.9", changefreq: "monthly" },
  { loc: "/news",     priority: "0.9", changefreq: "weekly"  },
  { loc: "/practice", priority: "0.9", changefreq: "weekly"  },
  { loc: "/faq",       priority: "0.7", changefreq: "monthly" },
  { loc: "/booking",  priority: "0.8", changefreq: "monthly" },
];

function xmlEscape(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// 依 hasMore 分頁抓取全部文章。
// 絕對不要使用 total 欄位 —— 該欄位有 bug，會回傳 limit+1。
async function fetchAllArticles() {
  const all = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await fetch(
      `${API_BASE}/news?page=${page}&limit=${PAGE_LIMIT}`,
      { cf: { cacheTtl: 600, cacheEverything: true } }
    );
    if (!res.ok) break;

    const json = await res.json();
    const data = json?.data;
    const articles = data?.articles ?? [];

    all.push(...articles);

    if (!data?.hasMore || articles.length === 0) break;
  }
  return all;
}

export async function onRequestGet() {
  const urls = STATIC_PAGES.map(
    (p) =>
      `  <url><loc>${SITE}${p.loc}</loc>` +
      `<changefreq>${p.changefreq}</changefreq>` +
      `<priority>${p.priority}</priority></url>`
  );

  try {
    const articles = await fetchAllArticles();
    for (const a of articles) {
      if (!a?.slug) continue;
      const lastmod = a.publishedAt
        ? `<lastmod>${xmlEscape(String(a.publishedAt).slice(0, 10))}</lastmod>`
        : "";
      urls.push(
        `  <url><loc>${SITE}/news/${xmlEscape(a.slug)}</loc>` +
          `${lastmod}<changefreq>monthly</changefreq>` +
          `<priority>0.7</priority></url>`
      );
    }
  } catch (e) {
    // API 異常時仍回傳靜態頁面部分，不讓整份 sitemap 失效
  }

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.join("\n") +
    `\n</urlset>`;

  return new Response(xml, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=600",
    },
  });
}
