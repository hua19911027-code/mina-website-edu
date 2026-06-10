# CLAUDE.md 補充規格：題庫系統 V1.1
**本文件補充並取代 CLAUDE.md 中關於題庫（practice）的相關決策。**  
**閱讀本文件前，必須先完整閱讀 CLAUDE.md。本文件僅說明差異與新增部分。**

---

## 第零步：V1 現況確認（執行前必讀）

在開始任何實作前，請先執行以下確認並輸出結果：

```bash
echo "=== Workers routes ===" && ls workers/src/routes/ 2>/dev/null || echo "routes/ 不存在"
echo "=== practice.ts 內容摘要 ===" && head -30 workers/src/routes/practice.ts 2>/dev/null || echo "practice.ts 不存在"
echo "=== Bindings 現況 ===" && grep -A5 "type Bindings" workers/src/index.ts 2>/dev/null || echo "index.ts 不存在"
echo "=== .env.example ===" && grep "NOTION_" .env.example 2>/dev/null || echo ".env.example 不存在"
echo "=== data/practice 檔案 ===" && ls data/practice/ 2>/dev/null && ls data/practice/en/ 2>/dev/null && ls data/practice/ma/ 2>/dev/null || echo "data/practice/ 不存在"
echo "=== wrangler.toml ===" && cat workers/wrangler.toml 2>/dev/null || echo "wrangler.toml 不存在"
```

根據輸出結果判斷哪些已建立、哪些需要新增或修改。**不得假設任何檔案已存在。**

---

## 一、CLAUDE.md §二 凍結決策更新

以下條目從本文件起正式更新，**取代** CLAUDE.md §二 的對應決策：

| 項目 | 原決策（CLAUDE.md §二） | 更新後決策 |
|---|---|---|
| 題庫主資料源 | JSON 靜態檔案 `data/practice/` | **Notion Database（主要）** |
| 題庫 Fallback | 無 | 靜態 JSON（僅 `ENVIRONMENT=development` 時使用） |
| 考前複習 | 未定義 | Notion Database（新增） |
| 題庫庫存清除 | 寒暑假前清除未發布題目 | **廢除。改為學年制封存（不刪除）** |
| 題庫 AI 出題 | 未定義 | **V2，本文件不實作** |
| 審核通知 | 未定義 | **V2，本文件不實作** |

---

## 二、Bindings 補充

### workers/src/index.ts `type Bindings` 新增

```typescript
type Bindings = {
  NOTION_API_KEY: string
  NOTION_BOOKING_DB_ID: string
  NOTION_NEWS_DB_ID: string
  NOTION_FAQ_DB_ID: string
  NOTION_PRACTICE_DB_ID: string       // ← 新增
  NOTION_EXAM_REVIEW_DB_ID: string    // ← 新增
  LINE_OFFICIAL_URL: string
  ADMIN_SECRET: string
  CORS_ORIGIN: string
  ENVIRONMENT: string
}
```

### .env.example 新增

在現有 `NOTION_FAQ_DB_ID` 下方加入：

```bash
NOTION_PRACTICE_DB_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_EXAM_REVIEW_DB_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### workers/wrangler.toml

`NOTION_PRACTICE_DB_ID` 和 `NOTION_EXAM_REVIEW_DB_ID` 必須設定為 **encrypted Secret**（不是 vars），與 `NOTION_API_KEY` 相同處理方式。

---

## 三、Notion Database 定義

### 3-1 題庫 Database（`NOTION_PRACTICE_DB_ID`）

| 欄位名稱 | Notion 類型 | 說明 |
|---|---|---|
| 題目ID | Title | 格式：`en-3-001`（科目-年級-序號），唯一值 |
| 年級 | Select | 小一 / 小二 / 小三 / 小四 / 小五 / 小六 |
| 科目 | Select | 英文 / 數學 |
| 題型 | Select | 標準題型 / 觀念拆解 / 錯題診斷 |
| 教材版本 | Select | 康軒Wonder World / 何嘉仁Super Fun / 康軒 / 翰林 / 南一 |
| 學期 | Select | 上學期 / 下學期 |
| **學年度** | **Select** | **例：115學年度、116學年度（8/1起至隔年7/31止）** |
| 單元 | Rich Text | 單元名稱（如：Unit 3 時態練習） |
| 題目 | Rich Text | 題目主文 |
| 選項A | Rich Text | |
| 選項B | Rich Text | |
| 選項C | Rich Text | |
| 選項D | Rich Text | |
| 答案 | Select | A / B / C / D |
| 正確觀念 | Rich Text | |
| 常見錯誤 | Rich Text | |
| 記憶提示 | Rich Text | |
| 發布日期 | Date | 設定為週六 01:00，API 端自動過濾（`發布日期 <= now()`） |
| 是否發布 | Checkbox | false = 草稿，true = 老師審核通過可發布 |

> **學年度說明：** 每學年 8/1 起算至隔年 7/31 止。學年結束後，老師在 Notion 批量將該學年題目標記「已封存」（建議新增「已封存」Checkbox 欄位），封存資料永久保留不刪除，作為未來歷史資料。API 過濾邏輯不受學年影響，仍以發布日期和是否發布為準。

### 3-2 考前複習 Database（`NOTION_EXAM_REVIEW_DB_ID`）

| 欄位名稱 | Notion 類型 | 說明 |
|---|---|---|
| 名稱 | Title | 如：115下學期段考一複習－英文小三 |
| 科目 | **Select（可自行擴充）** | 英文 / 數學 / 國語 / 自然 / 社會 / ⋯（老師直接在 Notion 新增選項，無需改程式） |
| 年級 | Select | 小一 / 小二 / 小三 / 小四 / 小五 / 小六 |
| PDF | Files & Media | 考前複習卷 PDF（上傳至 Notion） |
| 開始時間 | Date（含時間）| 考前週六 12:00 |
| 結束時間 | Date（含時間）| 考試當週日 23:59 |
| 是否啟用 | Checkbox | 總開關，false = 永遠不顯示（優先於時間判斷） |

> **科目欄位設計說明：** 使用 Notion Select 類型，老師可自行新增任何科目選項（如未來增加生活、藝術等），完全不需要修改程式碼。前端直接顯示 API 回傳的科目名稱，無硬編碼科目清單。

> **Notion PDF URL 注意**：Notion Files & Media URL 有時效性（約 1 小時），考前複習 API 端必須設定 `Cache-Control: no-store`，每次呼叫重新取得當次有效 URL。

---

## 四、practice.ts 完整 API 規格

### Routes 清單

```
GET /api/v1/practice              ← 歷屆題庫（近三個月）
GET /api/v1/practice/archive      ← Mina小幫手搜尋範圍（三個月以前）
GET /api/v1/practice/exam-review  ← 考前複習
```

---

### 4-1 `GET /api/v1/practice`（歷屆題庫，近三個月）

**請求參數：**

```
?grade=小三              # 可選：小一/小二/小三/小四/小五/小六
?subject=英文            # 可選：英文 / 數學
?type=標準題型           # 可選：標準題型 / 觀念拆解 / 錯題診斷
?page=1                  # 預設 1
?limit=12                # 固定 12
```

**篩選邏輯：**

```
是否發布 = true
AND 發布日期 >= (today - 90 days)
AND 發布日期 <= today
AND grade / subject / type（若有傳則疊加篩選）
```

**回傳格式（200 OK）：**

```json
{
  "ok": true,
  "data": {
    "questions": [
      {
        "id": "en-3-001",
        "grade": "小三",
        "subject": "英文",
        "type": "標準題型",
        "unit": "Unit 3 時態練習",
        "question": "克漏字（Cloze）怎麼作答最穩？",
        "options": ["只填文法正確的", "先看上下文脈絡", "跳過再猜", "選最長選項"],
        "answer": "B",
        "explanation": {
          "concept": "先看上下句的時態與連接詞，再挑語意最通順的選項；不確定就用刪去法。",
          "commonMistake": "只看空格那一行就選，忽略整段語意。",
          "memoryTip": "先讀完整段，再回頭填空。"
        },
        "publishedAt": "2026-06-07T01:00:00.000Z"
      }
    ],
    "total": 24,
    "page": 1,
    "limit": 12,
    "hasMore": true,
    "lastUpdated": "2026-06-07T01:00:00.000Z"
  }
}
```

> `lastUpdated`：當前篩選結果中最新一筆的 `publishedAt`，用於頁面顯示「最後更新日期」。

**Cache-Control：** `public, max-age=300`

---

### 4-2 `GET /api/v1/practice/archive`（三個月以前，Mina小幫手範圍）

**請求參數：**（同 4-1）

**篩選邏輯：**

```
是否發布 = true
AND 發布日期 < (today - 90 days)
AND grade / subject / type（若有傳則疊加）
```

**硬限制：API 端強制 total_limit = 36**

- `page=1`：回傳第 1–12 題
- `page=2`：回傳第 13–24 題
- `page=3`：回傳第 25–36 題，`hasMore=false`，`reachedLimit=true`
- `page>=4`：回傳 400

**回傳格式（多加 `reachedLimit`，其餘同 4-1）：**

```json
{
  "ok": true,
  "data": {
    "questions": [...],
    "total": 36,
    "page": 3,
    "limit": 12,
    "hasMore": false,
    "reachedLimit": true,
    "lastUpdated": "2026-04-05T01:00:00.000Z"
  }
}
```

**page >= 4 回傳 400：**

```json
{
  "ok": false,
  "error": { "code": "LIMIT_REACHED", "message": "已達查詢上限 36 題" }
}
```

**Cache-Control：** `public, max-age=3600`

---

### 4-3 `GET /api/v1/practice/exam-review`（考前複習）

**請求參數：**

```
?grade=小三              # 必填，前端選完年級後帶入
```

**篩選邏輯：**

```
是否啟用 = true
AND 年級 = grade（傳入值）
AND 開始時間 <= now()
AND 結束時間 >= now()
```

**有有效複習卷：**

```json
{
  "ok": true,
  "data": {
    "active": true,
    "grade": "小三",
    "items": [
      {
        "id": "exam-review-001",
        "name": "115下學期段考一複習－英文小三",
        "subject": "英文",
        "grade": "小三",
        "pdfUrl": "https://prod-files-secure.s3.us-west-2.amazonaws.com/...",
        "startAt": "2026-05-30T12:00:00.000Z",
        "endAt": "2026-06-08T23:59:00.000Z"
      },
      {
        "id": "exam-review-002",
        "name": "115下學期段考一複習－數學小三",
        "subject": "數學",
        "grade": "小三",
        "pdfUrl": "https://prod-files-secure.s3.us-west-2.amazonaws.com/...",
        "startAt": "2026-05-30T12:00:00.000Z",
        "endAt": "2026-06-08T23:59:00.000Z"
      }
    ]
  }
}
```

**無有效複習卷（時間外）：**

```json
{
  "ok": true,
  "data": {
    "active": false,
    "grade": "小三",
    "items": []
  }
}
```

> 前端根據 `active` 欄位判斷，不需要判斷 items 長度。  
> **Cache-Control：`no-store`**（Notion PDF URL 有時效性，禁止快取）

---

## 五、JSON Schema 更新（`data/practice/` Fallback 檔案）

所有 `data/practice/` 下 JSON 的 `explanation` 欄位統一改為物件，並補齊新欄位：

**修改前：**

```json
"explanation": "答案說明文字"
```

**修改後：**

```json
{
  "id": "en-3-001",
  "grade": "小三",
  "subject": "英文",
  "type": "標準題型",
  "unit": "Unit 3 時態練習",
  "question": "...",
  "options": ["A", "B", "C", "D"],
  "answer": "B",
  "explanation": {
    "concept": "正確觀念說明",
    "commonMistake": "常見錯誤說明",
    "memoryTip": "記憶提示"
  },
  "publishedAt": "2026-06-07T01:00:00.000Z"
}
```

> `grade` 改為個別年級（`小三`），不再使用 `elementary_3_4` 格式。  
> 所有 data/practice/ 下的 JSON 範例資料均需一併更新。

---

## 六、practice.ts Notion 查詢實作規則

### 時間計算

```typescript
const now = new Date()
const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
```

### 題庫 Notion filter 格式

```typescript
// 歷屆題庫
{
  "and": [
    { "property": "是否發布", "checkbox": { "equals": true } },
    { "property": "發布日期", "date": { "on_or_after": ninetyDaysAgo.toISOString() } },
    { "property": "發布日期", "date": { "on_or_before": now.toISOString() } },
    // 若有 grade：{ "property": "年級", "select": { "equals": grade } }
    // 若有 subject：{ "property": "科目", "select": { "equals": subject } }
    // 若有 type：{ "property": "題型", "select": { "equals": type } }
  ]
}
```

### 考前複習 Notion filter

```typescript
{
  "and": [
    { "property": "是否啟用", "checkbox": { "equals": true } },
    { "property": "年級", "select": { "equals": grade } },
    { "property": "開始時間", "date": { "on_or_before": now.toISOString() } },
    { "property": "結束時間", "date": { "on_or_after": now.toISOString() } }
  ]
}
```

### PDF URL 提取

使用現有 `notion.ts` adapter 的 `extractFileUrls()` 方法。若某筆資料 PDF 欄位為空，略過不回傳該筆。

### Development Fallback

```typescript
if (c.env.ENVIRONMENT === 'development') {
  // 題庫：讀取 data/practice/en/grade1-2.json 等靜態 JSON
  // 考前複習 fallback：回傳 active: false
}
```

---

## 七、前端整合規格（practice.js 更新）

### 7-1 歷屆題庫（頁面內嵌查詢）

```javascript
let currentPage = 1
let totalLoaded = 0
const LIMIT_PER_PAGE = 12
const MAX_QUESTIONS = 36

async function loadQuestions(isLoadMore = false) {
  const params = buildFilterParams()  // 從 UI 讀取 grade/subject/type
  params.page = isLoadMore ? currentPage + 1 : 1
  params.limit = LIMIT_PER_PAGE

  const res = await fetch('/api/v1/practice?' + new URLSearchParams(params))
  const json = await res.json()

  if (!json.ok) return showError()

  if (!isLoadMore) {
    clearQuestions()
    totalLoaded = 0
    currentPage = 1
  }

  renderQuestions(json.data.questions)
  totalLoaded += json.data.questions.length
  currentPage = json.data.page
  updateLastUpdated(json.data.lastUpdated)

  if (!json.data.hasMore || totalLoaded >= MAX_QUESTIONS) {
    hideLoadMoreButton()
    if (totalLoaded >= MAX_QUESTIONS) {
      showArchiveCTA()  // 顯示「找 Mina 小幫手」按鈕
    }
  } else {
    showLoadMoreButton()
  }
}
```

**「找 Mina 小幫手」按鈕行為：**

```javascript
document.getElementById('open-archive-btn').addEventListener('click', () => {
  if (window.minaWidget) {
    window.minaWidget.openToNode('archive_welcome')
  }
})
```

### 7-2 考前複習（頁面啟動時初始化，年級選後查詢）

```javascript
// 頁面載入：顯示考前複習入口，尚不查詢 API
// 使用者點「考前複習」→ 顯示年級選擇（小一~小六）
// 使用者選年級 → 呼叫 API（帶入 grade）→ 依 active 判斷顯示

async function loadExamReview(grade) {
  const res = await fetch(`/api/v1/practice/exam-review?grade=${grade}`)
  const json = await res.json()

  if (!json.ok) return showExamError()

  if (!json.data.active) {
    // 時間外：顯示幽默說明訊息
    showExamInactiveMessage()
    return
  }

  // 有效期間：顯示科目按鈕列表
  renderExamSubjects(json.data.items)
}

function showExamInactiveMessage() {
  // 顯示文字：
  // 「現在還不是考試季，先好好休息一下吧！😴
  //  考前複習卷會在段考前一週的週六中午開放，
  //  到時候再來找我喔～🌟」
  document.getElementById('exam-inactive-msg').style.display = 'block'
}

function renderExamSubjects(items) {
  // 依 items[].subject 動態產生科目按鈕
  // 點擊科目按鈕 → 直接觸發 PDF 下載（window.open(item.pdfUrl)）
}
```

> **科目按鈕為動態產生**，不可寫死科目清單。直接讀 API 回傳的 `items[].subject` 產生按鈕，未來老師在 Notion 新增任何科目，前端自動顯示。

---

## 八、Mina Widget 擴充：Archive 查詢流程

### 8-1 新增 `openToNode(nodeId)` 公開方法

```javascript
window.minaWidget = {
  open: () => { /* 開啟 widget */ },
  close: () => { /* 關閉 widget */ },
  openToNode: (nodeId) => {
    openWidget()
    resetSession()
    renderNode(nodeId)
  }
}
```

### 8-2 新增節點型別：`archive_fetch`

```javascript
async function renderNode_archiveFetch(node) {
  const { subject, grade, type } = state.archiveFilter || {}

  appendBubble('⌛ 幫你找找看，稍等一下喔…', 'mina')

  const params = new URLSearchParams({ page: state.archivePage || 1, limit: 12 })
  if (subject) params.set('subject', subject)
  if (grade) params.set('grade', grade)
  if (type) params.set('type', type)

  const res = await fetch('/api/v1/practice/archive?' + params)
  const json = await res.json()

  removeLoadingBubble()

  if (!json.ok || !json.data.questions.length) {
    renderNode('archive_not_found')
    return
  }

  renderArchiveQuestionCards(json.data.questions)
  state.archiveTotalLoaded = (state.archiveTotalLoaded || 0) + json.data.questions.length
  state.archivePage = json.data.page

  if (json.data.hasMore && !json.data.reachedLimit && state.archiveTotalLoaded < 36) {
    appendLoadMoreButton(() => {
      state.archivePage++
      renderNode_archiveFetch(node)
    })
  } else {
    renderNode('archive_limit_reached')
  }
}
```

**題目卡片 HTML（widget 內部渲染）：**

```html
<div class="mina-q-card">
  <div class="mina-q-header">
    <span class="mina-q-number">Q{n}</span>
    <span class="mina-q-title">{question}</span>
  </div>
  <div class="mina-q-options">
    <span>A. {options[0]}</span>
    <span>B. {options[1]}</span>
    <span>C. {options[2]}</span>
    <span>D. {options[3]}</span>
  </div>
  <button class="mina-q-toggle" aria-expanded="false">查看解析 ▾</button>
  <div class="mina-q-explanation" hidden>
    <div class="mina-exp concept">
      <span class="exp-label">✓ 正確觀念</span>
      <p>{explanation.concept}</p>
    </div>
    <div class="mina-exp mistake">
      <span class="exp-label">✗ 常見錯誤</span>
      <p>{explanation.commonMistake}</p>
    </div>
    <div class="mina-exp tip">
      <span class="exp-label">★ 記憶提示</span>
      <p>{explanation.memoryTip}</p>
    </div>
  </div>
</div>
```

### 8-3 `mina-advisor-tree.json` 新增 Archive 節點

**`flows` 新增：**

```json
"quiz_archive": "archive_welcome"
```

**`nodes` 新增：**

```json
"archive_welcome": {
  "id": "archive_welcome",
  "type": "options",
  "text": "我來幫你找找舊題庫 📚\n想找哪個科目的題目？",
  "options": [
    { "label": "📖 英文", "next": "archive_grade_en", "setFilter": { "key": "subject", "value": "英文" } },
    { "label": "🔢 數學", "next": "archive_grade_ma", "setFilter": { "key": "subject", "value": "數學" } }
  ]
},

"archive_grade_en": {
  "id": "archive_grade_en",
  "type": "options",
  "text": "哪個年級的英文題庫？",
  "options": [
    { "label": "小一", "next": "archive_type", "setFilter": { "key": "grade", "value": "小一" } },
    { "label": "小二", "next": "archive_type", "setFilter": { "key": "grade", "value": "小二" } },
    { "label": "小三", "next": "archive_type", "setFilter": { "key": "grade", "value": "小三" } },
    { "label": "小四", "next": "archive_type", "setFilter": { "key": "grade", "value": "小四" } },
    { "label": "小五", "next": "archive_type", "setFilter": { "key": "grade", "value": "小五" } },
    { "label": "小六", "next": "archive_type", "setFilter": { "key": "grade", "value": "小六" } }
  ]
},

"archive_grade_ma": {
  "id": "archive_grade_ma",
  "type": "options",
  "text": "哪個年級的數學題庫？",
  "options": [
    { "label": "小一", "next": "archive_type", "setFilter": { "key": "grade", "value": "小一" } },
    { "label": "小二", "next": "archive_type", "setFilter": { "key": "grade", "value": "小二" } },
    { "label": "小三", "next": "archive_type", "setFilter": { "key": "grade", "value": "小三" } },
    { "label": "小四", "next": "archive_type", "setFilter": { "key": "grade", "value": "小四" } },
    { "label": "小五", "next": "archive_type", "setFilter": { "key": "grade", "value": "小五" } },
    { "label": "小六", "next": "archive_type", "setFilter": { "key": "grade", "value": "小六" } }
  ]
},

"archive_type": {
  "id": "archive_type",
  "type": "options",
  "text": "想練哪種題型？",
  "options": [
    { "label": "📝 標準題型", "next": "archive_fetch", "setFilter": { "key": "type", "value": "標準題型" } },
    { "label": "💡 觀念拆解", "next": "archive_fetch", "setFilter": { "key": "type", "value": "觀念拆解" } },
    { "label": "🔍 錯題診斷", "next": "archive_fetch", "setFilter": { "key": "type", "value": "錯題診斷" } }
  ]
},

"archive_fetch": {
  "id": "archive_fetch",
  "type": "archive_fetch",
  "text": ""
},

"archive_not_found": {
  "id": "archive_not_found",
  "type": "answer",
  "text": "😅 翻遍了三個月前的庫存，這個組合還沒有題目耶～\n換個條件試試？或是告訴老師你想練什麼，我們幫你備料！",
  "options": [
    { "label": "換個條件再找", "next": "archive_welcome" }
  ],
  "cta": ["trial", "line", "phone"]
},

"archive_limit_reached": {
  "id": "archive_limit_reached",
  "type": "answer",
  "text": "我已傾盡畢生所學，36 題全數奉上！🫡\n剩下的精華……只有最熱血的 Mina 小幫手才能解鎖 🔥\n來試聽一堂課，讓老師直接針對你的弱點開寶箱吧！",
  "cta": ["trial", "line", "phone"]
}
```

### 8-4 `setFilter` 機制：widget.js 狀態處理

```javascript
function handleOptionClick(option) {
  if (option.setFilter) {
    state.archiveFilter = state.archiveFilter || {}
    state.archiveFilter[option.setFilter.key] = option.setFilter.value
  }

  // 重新開始時清除累積的 filter 和分頁狀態
  if (option.next === 'archive_welcome') {
    state.archiveFilter = {}
    state.archivePage = 1
    state.archiveTotalLoaded = 0
  }

  renderNode(option.next)
}
```

---

## 九、不實作項目（V2 範圍，明確排除）

以下功能**不得在本次實作中出現**，不得建立任何相關檔案或路由：

| 功能 | 說明 |
|---|---|
| AI 出題流程（n8n + OpenRouter） | V2 |
| 每月自動出題排程（Cron Trigger） | V2 |
| 老師審核通知（Email / LINE Messaging API） | V2 |
| 教材版本上傳管理介面 | V2 |
| 學校行事曆 DB 程式整合 | V2 |
| 考前複習 PDF 上傳後台 | V2（V1 直接在 Notion DB 上傳） |

---

## 十、實作順序

嚴格依序執行，每 Step 完成後 commit + push：

```
Step 0: 執行現況確認（第零步），輸出結果後繼續
Step 1: 更新 workers/src/index.ts Bindings
Step 2: 更新 .env.example
Step 3: 實作 workers/src/routes/practice.ts（三個 routes）
Step 4: 更新 workers/wrangler.toml（secrets 備註）
Step 5: 更新 data/practice/ 所有 JSON（explanation 拆三欄，grade 改個別年級）
Step 6: 更新 practice.js（歷屆題庫 + 考前複習 API 整合）
Step 7: 更新 mina-widget.js（openToNode + archive_fetch + setFilter）
Step 8: 更新 mina-advisor-tree.json（新增 archive 節點群）
Step 9: 更新 mina-widget.css（archive question card 樣式）
Step 10: 驗證（wrangler dev 測試三個 API，widget archive 流程完整走一遍）
```

**commit 格式：**

```bash
# Step 1
git add workers/src/index.ts
git commit -m "feat(workers): add NOTION_PRACTICE_DB_ID and NOTION_EXAM_REVIEW_DB_ID bindings"
git push origin dev

# Step 3
git add workers/src/routes/practice.ts
git commit -m "feat(workers): implement /api/v1/practice, /archive, /exam-review with Notion"
git push origin dev

# Step 6
git add frontend/practice.js
git commit -m "feat(frontend): integrate practice and exam-review APIs in practice.js"
git push origin dev

# Step 7-9
git add frontend/components/mina-widget.js frontend/components/mina-widget.css data/mina/mina-advisor-tree.json
git commit -m "feat(widget): add archive query flow, openToNode, question card rendering"
git push origin dev
```

---

## 十一、驗證清單（實作完成後逐一確認）

```
□ GET /api/v1/practice 回傳格式正確（含 lastUpdated）
□ GET /api/v1/practice?grade=小三&subject=英文 篩選正確
□ GET /api/v1/practice/archive page=3 → reachedLimit: true
□ GET /api/v1/practice/archive page=4 → 400 LIMIT_REACHED
□ GET /api/v1/practice/exam-review?grade=小三（有效期間）→ active: true，回傳科目 PDF 清單
□ GET /api/v1/practice/exam-review?grade=小三（時間外）→ active: false
□ ENVIRONMENT=development 時 API 使用靜態 JSON fallback
□ 考前複習卡片：點擊→選年級→選科目→PDF 下載
□ 考前複習 active=false：顯示幽默說明訊息，不顯示科目按鈕
□ 科目按鈕為動態產生（未硬編碼科目名稱）
□ 歷屆題庫：累積 36 題後顯示「找 Mina 小幫手」按鈕
□ 點擊按鈕：widget 開啟並停在 archive_welcome 節點
□ archive 流程完整走通：科目→年級→題型→API→題目卡片顯示
□ 題目卡片「查看解析」可展開/收起
□ archive 達 36 題：顯示幽默訊息 + 三個 CTA
□ archive 無結果：顯示幽默說明 + 換條件按鈕
□ mina-advisor-tree.json JSON.parse 不報錯
```

---

*Mina 題庫系統補充規格 V1.1*  
*對應 CLAUDE.md V1.1*  
*2026-06 — 資料源改為 Notion、三個 API 完整規格、archive 查詢流程、考前複習學年制、幽默文案*
