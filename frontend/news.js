/* news.js — 最新消息列表 + 單篇文章 */

(function () {
  'use strict';

  var API_BASE = 'https://mina-api.hua19911027.workers.dev';
  var PAGE_SIZE = 9;
  var currentCategory = 'all';
  var currentPage = 1;
  var hasMore = false;

  /* ── Helpers ── */
  function formatDate(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    return d.getFullYear() + '.' +
      String(d.getMonth() + 1).padStart(2, '0') + '.' +
      String(d.getDate()).padStart(2, '0');
  }

  function truncate(str, max) {
    if (!str) return '';
    return str.length > max ? str.slice(0, max) + '…' : str;
  }

  var CAT_CLASS = { '公告': 'c-notice', '活動': 'c-event', '特別課程': 'c-course', '文章': 'c-article' };
  var CAT_EMOJI = { '公告': '📢', '活動': '☀️', '特別課程': '🔤', '文章': '📖' };

  /* ── Article Card Factory — matches .ncard prototype structure ── */
  function buildCard(article) {
    var a = document.createElement('a');
    a.href = 'news-single.html?slug=' + encodeURIComponent(article.slug);
    a.className = 'ncard reveal';

    var catCls = CAT_CLASS[article.category] || '';
    var cover = document.createElement('div');
    cover.className = 'nc-cover ' + catCls;

    if (article.coverImage) {
      var img = document.createElement('img');
      img.src = article.coverImage;
      img.alt = article.title;
      img.loading = 'lazy';
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;';
      img.onerror = function () {
        this.style.display = 'none';
        var ico = document.createElement('span');
        ico.className = 'nc-ico';
        ico.textContent = CAT_EMOJI[article.category] || '📰';
        cover.appendChild(ico);
      };
      cover.appendChild(img);
    } else {
      var ico = document.createElement('span');
      ico.className = 'nc-ico';
      ico.textContent = CAT_EMOJI[article.category] || '📰';
      cover.appendChild(ico);
    }

    var catEl = document.createElement('span');
    catEl.className = 'nc-cat ' + catCls;
    catEl.textContent = article.category;

    var dateEl = document.createElement('span');
    dateEl.className = 'nc-date';
    dateEl.textContent = formatDate(article.publishedAt);

    var meta = document.createElement('div');
    meta.className = 'nc-meta';
    meta.appendChild(catEl);
    meta.appendChild(dateEl);

    var title = document.createElement('h3');
    title.textContent = article.title;

    var excerpt = document.createElement('p');
    excerpt.className = 'nc-excerpt';
    excerpt.textContent = truncate(article.excerpt || '', 80);

    var more = document.createElement('span');
    more.className = 'nc-more';
    more.textContent = '閱讀更多 →';

    var body = document.createElement('div');
    body.className = 'nc-body';
    body.appendChild(meta);
    body.appendChild(title);
    body.appendChild(excerpt);
    body.appendChild(more);

    a.appendChild(cover);
    a.appendChild(body);
    return a;
  }

  /* ── Skeleton card ── */
  function buildSkeleton() {
    var el = document.createElement('div');
    el.className = 'ncard';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML =
      '<div class="nc-cover" style="background:var(--bg-2);animation:shimmer 1.4s infinite;"></div>' +
      '<div class="nc-body">' +
      '<div style="height:13px;background:var(--line);border-radius:4px;width:38%;margin-bottom:10px;"></div>' +
      '<div style="height:17px;background:var(--line);border-radius:4px;width:92%;margin-bottom:8px;"></div>' +
      '<div style="height:13px;background:var(--line);border-radius:4px;width:68%;"></div>' +
      '</div>';
    return el;
  }

  /* ── Trigger reveal on dynamically added cards ── */
  function revealNewCards(container) {
    if (!('IntersectionObserver' in window)) {
      container.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('in'); obs.unobserve(entry.target); }
      });
    }, { threshold: 0.08 });
    container.querySelectorAll('.reveal:not(.in)').forEach(function (el) { obs.observe(el); });
  }

  /* ── Fetch and render list page ── */
  function fetchNews(category, page, append) {
    var grid = document.getElementById('newsGrid');
    var emptyEl = document.getElementById('newsEmpty');
    var loadMoreWrap = document.getElementById('load-more-wrap');
    if (!grid) return;

    if (!append) {
      grid.innerHTML = '';
      for (var i = 0; i < 3; i++) grid.appendChild(buildSkeleton());
    }

    var url = API_BASE + '/api/v1/news?page=' + page + '&limit=' + PAGE_SIZE;
    if (category && category !== 'all') url += '&category=' + encodeURIComponent(category);

    fetch(url)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!append) grid.innerHTML = '';
        var articles = (data.data && data.data.articles) || [];
        hasMore = !!(data.data && data.data.hasMore);
        console.log('[news.js] articles loaded:', articles.length);

        if (!articles.length && !append) {
          if (emptyEl) emptyEl.classList.add('show');
          if (loadMoreWrap) loadMoreWrap.style.display = 'none';
          return;
        }
        if (emptyEl) emptyEl.classList.remove('show');
        articles.forEach(function (a) { grid.appendChild(buildCard(a)); });
        revealNewCards(grid);
        if (loadMoreWrap) loadMoreWrap.style.display = hasMore ? 'block' : 'none';
      })
      .catch(function () {
        if (!append) {
          grid.innerHTML = '';
          if (emptyEl) emptyEl.classList.add('show');
        }
      });
  }

  /* ── Init list page ── */
  function initListPage() {
    var filterBar = document.getElementById('newsFilter');
    var loadMoreBtn = document.getElementById('load-more-btn');
    if (!filterBar) return;

    fetchNews(currentCategory, 1, false);

    filterBar.addEventListener('click', function (e) {
      var btn = e.target.closest('.nfilter');
      if (!btn) return;
      filterBar.querySelectorAll('.nfilter').forEach(function (t) { t.classList.remove('active'); });
      btn.classList.add('active');
      currentCategory = btn.dataset.cat;
      currentPage = 1;
      fetchNews(currentCategory, currentPage, false);
    });

    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', function () {
        currentPage++;
        fetchNews(currentCategory, currentPage, true);
      });
    }
  }

  /* ── Single article page ── */
  function initSinglePage() {
    var slug = new URLSearchParams(window.location.search).get('slug');
    if (!slug) { window.location.replace('news.html'); return; }
    initShareButtons();
    loadArticle(slug);
  }

  function initShareButtons() {
    var url = window.location.href;
    var lineBtn = document.getElementById('shLine');
    var fbBtn = document.getElementById('shFb');
    var copyBtn = document.getElementById('shCopy');
    var toast = document.getElementById('shToast');

    if (lineBtn) lineBtn.addEventListener('click', function () {
      window.open('https://social-plugins.line.me/lineit/share?url=' + encodeURIComponent(url), '_blank', 'noopener,width=560,height=640');
    });
    if (fbBtn) fbBtn.addEventListener('click', function () {
      window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url), '_blank', 'noopener,width=560,height=640');
    });
    if (copyBtn) copyBtn.addEventListener('click', function () {
      var done = function () {
        if (toast) { toast.classList.add('show'); setTimeout(function () { toast.classList.remove('show'); }, 1800); }
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done, done);
      } else { done(); }
    });
  }

  function loadArticle(slug) {
    var skeleton = document.getElementById('article-skeleton');
    var body = document.getElementById('article-body');
    var notFound = document.getElementById('article-404');

    fetch(API_BASE + '/api/v1/news/' + encodeURIComponent(slug))
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data.ok || !data.data) {
          if (skeleton) skeleton.style.display = 'none';
          if (notFound) notFound.style.display = 'block';
          return;
        }
        renderArticle(data.data);
        if (skeleton) skeleton.style.display = 'none';
        if (body) body.style.display = 'block';
        document.title = data.data.title + ' | 卓越國際文理';
      })
      .catch(function () {
        if (skeleton) skeleton.style.display = 'none';
        if (notFound) notFound.style.display = 'block';
      });
  }

  function renderArticle(article) {
    var catEl = document.getElementById('article-category');
    var dateEl = document.getElementById('article-date');
    var titleEl = document.getElementById('article-title');
    var bcTitle = document.getElementById('breadcrumb-title');
    var coverEl = document.getElementById('article-cover');
    var contentEl = document.getElementById('article-content');
    var catCls = CAT_CLASS[article.category] || '';

    if (catEl) { catEl.textContent = article.category; catEl.className = 'nc-cat ' + catCls; }
    if (dateEl) { dateEl.textContent = formatDate(article.publishedAt); dateEl.className = 'nc-date'; }
    if (titleEl) { titleEl.textContent = article.title; }
    if (bcTitle) { bcTitle.textContent = article.title; }

    if (coverEl) {
      coverEl.className = 'art-cover ' + catCls;
      coverEl.innerHTML = '';
      if (article.coverImage) {
        var img = document.createElement('img');
        img.src = article.coverImage;
        img.alt = article.title;
        img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:var(--r);';
        img.onerror = function () {
          this.style.display = 'none';
          coverEl.innerHTML = '<span class="ac-ico">' + (CAT_EMOJI[article.category] || '📰') + '</span>';
        };
        coverEl.appendChild(img);
      } else {
        coverEl.innerHTML = '<span class="ac-ico">' + (CAT_EMOJI[article.category] || '📰') + '</span>';
      }
    }

    if (contentEl) contentEl.innerHTML = article.content || '';

    /* Carousel for events with photos */
    if (article.category === '活動' && article.photos && article.photos.length >= 1) {
      var carousel = document.getElementById('photo-carousel');
      if (carousel) {
        carousel.style.display = 'block';
        initCarousel(carousel, article.photos, article.title);
      }
    }
  }

  /* ── Carousel ── */
  function initCarousel(carousel, photos, articleTitle) {
    var items = photos.slice(0, 20);
    if (!items.length) return;

    var track = carousel.querySelector('.carousel-track');
    var dotsEl = carousel.querySelector('.carousel-dots');
    var counter = carousel.querySelector('.carousel-counter');
    var prevBtn = carousel.querySelector('.carousel-prev');
    var nextBtn = carousel.querySelector('.carousel-next');
    var current = 0;

    track.innerHTML = '';
    if (dotsEl) dotsEl.innerHTML = '';

    items.forEach(function (url, i) {
      var slide = document.createElement('div');
      slide.className = 'carousel-slide' + (i === 0 ? ' on' : '');
      var img = document.createElement('img');
      img.src = url;
      img.alt = articleTitle + ' 活動照片 ' + (i + 1);
      img.loading = 'lazy';
      slide.appendChild(img);
      track.appendChild(slide);

      if (items.length > 1 && items.length <= 10 && dotsEl) {
        var dot = document.createElement('button');
        dot.className = 'dot' + (i === 0 ? ' on' : '');
        dot.setAttribute('aria-label', '第 ' + (i + 1) + ' 張');
        (function (idx) { dot.addEventListener('click', function () { goTo(idx); }); }(i));
        dotsEl.appendChild(dot);
      }
    });

    if (items.length === 1) {
      if (prevBtn) prevBtn.style.display = 'none';
      if (nextBtn) nextBtn.style.display = 'none';
      if (dotsEl) dotsEl.style.display = 'none';
      if (counter) counter.style.display = 'none';
      return;
    }

    function goTo(n) {
      var slides = track.querySelectorAll('.carousel-slide');
      var dots = dotsEl ? dotsEl.querySelectorAll('.dot') : [];
      slides[current].classList.remove('on');
      if (dots[current]) dots[current].classList.remove('on');
      current = (n + items.length) % items.length;
      slides[current].classList.add('on');
      if (dots[current]) dots[current].classList.add('on');
      if (counter) counter.textContent = (current + 1) + ' / ' + items.length;
    }

    if (prevBtn) prevBtn.addEventListener('click', function () { goTo(current - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { goTo(current + 1); });

    var startX = 0;
    track.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', function (e) {
      var diff = startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 40) goTo(diff > 0 ? current + 1 : current - 1);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') goTo(current - 1);
      if (e.key === 'ArrowRight') goTo(current + 1);
    });

    if (counter) counter.textContent = '1 / ' + items.length;
  }

  /* ── Route by data-screen-label ── */
  document.addEventListener('DOMContentLoaded', function () {
    var label = document.body.getAttribute('data-screen-label');
    if (label === '最新消息單篇') {
      initSinglePage();
    } else if (label === '最新消息') {
      initListPage();
    }
  });

}());
