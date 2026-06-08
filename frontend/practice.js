/* practice.js — 題庫練習頁（歷屆題庫 + 考前複習）*/
(function () {
  'use strict';

  var API_BASE = 'https://mina-api.hua19911027.workers.dev';
  var LIMIT_PER_PAGE = 12;
  var MAX_QUESTIONS = 36;

  var state = {
    subject: '',
    grade: '',
    type: '',
    page: 1,
    totalLoaded: 0,
    loading: false,
  };

  /* ── DOM refs ── */
  var qGrid = document.getElementById('qcards');
  var loadMoreBtn = document.getElementById('load-more-btn');
  var loadMoreWrap = document.getElementById('load-more-wrap');
  var archiveCta = document.getElementById('archive-cta');
  var lastUpdatedEl = document.getElementById('last-updated');
  var emptyState = document.getElementById('q-empty');

  /* ── Filter helpers ── */
  function getFilter(sel) {
    var el = document.querySelector(sel + '.active');
    return el ? el.dataset.val : '';
  }

  function buildFilterParams() {
    var p = {};
    if (state.subject) p.subject = state.subject;
    if (state.grade) p.grade = state.grade;
    if (state.type) p.type = state.type;
    return p;
  }

  /* ── Skeleton ── */
  function showSkeleton(container) {
    container.innerHTML = [1, 2, 3].map(function () {
      return '<div class="qcard skeleton" style="height:80px;background:var(--bg-2);border-radius:var(--r-md);animation:pulse 1.5s infinite;"></div>';
    }).join('');
  }

  /* ── Render a question card ── */
  function buildCard(q, n) {
    var optLabels = ['A', 'B', 'C', 'D'];
    var opts = q.options.map(function (o, i) {
      var letter = optLabels[i] || String(i + 1);
      var isAnswer = letter === q.answer;
      return '<div class="q-opt' + (isAnswer ? ' q-opt-correct' : '') + '">' +
        '<span class="q-opt-letter">' + letter + '</span>' +
        '<span>' + escHtml(o) + '</span>' +
        (isAnswer ? '<span class="q-opt-badge">✓ 正解</span>' : '') +
        '</div>';
    }).join('');

    var badge = q.grade + ' · ' + q.subject + (q.type ? ' · ' + q.type : '');

    return '<details class="qcard">' +
      '<summary>' +
        '<span class="qnum">Q' + n + '</span>' +
        '<div class="q-main">' +
          '<span class="q-badge">' + escHtml(badge) + '</span>' +
          '<span class="q-text">' + escHtml(q.question) + '</span>' +
        '</div>' +
        '<span class="plus">+</span>' +
      '</summary>' +
      '<div class="qbody">' +
        '<div class="q-opts">' + opts + '</div>' +
        '<div class="qseg ok"><div class="st">✓ 正確觀念</div><div class="sx">' + escHtml(q.explanation.concept) + '</div></div>' +
        '<div class="qseg err"><div class="st">✕ 常見錯誤</div><div class="sx">' + escHtml(q.explanation.commonMistake) + '</div></div>' +
        '<div class="qseg tip"><div class="st">★ 記憶提示</div><div class="sx">' + escHtml(q.explanation.memoryTip) + '</div></div>' +
      '</div>' +
    '</details>';
  }

  function escHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ── Load questions ── */
  function loadQuestions(isLoadMore) {
    if (state.loading) return;
    state.loading = true;

    if (!isLoadMore) {
      showSkeleton(qGrid);
      state.page = 1;
      state.totalLoaded = 0;
      if (archiveCta) archiveCta.style.display = 'none';
      if (loadMoreWrap) loadMoreWrap.style.display = 'none';
      if (emptyState) emptyState.style.display = 'none';
    }

    var params = buildFilterParams();
    params.page = isLoadMore ? state.page + 1 : 1;
    params.limit = LIMIT_PER_PAGE;

    fetch(API_BASE + '/api/v1/practice?' + new URLSearchParams(params))
      .then(function (r) { return r.json(); })
      .then(function (json) {
        state.loading = false;
        if (!json.ok) { showError(); return; }

        var qs = json.data.questions;
        if (!isLoadMore) {
          if (!qs.length) {
            qGrid.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
            return;
          }
          qGrid.innerHTML = '';
          state.totalLoaded = 0;
        }

        var start = state.totalLoaded;
        qs.forEach(function (q, i) {
          qGrid.insertAdjacentHTML('beforeend', buildCard(q, start + i + 1));
        });
        state.totalLoaded += qs.length;
        state.page = json.data.page;

        if (json.data.lastUpdated && lastUpdatedEl) {
          lastUpdatedEl.textContent = '最後更新：' + formatDate(json.data.lastUpdated);
        }

        if (!json.data.hasMore || state.totalLoaded >= MAX_QUESTIONS) {
          if (loadMoreWrap) loadMoreWrap.style.display = 'none';
          if (state.totalLoaded >= MAX_QUESTIONS && archiveCta) {
            archiveCta.style.display = 'block';
          }
        } else {
          if (loadMoreWrap) loadMoreWrap.style.display = 'block';
        }
      })
      .catch(function () {
        state.loading = false;
        showError();
      });
  }

  function showError() {
    qGrid.innerHTML = '<p style="text-align:center;color:var(--ink-mute);padding:30px;">載入失敗，請稍後再試。</p>';
  }

  function formatDate(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    return d.getFullYear() + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + String(d.getDate()).padStart(2, '0');
  }

  /* ── Filter UI ── */
  function initFilters() {
    document.querySelectorAll('.subj-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        document.querySelectorAll('.subj-tab').forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        state.subject = tab.dataset.val;
        loadQuestions(false);
      });
    });

    document.querySelectorAll('.grade-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        document.querySelectorAll('.grade-chip').forEach(function (c) { c.classList.remove('active'); });
        chip.classList.add('active');
        state.grade = chip.dataset.val;
        loadQuestions(false);
      });
    });

    document.querySelectorAll('.type-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        document.querySelectorAll('.type-chip').forEach(function (c) { c.classList.remove('active'); });
        chip.classList.add('active');
        state.type = chip.dataset.val;
        loadQuestions(false);
      });
    });
  }

  /* ── Load More button ── */
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', function () {
      loadQuestions(true);
    });
  }

  /* ── Archive CTA ── */
  var openArchiveBtn = document.getElementById('open-archive-btn');
  if (openArchiveBtn) {
    openArchiveBtn.addEventListener('click', function () {
      if (window.minaWidget) {
        window.minaWidget.openToNode('archive_welcome');
      }
    });
  }

  /* ── Exam Review ── */
  var examSection = document.getElementById('exam-review-section');
  var examGradeWrap = document.getElementById('exam-grade-wrap');
  var examResultWrap = document.getElementById('exam-result-wrap');
  var examInactiveMsg = document.getElementById('exam-inactive-msg');
  var examSubjectList = document.getElementById('exam-subject-list');
  var examEntryBtn = document.getElementById('exam-entry-btn');

  if (examEntryBtn) {
    examEntryBtn.addEventListener('click', function () {
      if (examSection) examSection.style.display = 'block';
      examEntryBtn.style.display = 'none';
      examSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  document.querySelectorAll('.exam-grade-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.exam-grade-btn').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      loadExamReview(btn.dataset.grade);
    });
  });

  function loadExamReview(grade) {
    if (examResultWrap) examResultWrap.style.display = 'none';
    if (examInactiveMsg) examInactiveMsg.style.display = 'none';
    if (examSubjectList) examSubjectList.innerHTML = '<p style="color:var(--ink-mute)">載入中…</p>';
    if (examResultWrap) examResultWrap.style.display = 'block';

    fetch(API_BASE + '/api/v1/practice/exam-review?grade=' + encodeURIComponent(grade))
      .then(function (r) { return r.json(); })
      .then(function (json) {
        if (!json.ok) {
          examSubjectList.innerHTML = '<p style="color:var(--ink-mute)">載入失敗，請稍後再試。</p>';
          return;
        }
        if (!json.data.active) {
          showExamInactiveMessage();
          return;
        }
        renderExamSubjects(json.data.items);
      })
      .catch(function () {
        if (examSubjectList) examSubjectList.innerHTML = '<p style="color:var(--ink-mute)">載入失敗，請稍後再試。</p>';
      });
  }

  function showExamInactiveMessage() {
    if (examSubjectList) examSubjectList.innerHTML = '';
    if (examInactiveMsg) examInactiveMsg.style.display = 'block';
  }

  function renderExamSubjects(items) {
    if (!examSubjectList) return;
    if (!items || !items.length) {
      showExamInactiveMessage();
      return;
    }
    examSubjectList.innerHTML = items.map(function (item) {
      return '<button class="exam-subj-btn" onclick="window.open(\'' + escHtml(item.pdfUrl) + '\', \'_blank\')">' +
        '<span class="exam-subj-icon">📄</span>' +
        '<span>' + escHtml(item.subject) + '</span>' +
        '<span class="exam-subj-dl">下載 PDF</span>' +
      '</button>';
    }).join('');
  }

  /* ── Init ── */
  initFilters();
  loadQuestions(false);

})();
