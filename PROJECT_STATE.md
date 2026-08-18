# PROJECT_STATE.md — Mina 網站專案

> 更早的歷史記錄見 `PROJECT_STATE-archive.md`；架構細節見 `CLAUDE.md`。

## 狀態（更新：2026-08-18）

已完成：
- **新建 A5-每年9月30日封存舊學年題庫**（`H540ksT2ZiAPIeEK`，12節點，仿 A3/A4 風格，`errorWorkflow` 接 F2）：
  - 依 `Mina_題庫系統_封板規格_V2.0.md` 工作流程4：cron `0 2 30 9 *`，計算「去年」學年度DB名稱（roc-1）、Notion `/v1/search` 比對精確標題找到目標DB、分頁抓取全部未封存題目（Code節點用 `this.helpers.httpRequestWithAuthentication` 迴圈處理 `has_more`/`next_cursor`）、逐題 PATCH `已封存=true`（不刪除，僅打勾）、完成後 LINE 通知
  - **多加一層安全煞車**（規格沒要求，是額外判斷）：封存前比對目標DB id 是否等於目前網站正在讀取的 `notionPracticeDbId`，若相同就中止並改發警告通知，避免萬一比對邏輯出錯而誤封存正在使用中的題庫
  - **2026-08-18 Manko 手動測試（execution 4636，n8n UI Execute workflow）：success**。已檢查實際節點輸出：走的是「找不到DB→安全警告」分支（`判斷是否找到`回傳`found:false`），驗證了觸發、資料庫比對、IF分支、安全煞車、LINE通知這條路徑正確。**但真正在做批次封存的那段（分頁抓取＋逐題PATCH）這次沒被執行到，仍未實測**，因為114的DB名稱還是對不上（見下）
  - **⚠️ 命名落差尚未解決，且比原先判斷更急迫**：114學年度題庫 Notion 標題前面留了一個空格（`" 114學年度題庫"`，直接查 `/v1/search` 原始回應確認，字元碼 `0x20`），逐字比對抓不到。**訂正先前錯誤判斷**：A5 這次啟用後，6週後（2026-09-30）第一次真正自動觸發，目標本來就是114（不是115，之前算錯），所以**必須在9/30前修好**，否則第一次正式執行只會發「找不到」警告、不會真的封存。修法：去 Notion 把「114學年度題庫」標題最前面的空格刪掉即可，不用改程式
  - **已啟用（`active: true`，2026-08-18）**
- **A4觸發確認 / A3排程視窗化 / PHASE B total欄位修正**（延續上輪 A3 冪等修復的收尾工作）：
  - **A4觸發確認**：直接查 n8n SQLite `workflow_statistics` 表（不受14天執行紀錄清除限制的持久化聚合統計），確認 A3 於 `2026-07-10 03:00`（台北時間）`production_success`、A4 於 `2026-08-01 03:00`（台北時間）`production_success`，兩者皆準時觸發成功。搭配正式站 `/api/v1/practice` 實測（撈到 2026-08 新題），確認題庫讀取路徑正常
  - **9/30 學年封存 workflow**：重新查現行全部 24 支 n8n workflow（含未啟用/已封存），確認**不存在**任何處理 9/30 學年封存的 workflow；舊 memory 記錄的 workflow ID（`ulkXidFkF4cf2wur`）已不存在於目前清單。是否需要重建屬業務決策，待 Manko 確認
  - **A3 排程視窗化**：cron 由單日 `0 3 10 7 *` 改為視窗 `0 3 10-23 7 *`（每年 7/10~7/23 每日檢查一次），workflow 更名為「A3-每年7/10~23建新學年度題庫DB（冪等，逐日檢查）」。前提條件（冪等，重複執行不重複建立）已於上輪修復滿足，故此改動安全。備份：`~/n8n-local/workflow-backups/A3-20260818-090310-before-window-schedule.json`
  - **PHASE B**：確認 n8n 24 支 workflow 均未呼叫 `/api/v1/practice`、`/api/v1/news` 公開端點（只呼叫 `/api/v1/admin/*` 系列），也未在任何 Code 節點讀取 `total` 欄位，前端亦確認未讀取（已 grep）。故將 `PracticeList`/`ArticleList` 的 `total` 欄位直接改名為 `atLeast`（誠實反映「本次查詢至少抓到這麼多筆」的語意，非資料庫真實總筆數），未保留過渡期別名。`workers/src/types.ts`、`routes/practice.ts`、`routes/news.ts` 已改，`tsc --noEmit` 通過，**已 `wrangler deploy` 上正式站並實測 `/api/v1/practice`、`/api/v1/news` 回應皆已改用 `atLeast`**
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
- （PHASE B 已部署，無未完成項）

下一步：
- **9/30前必做**：去 Notion 刪掉「114學年度題庫」標題前的空格，否則 A5 第一次正式觸發（9/30）會封存失敗（安全地失敗，只是發警告不會真的封存）
- A5 的批次封存段（分頁抓取＋逐題PATCH）還沒被實測過（上次測試因114命名對不上走了安全分支），標題修好後建議 Manko 或請人再測一次確認全路徑通
- 人工進 Notion 審 8 月那 171 題：挑掉看圖題，其餘勾「是否發布」
- 到 Cloudflare / Google Cloud 主控台重新產生 CF_TOKEN、GKEY
- Bing Webmaster Tools 提交 sitemap；Google Search Console 重新提交新版動態 sitemap

缺螺絲：
- `/practice` SSR 僅涵蓋單頁預設篩選（小一/英文）的本週題目；歷屆題庫、考前複習、切換篩選後結果仍是 client-side fetch。分年級/科目多網址（如 `/practice/g1-en`）列入後續規劃，屆時可沿用 `qcard-template.js`、Function 骨架、SSR 偵測邏輯
- `news.js` SSR 降級（`[slug].js` 內 API 異常回原樣外殼）+ 瀏覽器端 fetch 也失敗時，仍會顯示「找不到這篇文章」，需新增獨立「載入失敗」UI 狀態區塊，屬新功能，另行規劃
- `news-single.html`/`practice.html` 的 BreadcrumbList JSON-LD 內 `item` 仍含 `.html`（如 `.../news.html`、`.../practice.html`），與已修正的 canonical/og:url 不一致，屬遺漏點未修
- CLS 0.197~0.216 舊案尚未證實根本解決（見 archive「2026-07-01」段），下次應查 Search Console Core Web Vitals 真實數據，不要只重跑 PageSpeed
- 116 學年度（明年）出版社設定一樣要手動改 n8n code 節點（`IpxBWR3Nbg2z798v`），Admin Panel 出版社上傳功能目前是斷頭路
- gstack 技能框架 vendored 安裝造成技能清單膨脹，doctor 健檢發現但無法直接修
- Notion KV 設定的 `notionPracticeDbId`（現值 `2502b420-9049-4621-a4b9-99a299a9b922`）用 Manko 自己的 Notion 帳號（陳芊樺）查不到這個資料庫（404），但用 n8n/Workers 的整合金鑰查詢正常出題——研判是這個資料庫當初由自動化直接用 API 建立、未正確掛在「Minaedu.tw」父頁面下或未分享給個人帳號，功能上無影響但建議找時間在 Notion UI 裡確認這個資料庫的位置、補上正確歸屬
