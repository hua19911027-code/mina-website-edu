;(function () {
  'use strict'

  var API_BASE = 'https://mina-api.hua19911027.workers.dev/api/v1'
  var page = 1
  var loaded = 0
  var LIMIT = 12
  var MAX = 36
  var initialized = false

  var GRADE_MAP = { '1':'小一','2':'小二','3':'小三','4':'小四','5':'小五','6':'小六' }
  var SUBJ_MAP  = { 'en':'英文','ma':'數學' }

  function esc(s) {
    return String(s || '')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;')
  }

  function getContainer() {
    return document.getElementById('qcards')
  }

  function getFilters() {
    var gEl = document.querySelector('.grade.active')
    var sEl = document.querySelector('.tab.active')
    var tEl = document.querySelector('.chip.active')
    return {
      grade:   gEl ? (GRADE_MAP[gEl.dataset.g]   || gEl.dataset.g   || '') : '',
      subject: sEl ? (SUBJ_MAP[sEl.dataset.subj] || sEl.dataset.subj || '') : '',
      type:    tEl ? (tEl.dataset.chip || '') : ''
    }
  }

  /* Inject CSS for the option rows and explanation sections */
  function ensureStyles() {
    if (document.getElementById('pjs-styles')) return
    var s = document.createElement('style')
    s.id = 'pjs-styles'
    s.textContent = [
      '.qcard summary{align-items:flex-start!important;}',
      '.q-sum-body{flex:1;display:flex;flex-direction:column;gap:4px;}',
      '.q-meta{font-size:12px;color:var(--pink,#E8007D);font-weight:500;}',
      '.q-title{font-size:16px;font-weight:700;margin:4px 0 8px;}',
      '.q-opts{display:flex;flex-direction:column;gap:5px;margin-top:4px;}',
      '.q-opt{display:flex;align-items:center;gap:10px;padding:7px 14px;border-radius:10px;border:1.5px solid var(--pink-soft,#FFE3F1);background:var(--bg-2,#FFF6FB);font-size:14px;}',
      '.q-opt.correct{border-color:#22c55e;background:rgba(34,197,94,.08);}',
      '.q-opt-lbl{font-weight:700;min-width:18px;color:#bbb;}',
      '.q-opt.correct .q-opt-lbl{color:#16A34A;}',
      '.q-correct-tag{margin-left:auto;font-size:12px;color:#16A34A;font-weight:600;}',
      /* exam overlay */
      '.exam-grade-btn{padding:14px 0;border-radius:14px;border:2px solid var(--pink-soft,#FFE3F1);background:#fff;font-size:1rem;font-weight:700;cursor:pointer;transition:background .18s,border-color .18s,color .18s;color:var(--ink,#241019);}',
      '.exam-grade-btn:hover{background:var(--pink-soft,#FFE3F1);border-color:var(--pink,#E60D85);}',
      '.exam-grade-btn.selected{background:var(--pink,#E60D85);border-color:var(--pink,#E60D85);color:#fff;}',
      '.exam-subj-btn{display:flex;flex-direction:column;align-items:center;gap:6px;padding:18px 28px;border-radius:18px;border:2.5px solid var(--pink-soft,#FFE3F1);background:#fff;font-size:1rem;font-weight:700;cursor:pointer;transition:background .18s,border-color .18s,transform .15s;color:var(--ink,#241019);min-width:110px;}',
      '.exam-subj-btn:hover{transform:translateY(-3px);border-color:var(--pink,#E60D85);background:var(--pink-soft,#FFE3F1);}',
      '.exam-subj-btn .subj-icon{font-size:2rem;line-height:1;}',
      '.exam-subj-btn .subj-label{font-size:.85rem;color:var(--ink-mute,#A593A0);}',
    ].join('')
    ;(document.head || document.documentElement).appendChild(s)
  }

  /* Build one question card using the bundler template's .qcard (details) structure */
  function appendCard(q, n) {
    var container = getContainer()
    if (!container) return

    var optHtml = ['A','B','C','D'].map(function(lbl, i) {
      var ok = (lbl === q.answer)
      return '<div class="q-opt' + (ok ? ' correct' : '') + '">'
        + '<span class="q-opt-lbl">' + lbl + '</span>'
        + '<span>' + esc(q.options[i] != null ? q.options[i] : '') + '</span>'
        + (ok ? '<span class="q-correct-tag">&#10003; 正解</span>' : '')
        + '</div>'
    }).join('')

    var exp = q.explanation || {}
    var card = document.createElement('details')
    card.className = 'qcard'
    card.innerHTML =
      '<summary>'
        + '<span class="qnum">' + n + '</span>'
        + '<div class="q-sum-body">'
          + '<span class="q-meta">' + esc(q.grade) + ' &middot; ' + esc(q.subject) + (q.type ? ' &middot; ' + esc(q.type) : '') + '</span>'
          + '<span class="q-title">' + esc(q.question) + '</span>'
          + '<div class="q-opts">' + optHtml + '</div>'
        + '</div>'
        + '<span class="plus">+</span>'
      + '</summary>'
      + '<div class="qbody">'
        + '<div class="qseg ok"><span class="st">&#10003; 正確觀念</span><span class="sx">' + esc(exp.concept || '') + '</span></div>'
        + '<div class="qseg err"><span class="st">&#10007; 常見錯誤</span><span class="sx">' + esc(exp.commonMistake || '') + '</span></div>'
        + '<div class="qseg tip"><span class="st">&#9733; 記憶提示</span><span class="sx">' + esc(exp.memoryTip || '') + '</span></div>'
      + '</div>'

    container.appendChild(card)
  }

  function clearList() {
    var c = getContainer()
    if (c) c.innerHTML = ''
  }

  function fetchQuestions(isMore) {
    if (!isMore) { page = 1; loaded = 0; clearList() }
    var f = getFilters()
    var reqPage = isMore ? page + 1 : 1
    var params = 'page=' + reqPage + '&limit=' + LIMIT
    if (f.grade)   params += '&grade='   + encodeURIComponent(f.grade)
    if (f.subject) params += '&subject=' + encodeURIComponent(f.subject)
    if (f.type)    params += '&type='    + encodeURIComponent(f.type)

    /* skeleton while loading */
    if (!isMore) {
      clearList()
      var container = getContainer()
      if (container) {
        container.innerHTML = [1,2,3].map(function() {
          return '<div style="height:80px;background:var(--bg-2,#FFF6FB);border-radius:14px;margin-bottom:12px;animation:pjsPulse 1.5s infinite"></div>'
        }).join('')
        if (!document.getElementById('pjs-pulse')) {
          var ks = document.createElement('style')
          ks.id = 'pjs-pulse'
          ks.textContent = '@keyframes pjsPulse{0%,100%{opacity:1}50%{opacity:.45}}'
          ;(document.head || document.documentElement).appendChild(ks)
        }
      }
    }

    fetch(API_BASE + '/practice?' + params)
      .then(function(r) { return r.json() })
      .then(function(json) {
        if (!isMore) clearList()
        if (!json.ok) {
          var c = getContainer()
          if (c) c.innerHTML = '<p style="text-align:center;color:var(--ink-mute,#A593A0);padding:30px">載入失敗，請稍後再試。</p>'
          return
        }
        var qs = json.data.questions || []
        if (!isMore && !qs.length) {
          var c = getContainer()
          if (c) c.innerHTML = '<p style="text-align:center;color:var(--ink-mute,#A593A0);padding:30px">目前沒有符合條件的題目 &#128522;</p>'
          return
        }
        qs.forEach(function(q, i) { appendCard(q, loaded + i + 1) })
        loaded += qs.length
        page = json.data.page

        var dateEl = document.querySelector('.last-updated,[data-last-updated]')
        if (dateEl && json.data.lastUpdated)
          dateEl.textContent = '最後更新：' + json.data.lastUpdated.slice(0,10).replace(/-/g,'/')

        var moreBtn    = document.getElementById('load-more-btn')    || document.querySelector('[data-load-more]')
        var archiveCta = document.getElementById('archive-cta')      || document.querySelector('[data-archive-cta]')
        if (!json.data.hasMore || loaded >= MAX) {
          if (moreBtn) moreBtn.style.display = 'none'
          if (loaded >= MAX && archiveCta) archiveCta.style.display = ''
        } else {
          if (moreBtn) moreBtn.style.display = ''
        }
      })
      .catch(function(e) {
        console.error('fetchQuestions:', e)
        var c = getContainer()
        if (c) c.innerHTML = '<p style="text-align:center;color:var(--ink-mute,#A593A0);padding:30px">載入失敗，請稍後再試。</p>'
      })
  }

  function loadExamReview(grade) {
    fetch(API_BASE + '/practice/exam-review?grade=' + encodeURIComponent(grade))
      .then(function(r) { return r.json() })
      .then(function(json) {
        if (!json.ok) return
        var gradeSection = document.getElementById('exam-grade-section')
        var inactiveMsg  = document.getElementById('exam-inactive-msg')
        var subjectList  = document.getElementById('exam-subject-list')
        var gradeGrid = document.getElementById('exam-grade-grid')
        if (gradeGrid) gradeGrid.style.display = 'none'
        if (!json.data.active) {
          if (inactiveMsg) {
            inactiveMsg.style.display = 'block'
            inactiveMsg.textContent = '現在還不是考試季，先好好休息一下吧！😴 考前複習卷會在段考前一週的週六中午開放，到時候再來找我喔～🌟'
          }
          return
        }
        if (!subjectList) return
        subjectList.style.display = 'flex'
        subjectList.innerHTML = ''
        var SUBJ_ICONS = { '英文': '📘', '數學': '📐' }
        ;(json.data.items || []).forEach(function(item) {
          var btn = document.createElement('button')
          btn.className = 'exam-subj-btn'
          btn.innerHTML = '<span class="subj-icon">' + (SUBJ_ICONS[item.subject] || '📄') + '</span>'
            + '<span>' + item.subject + '</span>'
            + '<span class="subj-label">點此下載 PDF</span>'
          btn.addEventListener('click', function() { window.open(item.pdfUrl, '_blank') })
          subjectList.appendChild(btn)
        })
      })
      .catch(function(e) { console.error('loadExamReview:', e) })
  }

  /* Create exam grade picker panel dynamically (not in bundler template) */
  function ensureExamPanel() {
    var existing = document.getElementById('exam-grade-section')
    if (existing) return existing

    var panel = document.createElement('div')
    panel.id = 'exam-grade-section'
    panel.style.cssText = 'display:none;position:fixed;inset:0;z-index:9000;background:rgba(20,8,16,.55);align-items:center;justify-content:center;backdrop-filter:blur(2px);'
    panel.innerHTML =
      '<div style="background:#fff;border-radius:28px;padding:36px 32px 28px;max-width:420px;width:92%;text-align:center;box-shadow:0 32px 80px -20px rgba(0,0,0,.35);">'
        + '<div style="width:48px;height:48px;border-radius:16px;background:var(--pink,#E60D85);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:1.5rem;">📌</div>'
        + '<h3 style="margin:0 0 6px;font-size:1.3rem;font-weight:900;color:var(--ink,#241019);">選擇年級</h3>'
        + '<p style="margin:0 0 24px;font-size:.875rem;color:var(--ink-mute,#A593A0);line-height:1.5;">複習卷於段考前週六中午開放<br>選擇年級後即可下載 PDF 複習卷</p>'
        + '<div id="exam-grade-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px;">'
          + ['小一','小二','小三','小四','小五','小六'].map(function(g) {
              return '<button class="exam-grade-btn" data-exam-grade="' + g + '">' + g + '</button>'
            }).join('')
        + '</div>'
        + '<div id="exam-inactive-msg" style="display:none;padding:16px 20px;border-radius:14px;background:var(--bg-2,#FFF6FB);font-size:.875rem;color:var(--ink-soft,#6A5560);margin-bottom:20px;line-height:1.6;"></div>'
        + '<div id="exam-subject-list" style="display:none;flex-wrap:wrap;gap:12px;justify-content:center;margin-bottom:20px;"></div>'
        + '<button id="exam-panel-close" style="padding:11px 32px;border-radius:30px;border:none;background:var(--pink-soft,#FFE3F1);color:var(--pink,#E60D85);font-weight:700;cursor:pointer;font-size:.95rem;">關閉</button>'
      + '</div>'

    document.body.appendChild(panel)

    panel.querySelector('#exam-panel-close').addEventListener('click', function() {
      panel.style.display = 'none'
    })
    panel.addEventListener('click', function(e) {
      if (e.target === panel) panel.style.display = 'none'
    })
    panel.querySelectorAll('.exam-grade-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        panel.querySelectorAll('.exam-grade-btn').forEach(function(b) { b.classList.remove('selected') })
        btn.classList.add('selected')
        loadExamReview(btn.dataset.examGrade)
      })
    })

    return panel
  }

  function bindAll() {
    /* 年級 .grade[data-g] — toggle deselect */
    document.querySelectorAll('.grade').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var was = btn.classList.contains('active')
        document.querySelectorAll('.grade').forEach(function(b) { b.classList.remove('active') })
        if (!was) btn.classList.add('active')
        fetchQuestions(false)
      })
    })

    /* 科目 .tab[data-subj] — 互斥 */
    document.querySelectorAll('.tab').forEach(function(tab) {
      tab.addEventListener('click', function() {
        document.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active') })
        tab.classList.add('active')
        fetchQuestions(false)
      })
    })

    /* 題型 .chip[data-chip] — toggle deselect */
    document.querySelectorAll('.chip').forEach(function(chip) {
      chip.addEventListener('click', function() {
        var was = chip.classList.contains('active')
        document.querySelectorAll('.chip').forEach(function(c) { c.classList.remove('active') })
        if (!was) chip.classList.add('active')
        fetchQuestions(false)
      })
    })

    /* 考前複習 banner — 開啟年級選擇面板 */
    var examBanner = document.querySelector('.qbanner.b-review')
    if (examBanner) {
      examBanner.addEventListener('click', function(e) {
        e.preventDefault()
        e.stopImmediatePropagation()
        var panel = ensureExamPanel()
        panel.style.display = 'flex'
        /* reset inactive/subject state */
        var inactiveMsg = panel.querySelector('#exam-inactive-msg')
        var subjectList = panel.querySelector('#exam-subject-list')
        if (inactiveMsg) inactiveMsg.style.display = 'none'
        if (subjectList) { subjectList.style.display = 'none'; subjectList.innerHTML = '' }
        panel.querySelectorAll('[data-exam-grade]').forEach(function(b) { b.style.background = '#fff' })
      })
    } else {
      console.warn('practice.js: .qbanner.b-review not found')
    }

    /* 歷屆題庫 banner — 開啟 widget 切到 archive 流程 */
    var pastBanner = document.querySelector('.qbanner.b-past')
    if (pastBanner) {
      pastBanner.addEventListener('click', function(e) {
        e.preventDefault()
        e.stopImmediatePropagation()
        if (window.minaWidget && window.minaWidget.openToNode) {
          window.minaWidget.openToNode('archive_welcome')
        } else if (window.minaWidget && window.minaWidget.open) {
          window.minaWidget.open()
        } else {
          console.warn('practice.js: window.minaWidget not available')
        }
      })
    } else {
      console.warn('practice.js: .qbanner.b-past not found')
    }

    /* Mina 小幫手 btn-w — 開啟 widget */
    var widgetBtn = document.querySelector('.btn-w')
    if (widgetBtn) {
      widgetBtn.addEventListener('click', function(e) {
        e.preventDefault()
        e.stopImmediatePropagation()
        if (window.minaWidget && window.minaWidget.openToNode) {
          window.minaWidget.openToNode('quiz_welcome')
        } else if (window.minaWidget && window.minaWidget.open) {
          window.minaWidget.open()
        } else {
          console.warn('practice.js: window.minaWidget not available')
        }
      })
    } else {
      console.warn('practice.js: .btn-w not found')
    }

    /* 載入更多 */
    var moreBtn = document.getElementById('load-more-btn') || document.querySelector('[data-load-more]')
    if (moreBtn) {
      moreBtn.addEventListener('click', function() { fetchQuestions(true) })
    }

    /* Archive CTA → widget archive 流程 */
    var archiveBtn = document.getElementById('open-archive-btn') || document.querySelector('[data-open-archive]')
    if (archiveBtn) {
      archiveBtn.addEventListener('click', function(e) {
        e.preventDefault()
        if (window.minaWidget && window.minaWidget.openToNode) {
          window.minaWidget.openToNode('archive_welcome')
        }
      })
    }

    /* Mina widget 選完科目/年級後，同步篩選題庫 */
    document.addEventListener('minaQuizFilter', function(e) {
      var subj = e.detail && e.detail.subject
      var gradeCode = e.detail && e.detail.grade
      var gradeNum = gradeCode ? gradeCode.replace('grade_', '') : null
      if (subj) {
        document.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active') })
        var tabEl = document.querySelector('.tab[data-subj="' + subj + '"]')
        if (tabEl) tabEl.classList.add('active')
      }
      if (gradeNum) {
        document.querySelectorAll('.grade').forEach(function(g) { g.classList.remove('active') })
        var gradeEl = document.querySelector('.grade[data-g="' + gradeNum + '"]')
        if (gradeEl) gradeEl.classList.add('active')
      }
      fetchQuestions(false)
      var qcards = document.getElementById('qcards')
      if (qcards) setTimeout(function() { qcards.scrollIntoView({ behavior: 'smooth', block: 'start' }) }, 600)
    })
  }

  function init() {
    if (initialized) return
    if (!getContainer()) return
    initialized = true
    ensureStyles()
    bindAll()
    /* 不自動載入題目，等使用者點選年級或科目後再觸發 */
    var c = getContainer()
    if (c) c.innerHTML = '<p style="text-align:center;color:var(--ink-mute,#A593A0);padding:40px 20px;font-size:.95rem;">請選擇上方年級與科目，開始練習 😊</p>'
  }

  /* Bundler detection:
   * The bundler uses document.open()/write()/close() to replace the entire document.
   * After that, DOMContentLoaded does NOT re-fire for scripts from the old document.
   * Solution: MutationObserver + setInterval polling for #qcards to appear. */
  if (getContainer()) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init)
    } else {
      init()
    }
  } else {
    var obs = new MutationObserver(function() {
      if (getContainer()) { obs.disconnect(); clearInterval(timer); init() }
    })
    obs.observe(document.documentElement, { childList: true, subtree: true })
    var timer = setInterval(function() {
      if (getContainer()) { clearInterval(timer); obs.disconnect(); init() }
    }, 300)
    setTimeout(function() { clearInterval(timer); obs.disconnect() }, 30000)
  }
})()
