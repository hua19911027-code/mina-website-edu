# PROJECT_STATE.md — Mina 網站專案

> 更早的歷史記錄見 `PROJECT_STATE-archive.md`；架構細節見 `CLAUDE.md`。

## 狀態（更新：2026-08-10）

已完成：
- **最新消息 SEO 修復（PHASE 1–5，`seo-ssr-preview` 分支開發驗證後合併至 dev，已在正式站驗證通過）**：
  - `frontend/functions/news/[slug].js`：Cloudflare Pages Function 做文章頁 SSR（伺服器端填入 title/content/meta/og/JSON-LD BlogPosting，並切換 skeleton/body/404 可見性），用 `onRequest` 涵蓋 GET/HEAD，靜態外殼改抓無副檔名路徑並手動跟隨重導向（避開 `.html→無副檔名` 308 導致外殼取得失敗的坑）
  - `frontend/functions/sitemap.xml.js`：動態產生 sitemap，依 API `hasMore` 分頁抓全部文章（**API `total` 欄位有 bug，回傳 `limit+1`，全站程式碼禁止使用該欄位判斷分頁**）
  - `frontend/404.html`：新增真 404 頁（`noindex`，套用既有 header/footer），取代原本亂打網址回首頁還 200 的行為
  - `robots.txt` 排除 `/news-single`(.html)（SSR 用空殼模板不應被獨立收錄）；`llms.txt` 六個連結移除 `.html`；`news-single.html` 清除三篇寫死假文章（`#related-list` 改空容器供 `news.js` 注入）、修正 og:url
  - **根因排查**：Cloudflare 該網域的「URL 改寫規則」`/news/* → /news-single` 在邊緣層攔截了所有請求，Function 完全沒機會執行（h1 一直是 skeleton 佔位符、404 分支也回 200）；已由使用者在 Dashboard 停用該規則，問題排除，非程式碼問題
- `workers/src/routes/admin.ts` 的 paperCounts 修正已部署（2026-08-10，Version ID `763e0019-b1ec-4c39-9283-bc65c79acc81`）

下一步：
- 人工進 Notion 審 8 月那 171 題：挑掉看圖題，其餘勾「是否發布」
- 到 Cloudflare / Google Cloud 主控台重新產生 CF_TOKEN、GKEY（金鑰本身沒失效，待重新產生）
- Bing Webmaster Tools 提交 sitemap
- Google Search Console 重新提交新版動態 sitemap（新增 29 篇文章單獨 URL，之前這些頁面對爬蟲是空白的）

缺螺絲：
- `practice.html` 題庫頁靜態化未做（`news.js`/`practice.js` 同款「內容靠 JS fetch 注入」問題，practice 這支工程量較大，另行規劃）
- CLS 0.197~0.216 舊案尚未證實根本解決（見 archive「2026-07-01」段），下次應查 Search Console Core Web Vitals 真實數據，不要只重跑 PageSpeed
- 116 學年度（明年）出版社設定一樣要手動改 n8n code 節點（`IpxBWR3Nbg2z798v`），Admin Panel 出版社上傳功能目前是斷頭路
- gstack 技能框架 vendored 安裝造成技能清單膨脹，doctor 健檢發現但無法直接修
