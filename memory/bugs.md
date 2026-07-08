# Bugs & Security Fixes

## 2026-06-17 — Secrets in Git History

**問題：** Notion API key (`ntn_496417...`) 和 LINE Channel Access Token 透過「redact commit」方式移除，但舊 commit 的父節點中仍保留明文。

**根本原因：** 只加一個新 commit 移除 secret，不會改寫 git history。父 commit 永遠包含原始內容。

**解法：** 用 `git filter-repo --replace-text` 改寫全部歷史，再 force push。

**如何避免：**
- 絕對不在程式碼中 hardcode secret
- `.env` 永不進 git（已在 .gitignore）
- Scripts 中的 Notion API key 改用 `process.env.NOTION_API_KEY`（不設 fallback 預設值）
- `git filter-repo` 才是真正的 scrub 工具，`redact commit` 只是視覺上的假修正

**已執行：**
1. `git filter-repo --replace-text` 清除兩個 secrets
2. Force push dev branch
3. git gc --prune=now 清除 loose objects
4. 清除所有 stashes

**仍需手動完成（AI 無法代做）：**
- Notion: Settings → Integrations → Revoke → 重新產生 token → `wrangler secret put NOTION_API_KEY`
- LINE: Developers Console → Messaging API → Reissue channel access token → 更新 n8n credentials

---

## 2026-06-17 — javascript: href XSS in blocksToHtml

**問題：** `notion.ts` richTextToHtml 直接插入 `rt.href` 未過濾協定，`javascript:` URL 可在 `contentEl.innerHTML` 執行。

**解法：** 加上 `/^https?:\/\//i.test()` 過濾，非 http/https 一律換成 `#`。

**已修正：** `workers/src/adapters/notion.ts:107`

---

## 2026-07-08 — 「小小廚神」文章內文與影片不顯示

**問題：** 文章 `2026-summer-camp-scallion-pancake` 的內文與影片都沒顯示。

**根本原因（用 production API 直接查證，不是猜測）：**
1. 影片被上傳到 Notion「活動照片」欄位（該欄位設計給圖片用）。後端 `getPropFiles()` 不分檔案類型全部塞進 `article.photos`，前端 carousel 一律用 `<img>` 渲染，`.mp4` 塞進 `<img src>` 自然無法顯示。
2. 文章正文（Notion page body blocks）是空的——文字寫在「內容摘要」屬性（只用於列表卡片摘要 / SEO description），沒有寫進頁面內文區塊，所以 `article.content` 長度為 0。
3. 附帶問題：就算文字寫在頁面內文區塊、影片用 Notion 原生「影片區塊」插入，後端 `blockToHtml()` 也會直接丟棄 `case 'video': return ''`，完全不支援頁面內影片區塊。

**解法：**
- `workers/src/adapters/notion.ts`：`blockToHtml()` 新增 `case 'video'`，輸出 `<video controls>`，不再丟棄。
- `frontend/news.js`：新增 `isVideoUrl()`，carousel 依副檔名判斷改用 `<video controls>` 渲染影片項目；`renderArticle()` 內文為空時 fallback 顯示 `article.excerpt`（避免整段空白）。
- `frontend/styles.css`：`.carousel-slide video` 補上與 `img` 相同的尺寸樣式。

**如何避免（給未來寫文章的人）：**
- 影片、圖片內文請直接寫在 Notion 頁面「內文」區塊裡（用 Notion 原生影片/圖片區塊插入），不要只寫在「內容摘要」屬性——那個欄位只用於列表卡片摘要與 SEO description，不會顯示在文章內頁。
- 「活動照片」屬性只放圖片檔案；影片請用頁面內文的影片區塊插入。
