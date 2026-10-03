/**
 * 最新消息文章卡片模板（前後端共用）
 * 供 functions/news.js、functions/news/[slug].js 伺服器端渲染使用，
 * 輸出結構必須與 news.js 的 buildCard() 一致。
 * Function 端 import 不可帶 ?v= 版號。
 */

export const CAT_CLASS = { '公告': 'c-notice', '活動': 'c-event', '特別課程': 'c-course', '文章': 'c-article' }
export const CAT_EMOJI = { '公告': '📢', '活動': '☀️', '特別課程': '🔤', '文章': '📖' }

export function esc(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** 與 news.js formatDate 相同格式，固定用台北時區（Workers 預設為 UTC） */
export function formatDate(iso) {
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

export function truncate(str, max) {
  if (!str) return ''
  return str.length > max ? str.slice(0, max) + '…' : str
}

/** 產生一張 <a class="ncard"> 卡片，結構對應 news.js buildCard() */
export function renderCard(a) {
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
