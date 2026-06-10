# Mina 小幫手 Widget 實作指令

## 任務說明

實作 Mina 小幫手互動招生顧問 Widget。
資料來源：`data/mina/mina-advisor-tree.json`（唯一資料來源）
輸出目標：`frontend/components/mina-widget.js` + 各頁面整合

---

## 核心規則（不可違反）

| Rule | 說明 |
|------|------|
| 1 | 全部按鈕選擇，**不接受自由文字輸入** |
| 2 | 最多 **4 輪**到達結果頁 |
| 3 | 每輪最多 **6 個選項** |
| 4 | 每頁使用不同 **entry node**（依 `flows` 欄位） |
| 5 | 所有結果頁固定三出口：試聽 / LINE / 電話 |
| 6 | `quiz_result` 節點須觸發題庫篩選（見下方） |
| 7 | JSON 是唯一資料來源，改對話 = 改 JSON，不改程式碼 |

---

## JSON 結構說明

```
mina-advisor-tree.json
├── meta          → 版本、規則
├── global
│   ├── cta       → 全站共用 CTA 按鈕定義（trial/line/phone/map）
│   └── articles  → 課程文章連結（english/math/afterschool/camp）
├── flows         → 頁面 → 入口 nodeId 對照表
└── nodes         → 所有節點（flat object，key = nodeId）
```

### Node 型別

| type | 說明 | 渲染方式 |
|------|------|----------|
| `options` | 問題 + 選項 | Mina 泡泡 + 選項按鈕列 |
| `answer` | 最終回答 | Mina 泡泡 + CTA 按鈕 + 文章連結 |
| `quiz_result` | 題庫篩選結果 | Mina 泡泡 + 篩選動作 + 選項按鈕 |

### Node 欄位

```json
{
  "id": "node_id",
  "type": "options | answer | quiz_result",
  "text": "Mina 說的話（\n 為換行）",
  "options": [                    // options / quiz_result 必有
    { "label": "按鈕文字", "next": "下一個 nodeId" }
  ],
  "cta": ["trial", "line", "phone"],   // answer 必有（參照 global.cta）
  "articles": ["english", "math"],     // 可選，文章連結
  "filter": { "subject": "en", "grade": "elementary_3_4" }  // quiz_result 專用
}
```

---

## 各頁面整合方式

根據當前頁面 URL 決定起始節點：

```javascript
const FLOW_MAP = {
  '/':            'homepage',
  '/index':       'homepage',
  '/course':      'course',
  '/about':       'about',
  '/news':        'news',
  '/news-single': 'news',   // 單篇文章也用 news flow
  '/faq':         'faq',
  '/quiz':        'quiz',
  '/reservation': 'homepage'
};

function getFlowByUrl() {
  const path = window.location.pathname;
  for (const [pattern, flow] of Object.entries(FLOW_MAP)) {
    if (path.includes(pattern)) return flow;
  }
  return 'homepage';
}

const startNodeId = tree.flows[getFlowByUrl()];
```

---

## Widget UI 規格

### 外觀
- 聊天泡泡形式（對話介面）
- 右下角 floating widget（手機/桌面通用）
- 寬度：手機全寬，桌面 360px
- 品牌色：`#E60D85`（Mina 頭像、header、bubble 背景）
- 動畫：泡泡 fade-up（輕柔，0.25s）

### 狀態管理（純前端）

```javascript
const state = {
  currentNodeId: null,
  history: [],           // 走過的 nodeId array（用於 debug）
  depth: 0,              // 當前深度（最多 4）
  sessionId: generateUUID()  // 存 sessionStorage
};
```

### 渲染流程

```
renderNode(nodeId)
  → 讀取 nodes[nodeId]
  → 新增 Mina 泡泡（text）
  → 依 type 渲染互動區：
      options    → 選項按鈕列（點擊後記錄選擇、renderNode(next)）
      answer     → CTA 按鈕 + 文章連結
      quiz_result→ 觸發題庫篩選 + 選項按鈕（換年級/換科目/找不到）
```

---

## quiz_result 節點特殊處理

當 `node.type === 'quiz_result'` 時：

1. 從 `node.filter` 取得 `{ subject, grade }`
2. 呼叫題庫篩選函式：

```javascript
function filterQuizCards(subject, grade) {
  // subject: "en" | "ma"
  // grade: "elementary_1_2" | "elementary_3_4" | "elementary_5_6"
  
  // 對應到現有題庫資料的 subject / grade 欄位
  // 觸發 UI 更新：顯示符合條件的題卡
  
  const cards = allCards.filter(c =>
    c.subject === subject && c.grade === grade
  );
  renderQuizCards(cards);
}
```

3. Mina 泡泡顯示確認文字
4. 再顯示「換年級 / 換科目 / 找不到我要的」選項

---

## CTA 按鈕渲染規則

依 `global.cta` 定義渲染，型別對應 class：

```javascript
const CTA_CLASSES = {
  trial: 'cta-primary',   // 粉紅底白字
  line:  'cta-line',      // 綠色底
  phone: 'cta-secondary', // 白底黑字外框
  map:   'cta-map'        // 白底藍字外框
};
```

LINE 按鈕特殊說明文字（在按鈕下方小字）：
> 平日 13:30–19:30 回覆較快，其他時間稍慢

---

## 文章連結渲染

出現在 `node.articles` 時，於 CTA 區下方新增：

```html
<div class="mina-articles">
  <span class="articles-label">相關課程介紹</span>
  <a href="/news-single?slug=hsuwei-english-education-concept">📖 了解徐薇英文</a>
  ...
</div>
```

---

## 重新開始機制

Widget 底部固定顯示「↺ 重新開始」按鈕：
- 點擊後清空對話、深度歸零
- 回到當前頁面對應的起始節點
- **不清除 sessionId**

---

## 未來 LINE URL 處理

JSON 中 `global.cta.line.url` 目前為 `"#LINE_URL"`。
上線前搜尋替換即可，**不需改程式碼**：

```bash
sed -i 's|#LINE_URL|https://line.me/R/ti/p/...|g' data/mina/mina-advisor-tree.json
```

---

## 檔案位置

| 檔案 | 說明 |
|------|------|
| `data/mina/mina-advisor-tree.json` | 對話樹資料（唯一編輯點） |
| `frontend/components/mina-widget.js` | Widget 主程式 |
| `frontend/components/mina-widget.css` | Widget 樣式 |

各頁面在 `</body>` 前加入：

```html
<link rel="stylesheet" href="/components/mina-widget.css">
<script src="/components/mina-widget.js"></script>
```

Widget 自動偵測當前頁面 URL 決定使用哪個入口節點。
