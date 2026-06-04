/* faq.js — FAQ Accordion + Mina Chat Widget */

(function () {
  'use strict';

  /* ── FAQ fallback data ── */
  var FAQ_LOCAL = [
    {category:'試聽報名',question:'怎麼預約免費試聽？',answer:'最快的方式是點網站上的「預約免費試聽」填表，或直接打 04-2336-6868。我們會依孩子的年級與科目，幫忙安排合適的試聽時段。'},
    {category:'試聽報名',question:'試聽要收費嗎？需要準備什麼？',answer:'第一堂試聽完全免費。只要帶孩子本人來就可以，不需要特別準備；想帶上學校課本讓老師了解進度也很歡迎。'},
    {category:'試聽報名',question:'可以中途插班嗎？',answer:'可以。我們會先了解孩子目前的進度，必要時安排簡單的程度確認，再幫他銜接到合適的班別。'},
    {category:'課程費用',question:'學費怎麼計算？',answer:'費用依年級、科目與時數不同。詳細費用建議直接找 Mina 或來電洽詢，我們會提供清楚的收費說明，沒有隱藏費用。'},
    {category:'課程費用',question:'有提供教材嗎？教材費另計嗎？',answer:'英文搭配徐薇英文教材、數學使用偉智數學教材。教材費用會在報名時一併說明，讓家長清楚每一筆花費。'},
    {category:'課程費用',question:'一班大概多少人？',answer:'我們採小班教學，讓老師能照顧到每個孩子的學習狀況。實際人數依班別而定，歡迎洽詢目前各班名額。'},
    {category:'安親接送',question:'有課後安親嗎？時間到幾點？',answer:'有的。安親從放學後到晚間，包含作業督導與生活照顧，並能無縫銜接英數課程。實際時間以現場公告為準。'},
    {category:'安親接送',question:'會幫忙看作業嗎？',answer:'會。安親時段老師會督導孩子完成並訂正功課，遇到不懂的地方也會即時指導。'},
    {category:'安親接送',question:'位置在哪？接送方便嗎？',answer:'我們就在台中市烏日區健行北路96號，緊鄰旭光國小，孩子放學走過來大約 3 分鐘，接送非常方便。'},
    {category:'其他',question:'服務時間是？',answer:'服務時間為週一至週五 13:30–20:00。週六另有正音等假日課程，建議先來電確認當週時段。'},
    {category:'其他',question:'寒暑假有營隊嗎？',answer:'有夏令營與冬令營，並搭配正音與多元課程，讓孩子假期也能持續學習、探索興趣。詳情可參考課程介紹頁。'},
  ];

  var allFaqs = [];
  var curCat = '全部';

  /* ── FAQ fetch and render ── */
  function loadFaq() {
    fetch('/api/v1/faq')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var faqs = (data.data && data.data.faqs) || [];
        allFaqs = faqs.length ? faqs : FAQ_LOCAL;
        renderFAQ();
      })
      .catch(function () {
        allFaqs = FAQ_LOCAL;
        renderFAQ();
      });
  }

  function renderFAQ() {
    var list = document.getElementById('faqList');
    if (!list) return;
    var items = allFaqs.filter(function (f) {
      return curCat === '全部' || f.category === curCat;
    });
    list.innerHTML = items.map(function (f, i) {
      return '<details class="qcard faq-item"' + (i === 0 ? ' open' : '') + '>' +
        '<summary><span class="qnum">Q</span>' + escHtml(f.question) + '<span class="plus">+</span></summary>' +
        '<div class="qbody"><p>' + escHtml(f.answer) + '</p></div>' +
        '</details>';
    }).join('');
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function initCatFilter() {
    document.querySelectorAll('#faqCats .chip').forEach(function (c) {
      c.addEventListener('click', function () {
        document.querySelectorAll('#faqCats .chip').forEach(function (x) { x.classList.remove('active'); });
        c.classList.add('active');
        curCat = c.dataset.cat;
        renderFAQ();
      });
    });
  }

  /* ── Mina Chat Widget ── */
  var REPLIES = [
    {k:['試聽','預約','報名'],a:'預約試聽很簡單～點網站上的「預約免費試聽」填表，或打 04-2336-6868，我幫您安排合適的時段！要我直接帶您去預約頁嗎？😊'},
    {k:['費用','學費','多少錢','價格','錢'],a:'費用會依年級、科目與時數不同喔。方便留個方便的時間嗎？我請老師給您最清楚的費用說明，完全沒有隱藏費用！'},
    {k:['安親','接送','作業','照顧'],a:'有的～放學後安親包含作業督導與生活照顧，還能銜接英數課程。我們就在旭光國小旁，接送很方便喔！'},
    {k:['地址','哪裡','位置','地點','在哪'],a:'我們在台中市烏日區健行北路96號，緊鄰旭光國小，放學走過來大約 3 分鐘～需要地圖導航連結嗎？📍'},
    {k:['時間','幾點','營業','服務'],a:'服務時間是週一至週五 13:30–20:00 喔，週六另有正音等假日課程。想了解哪一科的時段呢？'},
    {k:['英文','徐薇'],a:'英文是徐薇英文 UP學，從自然發音到文法閱讀都有，分級上課。要不要先安排一堂免費試聽看看？'},
    {k:['數學','偉智'],a:'數學是偉智數學 WISE，重視觀念建立與解題策略，段考進步很有感！想試聽可以直接跟我說孩子的年級～'},
  ];

  function addBub(txt, who) {
    var body = document.getElementById('mcBody');
    if (!body) return;
    var d = document.createElement('div');
    d.className = 'b ' + who;
    d.textContent = txt;
    body.appendChild(d);
    body.scrollTop = body.scrollHeight;
  }

  function showTyping() {
    var body = document.getElementById('mcBody');
    if (!body) return null;
    var t = document.createElement('div');
    t.className = 'mc-typing';
    t.innerHTML = '<i></i><i></i><i></i>';
    body.appendChild(t);
    body.scrollTop = body.scrollHeight;
    return t;
  }

  function getLocalReply(msg) {
    for (var i = 0; i < REPLIES.length; i++) {
      if (REPLIES[i].k.some(function (k) { return msg.indexOf(k) !== -1; })) {
        return REPLIES[i].a;
      }
    }
    return '這個問題我幫您轉給老師，老師會親自回覆您喔！也可以直接打 04-2336-6868 找我們～😊';
  }

  function answer(msg) {
    var t = showTyping();
    fetch('/api/v1/mina/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg })
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (t) t.remove();
        addBub((data.data && data.data.reply) || getLocalReply(msg), 'mina');
      })
      .catch(function () {
        if (t) t.remove();
        addBub(getLocalReply(msg), 'mina');
      });
  }

  function initMinaChat() {
    document.querySelectorAll('#mcQuick button').forEach(function (b) {
      b.addEventListener('click', function () {
        addBub(b.dataset.q, 'me');
        answer(b.dataset.q);
      });
    });
    var form = document.getElementById('mcForm');
    var text = document.getElementById('mcText');
    if (form && text) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var v = text.value.trim();
        if (!v) return;
        addBub(v, 'me');
        text.value = '';
        answer(v);
      });
    }
  }

  /* ── Init ── */
  document.addEventListener('DOMContentLoaded', function () {
    loadFaq();
    initCatFilter();
    initMinaChat();
  });

}());
