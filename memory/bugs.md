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

**後續（同日）：改放頁面內文區塊後影片仍無法播放，影響文章：**
`2026-summer-camp-scallion-pancake`、`2026-childrens-day-happy-learning`、`2026-bug-awakening-super-sentai-part1`、`2026-bug-awakening-super-sentai-part2`

**真正根本原因：** `frontend/_headers` 的 CSP 沒有設定 `media-src`，瀏覽器會 fallback 用 `default-src 'self'`，導致所有跨網域（Notion 的 S3 檔案網址 `prod-files-secure.s3.us-west-2.amazonaws.com`）的 `<video>` 一律被瀏覽器靜默擋下（不會顯示任何錯誤訊息，只是播不出來）。`img-src` 當初有明確開 `https:`，所以圖片一直沒事，但沒人幫 `media-src` 開一樣的權限。直接 curl 該簽名網址回應 200 + `video/mp4`，證實檔案本身沒壞，純粹是 CSP 擋下。

**解法：** `frontend/_headers` CSP 新增 `media-src 'self' https:;`（比照 `img-src` 的作法）。

---

## 2026-07-12 — 桌面安裝版 PWA 打開最新消息內頁「整個網站解崩」（無樣式、巨大黑色對話框圖示）

**問題：** manko 反映之前把網站「安裝到桌面」的那個捷徑，打開任一篇最新消息內頁時整頁沒有任何 CSS 樣式，畫面上出現一顆巨大無樣式的黑色對話框圖示（其實是 Mina 小幫手聊天元件，本來該是右下角一顆小圓鈕）。重新安裝後問題消失。

**調查方式：** 用 `/browse` 對正式環境 `minaedu.tw` 實測 4 種情境（桌面版直接開文章、手機版點卡片進去、手機版直接開文章、含影片的文章），皆無法重現；console 無錯誤、network 無失敗請求、畫面截圖正常。改追資料流：所有頁面裡只有 `news-single.html` 有 `<base href="/">`，其餘 7 個頁面（about/booking/courses/faq/index/news/practice）都沒有，但因為它們都只服務單層路徑（`/faq`、`/courses` 等），相對路徑不受影響，不是漏改。

**最可能的根本原因（無法 100% 證實，見下）：** `<base href="/">` 是 `ffb51af`（2026-07-04 16:36）才加進 `news-single.html` 的，比「乾淨網址」`/news/:slug` 功能上線（`69af49a`，同日 16:20）晚了 16 分鐘——這 16 分鐘的視窗內，`/news/:slug` 頁面裡 `href="styles.css"` 這種相對路徑會被瀏覽器誤判成 `/news/styles.css`（相對於目前網址的資料夾，不是網站根目錄），404 後整頁樣式全部套用失敗，就是使用者看到的畫面。

**沒辦法完全鎖死的部分：** manko 是 2026-07-12 才反映，離那 16 分鐘視窗已經一週多。正式環境目前這個頁面的 `cache-control` 是 `public, max-age=0, must-revalidate`（已用真實 curl 驗證），理論上每次都會重新跟伺服器確認，不應該卡在一週前的舊內容。**最可能的解釋是「安裝到桌面」的 PWA 視窗有自己的分頁還原機制，會直接從記憶體秀出上次渲染好的畫面、完全跳過網路請求**——這不是這個 repo 的程式碼能控制的行為，是瀏覽器/作業系統層級的 session restore，Cache-Control header 對此無效（因為根本沒有發出網路請求）。已用真實 header 驗證排除「Cloudflare edge 快取到舊版」這個可能性（`cf-cache-status: DYNAMIC`，沒有做邊緣快取）。

**目前狀態：** 現在全新安裝或重新整理都會拿到已修正的版本（`ffb51af` 已經在正式環境生效超過一週），manko 重裝後問題消失也印證了這點。**沒有程式碼可以修**——真正能解決「已安裝的舊 PWA 視窗可能永遠卡在舊畫面」這個殘留風險的作法是加一個會偵測新版本、提示使用者重新整理的 Service Worker，這是新功能不是 bug 修正，範圍較大，本次未做。

**結構性風險（給下次遇到同類問題的人）：** `news-single.html` 這半個月被改了又撤（`0b50db0`）又重做（`69af49a`）又修（`ffb51af`）又改 canonical（`e0c4f7f`）又改連結格式（`1b78065`），是這個 repo 目前變動最頻繁的檔案。**「乾淨網址」`/news/:slug` 實際的轉址/rewrite 規則設定在 Cloudflare 儀表板（Transform Rules），不在這個 repo 裡**（見 `69af49a` commit message「搭配 Cloudflare rewrite」）——之後這一區塊再出問題，光看 repo 程式碼查不到完整真相，記得同時去 Cloudflare 儀表板核對 rewrite 規則本身有沒有跟著變。

**如何避免同類 bug：** 任何頁面如果之後要改成「巢狀路徑」（例如 `/courses/:id`），第一步就要先加 `<base href="/">`，不要等上線後才補——`news-single.html` 這次的 16 分鐘破窗證明這個坑一碰就會踩到，其他 7 個頁面目前都還是單層路徑所以沒事，但只要哪天有人幫其中一個加上巢狀網址（常見於 SEO 改版），同一個坑會馬上重演。

**如何避免：** 之後如果 CSP 要新增可外部載入的資源類型（字型、影片、iframe...），要記得同時確認對應的 `*-src` 指令有開，不能只靠 `default-src` 兜底——沒明確設定的資源類型全部會退回 `default-src 'self'`，跨網域資源會被靜默擋下且不易察覺。

---

## 2026-08-28 — GSC「已找到但未建立索引」28 篇 3 週未動；查到 courses.html 4 個連結死路

**症狀：** Manko 回報 Google Search Console 網頁索引狀態卡住（已建立索引 14 / 未建立索引 28），已用「網址審查」逐一提交 news 文章網址近三週，數字沒增加。「涵蓋範圍」原因分類：已找到-未建立索引 23、頁面會重新導向 3、找不到網頁(404) 1、已檢索-未建立索引 1。

**技術面查證（排除的可能性）：** 實測 `/news/{slug}` 真實回應——SSR 正常（`x-mina-render: ssr`）、`<title>`／canonical／JSON-LD 皆正確；`robots.txt` 沒有誤擋 `/news/*`；`sitemap.xml` 產出正常、35+ 篇文章網址皆在內；沒有誤加的 `noindex`。這條 SSR 管線本身沒有問題。

**找到的真實 bug：** `frontend/courses.html` 有 4 個「最新消息」相關連結寫成舊格式 `href="news-single.html?slug=..."`（見 `65b1e...`/`1d528d5` 前的版本）——`.html` 副檔名先觸發 Cloudflare Pages 308 轉址，轉址落點 `/news-single?slug=...` 又剛好是 `robots.txt` 明確 `Disallow` 的路徑，等於從 `courses.html`（重要頁面）連過去的內部連結全部死路。同時 `news.js` 的 BreadcrumbList JSON-LD 也殘留一個 `https://minaedu.tw/news.html`（同一個 `.html` 根因，結構化資料裡的無效網址）。判斷這是 GSC「頁面會重新導向」3 筆的來源之一，也拉低這幾篇文章從內部連結拿到的權重信號。

**修法：** `courses.html` 4 個連結改成正確的 `/news/{slug}`；`news.js` BreadcrumbList 的 `/news.html` 改成 `/news`；`news.js?v=` 快取版號同步 bump（20260810→20260828）。已 push `dev`、Cloudflare Pages 自動部署、`curl` 實測 `courses.html` 產出的連結已正確。

**沒辦法排除、判斷是主因的部分：** 「已找到-未建立索引」23 篇 3 週沒有變化，這是 Google 官方文件裡明確定義的「Google 知道網址存在（多半來自 sitemap），但選擇不優先爬取／收錄」的狀態，不是可以用程式碼直接修的技術錯誤。網站 2026-06-03 才開站（本次查證日 08-28，約 12 週），加上這批「最新消息」文章屬同樣版型的活動花絮日記（相似度高、差異化低），研判是 Google 對年輕網域＋內容差異化不足的正常保守收錄行為，不是 bug。

**相關決策：** 無

**狀態：** `courses.html` 死路連結已修復並驗證；GSC 收錄緩慢本身無法靠這次修法直接解決，屬於需要時間 + 內容差異化 + 外部連結累積的漸進過程，建議列入下方追蹤觀察，不是待修 bug。
