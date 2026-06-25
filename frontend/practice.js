;(function () {
  'use strict'

  var API_BASE = 'https://api.minaedu.tw/api/v1'
  var page = 1
  var loaded = 0
  var LIMIT = 12
  var MAX = 36
  var initialized = false

  var archivePage = 1
  var archiveLoaded = 0
  var archiveFetching = false

  var GRADE_MAP = { '1':'小一','2':'小二','3':'小三','4':'小四','5':'小五','6':'小六' }
  var SUBJ_MAP  = { 'en':'英文','ma':'數學' }

  function esc(s) {
    return String(s || '')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;')
  }

  function openPrintPage(examName, grade, subject, questions) {
    var win = window.open('', '_blank')
    if (!win) return
    var rows = (questions || []).map(function(q, i) {
      return '<div class="q">'
        + '<p class="qt"><b>' + (i + 1) + '.</b> ' + esc(q.question) + '</p>'
        + '<ol class="opts" type="A">'
        + '<li>' + esc(q.optionA) + '</li>'
        + '<li>' + esc(q.optionB) + '</li>'
        + '<li>' + esc(q.optionC) + '</li>'
        + '<li>' + esc(q.optionD) + '</li>'
        + '</ol></div>'
    }).join('')
    var answers = (questions || []).map(function(q, i) {
      return (i + 1) + '.' + esc(q.answer)
    }).join('　')
    var css = [
      'body{font-family:"Noto Sans TC",Arial,sans-serif;margin:0;padding:18mm 20mm;font-size:11pt;color:#111;}',
      '.hd{text-align:center;border-bottom:2px solid #333;padding-bottom:12px;margin-bottom:20px;}',
      '.hd h1{font-size:15pt;margin:0 0 4px;}.hd p{font-size:9.5pt;color:#555;margin:0;}',
      '.q{margin-bottom:18px;page-break-inside:avoid;}',
      '.qt{margin:0 0 6px;font-weight:600;line-height:1.6;}',
      '.opts{margin:0;padding-left:26px;line-height:1.9;}',
      '.opts li{margin-bottom:1px;}',
      '.ans{margin-top:28px;padding-top:10px;border-top:1.5px dashed #aaa;font-size:9.5pt;color:#555;}',
      '.noprint{text-align:center;margin-bottom:18px;}',
      '@media print{.noprint{display:none!important;}body{padding:10mm 12mm;}}'
    ].join('')
    win.document.write('<!DOCTYPE html><html lang="zh-TW"><head>'
      + '<meta charset="UTF-8">'
      + '<title>' + esc(examName) + ' ' + esc(grade) + ' ' + esc(subject) + '</title>'
      + '<style>' + css + '</style>'
      + '</head><body>'
      + '<div class="hd"><h1>' + esc(examName) + '　' + esc(grade) + '　' + esc(subject) + '複習卷</h1>'
      + '<p>卓越國際文理補習班　共 ' + (questions || []).length + ' 題，每題 5 分</p></div>'
      + '<div class="noprint"><button onclick="window.print()" style="padding:10px 32px;background:#E60D85;color:#fff;border:none;border-radius:24px;font-size:14px;font-weight:700;cursor:pointer;margin-right:10px;">🖨️ 列印 / 儲存 PDF</button><button onclick="window.close()" style="padding:10px 28px;background:#f5f5f5;color:#333;border:1.5px solid #ddd;border-radius:24px;font-size:14px;font-weight:700;cursor:pointer;">✕ 關閉視窗</button></div>'
      + rows
      + '<div class="ans"><b>答案：</b>' + answers + '</div>'
      + '</body></html>')
    win.document.close()
  }

  function getContainer(id) {
    return document.getElementById(id || 'qcards')
  }

  function getFilters() {
    var gEl = document.querySelector('.grade.active')
    var sEl = document.querySelector('.tab.active')
    return {
      grade:   gEl ? (GRADE_MAP[gEl.dataset.g]   || gEl.dataset.g   || '') : '',
      subject: sEl ? (SUBJ_MAP[sEl.dataset.subj] || sEl.dataset.subj || '') : '',
      type:    ''
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
      /* closed: correct option looks identical to others (no spoiler) */
      '.q-opt-lbl{font-weight:700;min-width:18px;color:#bbb;}',
      '.q-correct-tag{display:none;}',
      /* open: reveal correct option */
      '.qcard[open] .q-opt.correct{border-color:#22c55e;background:rgba(34,197,94,.08);}',
      '.qcard[open] .q-opt.correct .q-opt-lbl{color:#16A34A;}',
      '.qcard[open] .q-correct-tag{display:inline;margin-left:auto;font-size:12px;color:#16A34A;font-weight:600;}',
      /* answer badge inside 正確觀念 */
      '.q-ans-inline{display:flex;align-items:center;gap:8px;margin:6px 0 14px;}',
      '.q-ans-badge{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:7px;background:#22c55e;color:#fff;font-weight:900;font-size:.85rem;flex-shrink:0;}',
      '.q-ans-val{font-size:1rem;font-weight:800;color:#14532d;}',
      /* exam overlay */
      '#exam-grade-section{animation:examFadeIn .22s ease both;}',
      '@keyframes examFadeIn{from{opacity:0}to{opacity:1}}',
      '.exam-dialog{animation:examSlideUp .26s cubic-bezier(.34,1.4,.64,1) both;}',
      '@keyframes examSlideUp{from{opacity:0;transform:translateY(24px) scale(.96)}to{opacity:1;transform:none}}',
      /* grade buttons — 6 cells, each with its own accent color */
      '.exam-grade-btn{position:relative;padding:16px 0 14px;border-radius:16px;border:2.5px solid transparent;font-size:1rem;font-weight:900;cursor:pointer;transition:transform .18s,box-shadow .18s;color:#fff;overflow:hidden;display:flex;flex-direction:column;align-items:center;gap:3px;}',
      '.exam-grade-btn .eg-num{font-family:var(--fred,"Fredoka",sans-serif);font-size:1.6rem;line-height:1;font-weight:700;}',
      '.exam-grade-btn .eg-lbl{font-size:.7rem;letter-spacing:.5px;opacity:.85;font-weight:600;}',
      '.exam-grade-btn:hover{transform:translateY(-4px) scale(1.04);box-shadow:0 10px 24px -8px rgba(0,0,0,.25);}',
      '.exam-grade-btn.selected{box-shadow:0 0 0 3px #fff, 0 0 0 5px currentColor;transform:scale(1.04);}',
      '.exam-grade-btn:nth-child(1){background:linear-gradient(135deg,#FF6BA8,#E60D85);}',
      '.exam-grade-btn:nth-child(2){background:linear-gradient(135deg,#FF9A3C,#EE7700);}',
      '.exam-grade-btn:nth-child(3){background:linear-gradient(135deg,#FFD726,#F0A800);color:#241019;}',
      '.exam-grade-btn:nth-child(3) .eg-lbl{opacity:.7;}',
      '.exam-grade-btn:nth-child(4){background:linear-gradient(135deg,#4ECDC4,#0EA89E);}',
      '.exam-grade-btn:nth-child(5){background:linear-gradient(135deg,#A78BFA,#7C3AED);}',
      '.exam-grade-btn:nth-child(6){background:linear-gradient(135deg,#FB7185,#E11D48);}',
      /* subject list */
      '.exam-subj-btn{position:relative;display:flex;flex-direction:column;align-items:center;gap:8px;padding:20px 20px 16px;border-radius:20px;border:none;font-size:1rem;font-weight:800;cursor:pointer;transition:transform .2s,box-shadow .2s;overflow:hidden;min-width:120px;flex:1 1 calc(33% - 10px);max-width:160px;}',
      '.exam-subj-btn:hover{transform:translateY(-5px);box-shadow:0 12px 28px -8px rgba(0,0,0,.25);}',
      '.exam-subj-btn .subj-icon{font-size:2.4rem;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,.15));}',
      '.exam-subj-btn .subj-name{font-size:1.05rem;font-weight:900;}',
      '.exam-subj-btn .subj-label{font-size:.78rem;font-weight:500;opacity:.75;}',
      '.exam-subj-btn.s-en{background:linear-gradient(145deg,#FFE3F1,#FFC8E6);color:#8F0048;}',
      '.exam-subj-btn.s-ma{background:linear-gradient(145deg,#FFF0D6,#FFD99A);color:#7A3D00;}',
      '.exam-subj-btn.s-chi{background:linear-gradient(145deg,#E8F4FD,#BAE0FF);color:#054A79;}',
      '.exam-subj-btn.s-sci{background:linear-gradient(145deg,#E8F5E9,#A5D6A7);color:#1B5E20;}',
      '.exam-subj-btn.s-soc{background:linear-gradient(145deg,#F3E8FF,#D5B3FF);color:#4A1080;}',
      '.exam-subj-btn.s-other{background:linear-gradient(145deg,#FFF9E6,#FFEEA0);color:#5A4500;}',
      /* hide chip filter buttons */
      '.chips{display:none!important;}',
    ].join('')
    ;(document.head || document.documentElement).appendChild(s)
  }

  /* Build one question card using the bundler template's .qcard (details) structure */
  function appendCard(q, n, containerId) {
    var container = getContainer(containerId)
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
    /* find correct option value for the answer reveal row */
    var LABELS = ['A','B','C','D']
    var answerIdx = LABELS.indexOf(String(q.answer || '').toUpperCase())
    var answerVal = answerIdx >= 0 && q.options ? q.options[answerIdx] : ''
    var answerLbl = answerIdx >= 0 ? LABELS[answerIdx] : String(q.answer || '')

    var card = document.createElement('details')
    card.className = 'qcard'
    card.innerHTML =
      '<summary>'
        + '<span class="qnum">' + n + '</span>'
        + '<div class="q-sum-body">'
          + '<span class="q-meta">' + esc({'標準題型':'標準題型','觀念':'觀念拆解','錯題':'錯題診斷'}[q.type] || q.type || '標準題型') + '</span>'
          + '<span class="q-title">' + esc(q.question) + '</span>'
          + '<div class="q-opts">' + optHtml + '</div>'
        + '</div>'
        + '<span class="plus">+</span>'
      + '</summary>'
      + '<div class="qbody">'
        + '<div class="qseg ok">'
          + '<span class="st">&#10003; 正確觀念</span>'
          + '<div class="q-ans-inline">'
            + '<span class="q-ans-badge">' + esc(answerLbl) + '</span>'
            + '<span class="q-ans-val">' + esc(answerVal) + '</span>'
          + '</div>'
          + (exp.concept ? '<span class="sx">' + esc(exp.concept) + '</span>' : '')
        + '</div>'
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
          if (c) c.innerHTML = '<p style="text-align:center;color:var(--ink-mute,#A593A0);padding:30px">目前沒有符合條件的題目 😊</p>'
          return
        }
        var TYPE_ORDER = { '標準題型': 0, '觀念': 1, '錯題': 2 }
        qs.sort(function(a, b) {
          var ao = TYPE_ORDER[a.type] != null ? TYPE_ORDER[a.type] : 99
          var bo = TYPE_ORDER[b.type] != null ? TYPE_ORDER[b.type] : 99
          return ao - bo
        })
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
        var inactiveMsg  = document.getElementById('exam-inactive-msg')
        var subjectList  = document.getElementById('exam-subject-list')
        var gradeGrid = document.getElementById('exam-grade-grid')
        var backBtn   = document.getElementById('exam-back-btn')
        if (gradeGrid) gradeGrid.style.display = 'none'
        if (backBtn)   backBtn.style.display = 'inline-flex'
        var active = json.ok && json.data && json.data.active
        if (!active) {
          if (inactiveMsg) {
            inactiveMsg.style.display = 'block'
            inactiveMsg.innerHTML = '😴 <b>現在不是考試季</b><br>複習卷會在段考前一周開放<br>到時候再來找我喔～ 🌟'
          }
          return
        }
        if (!subjectList) return
        subjectList.style.display = 'flex'
        subjectList.innerHTML = ''
        var SUBJ_META = {
          '英文': { icon: '📘', cls: 's-en' },
          '數學': { icon: '📐', cls: 's-ma' }
        }
        var examName = json.data.examName || '考前複習'
        ;(json.data.items || []).forEach(function(item) {
          if (item.subject !== '英文' && item.subject !== '數學') return
          var meta = SUBJ_META[item.subject] || { icon: '📄', cls: 's-other' }
          var btn = document.createElement('button')
          btn.className = 'exam-subj-btn ' + meta.cls
          btn.innerHTML = '<span class="subj-icon">' + meta.icon + '</span>'
            + '<span class="subj-name">' + esc(item.subject) + '</span>'
            + '<span class="subj-label">🖨️ 列印複習卷</span>'
          btn.addEventListener('click', function() {
            openPrintPage(examName, grade, item.subject, item.questions)
          })
          subjectList.appendChild(btn)
        })
      })
      .catch(function(e) {
        console.error('loadExamReview:', e)
        var inactiveMsg = document.getElementById('exam-inactive-msg')
        var gradeGrid   = document.getElementById('exam-grade-grid')
        var backBtn     = document.getElementById('exam-back-btn')
        if (gradeGrid) gradeGrid.style.display = 'none'
        if (backBtn)   backBtn.style.display = 'inline-flex'
        if (inactiveMsg) {
          inactiveMsg.style.display = 'block'
          inactiveMsg.innerHTML = '😴 <b>現在不是考試季</b><br>複習卷會在段考前一周開放<br>到時候再來找我喔～ 🌟'
        }
      })
  }

  /* Create exam grade picker panel dynamically (not in bundler template) */
  function ensureExamPanel() {
    var existing = document.getElementById('exam-grade-section')
    if (existing) return existing

    var panel = document.createElement('div')
    panel.id = 'exam-grade-section'
    panel.style.cssText = 'display:none;position:fixed;inset:0;z-index:9000;background:rgba(20,8,16,.6);align-items:center;justify-content:center;backdrop-filter:blur(4px);padding:16px;'
    panel.innerHTML =
      '<div class="exam-dialog" style="background:#fff;border-radius:32px;padding:32px 28px 28px;max-width:460px;width:100%;text-align:center;box-shadow:0 40px 100px -20px rgba(0,0,0,.4);position:relative;">'
        /* decorative blobs */
        + '<div style="position:absolute;top:-20px;right:-20px;width:80px;height:80px;border-radius:50%;background:var(--pink-soft,#FFE3F1);opacity:.7;pointer-events:none;"></div>'
        + '<div style="position:absolute;bottom:-16px;left:-16px;width:60px;height:60px;border-radius:50%;background:var(--yellow-soft,#FFF7C2);opacity:.8;pointer-events:none;"></div>'
        /* header */
        + '<div style="display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,var(--pink-soft,#FFE3F1),#FFD5EE);border-radius:30px;padding:6px 16px 6px 8px;margin-bottom:16px;">'
          + '<span style="font-size:1.2rem;">📌</span>'
          + '<span style="font-size:.8rem;font-weight:700;color:var(--pink,#E60D85);letter-spacing:.3px;">EXAM REVIEW</span>'
        + '</div>'
        + '<h3 style="margin:0 0 6px;font-size:1.4rem;font-weight:900;color:var(--ink,#241019);letter-spacing:-.3px;">選擇你的年級</h3>'
        + '<p style="margin:0 0 24px;font-size:.85rem;color:var(--ink-mute,#A593A0);line-height:1.6;">段考前一周開放複習卷<br>點選年級，找到你要列印的科目 👇</p>'
        /* grade grid */
        + '<div id="exam-grade-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px;">'
          + [['小一','1'],['小二','2'],['小三','3'],['小四','4'],['小五','5'],['小六','6']].map(function(pair) {
              return '<button class="exam-grade-btn" data-exam-grade="' + pair[0] + '">'
                + '<span class="eg-num">' + pair[1] + '</span>'
                + '<span class="eg-lbl">' + pair[0] + '</span>'
              + '</button>'
            }).join('')
        + '</div>'
        /* inactive message */
        + '<div id="exam-inactive-msg" style="display:none;padding:16px 20px;border-radius:16px;background:linear-gradient(135deg,var(--yellow-soft,#FFF7C2),#FFFAE8);font-size:.875rem;color:#6A4F00;margin-bottom:20px;line-height:1.7;border:1.5px solid #FFE68A;"></div>'
        /* subject list */
        + '<div id="exam-subject-list" style="display:none;flex-wrap:wrap;gap:10px;justify-content:center;margin-bottom:20px;"></div>'
        /* bottom row: back + close */
        + '<div style="display:flex;gap:10px;justify-content:center;align-items:center;">'
          + '<button id="exam-back-btn" style="display:none;padding:12px 20px;border-radius:30px;border:1.5px solid var(--line,#F2D9E7);background:#fff;color:var(--ink-soft,#6A5560);font-weight:700;cursor:pointer;font-size:.9rem;">← 重選年級</button>'
          + '<button id="exam-panel-close" style="padding:12px 36px;border-radius:30px;border:none;background:var(--pink-soft,#FFE3F1);color:var(--pink,#E60D85);font-weight:800;cursor:pointer;font-size:.95rem;letter-spacing:.2px;">關閉</button>'
        + '</div>'
      + '</div>'

    document.body.appendChild(panel)

    panel.querySelector('#exam-panel-close').addEventListener('click', function() {
      panel.style.display = 'none'
    })
    panel.addEventListener('click', function(e) {
      if (e.target === panel) panel.style.display = 'none'
    })
    panel.querySelector('#exam-back-btn').addEventListener('click', function() {
      var gradeGrid   = panel.querySelector('#exam-grade-grid')
      var subjectList = panel.querySelector('#exam-subject-list')
      var inactiveMsg = panel.querySelector('#exam-inactive-msg')
      var backBtn     = panel.querySelector('#exam-back-btn')
      if (gradeGrid)   gradeGrid.style.display = 'grid'
      if (subjectList) { subjectList.style.display = 'none'; subjectList.innerHTML = '' }
      if (inactiveMsg) inactiveMsg.style.display = 'none'
      if (backBtn)     backBtn.style.display = 'none'
      panel.querySelectorAll('.exam-grade-btn').forEach(function(b) { b.classList.remove('selected') })
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

  function ensureArchivePanel() {
    var existing = document.getElementById('archive-grade-section')
    if (existing) return existing

    var panel = document.createElement('div')
    panel.id = 'archive-grade-section'
    panel.style.cssText = 'display:none;position:fixed;inset:0;z-index:9000;background:rgba(20,8,16,.6);align-items:center;justify-content:center;backdrop-filter:blur(4px);padding:16px;'
    panel.innerHTML =
      '<div style="background:#fff;border-radius:32px;padding:32px 28px 28px;max-width:460px;width:100%;text-align:center;box-shadow:0 40px 100px -20px rgba(0,0,0,.4);position:relative;">'
        + '<div style="position:absolute;top:-20px;right:-20px;width:80px;height:80px;border-radius:50%;background:#FFF7C2;opacity:.7;pointer-events:none;"></div>'
        + '<div style="position:absolute;bottom:-16px;left:-16px;width:60px;height:60px;border-radius:50%;background:#FFE3F1;opacity:.8;pointer-events:none;"></div>'
        + '<div style="display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,#FFF7C2,#FFEEA0);border-radius:30px;padding:6px 16px 6px 8px;margin-bottom:16px;">'
          + '<span style="font-size:1.2rem;">📚</span>'
          + '<span style="font-size:.8rem;font-weight:700;color:#7A4F00;letter-spacing:.3px;">ARCHIVE</span>'
        + '</div>'
        + '<h3 style="margin:0 0 6px;font-size:1.4rem;font-weight:900;color:var(--ink,#241019);letter-spacing:-.3px;">選擇你的年級</h3>'
        + '<p style="margin:0 0 24px;font-size:.85rem;color:var(--ink-mute,#A593A0);line-height:1.6;">近三個月以前的歷屆題目<br>選年級和科目，立刻顯示 👇</p>'
        + '<div id="archive-grade-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px;">'
          + [['小一','1'],['小二','2'],['小三','3'],['小四','4'],['小五','5'],['小六','6']].map(function(pair) {
              return '<button class="archive-grade-btn exam-grade-btn" data-ag="' + pair[0] + '" data-ag-num="' + pair[1] + '">'
                + '<span class="eg-num">' + pair[1] + '</span>'
                + '<span class="eg-lbl">' + pair[0] + '</span>'
              + '</button>'
            }).join('')
        + '</div>'
        + '<div id="archive-subj-list" style="display:none;flex-wrap:wrap;gap:10px;justify-content:center;margin-bottom:20px;"></div>'
        + '<div style="display:flex;gap:10px;justify-content:center;align-items:center;">'
          + '<button id="archive-back-btn" style="display:none;padding:12px 20px;border-radius:30px;border:1.5px solid var(--line,#F2D9E7);background:#fff;color:var(--ink-soft,#6A5560);font-weight:700;cursor:pointer;font-size:.9rem;">← 重選年級</button>'
          + '<button id="archive-panel-close" style="padding:12px 36px;border-radius:30px;border:none;background:#FFF7C2;color:#7A4F00;font-weight:800;cursor:pointer;font-size:.95rem;letter-spacing:.2px;">關閉</button>'
        + '</div>'
      + '</div>'

    document.body.appendChild(panel)

    panel.querySelector('#archive-panel-close').addEventListener('click', function() {
      panel.style.display = 'none'
    })
    panel.addEventListener('click', function(e) {
      if (e.target === panel) panel.style.display = 'none'
    })
    panel.querySelector('#archive-back-btn').addEventListener('click', function() {
      panel.querySelector('#archive-grade-grid').style.display = 'grid'
      var sl = panel.querySelector('#archive-subj-list')
      sl.style.display = 'none'; sl.innerHTML = ''
      panel.querySelector('#archive-back-btn').style.display = 'none'
      panel.querySelectorAll('.archive-grade-btn').forEach(function(b) { b.classList.remove('selected') })
    })
    panel.querySelectorAll('.archive-grade-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        panel.querySelectorAll('.archive-grade-btn').forEach(function(b) { b.classList.remove('selected') })
        btn.classList.add('selected')
        var grade = btn.dataset.ag
        var gradeNum = btn.dataset.agNum
        panel.querySelector('#archive-grade-grid').style.display = 'none'
        panel.querySelector('#archive-back-btn').style.display = 'inline-flex'
        var sl = panel.querySelector('#archive-subj-list')
        sl.style.display = 'flex'; sl.innerHTML = ''
        ;[['英文','en','📘','s-en'],['數學','ma','📐','s-ma']].forEach(function(s) {
          var sbtn = document.createElement('button')
          sbtn.className = 'exam-subj-btn ' + s[3]
          sbtn.innerHTML = '<span class="subj-icon">' + s[2] + '</span>'
            + '<span class="subj-name">' + esc(s[0]) + '</span>'
            + '<span class="subj-label">查看題目</span>'
          sbtn.addEventListener('click', function() {
            document.querySelectorAll('.grade').forEach(function(g) { g.classList.remove('active') })
            var gEl = document.querySelector('.grade[data-g="' + gradeNum + '"]')
            if (gEl) gEl.classList.add('active')
            document.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active') })
            var tEl = document.querySelector('.tab[data-subj="' + s[1] + '"]')
            if (tEl) tEl.classList.add('active')
            var hdr = document.querySelector('#archive-inline-msg h3')
            if (hdr) hdr.textContent = '📚 ' + grade + '　' + s[0] + '　歷屆題庫'
            panel.style.display = 'none'
            openArchive()
          })
          sl.appendChild(sbtn)
        })
      })
    })
    return panel
  }

  function fetchArchive(isMore) {
    if (archiveFetching) return
    archiveFetching = true
    if (!isMore) { archivePage = 1; archiveLoaded = 0 }

    var f = getFilters()
    var reqPage = isMore ? archivePage + 1 : 1
    var params = 'page=' + reqPage
    if (f.grade)   params += '&grade='   + encodeURIComponent(f.grade)
    if (f.subject) params += '&subject=' + encodeURIComponent(f.subject)

    var ac = getContainer('archive-cards')
    if (!isMore && ac) {
      ac.innerHTML = '<p style="text-align:center;padding:20px;color:var(--ink-mute,#A593A0)">載入中…</p>'
    }

    fetch(API_BASE + '/practice/archive?' + params)
      .then(function(r) { return r.json() })
      .then(function(json) {
        archiveFetching = false
        if (!json.ok || !json.data) {
          var ac = getContainer('archive-cards')
          if (ac) ac.innerHTML = '<p style="text-align:center;padding:20px;color:#E60D85">載入失敗，請稍後再試。</p>'
          return
        }
        var qs = json.data.questions || []
        var ac = getContainer('archive-cards')
        if (!isMore && ac) ac.innerHTML = ''
        if (!isMore && !qs.length && ac) {
          ac.innerHTML = '<p style="text-align:center;padding:20px;color:var(--ink-mute,#A593A0)">目前沒有符合條件的歷屆題目</p>'
          return
        }
        qs.forEach(function(q, i) { appendCard(q, archiveLoaded + i + 1, 'archive-cards') })
        archiveLoaded += qs.length
        archivePage = json.data.page

        var moreBtn  = document.getElementById('archive-load-more')
        var limitMsg = document.getElementById('archive-limit-msg')
        if (json.data.reachedLimit) {
          if (moreBtn) moreBtn.style.display = 'none'
          if (limitMsg) limitMsg.style.display = ''
        } else if (json.data.hasMore) {
          if (moreBtn) moreBtn.style.display = ''
          if (limitMsg) limitMsg.style.display = 'none'
        } else {
          if (moreBtn) moreBtn.style.display = 'none'
        }
      })
      .catch(function() {
        archiveFetching = false
        var ac = getContainer('archive-cards')
        if (ac) ac.innerHTML = '<p style="text-align:center;padding:20px;color:#E60D85">載入失敗，請稍後再試。</p>'
      })
  }

  function openArchive() {
    var msg = document.getElementById('archive-inline-msg')
    if (!msg) return
    var wasHidden = msg.style.display === 'none' || !msg.style.display
    msg.style.display = 'block'
    msg.scrollIntoView({ behavior: 'smooth', block: 'start' })
    if (wasHidden || archiveLoaded === 0) fetchArchive(false)
  }

  function bindAll() {
    /* 年級 .grade[data-g] — radio button behavior, always one selected */
    document.querySelectorAll('.grade').forEach(function(btn) {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.grade').forEach(function(b) { b.classList.remove('active') })
        btn.classList.add('active')
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

    /* 考前複習 banner — 開啟年級選擇面板 */
    var examBanner = document.querySelector('.qbanner.b-review')
    if (examBanner) {
      examBanner.addEventListener('click', function(e) {
        e.preventDefault()
        e.stopImmediatePropagation()
        var panel = ensureExamPanel()
        panel.style.display = 'flex'
        /* reset to grade selection state */
        var gradeGrid   = panel.querySelector('#exam-grade-grid')
        var inactiveMsg = panel.querySelector('#exam-inactive-msg')
        var subjectList = panel.querySelector('#exam-subject-list')
        var backBtn     = panel.querySelector('#exam-back-btn')
        if (gradeGrid)   gradeGrid.style.display = 'grid'
        if (inactiveMsg) inactiveMsg.style.display = 'none'
        if (subjectList) { subjectList.style.display = 'none'; subjectList.innerHTML = '' }
        if (backBtn)     backBtn.style.display = 'none'
        panel.querySelectorAll('.exam-grade-btn').forEach(function(b) { b.classList.remove('selected') })
      })
    } else {
      console.warn('practice.js: .qbanner.b-review not found')
    }

    var inlineClose = document.getElementById('archive-inline-close')
    if (inlineClose) {
      inlineClose.addEventListener('click', function() {
        var msg = document.getElementById('archive-inline-msg')
        if (msg) msg.style.display = 'none'
        window.scrollTo({ top: 0, behavior: 'smooth' })
      })
    }

    var archiveMoreBtn = document.getElementById('archive-load-more')
    if (archiveMoreBtn) {
      archiveMoreBtn.addEventListener('click', function() { fetchArchive(true) })
    }

    /* 歷屆題庫 banner */
    var pastBanner = document.querySelector('.qbanner.b-past')
    if (pastBanner) {
      pastBanner.addEventListener('click', function(e) {
        e.preventDefault()
        e.stopImmediatePropagation()
        var panel = ensureArchivePanel()
        panel.style.display = 'flex'
        var gg = panel.querySelector('#archive-grade-grid')
        var sl = panel.querySelector('#archive-subj-list')
        var bb = panel.querySelector('#archive-back-btn')
        if (gg) gg.style.display = 'grid'
        if (sl) { sl.style.display = 'none'; sl.innerHTML = '' }
        if (bb) bb.style.display = 'none'
        panel.querySelectorAll('.archive-grade-btn').forEach(function(b) { b.classList.remove('selected') })
      })
    } else {
      console.warn('practice.js: .qbanner.b-past not found')
    }

    /* Mina 小幫手 btn-w */
    var widgetBtn = document.querySelector('.btn-w')
    if (widgetBtn) {
      widgetBtn.addEventListener('click', function(e) {
        e.preventDefault()
        openArchive()
      })
    } else {
      console.warn('practice.js: .btn-w not found')
    }

    /* 載入更多 */
    var moreBtn = document.getElementById('load-more-btn') || document.querySelector('[data-load-more]')
    if (moreBtn) {
      moreBtn.addEventListener('click', function() { fetchQuestions(true) })
    }

    /* Archive CTA → 開啟歷屆面板 */
    var archiveBtn = document.getElementById('open-archive-btn') || document.querySelector('[data-open-archive]')
    if (archiveBtn) {
      archiveBtn.addEventListener('click', function(e) {
        e.preventDefault()
        openArchive()
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
    fetchQuestions(false)
  }

  /* Bundler detection:
   * The bundler uses document.open()/write()/close() to replace the entire document.
   * After that, DOMContentLoaded does NOT re-fire for scripts from the old document.
   * Solution: MutationObserver + setInterval polling for #qcards to appear. */
  function deferInit() {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(function() { init() }, { timeout: 2000 })
    } else {
      setTimeout(init, 200)
    }
  }
  if (getContainer()) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', deferInit)
    } else {
      deferInit()
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
