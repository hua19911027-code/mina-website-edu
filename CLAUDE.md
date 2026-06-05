> 所有回覆必須使用繁體中文。禁止使用日文、韓文或任何其他語言。

# CLAUDE.md — Mina Website Project
**這是 Claude Code 的唯一執行指令。讀完再動作，不得跳過任何段落。**

---

## 一、專案概要

**客戶**：臺中市私立卓越國際文理短期補習班  
**品牌**：Mina × 徐薇英文 UP學（RUBY）× 偉智數學 WISE  
**電話**：04-2336-6868  
**地址**：台中市烏日區健行北路96號（旭光國小旁）  
**服務時間**：週一至週五 13:30–20:00

**完整規格書**：`docs/Mina_Website_Master_Specification_V1.0.html`  
你必須閱讀並遵守規格書所有內容。本檔案補充並取代規格書中未明確決定的部分。

---

## 二、已凍結技術決策（不得詢問、不得更改）

| 項目 | 決策 | 說明 |
|------|------|------|
| Frontend | HTML / CSS / Vanilla JS | 無框架，靜態頁面 |
| Backend | **Cloudflare Workers + Hono.js** | 不是 Node.js VPS。使用 Hono 作為 router |
| Deploy | Cloudflare Pages（前端）+ Cloudflare Workers（後端） | 同一 CF 帳號管理 |
| CRM V1 | **Notion Database（直接推送）** | 預約資料直接寫入 Notion，不另建 DB |
| 題庫儲存 | JSON 靜態檔案 | `data/practice/` |
| FAQ 儲存 | JSON 靜態檔案（V1） | `data/faq/faq.json`，V2 再接 Notion |
| 新聞資料 | **Notion Database（主要）+ 靜態 JSON（fallback）** | `data/news/sample-news.json` 開發用 |
| Mina QA | JSON 靜態檔案 | `data/mina/qa-tree.json`，透過 API 回傳 |
| Media | **Local `frontend/assets/`** | 不使用 Cloudinary（V1），V2 再評估 |
| n8n | **不在 V1** | V2 再加 |
| 新聞單篇路由 | **`news-single.html?slug=xxx`** | query param，JS 讀取後打 API |
| booking/success | **`booking-success.html`（靜態）** | 表單送出後 JS redirect |
| TypeScript | **僅後端 Workers 使用 TS**，前端純 JS | Workers 目錄下 .ts 檔 |

---

## 三、後端架構（Cloudflare Workers + Hono）

### 後端目錄結構（取代規格書 E2 的 backend/）

```
workers/
├── src/
│   ├── index.ts              ← Workers 入口（wrangler.toml main 指向此）
│   ├── routes/
│   │   ├── bookings.ts       ← POST /api/v1/bookings
│   │   ├── news.ts           ← GET /api/v1/news, GET /api/v1/news/:slug
│   │   ├── faq.ts            ← GET /api/v1/faq
│   │   ├── practice.ts       ← GET /api/v1/practice
│   │   └── mina.ts           ← POST /api/v1/mina/query
│   ├── adapters/
│   │   └── notion.ts         ← Notion API 操作（所有 Notion 呼叫集中此處）
│   └── types.ts              ← 共用 TypeScript types
├── package.json
├── tsconfig.json
└── wrangler.toml
```

### wrangler.toml 正確格式

```toml
name = "mina-api"
main = "src/index.ts"
compatibility_date = "2025-01-01"

[env.production]
vars = { ENVIRONMENT = "production" }

[env.staging]
vars = { ENVIRONMENT = "staging" }
```

### index.ts 基本架構

```typescript
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import bookingsRoute from './routes/bookings'
import newsRoute from './routes/news'
import faqRoute from './routes/faq'
import practiceRoute from './routes/practice'
import minaRoute from './routes/mina'

type Bindings = {
  NOTION_API_KEY: string
  NOTION_BOOKING_DB_ID: string
  NOTION_NEWS_DB_ID: string
  NOTION_FAQ_DB_ID: string
  LINE_OFFICIAL_URL: string
  ADMIN_SECRET: string
  CORS_ORIGIN: string
  ENVIRONMENT: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('*', cors({
  origin: (origin, c) => {
    const allowed = [
      c.env.CORS_ORIGIN,
      'http://localhost:3000',
      'http://127.0.0.1:5500'
    ]
    return allowed.includes(origin) ? origin : c.env.CORS_ORIGIN
  }
}))

app.route('/api/v1/bookings', bookingsRoute)
app.route('/api/v1/news', newsRoute)
app.route('/api/v1/faq', faqRoute)
app.route('/api/v1/practice', practiceRoute)
app.route('/api/v1/mina', minaRoute)

app.get('/health', (c) => c.json({ status: 'ok', env: c.env.ENVIRONMENT }))

export default app
```

### workers/package.json

```json
{
  "name": "mina-api",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "deploy:staging": "wrangler deploy --env staging",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "hono": "^4.0.0"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.0.0",
    "typescript": "^5.0.0",
    "wrangler": "^3.0.0"
  }
}
```

### workers/tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "lib": ["ES2022"],
    "types": ["@cloudflare/workers-types"],
    "moduleResolution": "bundler",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules"]
}
```

---

## 四、前端目錄結構（取代規格書 E2 的 frontend/）

```
frontend/
├── index.html
├── about.html
├── courses.html
├── news.html
├── news-single.html        ← news-single.html?slug=xxx
├── practice.html
├── faq.html
├── booking.html
├── booking-success.html    ← booking.js redirect 至此
├── styles.css
├── site.js                 ← 通用（Nav, Scroll Reveal, Counter, Active Link）
├── news.js                 ← 最新消息（列表 + 單篇）
├── practice.js             ← 題庫練習
├── faq.js                  ← FAQ + Mina Widget
├── booking.js              ← 預約表單
└── assets/
    ├── logo/
    │   ├── zhuoyue-logo.svg
    │   ├── ruby-wordmark.png
    │   └── wise-wordmark.png
    ├── images/
    │   └── .gitkeep
    └── icons/
        └── .gitkeep
```

---

## 五、完整目錄結構（根目錄）

```
mina-website/
├── CLAUDE.md                        ← 本檔案
├── .env.example
├── .gitignore
├── package.json                     ← monorepo root（scripts only）
├── README.md
│
├── frontend/                        ← 見 §四
│
├── workers/                         ← 見 §三
│
├── data/
│   ├── mina/
│   │   └── qa-tree.json             ← §七 內容
│   ├── faq/
│   │   └── faq.json                 ← §八 內容
│   ├── news/
│   │   └── sample-news.json         ← §十四 內容（開發用）
│   └── practice/
│       ├── en/
│       │   ├── grade1-2.json
│       │   ├── grade3-4.json
│       │   └── grade5-6.json
│       └── ma/
│           ├── grade1-2.json
│           ├── grade3-4.json
│           └── grade5-6.json
│
├── deployment/
│   └── cloudflare/
│       └── _routes.json
│
└── docs/
    ├── Mina_Website_Master_Specification_V1.0.html
    └── prototypes/                  ← 原型 HTML（參考用，不部署）
```

---

## 六、執行順序（Phase-by-Phase，嚴格依序）

> **Git 規則**：每個 Phase 完成後必須執行 commit + push，再繼續下一個 Phase。不得累積多個 Phase 才 commit。

---

### Phase 1 — Scaffold（骨架）
**任務清單：**
1. 建立完整目錄結構（所有資料夾 + .gitkeep）
2. 建立根目錄 `README.md`（基本說明）
3. 建立 `.env.example`（使用 §十 內容）
4. 建立根目錄 `package.json`（monorepo scripts）
5. 建立 `.gitignore`
6. 建立 `workers/package.json`、`workers/tsconfig.json`、`workers/wrangler.toml`
7. 建立 `deployment/cloudflare/_routes.json`

**Phase 1 完成後執行：**
```bash
git init                          # 如果是第一次
git checkout -b dev               # 工作分支
git add .
git commit -m "chore(scaffold): initial project structure and config"
git push origin dev
```

---

### Phase 2 — 設計系統
**任務清單：**
1. 建立 `frontend/styles.css`（完整設計系統：CSS Variables, Reset, Typography, Components, Animations, Responsive）
2. 建立 `frontend/site.js`（Nav hamburger、Scroll Reveal、Counter Animation、Active Nav Link）

**Phase 2 完成後執行：**
```bash
git add frontend/styles.css frontend/site.js
git commit -m "style(design): implement complete design system and base JS"
git push origin dev
```

---

### Phase 3 — 前端頁面（每頁完成即 commit，不等全部完成）

**3-1 首頁（index.html）**
```bash
git add frontend/index.html
git commit -m "feat(frontend): add index.html homepage"
git push origin dev
```

**3-2 關於我們（about.html）**
```bash
git add frontend/about.html
git commit -m "feat(frontend): add about.html"
git push origin dev
```

**3-3 課程介紹（courses.html）**
```bash
git add frontend/courses.html
git commit -m "feat(frontend): add courses.html"
git push origin dev
```

**3-4 最新消息列表（news.html）**
```bash
git add frontend/news.html
git commit -m "feat(frontend): add news.html list page"
git push origin dev
```

**3-5 最新消息單篇（news-single.html）**
```bash
git add frontend/news-single.html
git commit -m "feat(frontend): add news-single.html article template"
git push origin dev
```

**3-6 題庫練習（practice.html）**
```bash
git add frontend/practice.html
git commit -m "feat(frontend): add practice.html"
git push origin dev
```

**3-7 常見問題（faq.html）**
```bash
git add frontend/faq.html
git commit -m "feat(frontend): add faq.html with Mina widget"
git push origin dev
```

**3-8 預約試聽（booking.html）**
```bash
git add frontend/booking.html
git commit -m "feat(frontend): add booking.html form page"
git push origin dev
```

**3-9 預約完成（booking-success.html）**
```bash
git add frontend/booking-success.html
git commit -m "feat(frontend): add booking-success.html"
git push origin dev
```

---

### Phase 4 — 前端 JS

**4-1 news.js**
```bash
git add frontend/news.js
git commit -m "feat(frontend): add news.js for list and single article"
git push origin dev
```

**4-2 practice.js**
```bash
git add frontend/practice.js
git commit -m "feat(frontend): add practice.js question bank"
git push origin dev
```

**4-3 faq.js（含 Mina Widget）**
```bash
git add frontend/faq.js
git commit -m "feat(frontend): add faq.js with Mina assistant widget"
git push origin dev
```

**4-4 booking.js**
```bash
git add frontend/booking.js
git commit -m "feat(frontend): add booking.js form validation and submit"
git push origin dev
```

---

### Phase 5 — Data 檔案

**全部 data 檔案建立完成後統一 commit：**
```bash
git add data/
git commit -m "content(data): add initial mina qa-tree, faq, practice, news sample data"
git push origin dev
```

建立清單：
1. `data/mina/qa-tree.json`（§七 完整內容）
2. `data/faq/faq.json`（§八 完整內容）
3. `data/news/sample-news.json`（§十四 完整內容）
4. `data/practice/en/grade1-2.json`（§九 內容）
5. `data/practice/en/grade3-4.json`（§九 格式，difficulty=2）
6. `data/practice/en/grade5-6.json`（§九 格式，difficulty=3）
7. `data/practice/ma/grade1-2.json`（§九 內容）
8. `data/practice/ma/grade3-4.json`（§九 格式，difficulty=2）
9. `data/practice/ma/grade5-6.json`（§九 格式，difficulty=3）

---

### Phase 6 — Backend Workers（每個 route 完成即 commit）

**6-1 types.ts**
```bash
git add workers/src/types.ts
git commit -m "feat(workers): add shared TypeScript types"
git push origin dev
```

**6-2 notion.ts adapter**
```bash
git add workers/src/adapters/notion.ts
git commit -m "feat(workers): add Notion adapter"
git push origin dev
```

**6-3 bookings route**
```bash
git add workers/src/routes/bookings.ts
git commit -m "feat(workers): add POST /api/v1/bookings route"
git push origin dev
```

**6-4 news route**
```bash
git add workers/src/routes/news.ts
git commit -m "feat(workers): add GET /api/v1/news and /news/:slug routes"
git push origin dev
```

**6-5 faq route**
```bash
git add workers/src/routes/faq.ts
git commit -m "feat(workers): add GET /api/v1/faq route"
git push origin dev
```

**6-6 practice route**
```bash
git add workers/src/routes/practice.ts
git commit -m "feat(workers): add GET /api/v1/practice route"
git push origin dev
```

**6-7 mina route**
```bash
git add workers/src/routes/mina.ts
git commit -m "feat(workers): add POST /api/v1/mina/query route"
git push origin dev
```

**6-8 index.ts（入口，組裝所有 routes）**
```bash
git add workers/src/index.ts
git commit -m "feat(workers): wire up all routes in Workers entry point"
git push origin dev
```

---

### Phase 7 — SEO 與部署設定

**任務清單：**
1. `frontend/sitemap.xml`
2. `frontend/robots.txt`
3. 確認 `deployment/cloudflare/_routes.json` 正確

**Phase 7 完成後執行：**
```bash
git add frontend/sitemap.xml frontend/robots.txt deployment/
git commit -m "chore(deploy): add sitemap, robots.txt, Cloudflare routes config"
git push origin dev
```

---

## 七、Mina QA Tree 完整內容（`data/mina/qa-tree.json`）

```json
{
  "version": "1.0",
  "updatedAt": "2026-01-01",
  "welcome": "你好！我是 Mina 小幫手 👋\n請問你想了解什麼呢？",
  "handoffMessage": "這個問題讓老師來親自回答更好喔 😊",
  "handoffCta": { "label": "加 LINE 詢問老師", "url": "#TODO_LINE_URL" },
  "nodes": {
    "root": {
      "id": "root",
      "type": "options",
      "text": null,
      "options": [
        { "label": "📚 課程相關", "nodeId": "courses" },
        { "label": "💰 費用相關", "nodeId": "pricing" },
        { "label": "🕐 上課時間", "nodeId": "schedule" },
        { "label": "📍 地點交通", "nodeId": "location" },
        { "label": "🎯 預約試聽", "nodeId": "booking" },
        { "label": "❓ 其他問題", "nodeId": "other" }
      ]
    },
    "courses": {
      "id": "courses",
      "type": "options",
      "text": "請問是哪個課程呢？",
      "options": [
        { "label": "徐薇英文 UP學", "nodeId": "course_english" },
        { "label": "偉智數學 WISE", "nodeId": "course_math" },
        { "label": "暑假 / 寒假營隊", "nodeId": "course_camp" },
        { "label": "← 回主選單", "nodeId": "root" }
      ]
    },
    "course_english": {
      "id": "course_english",
      "type": "answer",
      "text": "徐薇英文 UP學 適合國小一到六年級，依程度小班分組，從聽說讀寫全方位訓練。老師特別擅長讓原本對英文沒興趣的孩子也能慢慢愛上學英文！",
      "cta": { "label": "預約免費試聽 →", "url": "/booking" },
      "options": [
        { "label": "費用怎麼算？", "nodeId": "pricing" },
        { "label": "上課時間？", "nodeId": "schedule" },
        { "label": "← 回主選單", "nodeId": "root" }
      ]
    },
    "course_math": {
      "id": "course_math",
      "type": "answer",
      "text": "偉智數學 WISE 用理解取代死記，讓孩子真的搞懂數學邏輯。適合國小一到六年級，小班制讓老師能掌握每個孩子的狀況，課後有問題也可以問老師。",
      "cta": { "label": "預約免費試聽 →", "url": "/booking" },
      "options": [
        { "label": "費用怎麼算？", "nodeId": "pricing" },
        { "label": "上課時間？", "nodeId": "schedule" },
        { "label": "← 回主選單", "nodeId": "root" }
      ]
    },
    "course_camp": {
      "id": "course_camp",
      "type": "answer",
      "text": "暑假和寒假都有特別課程，通常名額很快就滿！建議直接加 LINE 詢問或看最新消息，第一時間掌握報名資訊。",
      "cta": { "label": "查看最新消息", "url": "/news" },
      "options": [
        { "label": "加 LINE 詢問", "nodeId": "line_handoff" },
        { "label": "← 回主選單", "nodeId": "root" }
      ]
    },
    "pricing": {
      "id": "pricing",
      "type": "answer",
      "text": "費用依課程、上課頻率而不同。建議先來一堂免費試聽課，老師評估後會詳細說明最適合的方案——試聽完全免費、不強迫報名。",
      "cta": { "label": "預約免費試聽 →", "url": "/booking" },
      "options": [
        { "label": "直接電話詢問", "nodeId": "phone_handoff" },
        { "label": "← 回主選單", "nodeId": "root" }
      ]
    },
    "schedule": {
      "id": "schedule",
      "type": "answer",
      "text": "上課時間是週一到週五，下午 1:30 開始到晚上 8:00，依不同年級和班別有不同時段。具體時段可以看課程介紹，或試聽時再跟老師確認。",
      "cta": { "label": "查看課程時段", "url": "/courses#schedule" },
      "options": [
        { "label": "預約試聽", "nodeId": "booking" },
        { "label": "← 回主選單", "nodeId": "root" }
      ]
    },
    "location": {
      "id": "location",
      "type": "answer",
      "text": "我們在台中市烏日區健行北路96號，就在旭光國小旁邊，附近有停車位，交通很方便。",
      "cta": { "label": "Google Maps 導航", "url": "https://maps.google.com/?q=台中市烏日區健行北路96號" },
      "options": [
        { "label": "預約試聽", "nodeId": "booking" },
        { "label": "← 回主選單", "nodeId": "root" }
      ]
    },
    "booking": {
      "id": "booking",
      "type": "answer",
      "text": "試聽完全免費、不強迫報名！填預約表單後，老師會先跟您聯繫確認，讓第一堂課就能有最好的體驗。",
      "cta": { "label": "立即預約試聽 →", "url": "/booking" },
      "options": [
        { "label": "用 LINE 聯繫老師", "nodeId": "line_handoff" },
        { "label": "← 回主選單", "nodeId": "root" }
      ]
    },
    "other": {
      "id": "other",
      "type": "handoff",
      "text": "這個問題讓老師親自回答更準確喔 😊 您可以：",
      "options": []
    },
    "line_handoff": {
      "id": "line_handoff",
      "type": "handoff",
      "text": "加入我們的 LINE 官方帳號，老師會直接回覆您的問題！",
      "options": []
    },
    "phone_handoff": {
      "id": "phone_handoff",
      "type": "handoff",
      "text": "直接撥電話也很歡迎！服務時間：週一至週五 13:30–20:00",
      "options": []
    }
  }
}
```

---

## 八、FAQ 初始內容（`data/faq/faq.json`）

```json
{
  "version": "1.0",
  "updatedAt": "2026-01-01",
  "faqs": [
    {
      "id": "faq-001",
      "category": "課程",
      "question": "幾歲可以開始上課？",
      "answer": "我們的課程適合國小一年級到六年級的孩子。如果不確定孩子的程度，歡迎先來試聽，老師評估後再建議合適的班別。",
      "order": 1
    },
    {
      "id": "faq-002",
      "category": "課程",
      "question": "一個班有幾個學生？",
      "answer": "我們採小班制教學，每班人數控制在適當範圍，讓老師能真正關注每一位學生的學習狀況，及時給予個別指導。",
      "order": 2
    },
    {
      "id": "faq-003",
      "category": "課程",
      "question": "課程內容跟學校教的一樣嗎？",
      "answer": "我們以學校課程為基礎，但不只是複習學校內容。英文課著重聽說讀寫全方位訓練，數學課重視邏輯理解，讓孩子建立真正的能力，而非只是應付考試。",
      "order": 3
    },
    {
      "id": "faq-004",
      "category": "課程",
      "question": "如果孩子跟不上進度怎麼辦？",
      "answer": "老師會持續觀察每位學生的學習狀況。如果遇到跟不上的情況，老師會主動調整教學方式，必要時也可以安排補充說明，不會讓孩子被落下。",
      "order": 4
    },
    {
      "id": "faq-005",
      "category": "試聽",
      "question": "試聽需要費用嗎？",
      "answer": "試聽完全免費！也不需要任何承諾，試聽後如果覺得合適再決定是否報名，不會有任何壓力。",
      "order": 5
    },
    {
      "id": "faq-006",
      "category": "試聽",
      "question": "試聽怎麼預約？",
      "answer": "您可以透過網站的「預約試聽」表單預約，或直接撥打 04-2336-6868，也歡迎加 LINE 詢問。預約後老師會在上課前與您聯繫確認。",
      "order": 6
    },
    {
      "id": "faq-007",
      "category": "上課",
      "question": "上課時間是什麼時候？",
      "answer": "開放時間是週一至週五，下午 1:30 到晚上 8:00，依不同年級和班別有不同時段。詳細時段請參考課程介紹，或在預約試聽時詢問老師。",
      "order": 7
    },
    {
      "id": "faq-008",
      "category": "上課",
      "question": "請假可以補課嗎？",
      "answer": "如果因故需要請假，可以提前告知老師，我們會盡量安排補課機會，但補課時段以班級空缺為主，請以彈性態度配合。",
      "order": 8
    },
    {
      "id": "faq-009",
      "category": "地點",
      "question": "上課地點在哪裡？",
      "answer": "我們位於台中市烏日區健行北路96號，就在旭光國小旁邊。附近有停車位，方便家長接送。",
      "order": 9
    },
    {
      "id": "faq-010",
      "category": "費用",
      "question": "費用怎麼計算？",
      "answer": "費用依課程類型（英文/數學）和上課頻率而有所不同。建議先來試聽，老師了解孩子的需求後，會詳細說明最適合的課程方案及費用。",
      "order": 10
    }
  ]
}
```

---

## 九、題庫範例資料

### `data/practice/en/grade1-2.json`

```json
{
  "subject": "en",
  "grade": "1-2",
  "gradeLabel": "國小低年級（1–2年級）",
  "updatedAt": "2026-01-01",
  "questions": [
    {
      "id": "en-12-001",
      "type": "multiple_choice",
      "chapter": "顏色與形狀",
      "question": "看圖選出正確的英文單字：🔴",
      "options": ["Blue", "Red", "Green", "Yellow"],
      "answer": "Red",
      "explanation": "紅色的英文是 Red。Blue 是藍色，Green 是綠色，Yellow 是黃色。",
      "difficulty": 1
    },
    {
      "id": "en-12-002",
      "type": "multiple_choice",
      "chapter": "數字",
      "question": "「五」的英文怎麼說？",
      "options": ["Three", "Four", "Five", "Six"],
      "answer": "Five",
      "explanation": "Five 是 5 的英文。Three=3，Four=4，Six=6。",
      "difficulty": 1
    },
    {
      "id": "en-12-003",
      "type": "multiple_choice",
      "chapter": "身體部位",
      "question": "「眼睛」的英文是什麼？",
      "options": ["Ear", "Nose", "Eye", "Mouth"],
      "answer": "Eye",
      "explanation": "Eye 是眼睛。Ear=耳朵，Nose=鼻子，Mouth=嘴巴。",
      "difficulty": 1
    },
    {
      "id": "en-12-004",
      "type": "multiple_choice",
      "chapter": "動物",
      "question": "「貓」的英文是什麼？",
      "options": ["Dog", "Cat", "Bird", "Fish"],
      "answer": "Cat",
      "explanation": "Cat 是貓。Dog=狗，Bird=鳥，Fish=魚。",
      "difficulty": 1
    },
    {
      "id": "en-12-005",
      "type": "multiple_choice",
      "chapter": "問候語",
      "question": "早上見到朋友應該說什麼？",
      "options": ["Good night!", "Good afternoon!", "Good morning!", "Goodbye!"],
      "answer": "Good morning!",
      "explanation": "早上打招呼說 Good morning！下午說 Good afternoon，晚上說 Good night，離開說 Goodbye。",
      "difficulty": 1
    }
  ]
}
```

### `data/practice/ma/grade1-2.json`

```json
{
  "subject": "ma",
  "grade": "1-2",
  "gradeLabel": "國小低年級（1–2年級）",
  "updatedAt": "2026-01-01",
  "questions": [
    {
      "id": "ma-12-001",
      "type": "multiple_choice",
      "chapter": "加法",
      "question": "5 + 3 = ?",
      "options": ["6", "7", "8", "9"],
      "answer": "8",
      "explanation": "5 加 3 等於 8。用手指頭數：5 之後再數 3 個就是 6、7、8。",
      "difficulty": 1
    },
    {
      "id": "ma-12-002",
      "type": "multiple_choice",
      "chapter": "減法",
      "question": "10 - 4 = ?",
      "options": ["4", "5", "6", "7"],
      "answer": "6",
      "explanation": "10 減掉 4 剩下 6。10 往回數 4 個：9、8、7、6。",
      "difficulty": 1
    },
    {
      "id": "ma-12-003",
      "type": "multiple_choice",
      "chapter": "比大小",
      "question": "下列哪個數字最大？",
      "options": ["15", "21", "9", "18"],
      "answer": "21",
      "explanation": "比較大小時，先比十位數：21 的十位是 2，其他都是 1 或 0，所以 21 最大。",
      "difficulty": 1
    },
    {
      "id": "ma-12-004",
      "type": "multiple_choice",
      "chapter": "形狀",
      "question": "正方形有幾個角？",
      "options": ["3", "4", "5", "6"],
      "answer": "4",
      "explanation": "正方形有 4 個角、4 條邊，而且每條邊一樣長。",
      "difficulty": 1
    },
    {
      "id": "ma-12-005",
      "type": "multiple_choice",
      "chapter": "時間",
      "question": "一小時等於幾分鐘？",
      "options": ["30分鐘", "60分鐘", "100分鐘", "24分鐘"],
      "answer": "60分鐘",
      "explanation": "1 小時 = 60 分鐘。記憶方法：時鐘的長針走一圈就是 60 分鐘，也就是 1 小時。",
      "difficulty": 1
    }
  ]
}
```

其他年級（grade3-4、grade5-6）依相同格式建立，`difficulty` 調整為 2 和 3，題目難度對應提升。

---

## 十、.env.example（必須建立此檔案）

```bash
# ─────────────────────────────────────────
# Mina Website — Environment Variables
# 複製此檔案為 .env.local，填入真實數值
# 絕對不要 commit .env.local 至 Git
# ─────────────────────────────────────────

# Notion API（到 https://www.notion.so/my-integrations 建立）
NOTION_API_KEY=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Notion Database IDs（在 Notion 頁面 URL 中取得 32 位 ID）
NOTION_BOOKING_DB_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_NEWS_DB_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_FAQ_DB_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# LINE Official Account（到 LINE Developers 取得）
LINE_OFFICIAL_URL=https://lin.ee/TODO

# Admin 保護 token（自行產生 32 位以上隨機字串）
ADMIN_SECRET=change-this-to-a-random-32-char-string

# CORS 允許的 Frontend 網域
CORS_ORIGIN=https://mina-website.pages.dev

# 執行環境
ENVIRONMENT=development
```

---

## 十一、Placeholder 規則

### 圖片
使用 `https://placehold.co/WxH/f0ece8/B8005F?text=Mina`，比例與規格書一致。

### 連結（HTML）
```html
<a href="#" data-todo="Replace with real LINE OA URL" class="soc-btn line">
  <span>LINE</span>
</a>
```

### 老師資訊
| 位置 | 姓名 | 科目 | 說明 |
|------|------|------|------|
| 老師 1 | 徐薇老師 | 英文科主任 | 20+ 年教學經驗，讓孩子愛上英文 |
| 老師 2 | 偉智老師 | 數學科主任 | 15+ 年教學經驗，邏輯思維訓練 |
| 老師 3 | 待補師資一 | 英文科 | — |
| 老師 4 | 待補師資二 | 數學科 | — |

頭貼：`https://placehold.co/120x120/f0ece8/B8005F?text=師`

### 信任指標（暫用）
```
10+ 年教學經驗 / 300+ 位學生 / 4.8★ Google 評分 / 90% 學生成績進步
```
頁面加備注：`data-placeholder="true"`

### 課程時段（暫用）
```
英文課：週一/三/五 14:00–15:30（低年級）｜16:00–17:30（中高年級）
數學課：週二/四 14:00–15:30（低年級）｜16:00–17:30（中高年級）
```
必須在課程時段表旁顯示：
```html
<p class="note schedule-note">以上為示意時段，實際開課時間以現場公告為準。</p>
```

---

## 十二、關鍵問題解法

### news-single.html 路由
```javascript
// news-single.html 頁頂，JS 立即執行
(function() {
  const params = new URLSearchParams(window.location.search)
  const slug = params.get('slug')
  if (!slug) { window.location.replace('/news.html'); return; }
  loadArticle(slug) // fetch /api/v1/news/:slug
})()
```

news.html 文章卡片連結：
```html
<a href="news-single.html?slug=SLUG_VALUE" class="news-card">...</a>
```

### booking-success.html
`booking.js` 成功後：
```javascript
window.location.replace('/booking-success.html')
```

### Workers 讀取靜態 JSON（practice / faq / mina）
```typescript
// 在 practice.ts route
import gradeData from '../../data/practice/en/grade1-2.json'
// 或動態 import
const data = await import(`../../data/practice/${subject}/${grade}.json`)
```
> 注意：Cloudflare Workers 不支援 Node.js `fs`，只能 import JSON 或從 KV / R2 讀取。
> V1 使用靜態 import，在 Workers bundle 時打包進去。

### Notion News 資料取得（含 fallback）
```typescript
// workers/src/routes/news.ts
async function getNewsFromNotion(env: Env) {
  try {
    // 打 Notion API
    const res = await notionAdapter.queryDatabase(env.NOTION_NEWS_DB_ID, ...)
    return transformNotionToNews(res)
  } catch (e) {
    // fallback：回傳空陣列，讓前端顯示「暫無消息」
    console.error('Notion news fetch failed:', e)
    return []
  }
}
```

---

## 十三、禁止事項（不得違反）

1. **不得詢問是否確認執行某個動作**
2. **不得問「要 A 還是 B 方案？」**（本文件已全部決定）
3. **不得因 placeholder 停下來**——直接用 TODO 標記繼續
4. **不得跳過 Phase 或亂序執行**
5. **不得在 Phase 完成後忘記 git commit + push**
6. **不得把後端寫成 Node.js VPS**——必須是 Cloudflare Workers
7. **不得使用前端框架（React/Vue 等）或 jQuery**
8. **不得把 API Key 或 Secret 寫死在程式碼中**——必須用 `c.env.XXX`
9. **不得把 `data/` 的 JSON 直接暴露給前端**——必須透過 Workers API 回傳

---

## 十四、最新消息完整規格

### news.html — 頁面結構

```
Page Hero
  ├── kicker: "LATEST NEWS"
  ├── title: "最新消息"
  └── description: "課程資訊、活動公告、成果分享"

Filter Bar（分類篩選）
  ├── Tab: 全部（預設選中）
  ├── Tab: 公告
  ├── Tab: 活動
  ├── Tab: 特別課程
  └── Tab: 文章

Article Grid（3欄桌機 / 2欄平板 / 1欄手機）
  └── ArticleCard × N
        ├── 封面圖（16:9，lazy loading）
        ├── 分類標籤（.tag）
        ├── 日期（YYYY.MM.DD）
        ├── 標題（h3）
        ├── 摘要（最多 80 字，超過 ... 截斷）
        └── 連結 → news-single.html?slug=SLUG

Load More 按鈕（非 pagination）
  ├── 預設顯示 9 篇
  ├── 點擊載入再 9 篇
  └── 全部載入後隱藏按鈕

Empty State（無文章時）
  └── "目前沒有消息，請稍後再看 😊"
```

### news.html 前端行為（news.js）

```javascript
// news.js 需實作以下功能：

// 1. 從 API 取得所有文章
async function fetchNews(category = 'all') {
  const url = category === 'all'
    ? '/api/v1/news'
    : `/api/v1/news?category=${category}`
  const res = await fetch(url)
  return res.json()
}

// 2. Filter Tab 點擊 → 重新 fetch + 重新渲染
// 3. Load More → append 下一批
// 4. ArticleCard HTML template（函式產生，不是 innerHTML 字串拼接）
// 5. 日期格式化：ISO → YYYY.MM.DD
// 6. 圖片 fallback：onerror → 顯示品牌色 placeholder
// 7. 載入中顯示 skeleton loading（3 個 .skeleton-card）
```

### news-single.html — 頁面結構

```
Back Link
  └── ← 返回最新消息

Article Header
  ├── 分類標籤（.tag）
  ├── 日期
  └── 標題（h1）

Cover Image（16:9，full width）

活動照片輪播（.photo-carousel）
  ├── 觸發條件：category === '活動' AND photos.length >= 1
  ├── 位置：封面圖下方、正文上方
  ├── 比例：4:3（aspect-ratio: 4/3）
  ├── 切換效果：opacity 淡入淡出 0.3s（不用 slide，避免過度動畫）
  ├── 控制：左右箭頭 + 底部圓點 + touch swipe + 鍵盤 ← →
  ├── 不自動播放
  ├── 計數器：右上角「1 / 8」
  ├── 單張時：隱藏箭頭和圓點
  └── 圖片 alt：「[文章標題] 活動照片 [index+1]」

Article Body
  └── 從 Notion 取得的 rich text 渲染為 HTML
      支援：p, h2, h3, ul, ol, li, strong, em, a, blockquote, img

Article Footer
  ├── 分隔線
  ├── 分享按鈕（複製連結）
  └── Back Link: ← 返回最新消息

Mina Chat CTA Block（標準元件，同其他頁面底部）
```

### news-single.html 前端行為（news.js）

```javascript
// 單篇文章行為（在 news.js 中，依 URL 判斷執行哪段邏輯）

if (document.body.classList.contains('page-news-single')) {
  const slug = new URLSearchParams(location.search).get('slug')
  if (!slug) { location.replace('/news.html'); }
  else { loadArticle(slug) }
}

async function loadArticle(slug) {
  // 1. 顯示 loading skeleton
  // 2. fetch /api/v1/news/:slug
  // 3. 渲染文章（Notion blocks → HTML）
  // 4. 若 article.category === '活動' && article.photos.length >= 1
  //    → 呼叫 initCarousel(article.photos, article.title)
  // 5. 設定 document.title = article.title + " | Mina 補習班"
  // 6. 處理 404：顯示「找不到這篇文章」+ 返回連結
}

function initCarousel(photos, articleTitle) {
  // 最多取 20 張
  const items = photos.slice(0, 20)
  if (items.length === 0) return

  const carousel = document.querySelector('.photo-carousel')
  const track = carousel.querySelector('.carousel-track')
  const dotsEl = carousel.querySelector('.carousel-dots')
  const counter = carousel.querySelector('.carousel-counter')
  let current = 0

  // 產生 slide 和 dots
  items.forEach((url, i) => {
    const slide = document.createElement('div')
    slide.className = 'carousel-slide' + (i === 0 ? ' active' : '')
    const img = document.createElement('img')
    img.src = url
    img.alt = `${articleTitle} 活動照片 ${i + 1}`
    img.loading = 'lazy'
    slide.appendChild(img)
    track.appendChild(slide)

    if (items.length > 1 && items.length <= 10) {
      const dot = document.createElement('span')
      dot.className = 'dot' + (i === 0 ? ' active' : '')
      dot.onclick = () => goTo(i)
      dotsEl.appendChild(dot)
    }
  })

  // 隱藏箭頭和點（單張時）
  if (items.length === 1) {
    carousel.querySelector('.carousel-prev').hidden = true
    carousel.querySelector('.carousel-next').hidden = true
    dotsEl.hidden = true
    counter.hidden = true
    return
  }

  function goTo(n) {
    track.querySelectorAll('.carousel-slide')[current].classList.remove('active')
    dotsEl.querySelectorAll('.dot')[current]?.classList.remove('active')
    current = (n + items.length) % items.length
    track.querySelectorAll('.carousel-slide')[current].classList.add('active')
    dotsEl.querySelectorAll('.dot')[current]?.classList.add('active')
    counter.textContent = `${current + 1} / ${items.length}`
  }

  carousel.querySelector('.carousel-prev').onclick = () => goTo(current - 1)
  carousel.querySelector('.carousel-next').onclick = () => goTo(current + 1)

  // Touch swipe
  let startX = 0
  track.addEventListener('touchstart', e => { startX = e.touches[0].clientX }, { passive: true })
  track.addEventListener('touchend', e => {
    const diff = startX - e.changedTouches[0].clientX
    if (Math.abs(diff) > 40) goTo(diff > 0 ? current + 1 : current - 1)
  })

  // Keyboard
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') goTo(current - 1)
    if (e.key === 'ArrowRight') goTo(current + 1)
  })

  counter.textContent = `1 / ${items.length}`
}
```

### workers/src/routes/news.ts — 完整實作規格

**GET /api/v1/news**

請求參數：
```
?category=公告|活動|特別課程|文章    # 可選，不傳則回全部
?page=1                               # 預設 1
?limit=9                              # 預設 9，最大 30
```

回傳格式：
```json
{
  "ok": true,
  "data": {
    "articles": [
      {
        "id": "notion-page-id",
        "slug": "summer-camp-2026",
        "title": "2026 暑假英數密集班開始報名！",
        "category": "活動",
        "excerpt": "今年暑假英文+數學密集班，名額有限，7月1日起開放報名...",
        "coverImage": "https://...",
        "publishedAt": "2026-05-01T00:00:00.000Z",
        "tags": ["暑假", "英文", "數學"]
      }
    ],
    "total": 24,
    "page": 1,
    "limit": 9,
    "hasMore": true
  }
}
```

**GET /api/v1/news/:slug**

回傳格式：
```json
{
  "ok": true,
  "data": {
    "id": "notion-page-id",
    "slug": "summer-camp-2026",
    "title": "2026 暑假英數密集班開始報名！",
    "category": "活動",
    "coverImage": "https://...",
    "photos": [
      "https://prod-files-secure.s3.us-west-2.amazonaws.com/...",
      "https://prod-files-secure.s3.us-west-2.amazonaws.com/..."
    ],
    "publishedAt": "2026-05-01T00:00:00.000Z",
    "tags": ["暑假", "英文", "數學"],
    "content": "<p>今年暑假...</p><h2>課程特色</h2>...",
    "related": []
  }
}
```

**photos 欄位規則：**
- `category === '活動'` 且 Notion「活動照片」欄位有值 → 回傳 URL 陣列（最多 20 個）
- 其他分類，或活動照片欄位為空 → 回傳 `[]`
- Notion Files & Media URL 有時效性，不可永久快取。整個 article 快取 TTL 10 分鐘。

content 欄位為 Notion blocks 轉換後的 HTML string。

**404 情況：**
```json
{
  "ok": false,
  "error": { "code": "NOT_FOUND", "message": "Article not found" }
}
```

### Notion News Database 欄位（`NOTION_NEWS_DB_ID`）

| 欄位名稱 | Notion 類型 | 說明 |
|---------|------------|------|
| Title | Title | 文章標題 |
| Slug | Rich Text | URL slug（英文小寫 + 連字號） |
| Category | Select | 公告 / 活動 / 特別課程 / 文章 |
| Status | Select | 草稿 / 已發布 |
| Published At | Date | 發布日期 |
| Excerpt | Rich Text | 摘要（80字以內） |
| Cover Image | Files & Media | 封面圖（單張，16:9） |
| **活動照片** | **Files & Media** | **活動現場照片（多張，category=活動 時使用，其他留空）** |
| Tags | Multi-select | 標籤 |

> Workers 只讀取 `Status = 已發布` 的文章。

### notion.ts adapter 需實作的方法

```typescript
// workers/src/adapters/notion.ts

interface NotionAdapter {
  // 查詢 database（支援 filter 和 pagination）
  queryDatabase(dbId: string, opts: QueryOpts): Promise<NotionPage[]>

  // 取得單頁（by page ID）
  getPage(pageId: string): Promise<NotionPage>

  // 取得頁面的 blocks（content）
  getPageBlocks(pageId: string): Promise<NotionBlock[]>

  // 將 Notion blocks 轉換為 HTML string
  // 支援：paragraph, heading_2, heading_3, bulleted_list_item,
  //       numbered_list_item, quote, image, divider
  // 不支援的 block type 直接跳過（不報錯）
  blocksToHtml(blocks: NotionBlock[]): string

  // 從 Files & Media 屬性提取 URL 陣列
  // Notion Files & Media 回傳的 file 物件格式：
  //   { type: 'file', file: { url: string, expiry_time: string } }
  //   { type: 'external', external: { url: string } }
  // 兩種格式都要支援，統一回傳 string[]
  extractFileUrls(filesProperty: NotionFilesProperty): string[]
}

// extractFileUrls 使用範例：
// const photos = adapter.extractFileUrls(page.properties['活動照片'])
// → ['https://prod-files-secure.s3...', 'https://...']
// → [] （欄位為空時）
```

### `data/news/sample-news.json`（開發時使用，Workers 環境變數 `ENVIRONMENT=development` 時 fallback）

```json
{
  "articles": [
    {
      "id": "sample-001",
      "slug": "summer-camp-2026",
      "title": "2026 暑假英數密集班，7 月 1 日起開放報名！",
      "category": "活動",
      "excerpt": "今年暑假英文＋數學密集班即將開放，小班制、強師資，名額有限，歡迎提早預約。",
      "coverImage": "https://placehold.co/800x450/f0ece8/B8005F?text=Summer+Camp",
      "publishedAt": "2026-05-15T08:00:00.000Z",
      "tags": ["暑假", "英文", "數學", "營隊"],
      "content": "<p>2026 年暑假，Mina 補習班精心規劃英數密集班，讓孩子在暑假不只是玩樂，也能打好基礎，迎接新學期。</p><h2>課程特色</h2><ul><li>英文：自然發音強化 + 閱讀理解</li><li>數學：應用題解題技巧 + 概念深化</li><li>小班制，每班最多 8 人</li></ul><p>歡迎填寫預約表單，老師會盡快與您聯繫。</p>"
    },
    {
      "id": "sample-002",
      "slug": "new-semester-notice-2026",
      "title": "115 學年度新學期招生公告",
      "category": "公告",
      "excerpt": "115 學年度下學期課程即將開始，歡迎新舊學員報名，試聽免費不限次數。",
      "coverImage": "https://placehold.co/800x450/fff8f0/F07800?text=New+Semester",
      "publishedAt": "2026-01-20T08:00:00.000Z",
      "tags": ["公告", "招生"],
      "content": "<p>115 學年度下學期課程開始招生，歡迎有興趣的家長帶孩子來試聽。</p><p>試聽完全免費，不需任何承諾。</p>"
    },
    {
      "id": "sample-003",
      "slug": "english-reading-tips",
      "title": "如何培養孩子的英文閱讀習慣？",
      "category": "文章",
      "excerpt": "英文閱讀能力是語言學習的根基，從小養成好習慣，事半功倍。徐薇老師分享三個實用方法。",
      "coverImage": "https://placehold.co/800x450/f0f4e8/3C7A4E?text=Reading+Tips",
      "publishedAt": "2026-03-10T08:00:00.000Z",
      "tags": ["英文", "閱讀", "親子"],
      "content": "<p>許多家長問：孩子英文成績還可以，但閱讀就是提不起興趣，怎麼辦？</p><h2>方法一：從孩子有興趣的主題開始</h2><p>強迫孩子讀他們不喜歡的內容，效果往往適得其反。先找到孩子喜歡的主題，哪怕是恐龍、太空、動物，再找對應的英文繪本或讀物。</p><h2>方法二：每天 10 分鐘，比週末 2 小時更有效</h2><p>閱讀習慣靠的是頻率而不是長度。每天睡前 10 分鐘的英文閱讀，三個月就能看到明顯進步。</p><h2>方法三：讀完後討論，不是考試</h2><p>讀完後問孩子「你最喜歡哪個部分？」而不是「這句話是什麼意思？」讓孩子感受到閱讀的樂趣，而不是壓力。</p>"
    }
  ]
}
```

---

## 十五、唯一允許停下來回報的情況

只有以下情況才停下來，格式如下：

```
[BLOCKED] Phase X — 檔案名稱
需要以下資訊才能繼續：
- 項目：說明
已完成到：上一個 commit 的位置
```

允許的情況：
1. 規格書與本文件有直接矛盾，且無法自行判斷
2. 需要真實敏感資訊（API Key），且 .env.example 沒有說明格式

**不允許的情況（不得停下來）：**
- placeholder 圖片 / 連結 → 用 TODO 標記
- 不確定 CSS 數值 → 依規格精神自行決定
- 功能是否要實作 → 規格書有寫的都做，沒寫的不做
- 任何已在本文件決定的技術選型問題

---

*CLAUDE.md V1.1 — Mina Website Project*  
*對應規格書：Mina_Website_Master_Specification_V1.0.html*  
*更新：2026-06 — 新增 Git commit 規則 + 最新消息完整規格*
