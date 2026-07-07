# PROJECT_STATE.md — Mina 網站專案

**最後更新**：2026-07-07（115學年度出版社設定更新）  
**分支**：dev（自動部署至 minaedu.tw，實際平台是 **Railway**（Railpack + Caddy），不是 Cloudflare Pages，見下方技術備忘）  
**Mobile PageSpeed**：Performance **91**、CLS **0**（2026-07-04 用 PageSpeed API 連測3次確認穩定，CrUX 無真實數據可查——流量不足，Search Console 應該也顯示同樣結果。之前 0.197~0.216 確認是 Lighthouse 手機節流模擬的量測抖動，非常態）、Accessibility 100、Best Practices 100、SEO 100  
**QA 健康分數**：93 / 100 ✅（6月25日 /qa 全面審計，修正 CSP GA4，此分數尚未反映今日變化）

---

## ✅ 已完成（2026-07-07，本次 session）

### 115 學年度出版社設定更新（n8n workflow，非 repo commit）
- 使用者提供旭光國小 115 學年度教科書選用表，8/1 起新學年生效
- **重要發現**：規格文件（`Mina_題庫系統_封板規格_V2.0.md` 第12節）描述的「Admin Panel 上傳教科書照片 → AI Vision 分析 → 寫入 Notion『出題規範』DB → 出題時讀取」機制**沒有真的接上**——那個 DB 有寫入但沒有東西讀取。實際出題邏輯是 n8n workflow `AI-自動出題（每月15日）`（ID `IpxBWR3Nbg2z798v`）「建立出題任務清單」code 節點裡**寫死**的 JS 出版社對照物件
- 已透過 n8n API 直接更新該節點，換成 115 學年度版本（數學：小一翰林/小二康軒/小三康軒/小四康軒/小五康軒/小六康軒；英文：小三何嘉仁SuperFun/小四康軒WW/小五康軒WW/小六何嘉仁SuperFun，小一小二英文沿用康軒WW）
- **時間壓力已排除**：此 workflow 7/15 09:00 會出「8月份」的題（115學年度第一批），已在期限前改完並驗證 workflow 仍是 active 狀態
- 詳細新舊對照與決策脈絡記錄在 `memory/decisions.md`
- **缺螺絲**：明年（116學年度）一樣要手動改這個 code 節點；Admin Panel 出版社上傳功能目前是斷頭路，要接上需額外開發（讀取出題規範DB、改 prompt 組裝邏輯），這次先跳過

---

## ✅ 已完成（2026-07-04）

### CLS 確認已解決（非新修正，是驗證之前的修正有效）
- 用 Google PageSpeed API（使用者提供 API key）連續查 3 次 minaedu.tw mobile，CLS 穩定為 0，效能分數 91
- CrUX 真實數據完全沒有（流量不足），Search Console Core Web Vitals 大概率顯示「資料不足」
- 結論：6/25 之前修正的 critical CSS cascade override（commit `1ef5900`）是有效的，之前重測分數沒改善是 Lighthouse 手機節流模擬變異度造成的假訊號

### 首頁 JSON-LD 補 aggregateRating（commit `29b8b29`）
- Google Maps 商家頁確認：4.8 星、22 則評論
- 補進 `index.html` JSON-LD `aggregateRating`

### `/news/xxx` 乾淨網址上線（commit `29b8b29`→`ffb51af`，含一次 Cloudflare 規則）
- **Cloudflare Transform Rule**（Rewrite）：`http.request.uri.path wildcard "/news/*"` → 內部改寫路徑到 `/news-single`、query 帶 `slug=`（Free 方案不支援 regex `matches`，改用 `wildcard` + `wildcard_replace()`）
- **`news.js`**（commit `69af49a`）：`initSinglePage()` 原本只認 `location.search` 的 `?slug=`，抓不到就 `location.replace('news.html')`——新增 `location.pathname` 解析 fallback（`/news/:slug` 格式）
- **`news-single.html`**（commit `ffb51af`）：加 `<base href="/">`——原本 nav/logo/CSS/JS 全部用相對路徑，瀏覽器在 `/news/xxx` 這種網址下會把 `news/` 誤判成目錄，資源全部 404（MIME type 被瀏覽器擋掉，script 完全沒執行）
- **驗證**：3 篇不同文章的乾淨網址 + 舊格式 `news-single.html?slug=xxx` + 假 slug（優雅顯示 404 區塊，非新問題）+ `/news.html` 列表頁 + 首頁，全部無 console error、內容正確
- **canonical/og:url 已統一（commit `e0c4f7f`）**：`updateArticleSEO()` 改成永遠產生 `/news/:slug` 格式，不管訪客從舊格式還是新格式進來，canonical 都指向同一個乾淨網址，避免重複內容疑慮。已驗證兩種進入方式皆正確。
- **文章卡片連結統一改乾淨網址（commit `1b78065`）**：`news.html` 列表頁、`news-single.html` 相關文章卡片，連結格式從 `news-single.html?slug=` 改成 `/news/:slug`，全站內部連結格式一致

---

## ✅ 已完成（2026-07-01 續）

### 關於我們頁面補照片（commit `e5b5873`）
- 「Our Story」區塊的「教室／環境照片（待提供）」佔位框，換成真實店面外觀照片
- `frontend/assets/images/space/店面.jpg`（1448×1086，4:3）

### 部署架構釐清：Railway，不是 Cloudflare Pages（重要，改了認知）
- 嘗試把 `/news-single.html?slug=xxx` 改成乾淨網址 `/news/xxx`，過程中發現 PROJECT_STATE.md 長期記錯部署平台
- **實際架構**：Railway（Railpack 建置，用 Caddy 當靜態檔案伺服器），`minaedu.tw` 沒有登記在 Railway 的 domain 清單裡 → 代表 **Cloudflare 在前面擋著轉發到 Railway**，header 設定（CSP等）跟任何網址重寫規則都是在 **Cloudflare 那層設定**，跟這個 git repo 完全無關
- `frontend/_headers`、`frontend/_redirects` 這兩個檔案（Cloudflare Pages/Netlify 慣例）對 Railway 來說**是死的，不會被讀取**——官方文件確認 Railpack 不支援這兩個檔案
- 乾淨網址嘗試因此失敗（`_redirects` 沒作用，`/news/xxx` 被 Cloudflare 既有規則 308 導到 `/news-single` 且掉失 slug），已完整 `git revert` 撤銷（commit `3c3c8ba`、`0b50db0`），確認線上恢復正常
- 過程中意外用 `railway domain`（不帶參數）誤建了一個多餘網域，已刪除清乾淨，不影響 minaedu.tw

### CLS 0.197 → 找到根因，部分修正（commit `1ef5900`）
- 發現：PageSpeed Performance 95→84，CLS 從 0 惡化成 0.197，`<section class="hero">` 被標為 layout shift 元凶
- 根因：稍早（6/25 之前）加的 critical CSS 只複製了 `styles.css` 裡 `.hero-sub` / `.page-hero .ph-sub` 的第一條規則，漏了後面第二條 cascade override（line-height、max-width 不同）→ 首次繪製跟 styles.css 載入後的排版不一致 → reflow
- 已修正 9 個頁面 critical CSS，補齊遺漏的第二條規則，確認已部署
- **⚠️ 但重測 PageSpeed 兩次，CLS 仍是 0.216，沒有明顯改善**——用瀏覽器直接量測（`performance.getEntriesByType('layout-shift')`）在正常網速下完全沒偵測到位移，代表這個 CLS 只在 PageSpeed 模擬的手機慢速網路/CPU 節流下才會重現，工具權限不夠（CDP 節流 API 被 browse 的安全清單擋掉）沒辦法在本機複現驗證
- 這個修正本身是對的、該做，但**還沒證實它是 CLS 唯一或主要成因**，留待下次追

---

## ✅ 已完成（2026-07-01）

### 首頁 FOUC 修正（commit `dd3309b`）
- 根因：`styles.css` 用 non-blocking preload 載入，瀏覽器先畫未套樣式的 HTML 再套 CSS，進站瞬間閃一下純文字版面
- 修法：9 個頁面 `<head>` 加 inline critical CSS（nav + hero/page-hero 關鍵樣式），首次繪製就是正確樣式，`styles.css` 仍維持 non-blocking 不影響效能分數

### SEO / Google 收錄補強（commit `d30e325`）
- `sitemap.xml`：14 篇最新消息文章原本完全沒有索引路徑（news.html 用 JS 動態產連結），已串 API 補進 sitemap
- `news-single.html` + `news.js`：文章載入後動態設定 canonical / og:title / og:description / og:image，並注入 `NewsArticle` + `BreadcrumbList` JSON-LD（原本每篇文章分享出去都顯示同一組通用標題）
- 首頁 JSON-LD：`image` 從 placehold.co 佔位圖網址改成真實 og-cover.jpg，新增 `sameAs`（LINE/FB/IG/Threads）、`logo`，`@type` 補上 `LocalBusiness`
- 7 個子頁加入 `BreadcrumbList` JSON-LD，對應既有視覺麵包屑
- `llms.txt` 內容原本描述另一間「數學補習班」，跟本站徐薇英文×偉智數學不符，已改寫
- Google Search Console 驗證、Google Business Profile 認領 → 使用者已自行完成

### 題庫「本週題目」空窗期 fallback（commit `6e6155f`）
- 根因：`/api/v1/practice` 用滾動 7 天窗口篩選本週題目，月批次交界（6/23 已發布批次 → 7/03 下一批）之間有空窗，7/01 當天窗口內完全沒有任何批次，導致首頁小工具與 practice.html 都顯示「目前沒有符合條件的題目」
- 修法：`index.html`、`practice.js` 本週題目為空時自動 fallback 到 `/practice/archive`，顯示最近一批已發布題目，附「本週新題準備中，先看看最近一批」提示；下次批次日期一到自動恢復正常，不用人工介入
- 另外：7 月已生成的 137 筆題目 Notion「是否發布」全數勾選（透過 Notion MCP 逐筆更新，SQL COUNT 驗證 137/137 成功）

### JS 快取版本號機制（commit `50c6df7`、`937fca1`）
- 踩坑：改了 `practice.js` 內容但忘記 bump `practice.html` 裡 `?v=` 版本號，Cloudflare 4小時快取讓已抓過舊版的瀏覽器/edge 持續跑舊程式碼，導致「首頁有 fallback 但 practice.html 沒有」
- 已修正版本號 → `?v=20260701`，並補上全站慣例：`site.js`、`components/mina-widget.js`、`booking.js`、`faq.js`、`news.js` 原本完全沒有版本號機制，9 個頁面 20 處 `<script src>` 統一補上 `?v=` query string
- **重要**：以後改任何一支 `.js`，記得同步 bump 該頁面上對應的版本號，否則會重演這次的問題

---

## ✅ 已完成（2026-06-25）

### QA 全面審計（6月25日完成）
- 9 個頁面全部通過，API 4 個端點全部正常
- CSP GA4 修正：`connect-src` 補加 `www.google.com`、`stats.g.doubleclick.net`、`region1.google-analytics.com`（commit `e5840eb`）
- QA 健康分 88 → 93

### PageSpeed Performance 95 + Accessibility 100（本輪完成）
- GA4 defer 至 window.load → TBT 210ms→50ms、LCP 3.5s→2.6s
- SVG preload 移至 head 最前 → Resource Load Delay 改善
- `.bub.me` / `.chat-top span` #06C755→#04882E（2.16:1→4.60:1）
- LINE 綠色全局修正：#048A2E（4.49:1）→ #04882E（4.60:1），通過 WCAG AA 4.5:1
- 移除 9 個 HTML 的 `body{opacity:0}` → 解決 LCP Element Render Delay 1590ms + CLS 0.095
- WCAG AA contrast 修正共 9 處（btn-line / soc / tstat / ink-mute / nav / widget / bub.me）
- 新增 llms.txt（H1 + 6 links，代理瀏覽 3/3）

### 品質 / 安全稽核（本輪完成）
- `/review 全面`：找出 3 項問題 → 已全部修正
  - body opacity 保底 setTimeout（9 個 HTML，防 LCP 找不到元素）
  - 非合成動畫移除（mina-fab box-shadow、footer link color transition）
  - var ac 重複宣告修正（practice.js）
- `/qa 全面`：線上 minaedu.tw 全面測試 → 找出 GA 未載入 → CSP 已修正
- `/cso 全面`：安全審計完成，3 項已修：
  - `X-Frame-Options: SAMEORIGIN` → `DENY`（與 CSP frame-ancestors 一致）
  - `/health` 移除 env 欄位（避免洩漏環境資訊）
  - Booking API 新增欄位長度上限（姓名100/電話30/備註500字）
- CSO SEC-001：確認 Notion API key + LINE token 已重發、repo 私有 → RESOLVED

---

## ✅ 已完成

### 前端頁面（全部上線）
- `index.html` — 首頁（Hero、Trust Section、課程卡、Practice Section、Widget）
- `about.html` — 關於我們
- `courses.html` — 課程介紹
- `news.html` — 最新消息列表（含 Filter Tab）
- `news-single.html` — 單篇文章（含活動照片 Carousel）
- `practice.html` — 題庫練習（年級 × 科目篩選、錯題診斷）
- `faq.html` — 常見問題
- `booking.html` — 預約試聽表單
- `booking-success.html` — 預約完成頁

### 後端 Workers API（Hono.js on Cloudflare Workers）
- `POST /api/v1/bookings` — 預約寫入 Notion
- `GET /api/v1/news` + `GET /api/v1/news/:slug` — 最新消息（含活動照片）
- `GET /api/v1/faq` — FAQ
- `GET /api/v1/practice` — 題庫（年級/科目/週次/審核模式過濾）
- `POST /api/v1/mina/query` — Mina 聊天機器人

### n8n 自動化 Flows（全部 active）
- **Flow 1**：每日出題（Cron → AI → Notion 題庫 DB）
- **Flow 2**：計數動畫 + 系統提示詞（V2.0 格式，15日 cron）
- **Flow 3**：Notion → 前端同步
- **Flow 4**：年度封存（9/30 執行，`已封存=true`）
- **Flow 5**：夜間整理（02:00 cron）
- **Flow 6**：30 日審核截止最終提醒（ID：`2V4fjNzNSgQ6Jccn`）

### Workers V2.0 KV + Cache（2026-06-15）
- 三個 KV namespace 綁定：`mina-settings`、`mina-cache`、`mina-rate-limit`
- 限流從 `KV_SETTINGS` 正確移至 `KV_RATE_LIMIT`
- News / Practice Notion API 回應加 KV Cache（15min / 5min / 60min）
- `DELETE /api/v1/admin/cache` + `/cache/:prefix` 快取清除 API
- Admin Panel 加「快取管理」卡片（清除新聞 / 題庫 / 全部）

### 效能優化（三輪完成）
- Noto Sans TC 移除 Google Fonts → 系統字型 fallback（CLS 0.095→~0）
- IntersectionObserver 取代 requestIdleCallback（LCP 8.9s→~2s）
- mina-widget.css 非阻塞載入（`media="print" onload`）
- 計數器動畫 800ms、qcards min-height、hero-logo 94×94
- 所有 transitions 改 composited（transform + opacity only）
- `font-display: optional`、`defer` scripts、logo width/height

### 題庫練習頁面修正（2026-06-15，全部 commit）
- 全站 LINE 連結 → `https://lin.ee/5oH6pOc`（9 個 HTML + mina-widget.js）
- FOUC 修正：`body{opacity:0}` + CSS onload reveal，0.15s fade
- 考前複習 inactive 訊息修正（`active = json.ok && json.data?.active`）
- 題目不顯示修正：移除 `是否發布/已封存` checkbox filter，改 `created_time` 排序
- 浮動按鈕圖示還原為學校 logo SVG
- 歷屆題庫提示改 inline 展開（`#archive-inline-msg`），避免被 widget z-index 遮住

---

## 🔄 進行中

（目前無進行中項目，2026-07-01 本輪 FOUC / SEO / 題庫空窗期 / JS 快取修正已全部 commit + push）

---

## 🔧 缺螺絲（下次可以做，未強制）

- **CLS 0.197~0.216 尚未證實解決**：已修正 critical CSS 遺漏的 cascade override（真的是個 bug，該修），但重測 PageSpeed 分數沒有改善。可能原因：Lighthouse 手機節流模擬本身變異度大（本次量測 CPU 模擬能力在 662~922 間跳動）、或 Cloudflare edge cache 節點間不同步、或還有沒抓到的第三個成因。下次先去 **Google Search Console → Core Web Vitals** 看真實使用者數據（比單次 Lighthouse 快照可靠），而不是一直重跑 PageSpeed
- **Bing Webmaster Tools 提交 sitemap**：GSC + GBP 已完成，Bing/Yahoo TW 這塊還沒補（5分鐘可完成，零成本）
- **Google 評論催收**：試聽後/續班時請家長留 Google 評論，累積到有意義數量（建議10+）後可把 `aggregateRating` schema 加回首頁 JSON-LD（現在故意沒加，因為不能虛構評分）
- **`news-single.html?slug=xxx` 網址格式**：跟速度無關，SEO 風險已用動態 canonical 補掉，只是不夠漂亮。**已嘗試改成 `/news/xxx` 但失敗並撤銷**（見上方「部署架構釐清」），因為部署平台是 Railway 不是 Cloudflare Pages，`_redirects` 沒用。要做的話得改 Cloudflare dashboard 的 Transform/Redirect Rules，或 Railway 自訂 Caddyfile，需要先弄清楚 Cloudflare 那層現有規則長怎樣（需要你有 Cloudflare dashboard 存取權限）
- **首頁「最新消息預覽」區塊**：目前首頁只有 nav/footer 連到 news.html，沒有文章預覽卡片，內部連結權重較弱。要加的話是新增首頁版面區塊，需要先問過再動（今日已問過，你選擇不做）
- **JS 版本號機制是新建立的慣例（2026-07-01 起）**：以後改 `site.js` / `practice.js` / `news.js` / `booking.js` / `faq.js` / `components/mina-widget.js` 任何一支，切記同步 bump 該頁面 `<script src>` 的 `?v=` 版本號，否則快取會讓使用者卡在舊版

---

## ❌ 未完成（V2.0 功能）

### ~~1. Workers KV 綁定~~ ✅ 完成
### ~~2. Admin Settings API~~ ✅ 完成
### ~~3. Admin Panel HTML~~ ✅ 完成（含快取管理）

### 4. n8n Webhook 串通 ✅ 完成（2026-06-16）
- **A2** 手動重新出題：`POST /api/v1/admin/practice/regenerate` → `https://n8n.minaedu.tw/webhook/practice-regenerate`
- **A3** 出版社分析：`POST /api/v1/admin/publisher/analyze` → `https://n8n.minaedu.tw/webhook/publisher-analyze`
- N8N_REGEN_WEBHOOK + N8N_PUBLISHER_WEBHOOK secrets ✅ 已設定

---

## ✅ 全部完成（2026-06-16）

| 項目 | 狀態 |
|------|------|
| `minaedu.tw` + `www.minaedu.tw` Pages 綁定 | ✅ |
| `api.minaedu.tw` Workers 路由 | ✅ DNS 已生效，HTTP 200 |
| `n8n.minaedu.tw` Tunnel → localhost:5678 | ✅ 10/10 穩定 |
| N8N_REGEN_WEBHOOK + N8N_PUBLISHER_WEBHOOK | ✅ |
| cloudflared systemd service（token 模式） | ✅ mina-tunnel-v2 |

---

## 技術備忘

| 項目 | 值 |
|------|-----|
| 前端部署 | **Railway**（Railpack 建置 + Caddy 靜態伺服器），`RAILPACK_SPA_OUTPUT_DIR=frontend`，自動從 `dev` branch 部署，`minaedu.tw` 沒登記在 Railway domain 清單裡 → Cloudflare 在前面轉發（見上方「部署架構釐清」）⚠️ 之前這裡誤寫 Cloudflare Pages，2026-07-01 已更正 |
| 前端專案 | Railway workspace `hua19911027-code's Projects`，project `vivacious-education`，service `mina-website-edu`（同 project 下還有 `n8n`、`mina-community-edu`、`Postgres`） |
| Railway CLI | `railway login --browserless`（WSL 沒有 GUI，用 device-code 流程，在自己電腦瀏覽器登入），`railway logs --build` 查建置log、`railway domain list`（⚠️ `railway domain` 不帶參數會**建立**新網域，不是列出，查詢一定要加 `list`） |
| header/redirect 設定位置 | 在 **Cloudflare dashboard**（Transform Rules / Redirect Rules），不在這個 repo 裡；`frontend/_headers`、`frontend/_redirects` 對 Railway 無效 |
| 後端部署 | `cd workers && npx wrangler deploy`（手動）→ `api.minaedu.tw`（Workers，跟前端是不同平台） |
| Cloudflare Tunnel | Tunnel ID: `dd5ef701`（mina-tunnel-v2），token 模式，service: `cloudflared-mina.service` |
| n8n | `http://localhost:5678`，公開: `https://n8n.minaedu.tw` ✅ |
| n8n | `http://localhost:5678`，JWT key 在 memory `reference_n8n_api.md` |
| n8n flows | A1~D2 命名，詳見 memory/reference_n8n_api.md |
| PageSpeed URL | `https://pagespeed.web.dev/?url=https://minaedu.tw`（舊的 `mina-website-edu.pages.dev` 網址已失效，2026-07-01 更正） |
| 規格文件層級 | V1.0 → V1.1 → V2.0 → V2.0 修訂摘要（後版優先） |
