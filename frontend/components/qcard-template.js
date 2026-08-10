/**
 * 題庫卡片（.qcard）HTML 模板 — 前端 practice.js 與後端 SSR Function 共用
 * 路徑：frontend/components/qcard-template.js
 *
 * 內容原封搬移自 practice.js 的 appendCard()，未做任何輸出改寫。
 *
 * 引用規則（兩邊不同，勿混用）：
 *   瀏覽器端（practice.js）：import 需帶 ?v= 版號，走 Cloudflare edge cache，
 *     改此檔內容後要同步 bump 兩邊引用的版號。
 *   Function 端（functions/practice.js）：import 不可帶版號，
 *     部署時由 esbuild 打包、不經過 edge cache，query string 可能導致
 *     esbuild 無法解析檔案路徑。
 */

/** 題型排序權重，未列出的型別排最後 */
export var TYPE_ORDER = { '標準題型': 0, '觀念': 1, '錯題': 2 };

function esc(s) {
  return String(s || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

/** 回傳單一題目卡片的 innerHTML 字串（不含外層 <details class="qcard">） */
export function renderQCard(q, n) {
  var optHtml = ['A','B','C','D'].map(function(lbl, i) {
    var ok = (lbl === q.answer)
    return '<div class="q-opt' + (ok ? ' correct' : '') + '">'
      + '<span class="q-opt-lbl">' + lbl + '</span>'
      + '<span>' + esc(q.options[i] != null ? q.options[i] : '') + '</span>'
      + (ok ? '<span class="q-correct-tag">&#10003; 正解</span>' : '')
      + '</div>'
  }).join('')

  var exp = q.explanation || {}
  /* find correct option value for the answer reveal row */
  var LABELS = ['A','B','C','D']
  var answerIdx = LABELS.indexOf(String(q.answer || '').toUpperCase())
  var answerVal = answerIdx >= 0 && q.options ? q.options[answerIdx] : ''
  var answerLbl = answerIdx >= 0 ? LABELS[answerIdx] : String(q.answer || '')

  return '<summary>'
      + '<span class="qnum">' + n + '</span>'
      + '<div class="q-sum-body">'
        + '<span class="q-meta">' + esc({'標準題型':'標準題型','觀念':'觀念拆解','錯題':'錯題診斷'}[q.type] || q.type || '標準題型') + '</span>'
        + '<span class="q-title">' + esc(q.question) + '</span>'
        + '<div class="q-opts">' + optHtml + '</div>'
      + '</div>'
      + '<span class="plus">+</span>'
    + '</summary>'
    + '<div class="qbody">'
      + '<div class="qseg ok">'
        + '<span class="st">&#10003; 正確觀念</span>'
        + '<div class="q-ans-inline">'
          + '<span class="q-ans-badge">' + esc(answerLbl) + '</span>'
          + '<span class="q-ans-val">' + esc(answerVal) + '</span>'
        + '</div>'
        + (exp.concept ? '<span class="sx">' + esc(exp.concept) + '</span>' : '')
      + '</div>'
      + '<div class="qseg err"><span class="st">&#10007; 常見錯誤</span><span class="sx">' + esc(exp.commonMistake || '') + '</span></div>'
      + '<div class="qseg tip"><span class="st">&#9733; 記憶提示</span><span class="sx">' + esc(exp.memoryTip || '') + '</span></div>'
    + '</div>'
}
