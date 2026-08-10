/**
 * Cloudflare Pages Function — 最新消息單篇文章伺服器端渲染
 * 路徑：frontend/functions/news/[slug].js
 * 對應網址：https://minaedu.tw/news/{slug}
 *
 * 設計原則：
 * 1. 沿用既有的 news-single.html 靜態外殼，不另做模板
 * 2. 用 HTMLRewriter 填入內容並切換可見性，重現「news.js 執行完畢」的狀態
 * 3. news.js 完全不需修改，瀏覽器端仍會正常運作（重複設定同樣的值，無副作用）
 * 4. API 異常時退回原樣外殼，行為與修改前相同，不讓頁面壞掉
 */

const API_BASE = "https://api.minaedu.tw/api/v1";
const SITE = "https://minaedu.tw";
const BRAND = "臺中市私立卓越國際文理短期補習班";

/* ── 工具函式 ───────────────────────────────────────────── */

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return String(iso);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
}

/** 保留既有 inline style，附加新規則（後者覆寫前者） */
function appendStyle(el, extra) {
  const current = el.getAttribute("style") || "";
  const sep = current.trim().endsWith(";") || current === "" ? "" : ";";
  el.setAttribute("style", `${current}${sep}${extra}`);
}

/** 補上 class（避免重複） */
function addClass(el, name) {
  const current = el.getAttribute("class") || "";
  if (current.split(/\s+/).includes(name)) return;
  el.setAttribute("class", current ? `${current} ${name}` : name);
}

/* ── 可見性切換 ─────────────────────────────────────────────
 * news-single.html 的預設狀態：
 *   #article-skeleton  可見（style="max-width:780px;margin:0 auto;"）
 *   #article-body      隱藏（style="display:none;"）
 *   #article-404       隱藏（style="display:none;"）
 *
 * news.js 成功時：skeleton→none、body→block、body 加 .in
 * news.js 失敗時：skeleton→none、404→block
 *
 * 一律使用 inline style 覆寫，與 news.js 相同機制，不自創 class。
 * .in 是必要的 —— .reveal 用 opacity:0 做動畫，缺少 .in 時內容
 * 雖然 display:block 但仍為全透明，爬蟲與使用者都看不到。
 * ────────────────────────────────────────────────────────── */

const HIDE_SKELETON = {
  element: (el) => appendStyle(el, "display:none;"),
};

const SHOW_BODY = {
  element(el) {
    appendStyle(el, "display:block;");
    addClass(el, "in");
  },
};

const SHOW_NOT_FOUND = {
  element: (el) => appendStyle(el, "display:block;"),
};

/* ── 主處理 ─────────────────────────────────────────────── */

export async function onRequestGet(context) {
  const { params, env, request } = context;
  const slug = params.slug;

  // 取得靜態外殼
  const shellUrl = new URL("/news-single.html", request.url);
  const shellRes = await env.ASSETS.fetch(new Request(shellUrl, request));
  const shellHtml = await shellRes.text();

  const makeShellResponse = () =>
    new Response(shellHtml, {
      headers: { "content-type": "text/html; charset=utf-8" },
    });

  // 取得文章資料
  let article = null;
  let apiFailed = false;

  try {
    const apiRes = await fetch(`${API_BASE}/news/${encodeURIComponent(slug)}`, {
      cf: { cacheTtl: 300, cacheEverything: true },
    });
    if (apiRes.ok) {
      const json = await apiRes.json();
      article = json?.data?.article ?? json?.data ?? null;
    } else if (apiRes.status !== 404) {
      apiFailed = true;
    }
  } catch (e) {
    apiFailed = true;
  }

  /* ── 路徑 A：API 異常 → 回原樣外殼，交給 JS 接手 ── */
  if (apiFailed) {
    return new Response(shellHtml, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  }

  /* ── 路徑 B：文章不存在 → 真 404 ── */
  if (!article) {
    const html = await new HTMLRewriter()
      .on("title", {
        element: (el) => el.setInnerContent(`找不到這篇文章｜${BRAND}`),
      })
      .on("head", {
        element: (el) =>
          el.append('<meta name="robots" content="noindex">', { html: true }),
      })
      .on("#article-skeleton", HIDE_SKELETON)
      .on("#article-404", SHOW_NOT_FOUND)
      // #article-body 維持預設的 display:none，不動
      .transform(makeShellResponse())
      .text();

    return new Response(html, {
      status: 404,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=0, s-maxage=60",
      },
    });
  }

  /* ── 路徑 C：正常渲染 ── */

  const title = article.title ?? "";
  const excerpt = article.excerpt ?? "";
  const contentHtml = article.content ?? "";
  const category = article.category ?? "";
  const publishedAt = article.publishedAt ?? "";
  const coverImage = article.coverImage ?? "";

  const pageTitle = `${title}｜${BRAND}`;
  const canonical = `${SITE}/news/${slug}`;
  const ogImage = coverImage || `${SITE}/assets/og-cover.jpg`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description: excerpt,
    datePublished: publishedAt,
    inLanguage: "zh-Hant-TW",
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
    publisher: {
      "@type": "EducationalOrganization",
      name: BRAND,
      url: SITE,
    },
  };
  if (ogImage) jsonLd.image = [ogImage];

  const html = await new HTMLRewriter()
    /* head — meta 與結構化資料 */
    .on("title", { element: (el) => el.setInnerContent(pageTitle) })
    .on("#meta-description", {
      element: (el) => el.setAttribute("content", excerpt),
    })
    .on("#canonical-link", {
      element: (el) => el.setAttribute("href", canonical),
    })
    .on("#og-title", { element: (el) => el.setAttribute("content", pageTitle) })
    .on("#og-description", {
      element: (el) => el.setAttribute("content", excerpt),
    })
    .on("#og-url", { element: (el) => el.setAttribute("content", canonical) })
    .on("#og-image", { element: (el) => el.setAttribute("content", ogImage) })
    .on("head", {
      element: (el) =>
        el.append(
          `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`,
          { html: true }
        ),
    })

    /* body — 內容填入 */
    .on("#article-title", { element: (el) => el.setInnerContent(title) })
    .on("#article-category", { element: (el) => el.setInnerContent(category) })
    .on("#article-date", {
      element: (el) => el.setInnerContent(formatDate(publishedAt)),
    })
    .on("#article-content", {
      element: (el) => el.setInnerContent(contentHtml, { html: true }),
    })

    /* body — 可見性切換 */
    .on("#article-skeleton", HIDE_SKELETON)
    .on("#article-body", SHOW_BODY)
    // #article-404 維持預設的 display:none，不動

    .transform(makeShellResponse())
    .text();

  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=300",
    },
  });
}
