# PROJECT_STATE.md — Mina 網站專案

> 更早的歷史記錄見 `PROJECT_STATE-archive.md`；架構細節見 `CLAUDE.md`。

## 狀態（更新：2026-08-28）

已完成：
- **修 courses.html 4 個死路連結**：`news-single.html?slug=...` 舊格式（.html 觸發 308 轉址 → 落在 robots.txt 擋掉的 `/news-single`）改成正確 `/news/{slug}`，`news.js` BreadcrumbList JSON-LD 的 `/news.html` 一併修正，見 memory/bugs.md 2026-08-28。起因是 Manko 回報 GSC 收錄卡住（14/42 已收錄，23 篇「已找到未建立索引」3 週未動），查證後 SSR/canonical/sitemap/robots.txt 本身都正常，這是查出的唯一真實技術 bug；收錄緩慢本身研判是年輕網域＋內容差異化不足的正常現象，非技術問題
- **新增 `frontend/threads/callback.html`／`frontend/threads/privacy.html`**：供 mina-social-studio 專案換 Threads 長效 token 用的一次性 OAuth callback 頁＋Meta 要求的隱私政策頁。`callback.html` 已完成階段性任務可以刪；`privacy.html` 要留著（Meta 會持續驗證這個網址）
- **新建 A5-每年9月30日封存舊學年題庫**（`H540ksT2ZiAPIeEK`，仿 A3/A4 風格，`errorWorkflow` 接 F2，`active: true`）：
  - 依 `Mina_題庫系統_封板規格_V2.0.md` 工作流程4：計算「去年」學年度DB名稱（roc-1）、Notion `/v1/search` 比對精確標題找到目標DB、逐題 PATCH `已封存=true`（不刪除，僅打勾）、完成後 LINE 通知
  - **多加一層安全煞車**（規格沒要求，是額外判斷）：封存前比對目標DB id 是否等於目前網站正在讀取的 `notionPracticeDbId`，若相同就中止並改發警告通知，避免萬一比對邏輯出錯而誤封存正在使用中的題庫
  - **2026-08-18 第一次手動測試（execution 4636）success，但走的是「找不到DB→安全警告」分支**（114標題當時還有空格），批次封存段沒被執行到
  - **114標題空格已刪**（Manko 確認並修正），但接著 Manko 再測時發現**批次封存段本身有 bug**：原本用 Code 節點呼叫 `this.helpers.httpRequestWithAuthentication` 做分頁抓取，這個 helper 在這個 n8n 版本的 Code Node 裡**不支援**，執行直接報錯
  - **已修復**：拿掉那個 Code 節點裡直接發 HTTP 請求的寫法，改成跟 A2「查詢應封存題目→拆分→逐題封存」完全同樣的 pattern（獨立的 HTTP Request 節點 + Code 節點純拆分陣列，不在 Code 節點裡發請求）——只用這個專案裡已經證實能跑的節點類型，不再用未驗證過的 API
  - **同時把單次查詢上限（100題/次）的限制，用視窗式重試解決**（呼應 A3 的做法）：cron 從單日改成 `9/30 + 10/1~10/6` 每日02:00重試一次，每天處理當天查到的未封存題目（自然冪等，已封存的下次查詢會被過濾掉），不需要在單次執行內做真正的分頁迴圈，也不用再冒險用未驗證的 API
  - 備份：`~/n8n-local/workflow-backups/A5-20260818-*-before-pagination-fix.json`
  - **2026-08-18 Manko 再測，成功，本次封存100題**（單次查詢上限），確認批次封存段（查詢待封存題目→拆分→逐題PATCH）真的能跑。剩餘題目會在9/30~10/6視窗內的後續每日重試自動補完（冪等，不會重複封存）
- **Mina小幫手「歷屆題庫」查詢回應改用真實題數**（`frontend/components/mina-widget.js`）：
  - **問題**：不論實際查到幾題，只要後端 `reachedLimit=true` 就固定顯示「已顯示36題（歷屆題庫查詢上限）」——但 `reachedLimit` 也會在「這個篩選條件本來就沒那麼多題」時觸發（例如剛換新學年度、題庫還在累積中），導致 Manko 實測「實際只有6題」卻回報36題的誤導訊息
  - **修法**：改用 API 回傳的 `atLeast`（PHASE B改名後的欄位）顯示真實題數，並依真實題數是否達36分流文案——真的達36才講「查詢上限」，未達36則說明是新學年度題庫剛開始累積、之後會越來越多，順帶把跨學年這件事講清楚
  - 新增 `mkLimMsg()` 輔助函式（因為原本的 fetch callback 用 `n` 當回應變數名，跟外層 widget 設定物件的 `n` 同名互相遮蔽，直接在 callback 內改node文字會存取錯物件；改成獨立函式在外層作用域執行，避開這個變數命名衝突），已 `node --check` 過語法
  - **注意**：`archive_fetch` 的請求目前只查 `page=1`（不會真的翻頁到第2、3頁），所以就算 `atLeast` 顯示到36，畫面上一次最多還是只顯示12題——這是既有的、範圍外的UX限制，這次沒有動
  - **2026-08-18 Manko 追問後訂正**：「剛換新學年度」文案原本是無條件顯示，只要題數<36就講。但實際算過：90天查詢窗口在8/1切換後滿90天（**精確是10/30，不是Manko猜的11月**）就會完全落在新學年度範圍內，屆時題數少已經跟「剛換學年」無關，繼續講會變誤導。改用 `daysSinceAug1()` 動態判斷（不寫死日期，每年8/1自動重算，下學年度切換時自動恢復顯示），未滿90天講「剛換學年度」，滿90天後改中性文案（只講真實題數，不下因果推論）。已用 node 測過6組跨年邊界日期（含下一年8/1切換）都正確
  - 已同步 bump 7個頁面的 `mina-widget.js?v=` 快取版號（20260701→20260819→20260820），確保正式站邊緣快取失效
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
- 觀察 A5 9/30~10/6 視窗內的後續每日重試，確認114的題目最終全數封存完（目前已封存100題，剩餘的靠隔天重試自動補）
- 小幫手歷屆題庫的真實題數修正已部署，建議實際在網站上測一次確認文案顯示正確（尤其是「未達36題」時的新分流文案）
- 題庫練習頁「歷屆題庫/小幫手」目前上限是近90天、36題，超過這個範圍系統本身就查不到（小幫手在36題之後其實是導去約試聽的CTA，沒有更長的查詢機制）——如果業務上需要更長的保留期，屬新功能規劃，不是bug
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
