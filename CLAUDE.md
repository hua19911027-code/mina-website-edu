# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

全域規則見 `~/.claude/CLAUDE.md`,本檔案只放本專案特有內容。

## 專案

mina-website-edu — 卓越國際文理補習班官網
路徑:/home/manko94134/mina-website-edu/

## 技術堆疊

| 層 | 選擇 |
|---|---|
| 前端 | 純靜態 HTML/CSS/vanilla JS(無 build step),`frontend/` |
| 後端 | Cloudflare Workers + Hono,`workers/` |
| 資料來源 | Notion Database(bookings/news/FAQ/practice/calendar),非本 repo 儲存 |
| 部署 | frontend → Cloudflare Pages(`minaedu.tw`);workers → Cloudflare Workers(`api.minaedu.tw`) |

## Build / Test / Deploy

前端(`frontend/`):純靜態,無 build step。本地預覽直接開檔或用 Live Server。

後端(`workers/`,Cloudflare Workers + Hono):
```bash
cd workers && npm run dev           # wrangler dev,本地跑 API
cd workers && npm run type-check    # tsc --noEmit
cd workers && npm run deploy        # 部署 production(wrangler deploy --env "")
cd workers && npm run deploy:staging
```
根目錄捷徑:`npm run dev:workers` / `npm run type-check` / `npm run deploy:workers`(見根目錄 `package.json`)

無自動化測試(無 test script、無 CI)。

## Git 分支與部署(注意:兩個部署單位各自獨立,不同步)

- 開發分支:dev(不是 main)
- push 後 Cloudflare Pages 自動從 dev 的 `frontend/` 目錄重新部署(無 build step,整包當靜態內容)
- Workers **不會**隨 git push 自動部署,需手動:`cd workers && npx wrangler deploy`
- frontend 改了就自動上線;workers 改了要記得手動 deploy——兩者各自的 git 歷史、部署流程、版本都不同步
- commit message 類型:fix:(這個專案偏好,其餘依全域格式)

## Architecture

**前後端分離,兩個獨立部署單位**:`frontend/`(Cloudflare Pages,自訂網域 `minaedu.tw`)與 `workers/`(Cloudflare Workers,路由到 `api.minaedu.tw/*`,見 `workers/wrangler.toml`)。

**Notion 是資料來源,不是這個 repo**:預約(bookings)、新聞(news)、FAQ、題庫(practice)、行事曆(calendar)全部讀寫 Notion Database,透過 `workers/src/adapters/notion.ts` 這層轉換(`transformPage()` 之類的函式把 Notion page properties 轉成 `workers/src/types.ts` 定義的前端用型別)。`data/` 目錄下的 JSON(news/faq/practice)只是本地開發用的 fallback 樣本,不是正式資料。

**開發模式自動降級**:每支 route(如 `workers/src/routes/news.ts`)開頭都會判斷 `!c.env.NOTION_API_KEY || c.env.ENVIRONMENT !== 'production'`,true 就直接讀 `data/` 底下的樣本 JSON,不打 Notion API。改 route 邏輯時兩條路徑(production 走 Notion、非 production 走樣本檔)都要顧到,否則本地測試看到的行為會跟正式站不一致。

**KV 三層快取/設定/限流**,見 `workers/wrangler.toml` 的 `kv_namespaces`:`KV_CACHE`(news/practice API 回應快取,15~30 分鐘 TTL)、`KV_SETTINGS`(Admin 面板可調設定,如題庫審核模式開關)、`KV_RATE_LIMIT`(限流計數,不要用錯 binding,之前發生過限流邏輯誤寫進 `KV_SETTINGS` 的事故)。

**Admin API 走共用 header 驗證**:`workers/src/routes/admin.ts` 底下所有路由都檢查 `X-Admin-Secret` header 是否等於 `c.env.ADMIN_SECRET`,新增 admin 路由要照抄這個 pattern。

**題庫內容由外部 n8n workflow 產生,不是這個 repo 的程式碼在寫**:`scripts/n8n-*.json` 是 n8n workflow 的備份存檔(非可執行程式碼),實際跑在另一台機器上的 n8n 服務,定期呼叫 AI 出題寫入 Notion,再由 `workers/src/routes/practice.ts` 讀出。改題庫邏輯前要先確認問題出在 Workers API 這層還是 n8n 那層生成的資料本身。

**前端 JS 有手動版號快取機制**:每支 `<script src="xxx.js?v=YYYYMMDD">` 都靠 query string 版號讓 Cloudflare edge cache 失效。改任何 `frontend/*.js` 內容後,必須同步把該頁面 `<script>` 標籤的 `?v=` 往前 bump,否則使用者端會持續執行舊版程式碼(4 小時 edge cache)。

**Cloudflare Pages 對 `.html` 結尾網址一律 308 重導向到無副檔名版本**(如 `/about.html` → `/about`),這是平台內建行為。所以 `frontend/*.html` 內部連結(nav/footer/breadcrumb)、`canonical` tag、`sitemap.xml` 一律用無副檔名網址,不要寫 `.html` 副檔名,否則會造成 SEO 重複網址/重新導向問題。

## 本專案特殊規則

- .env 永遠不進 Git;不要修改 .gitignore、不要修改 .env 實際值、不要修改正式環境設定
