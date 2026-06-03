/* practice.js — 題庫練習 */

(function () {
  'use strict';

  var state = {
    subject: 'en',
    grade: '1-2',
    questions: [],
    current: 0,
    score: 0,
    answered: false
  };

  /* ── Elements ── */
  var setupEl    = document.getElementById('practice-setup');
  var quizEl     = document.getElementById('practice-quiz');
  var resultEl   = document.getElementById('practice-result');

  var subjectBtns = document.querySelectorAll('.subject-btn');
  var gradeBtns   = document.querySelectorAll('.grade-btn');
  var startBtn    = document.getElementById('start-btn');
  var nextBtn     = document.getElementById('next-btn');
  var quitBtn     = document.getElementById('quit-btn');
  var retryBtn    = document.getElementById('retry-btn');

  if (!setupEl) return; /* Not on practice page */

  /* ── Subject selector ── */
  subjectBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      subjectBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      state.subject = btn.dataset.subject;
      /* Update grade btn active color */
      updateGradeColors();
    });
  });

  function updateGradeColors() {
    gradeBtns.forEach(function (btn) {
      if (btn.classList.contains('active')) {
        btn.style.background = state.subject === 'ma' ? 'var(--orange)' : 'var(--pink)';
        btn.style.borderColor = state.subject === 'ma' ? 'var(--orange)' : 'var(--pink)';
      }
    });
  }

  /* ── Grade selector ── */
  gradeBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      gradeBtns.forEach(function (b) {
        b.classList.remove('active');
        b.style.background = '';
        b.style.borderColor = '';
        b.style.color = '';
      });
      btn.classList.add('active');
      btn.style.background = state.subject === 'ma' ? 'var(--orange)' : 'var(--pink)';
      btn.style.borderColor = state.subject === 'ma' ? 'var(--orange)' : 'var(--pink)';
      btn.style.color = '#fff';
      state.grade = btn.dataset.grade;
    });
  });

  /* ── Start ── */
  startBtn && startBtn.addEventListener('click', function () {
    loadQuestions(state.subject, state.grade);
  });

  function loadQuestions(subject, grade) {
    fetch('/api/v1/practice?subject=' + subject + '&grade=' + encodeURIComponent(grade))
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var questions = (data.data && data.data.questions) || [];
        if (!questions.length) {
          window.showToast && window.showToast('題目資料暫時無法載入，請稍後再試。');
          return;
        }
        state.questions = questions;
        state.current = 0;
        state.score = 0;
        state.answered = false;
        showQuiz();
      })
      .catch(function () {
        window.showToast && window.showToast('無法連線，請確認網路後再試。');
      });
  }

  /* ── Show/hide panels ── */
  function showSetup() {
    setupEl.style.display = 'block';
    quizEl.style.display  = 'none';
    resultEl.style.display = 'none';
  }

  function showQuiz() {
    setupEl.style.display = 'none';
    quizEl.style.display  = 'block';
    resultEl.style.display = 'none';
    renderQuestion();
  }

  function showResult() {
    setupEl.style.display = 'none';
    quizEl.style.display  = 'none';
    resultEl.style.display = 'block';

    var total = state.questions.length;
    var pct = total > 0 ? Math.round((state.score / total) * 100) : 0;
    document.getElementById('final-score').textContent = pct;
    document.getElementById('max-score').textContent = '100';

    var msg = '';
    if (pct >= 90) msg = '太厲害了！你掌握得非常好 🎉';
    else if (pct >= 70) msg = '表現不錯！繼續保持 😊';
    else if (pct >= 50) msg = '還有進步空間，多練習幾次吧！';
    else msg = '不要氣餒，繼續努力！試聽一堂課，老師幫你打好基礎。';
    document.getElementById('result-message').textContent = msg;
  }

  /* ── Render question ── */
  function renderQuestion() {
    var q = state.questions[state.current];
    if (!q) return;

    state.answered = false;
    nextBtn.style.display = 'none';

    var total = state.questions.length;
    document.getElementById('q-current').textContent = state.current + 1;
    document.getElementById('q-total').textContent = total;
    document.getElementById('q-score').textContent = state.score;

    var pct = Math.round(((state.current) / total) * 100);
    document.getElementById('quiz-progress-bar').style.width = pct + '%';

    document.getElementById('quiz-question').textContent = q.question;

    var optionsEl = document.getElementById('quiz-options');
    optionsEl.innerHTML = '';
    q.options.forEach(function (opt) {
      var btn = document.createElement('button');
      btn.className = 'quiz-option';
      btn.textContent = opt;
      btn.type = 'button';
      btn.addEventListener('click', function () { selectOption(btn, opt, q); });
      optionsEl.appendChild(btn);
    });

    var expEl = document.getElementById('quiz-explanation');
    expEl.className = 'quiz-explanation';
    expEl.innerHTML = '';
  }

  function selectOption(btn, selected, q) {
    if (state.answered) return;
    state.answered = true;

    var correct = q.answer;
    var optBtns = document.querySelectorAll('.quiz-option');

    optBtns.forEach(function (b) {
      b.classList.remove('selected');
      if (b.textContent === correct) b.classList.add('correct');
    });

    if (selected === correct) {
      btn.classList.add('correct');
      state.score++;
    } else {
      btn.classList.add('wrong');
    }

    document.getElementById('q-score').textContent = state.score;

    var expEl = document.getElementById('quiz-explanation');
    expEl.innerHTML = '<strong>' + (selected === correct ? '✓ 答對了！' : '✗ 答錯了') + '</strong> ' + (q.explanation || '');
    expEl.classList.add('show');

    nextBtn.style.display = 'inline-flex';
  }

  /* ── Next / Quit / Retry ── */
  nextBtn && nextBtn.addEventListener('click', function () {
    state.current++;
    if (state.current >= state.questions.length) {
      showResult();
    } else {
      renderQuestion();
    }
  });

  quitBtn && quitBtn.addEventListener('click', function () {
    if (state.current > 0) {
      showResult();
    } else {
      showSetup();
    }
  });

  retryBtn && retryBtn.addEventListener('click', function () {
    showSetup();
  });

}());
