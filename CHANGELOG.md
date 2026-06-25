# CHANGELOG

## 2026-06-25

### 效能（PageSpeed 修正，目標 90+）
- **LCP 根本原因修正**：移除 9 個 HTML 的 `body{opacity:0}` + setTimeout fallback → 解決 LCP Element Render Delay 1590ms 問題
- **CLS 修正**：body 不再隱藏，CLS 0.095 → 近 0
- **llms.txt**：新增含 H1 標題與 6 個連結（代理瀏覽 3/3）

### Accessibility（WCAG AA 修正）
- `.btn-line`：背景 `#06C755` → `#048A2E`，白字對比 2.3:1 → 5.3:1 ✅
- `.soc`：文字 `--pink` → `--pink-deep`，粉底上對比 3.8:1 → 7.7:1 ✅
- `.tstat` 統計數字：橘色 `#EE7700` → `#C76A00`，金色 `#C7A800` → `#8C7400` ✅
- `--ink-mute`：`#A593A0` → `#7A6574`，小字對比 2.8:1 → 4.9:1 ✅
- `.nav-links a`：`rgba(255,255,255,.92)` → `#fff`，移除透明度
- mina-widget.css：FAB/Header/Bubble `#E60D85` → `#C80079`（對比 4.2:1 → 5.5:1）✅
- mina-status：`rgba(255,255,255,.85)` → `#fff`，修正 11px 小字對比

### 修正
- **CSP**：`script-src` 加入 `https://www.googletagmanager.com`，`connect-src` 加入 GA 端點，修正 Google Analytics 無法載入
- **效能**：移除 mina-fab `box-shadow` transition（非合成動畫）
- **效能**：移除 footer link `color` transition → 改 `opacity`（合成動畫）
- **程式碼**：修正 `practice.js` `fetchArchive` 內 `var ac` 重複宣告

### 安全（CSO 審計 2026-06-25，健康分數 74 → 88）
- `X-Frame-Options: SAMEORIGIN` → `DENY`（與 CSP `frame-ancestors 'none'` 一致）
- `/health` endpoint 移除 `env` 欄位，避免暴露 ENVIRONMENT 值
- `bookings.ts` 新增欄位長度驗證（家長姓名 ≤100 / 電話 ≤30 / 備註 ≤500 字）
- CSO SEC-001 確認 Notion API key + LINE token 已重發、repo 為私有 → RESOLVED

### 功能
- 歷屆題庫改為年級/科目彈窗選擇（與考前複習 UX 一致）
- 歷屆 36 題上限後加入「找 Mina」按鈕，引導查更早題目
- 考前複習列印頁加「關閉視窗」按鈕
- `courses.html` 補上 Mina 浮動小幫手，按鈕改為開啟浮動視窗

---

## 2026-06-24

### 功能
- 行事曆分類對齊 Notion 最新欄位名稱（課程 / 報名 / 學測評量），保留舊名相容
- B1 生題 workflow 啟動完成

---

## 2026-06-16

### 基礎建設
- 全域名上線（`minaedu.tw` + `api.minaedu.tw` DNS 生效）
- N8N_REGEN_WEBHOOK + N8N_PUBLISHER_WEBHOOK secrets 設定完成
- n8n Flows A1~D2 全部 active

---

## 2026-06-15

### 新增
- Workers V2.0 KV namespace 三組綁定（KV_SETTINGS / KV_CACHE / KV_RATE_LIMIT）
- Admin Panel：Settings、快取管理、重新出題、考前複習、出版社分析
- 考前複習卷生成 API（`POST /api/v1/admin/exam-review/generate`）
- 行事曆 API（`GET /api/v1/calendar`）

### 修正
- FOUC：`body{opacity:0}` + CSS onload reveal
- 題目不顯示：移除 checkbox filter，改 `created_time` 排序
- LINE 連結全站更新
