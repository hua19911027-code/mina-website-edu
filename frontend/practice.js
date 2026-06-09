/* practice.js — Mina 題庫 API 整合層
 * 卡片使用 bundler 模板原有 CSS class（不新增 HTML 結構）
 * 新行為：選項 ABCD 預設顯示；+ 按鈕只展開三塊解析
 * 容器 #qcards；篩選 .grade[data-g]、.tab[data-subj]、.chip[data-chip]
 */
;(function () {
  'use strict';

  var API_BASE = 'https://mina-api.hua19911027.workers.dev/api/v1';
  var page     = 1;
  var loaded   = 0;
  var LIMIT    = 12;
  var MAX      = 36;
  var initialized = false;

  /* 年級 data-g → API 值 */
  var GRADE_MAP = { '1':'小一','2':'小二','3':'小三','4':'小四','5':'小五','6':'小六' };
  /* 科目 data-subj → API 值 */
  var SUBJ_MAP  = { 'en':'英文','ma':'數學' };

  /* ── HTML 轉義 ── */
  function esc(s) {
    return String(s || '')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ── 讀取當前篩選條件 ── */
  function getFilters() {
    var gEl = document.querySelector('.grade.active');
    var sEl = document.querySelector('.tab.active');
    var tEl = document.querySelector('.chip.active');
    return {
      grade:   gEl ? (GRADE_MAP[gEl.dataset.g]   || gEl.dataset.g)   : '',
      subject: sEl ? (SUBJ_MAP[sEl.dataset.subj] || sEl.dataset.subj) : '',
      type:    tEl ? (tEl.dataset.chip || '')                          : ''
    };
  }

  /* ── 注入動態樣式（解析區塊 toggle 用）── */
  function ensureStyles() {
    if (document.getElementById('pjs-styles')) return;
    var s = document.createElement('style');
    s.id = 'pjs-styles';
    s.textContent = [
      /* 選項區塊：預設顯示，不套 <details> 折疊 */
      '.pjs-card{background:#fff;border:2px solid var(--pink-soft,#FFE3F1);border-radius:20px;overflow:hidden;margin-bottom:14px;transition:.25s}',
      '.pjs-card:hover{box-shadow:0 20px 44px -20px rgba(184,0,95,.22)}',
      '.pjs-head{display:flex;align-items:flex-start;gap:12px;padding:16px 20px 12px}',
      '.pjs-num{flex-shrink:0;width:32px;height:32px;border-radius:50%;background:var(--pink,#E60D85);color:#fff;display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:700}',
      '.pjs-body{flex:1;min-width:0}',
      '.pjs-badge{display:inline-block;font-size:.72rem;color:var(--ink-mute,#A593A0);background:var(--bg-2,#FFF6FB);border-radius:4px;padding:1px 6px;margin-bottom:5px}',
      '.pjs-q{display:block;font-weight:600;font-size:.92rem;line-height:1.55;color:var(--ink,#241019)}',
      '.pjs-toggle{flex-shrink:0;width:30px;height:30px;border-radius:50%;border:none;background:var(--pink-soft,#FFE3F1);color:var(--pink,#E60D85);font-size:1.25rem;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:.2s;margin-top:2px}',
      '.pjs-toggle:hover{background:var(--pink,#E60D85);color:#fff}',
      '.pjs-toggle[aria-expanded="true"]{background:var(--pink,#E60D85);color:#fff;transform:rotate(45deg)}',
      /* 選項：永遠顯示 */
      '.pjs-opts{padding:0 20px 14px;display:flex;flex-direction:column;gap:6px}',
      '.pjs-opt{display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:10px;border:1.5px solid var(--line,#F2D9E7);background:var(--bg-2,#FFF6FB);font-size:.875rem}',
      '.pjs-opt.correct{border-color:#22c55e;background:rgba(34,197,94,.08)}',
      '.pjs-letter{flex-shrink:0;width:24px;height:24px;border-radius:50%;background:var(--line,#F2D9E7);display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:700}',
      '.pjs-opt.correct .pjs-letter{background:#22c55e;color:#fff}',
      '.pjs-badge-ans{margin-left:auto;font-size:.72rem;font-weight:700;color:#22c55e}',
      /* 解析：預設隱藏，toggle 展開 */
      '.pjs-exp{padding:0 20px 16px;display:flex;flex-direction:column;gap:8px;border-top:1px solid var(--line,#F2D9E7)}',
      '.pjs-seg{padding:10px 14px;border-radius:10px;font-size:.85rem;line-height:1.6}',
      '.pjs-seg.ok{background:rgba(34,197,94,.07)}.pjs-seg.ok .pjs-st{color:#16a34a}',
      '.pjs-seg.err{background:rgba(239,68,68,.07)}.pjs-seg.err .pjs-st{color:#dc2626}',
      '.pjs-seg.tip{background:rgba(234,179,8,.08)}.pjs-seg.tip .pjs-st{color:#a16207}',
      '.pjs-st{font-size:.72rem;font-weight:700;display:block;margin-bottom:3px}',
      '.pjs-sx{color:var(--ink-soft,#6A5560)}'
    ].join('');
    (document.head || document.documentElement).appendChild(s);
  }

  /* ── 建立一張題目卡片 ── */
  function buildCard(q, n) {
    var labels  = ['A','B','C','D'];
    var optRows = (q.options || []).map(function(o, i) {
      var lbl     = labels[i] || String(i + 1);
      var correct = (lbl === q.answer);
      return '<div class="pjs-opt' + (correct ? ' correct' : '') + '">'
        + '<span class="pjs-letter">' + lbl + '</span>'
        + '<span>' + esc(o) + '</span>'
        + (correct ? '<span class="pjs-badge-ans">✓ 正解</span>' : '')
        + '</div>';
    }).join('');

    var badge = esc(q.grade) + ' · ' + esc(q.subject) + (q.type ? ' · ' + esc(q.type) : '');
    var expId  = 'pjs-exp-' + n;

    return '<div class="pjs-card">'
      /* 標頭：題號、標籤、題目、toggle 按鈕 */
      + '<div class="pjs-head">'
        + '<span class="pjs-num">' + n + '</span>'
        + '<div class="pjs-body">'
          + '<span class="pjs-badge">' + badge + '</span>'
          + '<span class="pjs-q">' + esc(q.question) + '</span>'
        + '</div>'
        + '<button class="pjs-toggle" aria-expanded="false" aria-controls="' + expId + '" aria-label="展開解析">+</button>'
      + '</div>'
      /* 選項：永遠可見 */
      + '<div class="pjs-opts">' + optRows + '</div>'
      /* 解析：預設隱藏 */
      + '<div class="pjs-exp" id="' + expId + '" hidden>'
        + '<div class="pjs-seg ok"><span class="pjs-st">✓ 正確觀念</span><span class="pjs-sx">' + esc(q.explanation.concept) + '</span></div>'
        + '<div class="pjs-seg err"><span class="pjs-st">✕ 常見錯誤</span><span class="pjs-sx">' + esc(q.explanation.commonMistake) + '</span></div>'
        + '<div class="pjs-seg tip"><span class="pjs-st">★ 記憶提示</span><span class="pjs-sx">' + esc(q.explanation.memoryTip) + '</span></div>'
      + '</div>'
    + '</div>';
  }

  /* ── 題目清單容器 ── */
  function getContainer() {
    return document.getElementById('qcards')
      || document.getElementById('question-list')
      || document.querySelector('.question-list');
  }

  /* ── 呼叫題庫 API ── */
  function fetchQuestions(isMore) {
    var container = getContainer();
    if (!container) return;

    if (!isMore) {
      page = 1; loaded = 0;
      container.innerHTML = '';
    }

    var f = getFilters();
    var p = { page: isMore ? page + 1 : 1, limit: LIMIT };
    if (f.grade)   p.grade   = f.grade;
    if (f.subject) p.subject = f.subject;
    if (f.type)    p.type    = f.type;

    /* skeleton */
    if (!isMore) {
      container.innerHTML = [1,2,3].map(function() {
        return '<div style="height:80px;background:var(--bg-2,#FFF6FB);border-radius:14px;margin-bottom:12px;animation:pjsPulse 1.5s infinite"></div>';
      }).join('');
      if (!document.getElementById('pjs-pulse')) {
        var ks = document.createElement('style');
        ks.id = 'pjs-pulse';
        ks.textContent = '@keyframes pjsPulse{0%,100%{opacity:1}50%{opacity:.45}}';
        document.head && document.head.appendChild(ks);
      }
    }

    fetch(API_BASE + '/practice?' + new URLSearchParams(p))
      .then(function(r) { return r.json(); })
      .then(function(json) {
        if (!isMore) container.innerHTML = '';
        if (!json.ok) {
          container.innerHTML = '<p style="text-align:center;color:var(--ink-mute,#A593A0);padding:30px">載入失敗，請稍後再試。</p>';
          return;
        }
        var qs = json.data.questions || [];
        if (!isMore && !qs.length) {
          container.innerHTML = '<p style="text-align:center;color:var(--ink-mute,#A593A0);padding:30px">目前沒有符合條件的題目 😊</p>';
          return;
        }
        qs.forEach(function(q, i) {
          container.insertAdjacentHTML('beforeend', buildCard(q, loaded + i + 1));
        });

        /* 綁定 toggle 按鈕 */
        container.querySelectorAll('.pjs-toggle').forEach(function(btn) {
          if (btn.dataset.bound) return;
          btn.dataset.bound = '1';
          btn.addEventListener('click', function() {
            var open   = btn.getAttribute('aria-expanded') === 'true';
            var target = document.getElementById(btn.getAttribute('aria-controls') || '');
            btn.setAttribute('aria-expanded', String(!open));
            if (target) target.hidden = open;
          });
        });

        loaded += qs.length;
        page = json.data.page;

        /* 最後更新日期 */
        if (json.data.lastUpdated) {
          var el = document.querySelector('.last-updated,[data-last-updated],[id="last-updated"]');
          if (el) el.textContent = '最後更新：' + json.data.lastUpdated.slice(0,10).replace(/-/g,'/');
        }

        /* 載入更多 / Archive CTA */
        var moreBtn    = document.getElementById('load-more-btn') || document.querySelector('[data-load-more]');
        var archiveCta = document.getElementById('archive-cta')   || document.querySelector('[data-archive-cta]');
        if (!json.data.hasMore || loaded >= MAX) {
          if (moreBtn)    moreBtn.style.display    = 'none';
          if (loaded >= MAX && archiveCta) archiveCta.style.display = '';
        } else {
          if (moreBtn) moreBtn.style.display = '';
        }
      })
      .catch(function(e) {
        console.error('fetchQuestions:', e);
        container.innerHTML = '<p style="text-align:center;color:var(--ink-mute,#A593A0);padding:30px">載入失敗，請稍後再試。</p>';
      });
  }

  /* ── 考前複習 ── */
  function loadExamReview(grade) {
    fetch(API_BASE + '/practice/exam-review?grade=' + encodeURIComponent(grade))
      .then(function(r) { return r.json(); })
      .then(function(json) {
        if (!json.ok) return;
        var inactive = document.getElementById('exam-inactive-msg') || document.querySelector('[data-exam-inactive]');
        var list     = document.getElementById('exam-subject-list') || document.querySelector('[data-exam-subjects]');
        var wrap     = document.getElementById('exam-result-wrap');
        if (wrap) wrap.style.display = 'block';
        if (!json.data.active) {
          if (inactive) inactive.style.display = 'block';
          return;
        }
        if (!list) return;
        list.innerHTML = '';
        (json.data.items || []).forEach(function(item) {
          list.insertAdjacentHTML('beforeend',
            '<button class="exam-subj-btn" onclick="window.open(\'' + esc(item.pdfUrl) + '\',\'_blank\')">'
            + '<span class="exam-subj-icon">📄</span><span>' + esc(item.subject) + '</span>'
            + '<span class="exam-subj-dl">下載 PDF</span></button>');
        });
      })
      .catch(function(e) { console.error('loadExamReview:', e); });
  }

  /* ── 綁定所有互動元素 ── */
  function bindAll() {
    /* 年級：.grade[data-g] — toggle（再點取消） */
    document.querySelectorAll('.grade').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var was = btn.classList.contains('active');
        document.querySelectorAll('.grade').forEach(function(b) { b.classList.remove('active'); });
        if (!was) btn.classList.add('active');
        fetchQuestions(false);
      });
    });

    /* 科目：.tab[data-subj] — 互斥 */
    document.querySelectorAll('.tab').forEach(function(tab) {
      tab.addEventListener('click', function() {
        document.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); });
        tab.classList.add('active');
        fetchQuestions(false);
      });
    });

    /* 題型：.chip[data-chip] — toggle */
    document.querySelectorAll('.chip').forEach(function(chip) {
      chip.addEventListener('click', function() {
        var was = chip.classList.contains('active');
        document.querySelectorAll('.chip').forEach(function(c) { c.classList.remove('active'); });
        if (!was) chip.classList.add('active');
        fetchQuestions(false);
      });
    });

    /* 考前複習 — 年級按鈕 */
    document.querySelectorAll('.exam-grade-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.exam-grade-btn').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        loadExamReview(btn.dataset.grade || btn.textContent.trim());
      });
    });

    /* 考前複習 — 入口按鈕 */
    var entryBtn = document.getElementById('exam-entry-btn');
    if (entryBtn) {
      entryBtn.addEventListener('click', function() {
        var sec = document.getElementById('exam-review-section');
        if (sec) { sec.style.display = 'block'; sec.scrollIntoView({ behavior:'smooth', block:'start' }); }
        entryBtn.style.display = 'none';
      });
    }

    /* 載入更多 */
    var moreBtn = document.getElementById('load-more-btn') || document.querySelector('[data-load-more]');
    if (moreBtn) {
      moreBtn.addEventListener('click', function() { fetchQuestions(true); });
    }

    /* Archive CTA */
    var archBtn = document.getElementById('open-archive-btn') || document.querySelector('[data-open-archive]');
    if (archBtn) {
      archBtn.addEventListener('click', function() {
        if (window.minaWidget && window.minaWidget.openToNode) {
          window.minaWidget.openToNode('archive_welcome');
        }
      });
    }
  }

  /* ── 初始化（確保只執行一次）── */
  function init() {
    if (initialized) return;
    if (!getContainer()) return;
    initialized = true;
    ensureStyles();
    bindAll();
    fetchQuestions(false);
  }

  /* ── 啟動策略 ──
   * 打包版 bundler 用 document.open/write/close 替換整份文件
   * 替換後 DOMContentLoaded 不會再次觸發，需以 MutationObserver + setInterval 偵測
   */
  if (getContainer()) {
    /* 非 bundler 情境：直接等 DOMContentLoaded */
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  } else {
    /* Bundler 情境：等待 #qcards 出現 */
    var obs = new MutationObserver(function() {
      if (getContainer()) { obs.disconnect(); clearInterval(timer); init(); }
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });

    /* 輔助 polling（部分瀏覽器 document.write 後 MutationObserver target 失效） */
    var timer = setInterval(function() {
      if (getContainer()) { clearInterval(timer); obs.disconnect(); init(); }
    }, 300);

    /* 安全截止：30 秒後停止 polling */
    setTimeout(function() { clearInterval(timer); obs.disconnect(); }, 30000);
  }

})();
