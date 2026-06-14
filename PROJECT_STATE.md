# PROJECT_STATE.md — Mina 網站專案

**最後更新**：2026-06-15  
**分支**：dev（自動部署至 mina-website-edu.pages.dev）  
**Mobile PageSpeed**：91 / 100 ✅

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

（目前無進行中項目，題庫修正 2026-06-15 結案）

---

## ❌ 未完成（V2.0 功能）

### 1. Workers KV 綁定（估時：30min）
- 在 CF Dashboard 建立 KV namespace `mina-settings`
- `wrangler.toml` 加 `[[kv_namespaces]]` binding
- `workers/src/types.ts` 加 `KV_SETTINGS: KVNamespace`

### 2. Admin Settings API（估時：1hr）
- `GET /api/v1/admin/settings`
- `PUT /api/v1/admin/settings`
- 讀寫 KV 的 `REVIEW_MODE_ENABLED`、`NOTION_PRACTICE_DB_ID` 等
- `X-Admin-Secret` header 驗證

### 3. Admin Panel HTML（估時：2–3hr）
- `/admin/practice.html`
- 審核模式開關
- 題目列表（依週次 / 年級 / 科目篩選）
- 重新生成按鈕（含確認 dialog）
- 手動觸發出題

### 4. n8n 重新生成 Webhook Flow（估時：1hr）
- V2 Flow 5：手動觸發再出題
- Workers `POST /api/v1/admin/practice/regenerate` → n8n webhook → AI → Notion
- 舊題 `已封存=true`，新題序號遞增

### 5. 出版社分析 Flow（估時：複雜）
- 上傳媒介待確認（Cloudflare R2 or Notion Files）
- AI Vision API 讀 PDF / 圖片
- 寫入出題規範 Notion DB

---

## ⚠️ 缺螺絲（需外部資源才能繼續）

| 項目 | 需要什麼 | 誰去做 |
|------|---------|-------|
| Workers KV | CF Dashboard 建立 KV namespace `mina-settings` | 用戶手動建立（Dashboard → Workers & Pages → KV） |
| wrangler deploy | `! wrangler login`（WSL OAuth 無法自動完成） | 用戶在終端執行 |
| n8n Webhook URL | Flow 5 重新生成 Webhook 的實際 URL | n8n 建立 Webhook node 後取得 |
| LINE Official URL | `#TODO_LINE_URL` placeholder 尚未填入真實 LINE OA URL | 用戶提供 |
| 出版社分析 R2 | Cloudflare R2 bucket 建立 + 上傳 PDF 機制確認 | 待設計決策 |

---

## 技術備忘

| 項目 | 值 |
|------|-----|
| 前端部署 | Cloudflare Pages，自動從 `dev` branch 部署 |
| 後端部署 | `cd workers && npx wrangler deploy`（手動） |
| n8n | `http://localhost:5678`，JWT key 在 memory `reference_n8n_api.md` |
| n8n Flow 6 ID | `2V4fjNzNSgQ6Jccn` |
| PageSpeed URL | `https://pagespeed.web.dev/?url=https://mina-website-edu.pages.dev` |
| 規格文件層級 | V1.0 → V1.1 → V2.0 → V2.0 修訂摘要（後版優先） |
