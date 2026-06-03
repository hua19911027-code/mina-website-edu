# Mina Website

臺中市私立卓越國際文理短期補習班 — Mina × 徐薇英文 UP學 × 偉智數學 WISE 官方網站

## 技術棧

- **Frontend**: HTML / CSS / Vanilla JS（靜態頁面，部署至 Cloudflare Pages）
- **Backend**: Cloudflare Workers + Hono.js（部署至 Cloudflare Workers）
- **CRM**: Notion Database（預約資料直接寫入）
- **新聞**: Notion Database（主要）+ 靜態 JSON（fallback）

## 目錄結構

```
mina-website/
├── frontend/          ← 靜態前端（HTML/CSS/JS）
├── workers/           ← Cloudflare Workers 後端（TypeScript + Hono）
├── data/              ← 靜態 JSON 資料
├── deployment/        ← 部署設定
└── docs/              ← 規格書與原型
```

## 快速開始

```bash
# 前端開發（靜態伺服器，如 Live Server）
# 開啟 frontend/index.html

# 後端開發
cd workers
npm install
npm run dev    # 啟動 wrangler dev
```

## 聯絡資訊

- **電話**: 04-2336-6868
- **地址**: 台中市烏日區健行北路96號（旭光國小旁）
- **服務時間**: 週一至週五 13:30–20:00
