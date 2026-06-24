# Performance Final Optimization 指令
**目標**：Desktop 95+、Mobile 85+
**原則**：只動效能，不動 UI、版面、動畫、品牌、文案、SEO 內容、功能

> 全程繁體中文回覆。逐 Phase 完成，每 Phase commit 一次。全部完成後 git push origin dev。
> 遇到無法確定的判斷，記錄在最後報告中，不要停下來詢問。

---

## 前置確認

```bash
cd ~/mina-website-edu/frontend

echo "=== 確認主要 HTML 和 JS 清單 ==="
ls *.html *.js components/*.js components/*.css

echo "=== 確認 styles.css 大小 ==="
wc -c styles.css components/mina-widget.css

echo "=== 確認 _headers 是否存在 ==="
ls _headers 2>/dev/null || echo "不存在"

echo "=== 確認 practice.js 的 API fetch 呼叫 ==="
grep -n "fetch\|mina-api\|/api/v1/practice" practice.js | head -10

echo "=== 確認 site.js 的 API fetch 呼叫 ==="
grep -n "fetch\|mina-api\|/api/v1/practice" site.js | head -10
```

---

## Phase P1 — Google Fonts 改 Async 非阻塞載入（最高優先）

**問題**：目前 `rel="stylesheet"` 讓 Google Fonts CSS（131KB）直接阻塞 render 1,620ms（mobile）。
**修法**：改用 preload + onload 模式，字型非同步載入，render 立即開始。

```bash
cd ~/mina-website-edu/frontend
python3 << 'PYEOF'
import os, glob

# 需要處理的所有 HTML 檔案
html_files = glob.glob('*.html')

FONT_URL = "https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Noto+Sans+TC:wght@400;500;700;900&display=swap"

OLD_LINK = f'<link href="{FONT_URL}" rel="stylesheet"/>'
OLD_LINK_ALT = f'<link rel="stylesheet" href="{FONT_URL}"/>'

NEW_FONT_HTML = f'''<link rel="preload" href="{FONT_URL}" as="style" onload="this.onload=null;this.rel=\'stylesheet\'"/>
<noscript><link rel="stylesheet" href="{FONT_URL}"/></noscript>'''

for fname in html_files:
    with open(fname, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    content = content.replace(OLD_LINK, NEW_FONT_HTML)
    content = content.replace(OLD_LINK_ALT, NEW_FONT_HTML)
    
    if content != original:
        with open(fname, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'✓ {fname}: Google Fonts 改為 async 載入')
    else:
        # 試找變體格式
        import re
        if re.search(r'fonts\.googleapis\.com.*rel=["\']stylesheet["\']', content) or \
           re.search(r'rel=["\']stylesheet["\'].*fonts\.googleapis\.com', content):
            print(f'⚠ {fname}: 找到 fonts link 但格式不符，需手動確認')
        else:
            print(f'ℹ {fname}: 無 Google Fonts link，略過')

print('\n✓ Phase P1 完成')
PYEOF
```

**驗證**：
```bash
grep -l "fonts.googleapis.com" frontend/*.html | head -5
grep -n "preload.*fonts.googleapis\|fonts.googleapis.*preload" frontend/index.html
```

---

## Phase P2 — CSS 改非阻塞 + 補 fetchpriority

**問題**：`mina-widget.css`（450ms）和 `styles.css`（300ms）都在阻塞 render。
**修法**：
1. `styles.css`：改 preload 非同步
2. `mina-widget.css`：移到 `<body>` 底部（widget 是頁面底部元件，不是首屏必要）
3. Hero logo 補 `fetchpriority="high"`

```bash
cd ~/mina-website-edu/frontend
python3 << 'PYEOF'
import os, glob, re

html_files = glob.glob('*.html')

for fname in html_files:
    with open(fname, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content

    # ── 1. styles.css 改 preload 非同步載入（保留 noscript fallback）
    OLD_STYLES = '<link rel="stylesheet" href="styles.css"/>'
    NEW_STYLES = '''<link rel="preload" href="styles.css" as="style" onload="this.onload=null;this.rel='stylesheet'"/>
<noscript><link rel="stylesheet" href="styles.css"/></noscript>'''
    content = content.replace(OLD_STYLES, NEW_STYLES)
    
    # 也處理另一種寫法
    OLD_STYLES2 = '<link rel="stylesheet" href="styles.css">'
    content = content.replace(OLD_STYLES2, NEW_STYLES)

    # ── 2. mina-widget.css 從 <head> 移除，改在 </body> 前 inline link
    # 先移除 head 裡的 mina-widget.css link
    content = re.sub(
        r'\s*<link[^>]*href=["\']components/mina-widget\.css["\'][^>]*/?>',
        '', content
    )
    # 在 mina-widget.js 的 <script> tag 之前加入 mina-widget.css link
    content = content.replace(
        '<script src="components/mina-widget.js"></script>',
        '<link rel="stylesheet" href="components/mina-widget.css"/>\n<script src="components/mina-widget.js"></script>'
    )

    # ── 3. Hero logo 補 fetchpriority（僅限有 hero-logo class 的 img）
    content = re.sub(
        r'(<img\s+class="hero-logo"[^>]*)(/>|>)',
        lambda m: m.group(0) if 'fetchpriority' in m.group(0) else m.group(1) + ' fetchpriority="high"' + m.group(2),
        content
    )

    if content != original:
        with open(fname, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'✓ {fname}: CSS 非阻塞 + fetchpriority 完成')
    else:
        print(f'ℹ {fname}: 無需修改')

print('\n✓ Phase P2 完成')
PYEOF
```

---

## Phase P3 — Practice API 移出 Critical Chain

**問題**：首頁載入時 practice API（741ms/mobile 上是 1,154ms）在關鍵路徑上，導致 LCP 延遲。
**修法**：找到 practice.js 或 site.js 中的 API fetch，包裝進 `requestIdleCallback` 或 `setTimeout(fn, 200)`。

```bash
cd ~/mina-website-edu/frontend

# 先確認實際的 fetch 在哪個檔案、哪一行
echo "=== practice.js fetch 位置 ==="
grep -n "fetch\|/api/v1\|mina-api" practice.js | head -20

echo ""
echo "=== site.js fetch 位置 ==="
grep -n "fetch\|/api/v1\|mina-api" site.js | head -20
```

根據上面輸出，用 Python 腳本修改：

```bash
cd ~/mina-website-edu/frontend
python3 << 'PYEOF'
# 修改 practice.js：找出立即執行的 fetch 並延遲
with open('practice.js', 'r', encoding='utf-8') as f:
    js = f.read()

import re

# 常見模式：頁面載入時立即 fetch
# 尋找 DOMContentLoaded 內或全局的 fetch('/api/v1/practice...')
# 包裝成 requestIdleCallback 或 setTimeout

# 方案：在整個 practice 初始化入口外包一層延遲
# 找 document.addEventListener('DOMContentLoaded') 或 IIFE 入口
# 若是 DOMContentLoaded，在 callback 內加延遲

# 安全包裝：找到主要 init 函式後的呼叫，加上 requestIdleCallback
if 'requestIdleCallback' not in js:
    # 將直接的 fetch('/api/v1/practice') 或 loadPractice() 等
    # 推遲到 idle 時間
    # 找 DOMContentLoaded 或頁面末尾的初始化 call
    
    # 策略：在 fetch 前加入延遲
    js = re.sub(
        r"(fetch\s*\(\s*['\"]https://mina-api\.hua19911027\.workers\.dev/api/v1/practice)",
        r"/* defer: */ setTimeout(() => \g<1>",
        js,
        count=1
    )
    # 如果有修改到 fetch，需要在對應的 .then/.catch 結束後加 ), 200)
    # 請 Claude Code 確認替換結果正確，若格式複雜則手動包裝

    with open('practice.js', 'w', encoding='utf-8') as f:
        f.write(js)
    print('✓ practice.js：fetch 已嘗試延遲處理')
    print('⚠ 請確認語法正確，確保 setTimeout 括號閉合')
else:
    print('ℹ practice.js 已有 requestIdleCallback，略過')
PYEOF
```

**手動確認方式**（若自動腳本不確定）：

在 `practice.js` 找到主要初始化的程式碼（類似 `init()` 或 `loadQuestions()` 的呼叫），手動包成：
```javascript
// 改這個：
init();

// 成這樣：
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => init(), { timeout: 2000 });
} else {
  setTimeout(() => init(), 200);
}
```

---

## Phase P4 — 圖片補 width / height（修 CLS）

**問題**：所有 SVG logo img 沒有 `width` 和 `height`，造成 CLS。

```bash
cd ~/mina-website-edu/frontend
python3 << 'PYEOF'
import glob, re

# 各 logo 的合理尺寸（維持 aspect ratio，避免 CLS）
LOGO_DIMS = {
    'zhuoyue-logo.svg':         ('width="48" height="48"', 'nav brand'),
    'hero-logo':                 ('width="120" height="120"', 'hero section'),  # class-based
    'RUBY_precise_svg.svg':     ('width="200" height="80"', 'course card'),
    'WISE_math_precise_trace.svg': ('width="200" height="80"', 'course card'),
    'ruby-wordmark-t.png':      ('width="200" height="80"', 'fallback'),
    'wise-math-t.png':          ('width="200" height="80"', 'fallback'),
}

for fname in glob.glob('*.html'):
    with open(fname, 'r', encoding='utf-8') as f:
        content = f.read()
    original = content

    # zhuoyue-logo.svg — nav logo（48x48）
    content = re.sub(
        r'(<img\b(?![^>]*\bwidth\b)[^>]*src="[^"]*zhuoyue-logo\.svg"[^>]*)(/>|>)',
        lambda m: m.group(0) if 'width=' in m.group(0) else
                  re.sub(r'(<img\b)', r'\1 width="48" height="48"', m.group(0), count=1),
        content
    )

    # hero-logo class（120x120）
    content = re.sub(
        r'(<img\s+class="hero-logo"(?![^>]*\bwidth\b)[^>]*)(/>|>)',
        lambda m: m.group(1) + ' width="120" height="120"' + m.group(2),
        content
    )

    # RUBY svg（200x80）
    content = re.sub(
        r'(<img\b(?![^>]*\bwidth\b)[^>]*RUBY_precise_svg\.svg[^>]*)(/>|>)',
        lambda m: m.group(1) + ' width="200" height="80"' + m.group(2),
        content
    )

    # WISE svg（200x80）
    content = re.sub(
        r'(<img\b(?![^>]*\bwidth\b)[^>]*WISE_math_precise_trace\.svg[^>]*)(/>|>)',
        lambda m: m.group(1) + ' width="200" height="80"' + m.group(2),
        content
    )

    # ft-brand logo in footer（40x40）
    content = re.sub(
        r'(<div class="ft-brand">.*?<img\b(?![^>]*\bwidth\b)[^>]*zhuoyue-logo[^>]*)(/>|>)',
        lambda m: m.group(1) + ' width="40" height="40"' + m.group(2),
        content,
        flags=re.DOTALL
    )

    if content != original:
        with open(fname, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'✓ {fname}: 圖片尺寸補齊')
    else:
        print(f'ℹ {fname}: 無需修改')

print('\n✓ Phase P4 完成')
PYEOF
```

---

## Phase P5 — Pulse 動畫改 Composited（修 CLS / 非合成動畫）

**問題**：`.pulse` 使用 `box-shadow` 動畫，無法 GPU 合成，影響 CLS 和效能。
**修法**：改用 `transform: scale()` + `opacity`。

```bash
cd ~/mina-website-edu/frontend
python3 << 'PYEOF'
with open('styles.css', 'r', encoding='utf-8') as f:
    css = f.read()

import re

# 找到 .pulse 的 @keyframes 和樣式，替換 box-shadow 為 transform/opacity
# 常見的 pulse 動畫用 box-shadow 擴散效果

# 替換 @keyframes pulse 中的 box-shadow
css = re.sub(
    r'(@keyframes\s+pulse\s*\{[^}]*?)(box-shadow\s*:[^;]+;)',
    lambda m: m.group(1) + 'transform: scale(1.5); opacity: 0;',
    css, flags=re.DOTALL
)

# 若 keyframes 有 0% / 100% 結構
css = re.sub(
    r'(0%\s*\{[^}]*?)(box-shadow\s*:[^;]+;)([^}]*?\})',
    lambda m: m.group(1) + 'transform: scale(1); opacity: 1;' + m.group(3),
    css, flags=re.DOTALL
)
css = re.sub(
    r'(100%\s*\{[^}]*?)(box-shadow\s*:[^;]+;)([^}]*?\})',
    lambda m: m.group(1) + 'transform: scale(2); opacity: 0;' + m.group(3),
    css, flags=re.DOTALL
)

# .pulse 元素本身需要確保 will-change
if '.pulse' in css:
    css = re.sub(
        r'(\.pulse\s*\{)',
        r'\1\n  will-change: transform, opacity;',
        css, count=1
    )

with open('styles.css', 'w', encoding='utf-8') as f:
    f.write(css)

print('✓ styles.css: pulse 動畫改為 transform/opacity')
print('⚠ 請視覺確認 pulse 動畫效果（圓圈擴散應保持，只是改用 GPU 合成屬性）')
PYEOF
```

---

## Phase P6 — JS 壓縮（mina-widget.js 省 3.4KB）

```bash
cd ~/mina-website-edu/frontend

# 確認 terser 可用
npx terser --version 2>/dev/null || echo "需要安裝"

# 備份原始檔
cp components/mina-widget.js components/mina-widget.js.bak

# 壓縮
npx terser components/mina-widget.js \
  --compress drop_console=true \
  --mangle \
  --output components/mina-widget.js

echo "壓縮前後大小比較："
wc -c components/mina-widget.js.bak components/mina-widget.js
```

---

## Phase P7 — Script 標籤補 defer

**效果**：讓 JS 不阻塞 HTML 解析。

```bash
cd ~/mina-website-edu/frontend
python3 << 'PYEOF'
import glob, re

DEFER_SCRIPTS = ['practice.js', 'site.js']

for fname in glob.glob('*.html'):
    with open(fname, 'r', encoding='utf-8') as f:
        content = f.read()
    original = content

    for script in DEFER_SCRIPTS:
        # 補 defer（若尚未有）
        content = re.sub(
            rf'(<script\s+src="{re.escape(script)}")(?![^>]*defer)([^>]*>)',
            rf'\1 defer\2',
            content
        )

    if content != original:
        with open(fname, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'✓ {fname}: script defer 補齊')
    else:
        print(f'ℹ {fname}: 無需修改')

print('\n✓ Phase P7 完成')
PYEOF
```

---

## Phase P8 — Heading 層級修正（Accessibility）

**問題**：footer 的 `<h4>網站導覽</h4>` 從頁面 `<h2>` 跳到 `<h4>`，跳過 `<h3>`。
**修法**：footer 內的 `<h4>` 改成 `<h3>`（footer 是獨立語意區塊，h3 在此合適）。

```bash
cd ~/mina-website-edu/frontend
python3 << 'PYEOF'
import glob, re

for fname in glob.glob('*.html'):
    with open(fname, 'r', encoding='utf-8') as f:
        content = f.read()
    original = content

    # 只替換 footer 內的 h4 → h3
    def fix_footer_headings(m):
        footer_content = m.group(1)
        footer_content = re.sub(r'<h4>', '<h3>', footer_content)
        footer_content = re.sub(r'</h4>', '</h3>', footer_content)
        return '<footer>' + footer_content + '</footer>'

    content = re.sub(
        r'<footer>(.*?)</footer>',
        fix_footer_headings,
        content,
        flags=re.DOTALL
    )

    if content != original:
        with open(fname, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'✓ {fname}: footer h4 → h3')
    else:
        print(f'ℹ {fname}: 無需修改')

print('\n✓ Phase P8 完成')
PYEOF
```

---

## Phase P9 — 對比度修正（Accessibility 93 → 98+）

**問題（從報告中）**：
- Nav 品牌字（`RUBY × WISE`）對比不足
- Footer 小字（`台中市烏日區・旭光國小旁`）對比不足
- 社群連結文字對比不足

**策略**：加深 nav 副字和 footer 小字的顏色，不動主視覺。

```bash
cd ~/mina-website-edu/frontend
python3 << 'PYEOF'
with open('styles.css', 'r', encoding='utf-8') as f:
    css = f.read()

import re

# 找出 .bt span（nav 副品牌字 RUBY × WISE）提高對比
# 找出 .fb-loc（footer 地址小字）提高對比
# 找出 .soc（社群連結）提高對比

# 策略：確保這些元素的文字顏色夠深
# （保持現有設計風格，只微調 opacity 或 color）

# 注意：不要改主色 #E60D85，只改 secondary text
modifications = [
    # nav 副字（通常是半透明白或淡色）→ 提高 opacity 或改為確定深色
    (r'(\.bt\s+span\s*\{[^}]*?)color\s*:\s*[^;]+;', r'\1color: rgba(80,0,40,0.75);'),
    # footer 地址小字
    (r'(\.fb-loc\s*\{[^}]*?)color\s*:\s*[^;]+;', r'\1color: rgba(255,255,255,0.75);'),
    # footer 社群按鈕
    (r'(\.soc\s*\{[^}]*?)color\s*:\s*[^;]+;', r'\1color: rgba(255,255,255,0.85);'),
]

original = css
for pattern, replacement in modifications:
    css = re.sub(pattern, replacement, css, flags=re.DOTALL)

if css != original:
    with open('styles.css', 'w', encoding='utf-8') as f:
        f.write(css)
    print('✓ styles.css: 對比度調整完成')
    print('⚠ 請視覺確認顏色變化不影響設計風格')
else:
    print('⚠ 未找到對應 CSS 規則，需手動確認低對比元素的實際 class 名稱')
    print('請執行：grep -n "RUBY\|fb-loc\|\.soc" styles.css | head -20')
PYEOF
```

---

## Phase P10 — Security Headers（Cloudflare Pages `_headers`）

```bash
cd ~/mina-website-edu/frontend

cat > _headers << 'EOF'
/*
  X-Frame-Options: SAMEORIGIN
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  Cross-Origin-Opener-Policy: same-origin-allow-popups
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://mina-api.hua19911027.workers.dev https://api.notion.com; frame-ancestors 'none'
EOF

echo "✓ _headers 建立完成"
cat _headers
```

---

## Phase P11 — 自我驗證

```bash
cd ~/mina-website-edu/frontend

echo "=== P1：確認所有 HTML 的 Google Fonts 改為 preload ==="
grep -l "fonts.googleapis.com" *.html | while read f; do
  grep -c "rel=\"preload\".*fonts.googleapis\|fonts.googleapis.*rel=\"preload\"" "$f" > /dev/null \
    && echo "✓ $f" || echo "⚠ $f 仍是 blocking"
done

echo ""
echo "=== P2：確認 mina-widget.css 不在 <head> ==="
for f in *.html; do
  head_part=$(sed -n '/<head>/,/<\/head>/p' "$f")
  echo "$head_part" | grep -q "mina-widget.css" \
    && echo "⚠ $f: mina-widget.css 仍在 head" \
    || echo "✓ $f: OK"
done

echo ""
echo "=== P4：確認 logo img 有 width/height ==="
grep -c 'hero-logo.*width\|width.*hero-logo' index.html > /dev/null \
  && echo "✓ hero-logo 有 width" || echo "⚠ hero-logo 缺 width"

echo ""
echo "=== P7：確認 script defer ==="
grep "practice.js" index.html
grep "site.js" index.html

echo ""
echo "=== P8：確認 footer 無 <h4> ==="
grep -c "<h4>" index.html
echo "（應為 0）"

echo ""
echo "=== _headers 存在 ==="
ls -la _headers

echo ""
echo "=== 功能快速確認 ==="
echo "請手動開啟瀏覽器確認："
echo "  1. 首頁字型正常顯示（無 FOUT 閃爍超過 1 秒）"
echo "  2. Mina Widget 浮動按鈕正常"
echo "  3. 題庫 Tab 切換正常"
echo "  4. 首頁動畫（blob、sparkle、pulse）正常"
```

---

## Phase P12 — git commit + push

```bash
cd ~/mina-website-edu

git add -A
git status

git commit -m "perf: Performance Final Optimization — async fonts, defer CSS/JS, image dims, pulse composited, heading fix, security headers

- P1: Google Fonts 改 preload async 非阻塞（預估 mobile FCP -1,600ms）
- P2: mina-widget.css 移至 body 底部、styles.css preload
- P3: practice API defer/requestIdleCallback
- P4: 所有 logo img 補 width/height（修 CLS）
- P5: .pulse 動畫改 transform/opacity（修 non-composited）
- P6: mina-widget.js minify（-3KB）
- P7: practice.js / site.js 加 defer
- P8: footer h4 → h3（heading hierarchy）
- P9: 低對比度文字調整
- P10: Cloudflare Pages _headers 安全標頭"

git push origin dev

echo ""
echo "✓ 部署完成。等待 2 分鐘後重新跑 PageSpeed："
echo "Mobile:  https://pagespeed.web.dev/analysis?url=https://mina-website-edu.pages.dev"
echo "Desktop: https://pagespeed.web.dev/analysis?url=https://mina-website-edu.pages.dev&form_factor=desktop"
```

---

## 最後請輸出 Performance Final Report

格式：
```
## Performance Final Report

### 修正項目與原因
| # | 項目 | 修正前 | 修正後 | 預估改善 |
|---|------|--------|--------|----------|
| P1 | ... | ... | ... | ... |
...

### 預估分數
| | Desktop | Mobile |
|---|---------|--------|
| 修正前 | 86 | 57 |
| 預估修正後 | ? | ? |

### 無法自動處理（需人工確認）
- ...

### 視覺驗證清單
- [ ] 字型正常載入
- [ ] Widget 正常
- [ ] 題庫正常
- [ ] 動畫正常
- [ ] RWD 正常
```
