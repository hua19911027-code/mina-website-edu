# PROJECT_STATE.md — Mina 網站專案

> 更早的歷史記錄見 `PROJECT_STATE-archive.md`；架構細節見 `CLAUDE.md`。

## 狀態（更新：2026-08-15）

已完成：
- **n8n A3 workflow（每年7月10日建新學年度題庫DB）無聲失敗修復**：
  - 移除「建立新學年度DB」「更新KV出題DB」兩個節點的 `neverError:true`（原本 Notion/KV 失敗時 workflow 仍回報成功，可能寫入壞值）
  - 新增冪等前置判斷：查詢 Notion `/v1/search` 比對是否已存在同名同父頁面的資料庫，已存在則跳過建立、直接沿用既有 database id；新增「驗證DB建立結果」節點檢查回應含合法 UUID 格式的 id
  - `settings.errorWorkflow` 接上 `F2 Error Notification`（`fMZOlJFiH8rj7SOG`），失敗時會觸發 LINE 通知（不再無聲）
  - 「彙整結果」改讀 `$json.data?.notionPracticeGenDbId`（更新KV回應裡的權威值），取代原本回頭抓「建立新學年度DB」節點輸出的寫法——兩條分支（新建/沿用既有）都適用，且真正驗證了 KV 有無寫入成功，而不是只看 Notion 建立成功與否
  - **實測**（停用「更新KV出題DB」節點，避免測試寫壞正式 KV）：手動執行一次，走「已存在」分支，`組裝DB請求體`/`建立新學年度DB`/`驗證DB建立結果` 三節點確認未執行（跳過），`沿用既有DB` 輸出 id = `398b8ee1-06b4-8192-92af-fca92bde02a5`，與 115學年度題庫的真實 database id 逐字元相符；停用節點造成 KV 未寫入，`彙整結果` 據實判定 `ok=false` 並經 LINE 送出失敗通知——驗證了失敗通知路徑本身是通的。測試後已重新啟用該節點並確認結構完整（12 節點、errorWorkflow、active、IF 兩分支連線）
  - 備份：`~/n8n-local/workflow-backups/A3-20260815-163546-before-neverError-fix.json`（修改前原版，7 節點）；回滾程序見同目錄下操作記錄——`jq '{name,nodes,connections,settings,staticData}' <備份檔> | curl -X PUT -H "X-N8N-API-KEY:$KEY" -d @- http://localhost:5678/api/v1/workflows/a3c23a212aecad4b`
  - 診斷過程一併發現：A4（8/1切換讀取DB）當時無法確認是否曾自動觸發（n8n 執行紀錄僅保留14天，覆蓋不到 7/10、8/1 兩個日期）；9/30 學年封存 workflow 在現行 n8n 裡不存在，規格文件與實作已脫節
- **SEO 修復第二輪（PHASE C + A，`seo-round2-preview` 分支開發驗證後合併至 dev，已在正式站驗證通過）**：
  - PHASE C：`news-single.html` 封面圖 SSR（`[slug].js` 注入 `<img>` 到 `#article-cover`）；`news.js` `loadArticle()` 修正「fetch 失敗覆蓋 SSR 內容」問題（判斷 `#article-body` 是否已是 SSR 設定的 `display:block`）
  - PHASE A：`/practice` 題庫頁 SSR，預設篩選（小一/英文，對應頁面預設 active 狀態）本週題目。新增 `frontend/components/qcard-template.js` 為前後端共用的題目卡片模板（`renderQCard()`/`TYPE_ORDER`，字串比對驗證輸出與原版一致）；`practice.js` 改為 `type="module"`，`init()` 讀 `#qcards` 的 `data-ssr-count`/`data-ssr-hasmore` 決定是否跳過 client fetch，避免「內容出現→清空→骨架→重繪」的閃爍；新增 `frontend/functions/practice.js`（本專案首次 Pages Function 從 `functions/` 目錄外 import 共用模組，驗證打包正常）
  - 過程中修正先前一輪診斷的錯誤結論:`GET /practice` 不帶參數並非預設回小一/英文，而是全年級混合，改用 `grade=小一&subject=英文` 明確篩選才與頁面預設 UI 一致
- 舊項目（最新消息 SEO 修復 PHASE 1–5、admin.ts paperCounts）已移至 `PROJECT_STATE-archive.md`

未完成：
- PHASE B（`workers/src/routes/news.ts`/`practice.ts` 的 `total` 欄位語意錯誤：實際是「已抓取筆數」被誤標成「總筆數」，非 Notion has_more 判斷錯誤）本輪暫緩未執行。前端/後端目前皆無人讀取此欄位（已 grep 確認），改動風險低，但 n8n workflow 是否依賴需 Manko 自行在 n8n 介面確認（本 repo 內查無 n8n 流程定義檔，無法用 grep 查）

下一步：
- 人工進 Notion 審 8 月那 171 題：挑掉看圖題，其餘勾「是否發布」
- 到 Cloudflare / Google Cloud 主控台重新產生 CF_TOKEN、GKEY
- Bing Webmaster Tools 提交 sitemap；Google Search Console 重新提交新版動態 sitemap
- PHASE B：確認 n8n 是否依賴 `total` 欄位後再決定修法（移除，或改名 `atLeast` 並保留 `total` 過渡期）

缺螺絲：
- `/practice` SSR 僅涵蓋單頁預設篩選（小一/英文）的本週題目；歷屆題庫、考前複習、切換篩選後結果仍是 client-side fetch。分年級/科目多網址（如 `/practice/g1-en`）列入後續規劃，屆時可沿用 `qcard-template.js`、Function 骨架、SSR 偵測邏輯
- `news.js` SSR 降級（`[slug].js` 內 API 異常回原樣外殼）+ 瀏覽器端 fetch 也失敗時，仍會顯示「找不到這篇文章」，需新增獨立「載入失敗」UI 狀態區塊，屬新功能，另行規劃
- `news-single.html`/`practice.html` 的 BreadcrumbList JSON-LD 內 `item` 仍含 `.html`（如 `.../news.html`、`.../practice.html`），與已修正的 canonical/og:url 不一致，屬遺漏點未修
- CLS 0.197~0.216 舊案尚未證實根本解決（見 archive「2026-07-01」段），下次應查 Search Console Core Web Vitals 真實數據，不要只重跑 PageSpeed
- 116 學年度（明年）出版社設定一樣要手動改 n8n code 節點（`IpxBWR3Nbg2z798v`），Admin Panel 出版社上傳功能目前是斷頭路
- gstack 技能框架 vendored 安裝造成技能清單膨脹，doctor 健檢發現但無法直接修
- A3 排程仍為單日觸發（`0 3 10 7 *`），視窗式排程（如改 `0 3 10-23 7 *` 避免機器未開機整年錯過）尚未套用——但前提條件（冪等，連續執行不重複建立）已於本輪滿足，之後排程本身要不要改是獨立決策
- A4（8/1切換讀取DB）、9/30學年封存這兩個項目本輪只診斷未修：A4 是否曾自動觸發無法從執行紀錄確認；9/30 封存 workflow 在現行 n8n 找不到，規格文件已過時，需重新確認業務需求是否還要做
