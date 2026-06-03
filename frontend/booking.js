/* booking.js — 預約表單驗證與送出 */

(function () {
  'use strict';

  var form = document.getElementById('booking-form');
  if (!form) return;

  /* ── Validation helpers ── */

  function showError(id, show) {
    var el = document.getElementById(id);
    if (el) el.classList.toggle('show', show);
  }

  function markField(fieldId, hasError) {
    var el = document.getElementById(fieldId);
    if (el) el.classList.toggle('error', hasError);
  }

  function clearErrors() {
    form.querySelectorAll('.form-error').forEach(function (el) { el.classList.remove('show'); });
    form.querySelectorAll('.form-input, .form-select, .form-textarea').forEach(function (el) { el.classList.remove('error'); });
  }

  function isValidPhone(val) {
    return /^[\d\-\+\(\)\s]{7,20}$/.test(val.trim());
  }

  function validate() {
    clearErrors();
    var valid = true;

    var parentName = document.getElementById('parent-name');
    if (!parentName || !parentName.value.trim()) {
      showError('err-parent-name', true);
      markField('parent-name', true);
      valid = false;
    }

    var phone = document.getElementById('phone');
    if (!phone || !isValidPhone(phone.value)) {
      showError('err-phone', true);
      markField('phone', true);
      valid = false;
    }

    var studentName = document.getElementById('student-name');
    if (!studentName || !studentName.value.trim()) {
      showError('err-student-name', true);
      markField('student-name', true);
      valid = false;
    }

    var grade = document.getElementById('grade');
    if (!grade || !grade.value) {
      showError('err-grade', true);
      markField('grade', true);
      valid = false;
    }

    var courses = form.querySelectorAll('input[name="courses"]:checked');
    if (courses.length === 0) {
      showError('err-courses', true);
      valid = false;
    }

    return valid;
  }

  /* ── Submit ── */

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate()) return;

    var submitBtn = document.getElementById('submit-btn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = '送出中…';
    }

    var courses = [];
    form.querySelectorAll('input[name="courses"]:checked').forEach(function (cb) {
      courses.push(cb.value);
    });

    var payload = {
      parentName:    document.getElementById('parent-name').value.trim(),
      phone:         document.getElementById('phone').value.trim(),
      studentName:   document.getElementById('student-name').value.trim(),
      grade:         document.getElementById('grade').value,
      courses:       courses,
      preferredTime: document.getElementById('preferred-time').value,
      note:          document.getElementById('note').value.trim()
    };

    fetch('/api/v1/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.ok) {
          window.location.replace('booking-success.html');
        } else {
          throw new Error(data.error && data.error.message || '送出失敗');
        }
      })
      .catch(function (err) {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = '送出預約申請 →';
        }
        window.showToast && window.showToast('送出失敗，請再試一次或直接電話聯繫。');
      });
  });

  /* ── Real-time validation ── */

  ['parent-name', 'phone', 'student-name'].forEach(function (id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('blur', function () {
      var empty = !el.value.trim();
      var invalid = id === 'phone' ? !isValidPhone(el.value) : empty;
      markField(id, invalid);
      showError('err-' + id, invalid);
    });
  });

  var gradeEl = document.getElementById('grade');
  if (gradeEl) {
    gradeEl.addEventListener('change', function () {
      var empty = !gradeEl.value;
      markField('grade', empty);
      showError('err-grade', empty);
    });
  }

}());
