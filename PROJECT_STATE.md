# PROJECT_STATE.md — Mina 網站專案

> 更早的歷史記錄見 `PROJECT_STATE-archive.md`；架構細節見 `CLAUDE.md`。

## 狀態（更新：2026-07-14）

已完成：
- GSC「頁面會重新導向」修復：canonical tag + sitemap.xml 改無副檔名網址（commit `1669dbc`）；全站 9 頁 203 處內部導覽連結（nav/footer/breadcrumb）同步改無副檔名（commit `7b43d41`）。根因是 Cloudflare Pages 對 `.html` 結尾網址一律 308 重導向，但 canonical/連結卻宣告 `.html` 版本，自我矛盾
- GSC 回報的另外 2 筆（`http://minaedu.tw/` HTTP→HTTPS、`api.minaedu.tw/` 404）確認是平台正常行為，非 bug，不需修正
- `/doctor` 環境健檢：關閉 3 個從未使用/近一個月未用的外掛（andrej-karpathy-skills、compound-engineering、vercel-plugin）與 1 個 MCP 連線（notebooklm-mcp）；清掉 `.claude/settings.local.json` 裡意外內嵌真實密鑰的 3 條規則（CF_TOKEN×2、GKEY，該檔案本來就沒進 git，未外流）
- `CLAUDE.md` 補上 Commands / Architecture 章節（`/init`），精簡跟全域規則重複的行為守則段落，順手修正過時錯誤資訊（誤寫「push 後 Vercel 自動部署」，已改對）

下一步：
- 到 Cloudflare / Google Cloud 主控台重新產生 CF_TOKEN、GKEY 這兩把金鑰（doctor 健檢時發現明碼內嵌在本地設定檔的規則字串裡，字串已清但金鑰本身沒失效）
- Bing Webmaster Tools 提交 sitemap（5 分鐘、零成本，一直沒排進去）

缺螺絲：
- CLS 0.197~0.216 舊案尚未證實根本解決（見 archive「2026-07-01」段），下次應查 Search Console Core Web Vitals 真實數據，不要只重跑 PageSpeed
- 116 學年度（明年）出版社設定一樣要手動改 n8n code 節點（`IpxBWR3Nbg2z798v`），Admin Panel 出版社上傳功能目前是斷頭路
- gstack 技能框架 vendored 安裝造成技能清單膨脹（node_modules 文件被當技能列出），doctor 健檢發現但無法直接修，需透過 gstack 自己的 vendoring 遷移流程處理
