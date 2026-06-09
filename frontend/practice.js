/* practice.js — Mina 題庫系統 API 整合層
 * 只負責資料，HTML/CSS 完全來自 practice.html（打包版），不在此修改結構
 * Step 2 確認的容器：#qcards（題目列表）、#gradeRow（年級選擇）
 * 篩選按鈕：.grade[data-g]、.tab[data-subj]、.chip[data-chip]
 */

;(function () {
  'use strict';

  var API   = 'https://mina-api.hua19911027.workers.dev/api/v1';
  var page  = 1;
  var loaded = 0;
  var LIMIT  = 12;
  var MAX    = 36;

  /* 年級 data-g → API grade 值 */
  var GRADE_MAP = { '1':'小一','2':'小二','3':'小三','4':'小四','5':'小五','6':'小六' };
  /* 科目 data-subj → API subject 值 */
  var SUBJ_MAP  = { 'en':'英文','ma':'數學' };

  /* ── 讀取當前篩選條件 ── */
  function getFilters() {
    var gradeEl = document.querySelector('.grade.active');
    var subjEl  = document.querySelector('.tab.active');
    var typeEl  = document.querySelector('.chip.active');
    return {
      grade:   gradeEl ? (GRADE_MAP[gradeEl.dataset.g]  || gradeEl.dataset.g)  : '',
      subject: subjEl  ? (SUBJ_MAP[subjEl.dataset.subj] || subjEl.dataset.subj) : '',
      type:    typeEl  ? (typeEl.dataset.chip || '')                              : ''
    };
  }

  /* ── 題目卡片 HTML ── */
  function buildCard(q, n) {
    var labels = ['A','B','C','D'];
    var opts = (q.options || []).map(function(o, i) {
      var letter  = labels[i] || String(i + 1);
      var correct = (letter === q.answer);
      return '<div class="q-opt' + (correct ? ' q-opt-correct' : '') + '">'
        + '<span class="q-opt-letter">' + letter + '</span>'
        + '<span>' + esc(o) + '</span>'
        + (correct ? '<span class="q-opt-badge">✓ 正解</span>' : '')
        + '</div>';
    }).join('');

    return '<details class="qcard">'
      + '<summary>'
        + '<span class="qnum">Q' + n + '</span>'
        + '<div class="q-main">'
          + '<span class="q-badge">' + esc(q.grade + ' · ' + q.subject + (q.type ? ' · ' + q.type : '')) + '</span>'
          + '<span class="q-title">' + esc(q.question) + '</span>'
        + '</div>'
        + '<span class="plus">+</span>'
      + '</summary>'
      + '<div class="qbody">'
        + '<div class="q-opts">' + opts + '</div>'
        + '<div class="qseg ok"><div class="st">✓ 正確觀念</div><div class="sx">' + esc(q.explanation.concept) + '</div></div>'
        + '<div class="qseg err"><div class="st">✕ 常見錯誤</div><div class="sx">' + esc(q.explanation.commonMistake) + '</div></div>'
        + '<div class="qseg tip"><div class="st">★ 記憶提示</div><div class="sx">' + esc(q.explanation.memoryTip) + '</div></div>'
      + '</div>'
    + '</details>';
  }

  function esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ── 呼叫題庫 API ── */
  function fetchQuestions(isMore) {
    if (!isMore) { page = 1; loaded = 0; }

    var container = document.getElementById('qcards');
    if (!container) return;
    if (!isMore) container.innerHTML = '';

    var f  = getFilters();
    var p  = { page: isMore ? page + 1 : 1, limit: LIMIT };
    if (f.grade)   p.grade   = f.grade;
    if (f.subject) p.subject = f.subject;
    if (f.type)    p.type    = f.type;

    fetch(API + '/practice?' + new URLSearchParams(p))
      .then(function(r) { return r.json(); })
      .then(function(json) {
        if (!json.ok) return;

        var qs = json.data.questions || [];
        qs.forEach(function(q, i) {
          container.insertAdjacentHTML('beforeend', buildCard(q, loaded + i + 1));
        });
        loaded += qs.length;
        page    = json.data.page;

        /* 最後更新日期 */
        if (json.data.lastUpdated) {
          var el = document.querySelector('.last-updated, [data-last-updated]');
          if (el) el.textContent = '最後更新：' + json.data.lastUpdated.slice(0,10).replace(/-/g,'/');
        }

        /* 載入更多 / Archive CTA */
        var moreBtn    = document.getElementById('load-more-btn');
        var archiveCta = document.getElementById('archive-cta');
        if (!json.data.hasMore || loaded >= MAX) {
          if (moreBtn)    moreBtn.style.display    = 'none';
          if (loaded >= MAX && archiveCta) archiveCta.style.display = '';
        } else {
          if (moreBtn) moreBtn.style.display = '';
        }
      })
      .catch(function(e) { console.error('fetchQuestions:', e); });
  }

  /* ── 考前複習 ── */
  function loadExamReview(grade) {
    fetch(API + '/practice/exam-review?grade=' + encodeURIComponent(grade))
      .then(function(r) { return r.json(); })
      .then(function(json) {
        if (!json.ok) return;
        var inactive = document.getElementById('exam-inactive-msg');
        var list     = document.getElementById('exam-subject-list');
        if (!json.data.active) {
          if (inactive) inactive.style.display = '';
          return;
        }
        if (!list) return;
        list.innerHTML = '';
        (json.data.items || []).forEach(function(item) {
          list.insertAdjacentHTML('beforeend',
            '<button class="exam-subj-btn" onclick="window.open(\'' + esc(item.pdfUrl) + '\',\'_blank\')">'
            + '<span class="exam-subj-icon">📄</span>'
            + '<span>' + esc(item.subject) + '</span>'
            + '<span class="exam-subj-dl">下載 PDF</span>'
            + '</button>');
        });
      })
      .catch(function(e) { console.error('loadExamReview:', e); });
  }

  /* ── 綁定篩選按鈕 ── */
  function bindFilters() {
    /* 年級：.grade[data-g] — toggle 行為（再點同一格取消） */
    document.querySelectorAll('.grade').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var wasActive = btn.classList.contains('active');
        document.querySelectorAll('.grade').forEach(function(b) { b.classList.remove('active'); });
        if (!wasActive) btn.classList.add('active');
        fetchQuestions(false);
      });
    });

    /* 科目：.tab[data-subj] — 互斥選擇 */
    document.querySelectorAll('.tab').forEach(function(tab) {
      tab.addEventListener('click', function() {
        document.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); });
        tab.classList.add('active');
        fetchQuestions(false);
      });
    });

    /* 題型：.chip[data-chip] — toggle 行為 */
    document.querySelectorAll('.chip').forEach(function(chip) {
      chip.addEventListener('click', function() {
        var wasActive = chip.classList.contains('active');
        document.querySelectorAll('.chip').forEach(function(c) { c.classList.remove('active'); });
        if (!wasActive) chip.classList.add('active');
        fetchQuestions(false);
      });
    });
  }

  /* ── 考前複習入口 ── */
  function bindExamReview() {
    document.querySelectorAll('[data-exam-grade], .exam-grade-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var grade = btn.dataset.examGrade || btn.dataset.grade || btn.textContent.trim();
        loadExamReview(grade);
      });
    });

    var entryBtn = document.getElementById('exam-entry-btn');
    if (entryBtn) {
      entryBtn.addEventListener('click', function() {
        var section = document.getElementById('exam-review-section');
        if (section) { section.style.display = 'block'; }
        entryBtn.style.display = 'none';
      });
    }
  }

  /* ── Archive CTA ── */
  function bindArchiveCta() {
    var btn = document.getElementById('open-archive-btn')
           || document.querySelector('[data-open-archive]');
    if (btn) {
      btn.addEventListener('click', function() {
        if (window.minaWidget && window.minaWidget.openToNode) {
          window.minaWidget.openToNode('archive_welcome');
        }
      });
    }
  }

  /* ── 載入更多 ── */
  function bindLoadMore() {
    var btn = document.getElementById('load-more-btn')
           || document.querySelector('[data-load-more]');
    if (btn) {
      btn.addEventListener('click', function() { fetchQuestions(true); });
    }
  }

  /* ── 啟動：bundler 解包後才能操作 DOM ── */
  function init() {
    bindFilters();
    bindExamReview();
    bindArchiveCta();
    bindLoadMore();
    fetchQuestions(false);
  }

  /* bundler 用 document.open/write/close 替換整份文件
   * 替換後的文件會再次觸發 DOMContentLoaded
   * 用 MutationObserver 輔助偵測 #qcards 出現 */
  if (document.getElementById('qcards')) {
    /* 若 qcards 已存在（非 bundler 情境），直接初始化 */
    document.addEventListener('DOMContentLoaded', init);
  } else {
    /* bundler 情境：等待 qcards 出現 */
    var observer = new MutationObserver(function(_, obs) {
      if (document.getElementById('qcards')) {
        obs.disconnect();
        init();
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    /* 備援：直接監聽 DOMContentLoaded */
    document.addEventListener('DOMContentLoaded', function() {
      if (document.getElementById('qcards')) {
        init();
      }
    });
  }

})();
