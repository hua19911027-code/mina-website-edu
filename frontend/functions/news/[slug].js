/**
 * Cloudflare Pages Function — 最新消息單篇文章伺服器端渲染
 * 路徑：frontend/functions/news/[slug].js
 * 對應網址：https://minaedu.tw/news/{slug}
 *
 * 版本：V3
 *
 * 版本歷程：
 *   V1 — 初版。問題：env.ASSETS.fetch("/news-single.html") 疑似觸發
 *        「.html → 無副檔名」308 重導向，body 為空，產生空白頁。
 *   V2 — 改為優先取無副檔名路徑 + 手動跟隨 3xx。SSR 成功。
 *        殘留問題：只匯出 onRequestGet，HEAD 請求不經過 Function，
 *        導致 curl -I 測到的是靜態資源層的回應（狀態碼與標頭皆非本 Function 產生）。
 *   V3 — 改為 onRequest（涵蓋 GET 與 HEAD）；
 *        setDisplay() 改為先移除既有 display 宣告再設定，避免
 *        style 屬性殘留 "display:none;display:block;" 這類脆弱寫法。
 */

const API_BASE = "https://api.minaedu.tw/api/v1";
const SITE = "https://minaedu.tw";
const BRAND = "臺中市私立卓越國際文理短期補習班";

/** 外殼候選路徑，依序嘗試 */
const SHELL_CANDIDATES = ["/news-single", "/news-single.html"];

/** 外殼內容最小長度，低於此值視為抓取失敗 */
const SHELL_MIN_LENGTH = 500;

/* ── 工具函式 ───────────────────────────────────────────── */

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return String(iso);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
}

/**
 * 設定 inline style 的 display 值。
 * 先移除既有的 display 宣告再寫入，避免同一屬性重複出現。
 * 其餘 style 宣告（如 max-width、margin）完整保留。
 */
function setDisplay(el, value) {
  const current = el.getAttribute("style") || "";
  const kept = current
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s && !/^display\s*:/i.test(s));
  kept.push(`display:${value}`);
  el.setAttribute("style", kept.join(";") + ";");
}

/** 補上 class（避免重複） */
function addClass(el, name) {
  const current = el.getAttribute("class") || "";
  if (current.split(/\s+/).filter(Boolean).includes(name)) return;
  el.setAttribute("class", current ? `${current} ${name}` : name);
}

/**
 * 取得靜態外殼 HTML。
 * 依序嘗試候選路徑，並手動跟隨重導向（env.ASSETS.fetch 不會自動跟隨）。
 * @returns {Promise<{html: string, path: string} | null>}
 */
async function loadShell(env, request) {
  for (const candidate of SHELL_CANDIDATES) {
    let url = new URL(candidate, request.url);

    try {
      // 使用乾淨的 GET 請求，不沿用原始 request 的標頭與方法。
      // 特別重要：原始請求可能是 HEAD，直接沿用會拿不到 body。
      let res = await env.ASSETS.fetch(
        new Request(url.toString(), { method: "GET" })
      );

      for (let hop = 0; hop < 3; hop++) {
        if (res.status < 300 || res.status >= 400) break;
        const loc = res.headers.get("location");
        if (!loc) break;
        url = new URL(loc, url);
        res = await env.ASSETS.fetch(
          new Request(url.toString(), { method: "GET" })
        );
      }

      if (!res.ok) continue;

      const html = await res.text();
      if (html && html.length >= SHELL_MIN_LENGTH) {
        return { html, path: url.pathname };
      }
    } catch (e) {
      // 換下一個候選路徑
    }
  }

  return null;
}

/* ── 可見性切換 ─────────────────────────────────────────────
 * news-single.html 預設狀態：
 *   #article-skeleton  可見（style="max-width:780px;margin:0 auto;"）
 *   #article-body      隱藏（style="display:none;"）
 *   #article-404       隱藏（style="display:none;"）
 *
 * news.js 成功時：skeleton→none、body→block、body 加 .in
 * news.js 失敗時：skeleton→none、404→block
 *
 * 以 inline style 覆寫，與 news.js 相同機制。
 * .in 為必要 —— .reveal 使用 opacity:0，缺少 .in 時內容雖 display:block
 * 仍為全透明，等同不可見。
 * ────────────────────────────────────────────────────────── */

const HIDE_SKELETON = {
  element: (el) => setDisplay(el, "none"),
};

const SHOW_BODY = {
  element(el) {
    setDisplay(el, "block");
    addClass(el, "in");
  },
};

const SHOW_NOT_FOUND = {
  element: (el) => setDisplay(el, "block"),
};

/* ── 主處理 ─────────────────────────────────────────────────
 * 使用 onRequest 而非 onRequestGet：
 * 需同時涵蓋 HEAD 請求。爬蟲、監控工具與 curl -I 皆會發送 HEAD，
 * 若只處理 GET，HEAD 會掉到靜態資源層，回傳與本 Function 無關的
 * 狀態碼與標頭，造成誤判。
 * Workers runtime 會自動為 HEAD 回應移除 body。
 * ────────────────────────────────────────────────────────── */

export async function onRequest(context) {
  const { params, env, request } = context;

  // 僅處理讀取類方法
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: { allow: "GET, HEAD" },
    });
  }

  const slug = params.slug;

  /* 步驟 1：取得靜態外殼 */
  const shell = await loadShell(env, request);

  if (!shell) {
    return new Response(
      "Shell template unavailable. Tried: " + SHELL_CANDIDATES.join(", "),
      {
        status: 500,
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "cache-control": "no-store",
          "x-mina-render": "shell-load-failed",
        },
      }
    );
  }

  const shellHtml = shell.html;
  const makeShellResponse = () =>
    new Response(shellHtml, {
      headers: { "content-type": "text/html; charset=utf-8" },
    });

  /* 步驟 2：取得文章資料 */
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

  /* 路徑 A：API 異常 → 回原樣外殼，交給前端 JS 接手 */
  if (apiFailed) {
    return new Response(shellHtml, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
        "x-mina-shell": shell.path,
        "x-mina-render": "api-failed-passthrough",
      },
    });
  }

  /* 路徑 B：文章不存在 → 真 404 */
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
      // #article-body 維持預設 display:none
      .transform(makeShellResponse())
      .text();

    return new Response(html, {
      status: 404,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=0, s-maxage=60",
        "x-mina-shell": shell.path,
        "x-mina-render": "not-found",
      },
    });
  }

  /* 路徑 C：正常渲染 */

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
    // #article-404 維持預設 display:none

    .transform(makeShellResponse())
    .text();

  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=300",
      "x-mina-shell": shell.path,
      "x-mina-render": "ssr",
    },
  });
}
