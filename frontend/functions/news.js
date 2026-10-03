/**
 * Cloudflare Pages Function — 最新消息列表頁伺服器端渲染
 * 路徑：frontend/functions/news.js
 * 對應網址：https://minaedu.tw/news
 *
 * 目的：讓第一頁文章卡片（含 /news/{slug} 連結）直接出現在 HTML，
 * 搜尋引擎不需執行 JavaScript 就能發現每篇文章。
 * 範圍：僅 SSR「全部」分類第 1 頁卡片，另在底部輸出所有文章的連結清單；切換分類、載入更多維持 news.js 的 client-side fetch。
 * 卡片結構必須與 news.js 的 buildCard() 一致。
 */

const API_BASE = 'https://api.minaedu.tw/api/v1'

/** 與 news.js 的 PAGE_SIZE 一致 */
const PAGE_SIZE = 9

/** 外殼候選路徑，依序嘗試 */
const SHELL_CANDIDATES = ['/news', '/news.html']

/** 外殼內容最小長度，低於此值視為抓取失敗 */
const SHELL_MIN_LENGTH = 500

const CAT_CLASS = { '公告': 'c-notice', '活動': 'c-event', '特別課程': 'c-course', '文章': 'c-article' }
const CAT_EMOJI = { '公告': '📢', '活動': '☀️', '特別課程': '🔤', '文章': '📖' }

/* ── 工具函式（沿用 practice.js 的外殼載入做法）──────────────── */

async function loadShell(env, request) {
  for (const candidate of SHELL_CANDIDATES) {
    let url = new URL(candidate, request.url)

    try {
      let res = await env.ASSETS.fetch(
        new Request(url.toString(), { method: 'GET' })
      )

      for (let hop = 0; hop < 3; hop++) {
        if (res.status < 300 || res.status >= 400) break
        const loc = res.headers.get('location')
        if (!loc) break
        url = new URL(loc, url)
        res = await env.ASSETS.fetch(
          new Request(url.toString(), { method: 'GET' })
        )
      }

      if (!res.ok) continue

      const html = await res.text()
      if (html && html.length >= SHELL_MIN_LENGTH) {
        return { html, path: url.pathname }
      }
    } catch (e) {
      // 換下一個候選路徑
    }
  }

  return null
}

function esc(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** 與 news.js formatDate 相同格式，固定用台北時區（Workers 預設為 UTC） */
function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d)) return ''
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d)
  const get = (t) => parts.find((p) => p.type === t).value
  return `${get('year')}.${get('month')}.${get('day')}`
}

function truncate(str, max) {
  if (!str) return ''
  return str.length > max ? str.slice(0, max) + '…' : str
}

/** 產生一張 <a class="ncard"> 卡片，結構對應 news.js buildCard() */
function renderCard(a) {
  const catCls = CAT_CLASS[a.category] || ''
  const cover = a.coverImage
    ? `<img src="${esc(a.coverImage)}" alt="${esc(a.title)}" loading="lazy" style="width:100%;height:100%;object-fit:cover;">`
    : `<span class="nc-ico">${CAT_EMOJI[a.category] || '📰'}</span>`

  return (
    `<a href="/news/${encodeURIComponent(a.slug)}" class="ncard reveal in">` +
    `<div class="nc-cover ${catCls}">${cover}</div>` +
    `<div class="nc-body">` +
    `<div class="nc-meta"><span class="nc-cat ${catCls}">${esc(a.category)}</span>` +
    `<span class="nc-date">${formatDate(a.publishedAt)}</span></div>` +
    `<h3>${esc(a.title)}</h3>` +
    `<p class="nc-excerpt">${esc(truncate(a.excerpt || '', 80))}</p>` +
    `<span class="nc-more">閱讀更多 →</span>` +
    `</div></a>`
  )
}

/* ── 主處理 ─────────────────────────────────────────────────
 * 使用 onRequest 而非 onRequestGet：需同時涵蓋 HEAD 請求，理由同 news/[slug].js。
 * ────────────────────────────────────────────────────────── */

export async function onRequest(context) {
  const { env, request } = context

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: { allow: 'GET, HEAD' },
    })
  }

  const shell = await loadShell(env, request)

  if (!shell) {
    return new Response(
      'Shell template unavailable. Tried: ' + SHELL_CANDIDATES.join(', '),
      {
        status: 500,
        headers: {
          'content-type': 'text/plain; charset=utf-8',
          'cache-control': 'no-store',
          'x-mina-render': 'shell-load-failed',
        },
      }
    )
  }

  const shellHtml = shell.html

  /* 單次最多 30 篇（API 上限），抓前兩頁涵蓋至多 60 篇，供「全部文章」連結清單使用 */
  let articles = null
  try {
    const pages = await Promise.all(
      [1, 2].map(async (p) => {
        const apiRes = await fetch(`${API_BASE}/news?page=${p}&limit=30`, {
          cf: { cacheTtl: 300, cacheEverything: true },
        })
        if (!apiRes.ok) return null
        const json = await apiRes.json()
        return json.ok && json.data && Array.isArray(json.data.articles) ? json.data : null
      })
    )
    if (pages[0]) {
      articles = pages[0].articles.concat(pages[1] ? pages[1].articles : [])
    }
  } catch (e) {
    // articles 維持 null，走降級路徑
  }

  /* 降級路徑：API 異常或沒有文章 → 回原樣外殼，交給 news.js 接手 */
  if (!articles || !articles.length) {
    return new Response(shellHtml, {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-store',
        'x-mina-shell': shell.path,
        'x-mina-render': 'api-failed-passthrough',
      },
    })
  }

  const cards = articles.slice(0, PAGE_SIZE)
  const cardsHtml = cards.map(renderCard).join('')
  const hasMore = articles.length > PAGE_SIZE

  /* 全部文章連結清單：搜尋引擎不會點「載入更多」，這裡把所有文章連結直接列在 HTML */
  const allListHtml =
    `<nav class="news-all" aria-label="全部文章" style="margin-top:48px;">` +
    `<h2 style="font-size:1.1rem;margin-bottom:12px;">全部文章</h2>` +
    `<ul style="list-style:none;padding:0;margin:0;display:grid;gap:8px;">` +
    articles
      .map(
        (a) =>
          `<li><a href="/news/${encodeURIComponent(a.slug)}">${esc(a.title)}</a>` +
          ` <span style="opacity:.6;font-size:.85em;">${formatDate(a.publishedAt)}</span></li>`
      )
      .join('') +
    `</ul></nav>`

  const html = await new HTMLRewriter()
    .on('#newsGrid', {
      element(el) {
        el.setAttribute('data-ssr-count', String(cards.length))
        el.setAttribute('data-ssr-hasmore', hasMore ? 'true' : 'false')
        el.setInnerContent(cardsHtml, { html: true })
      },
    })
    .on('#load-more-wrap', {
      element(el) {
        if (hasMore) el.setAttribute('style', 'text-align:center;margin-top:40px;display:block;')
        el.after(allListHtml, { html: true })
      },
    })
    .transform(
      new Response(shellHtml, {
        headers: { 'content-type': 'text/html; charset=utf-8' },
      })
    )
    .text()

  return new Response(html, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=0, s-maxage=600',
      'x-mina-shell': shell.path,
      'x-mina-render': 'ssr',
    },
  })
}
