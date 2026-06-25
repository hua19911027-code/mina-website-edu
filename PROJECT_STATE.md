# PROJECT_STATE.md — Mina 網站專案

**最後更新**：2026-06-25（/review + /qa + /cso 三輪稽核完成）  
**分支**：dev（自動部署至 minaedu.tw）  
**Mobile PageSpeed**：91 / 100 ✅  
**安全健康分數**：88 / 100 ✅（6月25日 CSO 審計）

---

## ✅ 已完成（2026-06-25 最新）

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

（目前無進行中項目，題庫修正 2026-06-15 結案）

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
| 前端部署 | Cloudflare Pages，自動從 `dev` branch 部署 → `minaedu.tw` |
| 後端部署 | `cd workers && npx wrangler deploy`（手動）→ `api.minaedu.tw` |
| Cloudflare Tunnel | Tunnel ID: `dd5ef701`（mina-tunnel-v2），token 模式，service: `cloudflared-mina.service` |
| n8n | `http://localhost:5678`，公開: `https://n8n.minaedu.tw` ✅ |
| n8n | `http://localhost:5678`，JWT key 在 memory `reference_n8n_api.md` |
| n8n flows | A1~D2 命名，詳見 memory/reference_n8n_api.md |
| PageSpeed URL | `https://pagespeed.web.dev/?url=https://mina-website-edu.pages.dev` |
| 規格文件層級 | V1.0 → V1.1 → V2.0 → V2.0 修訂摘要（後版優先） |
