# PROJECT_STATE.md — Mina 網站專案

> 更早的歷史記錄見 `PROJECT_STATE-archive.md`；架構細節見 `CLAUDE.md`。

## 狀態（更新：2026-07-27）

已完成：
- 題庫 n8n 自動化連環 bug 全部查明修正（透過 n8n API 直接改 workflow，非本 repo git 歷史）：
  - A2-週六發布封存：`計算目標日期`節點用 UTC 算日期，跟台灣時區排程日期差一天，導致「今日發布」query 每週必為 0；改用 `Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei'})` 修正
  - A1-每月15日出題：AI prompt 樣板裡混入一個未轉義的真實換行字元（新增禁圖規則時手滑），造成整批 JSON.parse 失敗、8月題目 0 生成；已修正轉義，並強化禁圖規則措辭（明確禁止「如圖」「如下圖」等字眼）
  - A1「是否發布」checkbox 建立時改預設打勾（`checkboxValue: true`），新題直接發布，有問題使用者自行取消勾選；舊有 171 題 8月批次不受影響，仍為未勾，需人工審核挑除看圖題
  - A1/A2/A3/A4/C1/E2/B1 七個會發通知的 workflow，訊息全部改「詳細版」：各年級科目題數明細、來源 workflow 名稱、時間戳；並用【官網題庫】【官網預約】【社群】等標籤區分不同子系統，避免混淆是誰發的訊息
  - D2/D3/D4/D5、E1、Social Studio 排程/同步觸發：確認本來就不發通知訊息，未動
- `workers/src/routes/admin.ts` 的 `/exam-review/generate` 加回傳 `paperCounts`/`totalQuestions`（各年級科目實際生題數），修正 B1 通知訊息原本寫死「英數各年級共12份」看不出題庫不足的問題（commit `f8a0920`，**尚未 deploy**）
- GSC「頁面會重新導向」修復：canonical tag + sitemap.xml 改無副檔名網址（commit `1669dbc`）；全站 9 頁 203 處內部導覽連結（nav/footer/breadcrumb）同步改無副檔名（commit `7b43d41`）
- FB 網域驗證：改用 `frontend/functions/` 下的 Pages Function 直接攔截該路徑回應驗證碼，已部署（commit `3e1b813`、`532bd47`）

下一步：
- `cd workers && npx wrangler deploy` 部署 `admin.ts` 的 paperCounts 修正（B1 訊息 deploy 前會顯示退回版文案，不會壞，但沒有真實數字）
- 人工進 Notion 審 8 月那 171 題：挑掉看圖題，其餘勾「是否發布」
- 到 Cloudflare / Google Cloud 主控台重新產生 CF_TOKEN、GKEY 這兩把金鑰（doctor 健檢時發現明碼內嵌在本地設定檔的規則字串裡，字串已清但金鑰本身沒失效）
- Bing Webmaster Tools 提交 sitemap（5 分鐘、零成本，一直沒排進去）

缺螺絲：
- CLS 0.197~0.216 舊案尚未證實根本解決（見 archive「2026-07-01」段），下次應查 Search Console Core Web Vitals 真實數據，不要只重跑 PageSpeed
- 116 學年度（明年）出版社設定一樣要手動改 n8n code 節點（`IpxBWR3Nbg2z798v`），Admin Panel 出版社上傳功能目前是斷頭路
- gstack 技能框架 vendored 安裝造成技能清單膨脹（node_modules 文件被當技能列出），doctor 健檢發現但無法直接修，需透過 gstack 自己的 vendoring 遷移流程處理
