/**
 * Cloudflare Pages Function — 題庫練習頁伺服器端渲染
 * 路徑：frontend/functions/practice.js
 * 對應網址：https://minaedu.tw/practice
 *
 * 範圍：本輪僅 SSR 預設篩選（小一／英文）的本週題目到 #qcards。
 * 歷屆題庫、考前複習、切換篩選後的結果維持既有的 client-side fetch，
 * 不在此 Function 處理範圍內。
 */

import { renderQCard, TYPE_ORDER } from '../components/qcard-template.js'

const API_BASE = 'https://api.minaedu.tw/api/v1'

/** 外殼候選路徑，依序嘗試 */
const SHELL_CANDIDATES = ['/practice', '/practice.html']

/** 外殼內容最小長度，低於此值視為抓取失敗 */
const SHELL_MIN_LENGTH = 500

/**
 * SSR 要渲染的預設篩選條件，必須與 practice.html 的預設 active 狀態一致：
 *   <button class="grade active" data-g="1">小一</button>
 *   <button class="tab active" data-subj="en">英文</button>
 * practice.js 的 GRADE_MAP/SUBJ_MAP 會把這兩個 data 屬性轉成中文值再送 API，
 * 這裡直接寫中文值，跳過轉換這層——若之後改了 practice.html 的預設選取狀態，
 * 這裡也要同步改。
 */
const DEFAULT_GRADE = '小一'
const DEFAULT_SUBJECT = '英文'

/* ── 工具函式（沿用 news/[slug].js 的做法）───────────────────── */

/**
 * 取得靜態外殼 HTML。
 * 依序嘗試候選路徑，並手動跟隨重導向（env.ASSETS.fetch 不會自動跟隨）。
 * 務必用 env.ASSETS.fetch() 直接取靜態資源，不可用 fetch("/practice")——
 * 後者會呼叫到這支 Function 自己，造成無限迴圈。
 * @returns {Promise<{html: string, path: string} | null>}
 */
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

/** 依 practice.js 相同的題型排序邏輯排序題目 */
function sortQuestions(qs) {
  return qs.slice().sort((a, b) => {
    const ao = TYPE_ORDER[a.type] != null ? TYPE_ORDER[a.type] : 99
    const bo = TYPE_ORDER[b.type] != null ? TYPE_ORDER[b.type] : 99
    return ao - bo
  })
}

/** 產生一張 <details class="qcard">…</details> 的完整 HTML */
function renderQCardDetails(q, n) {
  return `<details class="qcard">${renderQCard(q, n)}</details>`
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

  /* 步驟 1：取得靜態外殼 */
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
  const makeShellResponse = () =>
    new Response(shellHtml, {
      headers: { 'content-type': 'text/html; charset=utf-8' },
    })

  /* 步驟 2：取得預設篩選（小一／英文）的本週題目 */
  let questions = null

  try {
    const params = `grade=${encodeURIComponent(DEFAULT_GRADE)}&subject=${encodeURIComponent(DEFAULT_SUBJECT)}`
    const apiRes = await fetch(`${API_BASE}/practice?${params}`, {
      cf: { cacheTtl: 300, cacheEverything: true },
    })
    if (apiRes.ok) {
      const json = await apiRes.json()
      if (json.ok && json.data && Array.isArray(json.data.questions)) {
        questions = json.data
      }
    }
  } catch (e) {
    // questions 維持 null，走降級路徑
  }

  /* 降級路徑：API 異常或 questions 為空 → 回原樣外殼，交給前端 JS 接手 */
  if (!questions || !questions.questions.length) {
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

  /* 正常渲染路徑 */
  const sorted = sortQuestions(questions.questions)
  const cardsHtml = sorted.map((q, i) => renderQCardDetails(q, i + 1)).join('')
  const hasMore = !!questions.hasMore

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: '小一英文練習題庫',
    itemListElement: sorted.map((q, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: q.question,
    })),
  }

  const html = await new HTMLRewriter()
    .on('#qcards', {
      element(el) {
        el.setAttribute('data-ssr-count', String(sorted.length))
        el.setAttribute('data-ssr-hasmore', hasMore ? 'true' : 'false')
        el.setInnerContent(cardsHtml, { html: true })
      },
    })
    .on('head', {
      element: (el) =>
        el.append(
          `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`,
          { html: true }
        ),
    })
    .transform(makeShellResponse())
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
