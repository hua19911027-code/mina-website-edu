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
