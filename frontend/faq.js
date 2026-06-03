/* faq.js — FAQ Accordion + Mina Widget */

(function () {
  'use strict';

  /* ── FAQ List ── */

  function loadFaq() {
    var faqList = document.getElementById('faq-list');
    var skeleton = document.getElementById('faq-skeleton');
    if (!faqList) return;

    fetch('/api/v1/faq')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var faqs = (data.data && data.data.faqs) || [];
        if (skeleton) skeleton.style.display = 'none';
        if (!faqs.length) {
          faqList.innerHTML = '<p style="color:var(--ink-3);text-align:center;padding:40px 0;">暫無問題內容，請稍後再看。</p>';
          return;
        }
        renderFaqList(faqList, faqs);
      })
      .catch(function () {
        if (skeleton) skeleton.style.display = 'none';
        faqList.innerHTML = '<p style="color:var(--ink-3);text-align:center;padding:40px 0;">無法載入常見問題，請重新整理頁面。</p>';
      });
  }

  function renderFaqList(container, faqs) {
    /* Group by category */
    var categories = [];
    var categoryMap = {};
    faqs.forEach(function (faq) {
      var cat = faq.category || '其他';
      if (!categoryMap[cat]) {
        categoryMap[cat] = [];
        categories.push(cat);
      }
      categoryMap[cat].push(faq);
    });

    var html = '';
    categories.forEach(function (cat) {
      html += '<p class="faq-category-title">' + cat + '</p>';
      categoryMap[cat].forEach(function (faq) {
        html +=
          '<div class="faq-item">' +
          '<div class="faq-question" role="button" tabindex="0" aria-expanded="false">' +
          '<span>' + faq.question + '</span>' +
          '<span class="faq-icon" aria-hidden="true">+</span>' +
          '</div>' +
          '<div class="faq-answer" aria-hidden="true">' +
          '<p>' + faq.answer + '</p>' +
          '</div>' +
          '</div>';
      });
    });

    container.innerHTML = html;

    /* Bind accordion */
    container.querySelectorAll('.faq-item').forEach(function (item) {
      var question = item.querySelector('.faq-question');
      question.addEventListener('click', function () { toggleFaq(item); });
      question.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleFaq(item); }
      });
    });
  }

  function toggleFaq(item) {
    var isOpen = item.classList.contains('open');
    /* Close all siblings */
    var parent = item.parentElement;
    parent.querySelectorAll('.faq-item.open').forEach(function (el) {
      el.classList.remove('open');
      el.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
      el.querySelector('.faq-answer').setAttribute('aria-hidden', 'true');
    });
    if (!isOpen) {
      item.classList.add('open');
      item.querySelector('.faq-question').setAttribute('aria-expanded', 'true');
      item.querySelector('.faq-answer').setAttribute('aria-hidden', 'false');
    }
  }

  /* ── Mina Widget ── */

  var minaData = null;
  var currentNodeId = 'root';

  function loadMinaData() {
    return fetch('/api/v1/mina/data')
      .then(function (r) { return r.json(); })
      .then(function (d) { minaData = d.data || d; })
      .catch(function () { minaData = null; });
  }

  function initMinaWidget() {
    var trigger = document.getElementById('mina-trigger');
    var panel = document.getElementById('mina-panel');
    var closeBtn = document.getElementById('mina-close');
    var body = document.getElementById('mina-body');

    if (!trigger || !panel || !body) return;

    trigger.addEventListener('click', function () {
      var isOpen = panel.classList.toggle('open');
      panel.setAttribute('aria-hidden', String(!isOpen));
      if (isOpen && !minaData) {
        loadMinaData().then(function () { startConversation(body); });
      } else if (isOpen) {
        startConversation(body);
      }
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        panel.classList.remove('open');
        panel.setAttribute('aria-hidden', 'true');
      });
    }
  }

  function startConversation(body) {
    if (!minaData) {
      body.innerHTML = '<div class="mina-msg bot">哈囉！我是 Mina 小幫手 👋 目前無法連線，請直接撥打 <strong>04-2336-6868</strong> 詢問。</div>';
      return;
    }
    currentNodeId = 'root';
    body.innerHTML = '';
    appendMessage(body, minaData.welcome || '你好！我是 Mina 小幫手 👋', 'bot', null);
    renderNode(body, currentNodeId);
  }

  function renderNode(body, nodeId) {
    if (!minaData || !minaData.nodes) return;
    var node = minaData.nodes[nodeId];
    if (!node) return;
    currentNodeId = nodeId;

    /* Show node text */
    if (node.text) {
      appendMessage(body, node.text, 'bot', node.cta || null);
    }

    /* Handoff */
    if (node.type === 'handoff') {
      var hdText = minaData.handoffMessage || '這個問題讓老師來親自回答更好喔 😊';
      var hdCta  = minaData.handoffCta || null;
      if (!node.text) appendMessage(body, hdText, 'bot', hdCta);
      appendContact(body);
      return;
    }

    /* Options */
    if (node.options && node.options.length) {
      appendOptions(body, node.options);
    }

    /* Scroll to bottom */
    body.scrollTop = body.scrollHeight;
  }

  function appendMessage(body, text, side, cta) {
    var div = document.createElement('div');
    div.className = 'mina-msg ' + side;
    div.textContent = text;

    if (cta) {
      var a = document.createElement('a');
      a.href = cta.url;
      a.className = 'mina-cta-btn';
      a.textContent = cta.label;
      if (cta.url && cta.url.startsWith('http')) {
        a.target = '_blank';
        a.rel = 'noopener';
      }
      div.appendChild(document.createElement('br'));
      div.appendChild(a);
    }

    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
  }

  function appendOptions(body, options) {
    var wrap = document.createElement('div');
    wrap.className = 'mina-options';

    options.forEach(function (opt) {
      var btn = document.createElement('button');
      btn.className = 'mina-option-btn';
      btn.textContent = opt.label;
      btn.type = 'button';
      btn.addEventListener('click', function () {
        /* Show user's selection */
        var userMsg = document.createElement('div');
        userMsg.className = 'mina-msg';
        userMsg.style.cssText = 'background:var(--pink);color:#fff;align-self:flex-end;border-bottom-right-radius:4px;margin-left:auto;';
        userMsg.textContent = opt.label;
        body.appendChild(userMsg);

        /* Remove options */
        wrap.remove();
        renderNode(body, opt.nodeId);
      });
      wrap.appendChild(btn);
    });

    body.appendChild(wrap);
    body.scrollTop = body.scrollHeight;
  }

  function appendContact(body) {
    var div = document.createElement('div');
    div.className = 'mina-msg bot';
    div.innerHTML =
      '<div style="display:flex;flex-direction:column;gap:8px;margin-top:4px;">' +
      '<a href="tel:0423366868" class="mina-cta-btn">📞 04-2336-6868</a>' +
      '<a href="#" data-todo="LINE_URL" class="mina-cta-btn" style="background:var(--green);">💬 LINE 官方帳號</a>' +
      '<a href="/booking.html" class="mina-cta-btn">📅 預約試聽</a>' +
      '</div>';
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
  }

  /* ── Init ── */

  document.addEventListener('DOMContentLoaded', function () {
    loadFaq();
    initMinaWidget();
  });

}());
