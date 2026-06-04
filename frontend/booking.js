/* booking.js — 預約表單送出（POST /api/v1/bookings） */

(function () {
  'use strict';

  /* ── Subject option toggle ── */
  document.querySelectorAll('#subjOpts .opt').forEach(function (o) {
    o.addEventListener('click', function () { o.classList.toggle('on'); });
  });

  /* ── Form submit ── */
  var form = document.getElementById('bookForm');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var btn = form.querySelector('.form-submit');
    if (btn) { btn.disabled = true; btn.textContent = '送出中…'; }

    var subjects = [];
    document.querySelectorAll('#subjOpts .opt.on').forEach(function (o) {
      subjects.push(o.dataset.v || o.textContent.trim());
    });

    var payload = {
      parentName:    (form.elements['name']  ? form.elements['name'].value.trim()  : ''),
      phone:         (form.elements['phone'] ? form.elements['phone'].value.trim() : ''),
      grade:         (form.elements['grade'] ? form.elements['grade'].value        : ''),
      subjects:      subjects,
      preferredTime: (form.elements['time']  ? form.elements['time'].value         : ''),
      note:          (form.elements['note']  ? form.elements['note'].value.trim()  : '')
    };

    if (!payload.parentName || !payload.phone) {
      if (btn) { btn.disabled = false; btn.textContent = '送出預約 · Mina 盡快回覆您 →'; }
      alert('請填寫姓名與聯絡電話。');
      return;
    }

    fetch('/api/v1/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (data) {
        if (data.ok || data.id) {
          window.location.replace('booking-success.html');
        } else {
          throw new Error((data.error && data.error.message) || '送出失敗');
        }
      })
      .catch(function () {
        if (btn) { btn.disabled = false; btn.textContent = '送出預約 · Mina 盡快回覆您 →'; }
        alert('送出失敗，請稍後再試，或直接來電 04-2336-6868。');
      });
  });

}());
