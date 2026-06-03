/* news.js — 最新消息列表 + 單篇文章 */

(function () {
  'use strict';

  var PAGE_SIZE = 9;
  var currentCategory = 'all';
  var currentPage = 1;
  var hasMore = false;

  /* ── Helpers ── */

  function formatDate(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '.' + m + '.' + day;
  }

  function truncate(str, max) {
    if (!str) return '';
    return str.length > max ? str.slice(0, max) + '…' : str;
  }

  function tagClass(category) {
    var map = { '公告': '', '活動': 'tag-orange', '特別課程': 'tag-yellow', '文章': 'tag-green' };
    return map[category] || '';
  }

  /* ── Article Card Factory ── */

  function buildCard(article) {
    var a = document.createElement('a');
    a.href = 'news-single.html?slug=' + encodeURIComponent(article.slug);
    a.className = 'news-card reveal';

    var img = document.createElement('img');
    img.src = article.coverImage || 'https://placehold.co/800x450/f0ece8/B8005F?text=Mina';
    img.alt = article.title;
    img.loading = 'lazy';
    img.onerror = function () {
      this.src = 'https://placehold.co/800x450/f0ece8/B8005F?text=Mina';
    };

    var imgWrap = document.createElement('div');
    imgWrap.className = 'news-card-img';
    imgWrap.appendChild(img);

    var tagEl = document.createElement('span');
    tagEl.className = 'tag ' + tagClass(article.category);
    tagEl.textContent = article.category;

    var dateEl = document.createElement('span');
    dateEl.className = 'news-card-date';
    dateEl.textContent = formatDate(article.publishedAt);

    var meta = document.createElement('div');
    meta.className = 'news-card-meta';
    meta.appendChild(tagEl);
    meta.appendChild(dateEl);

    var title = document.createElement('h3');
    title.className = 'news-card-title';
    title.textContent = article.title;

    var excerpt = document.createElement('p');
    excerpt.className = 'news-card-excerpt';
    excerpt.textContent = truncate(article.excerpt || '', 80);

    var body = document.createElement('div');
    body.className = 'news-card-body';
    body.appendChild(meta);
    body.appendChild(title);
    body.appendChild(excerpt);

    a.appendChild(imgWrap);
    a.appendChild(body);
    return a;
  }

  /* ── Skeleton ── */

  function buildSkeleton() {
    var el = document.createElement('div');
    el.className = 'skeleton-card';
    el.innerHTML =
      '<div class="skeleton skeleton-img"></div>' +
      '<div class="skeleton-body">' +
      '<div class="skeleton skeleton-line w-half"></div>' +
      '<div class="skeleton skeleton-line w-full"></div>' +
      '<div class="skeleton skeleton-line w-3q"></div>' +
      '</div>';
    return el;
  }

  /* ── Reveal newly added cards ── */

  function revealCards(container) {
    if (!('IntersectionObserver' in window)) {
      container.querySelectorAll('.reveal:not(.visible)').forEach(function (el) {
        el.classList.add('visible');
      });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    container.querySelectorAll('.reveal:not(.visible)').forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ── Fetch and render (list page) ── */

  function fetchNews(category, page, append) {
    var grid = document.getElementById('news-grid');
    var emptyEl = document.getElementById('news-empty');
    var loadMoreWrap = document.getElementById('load-more-wrap');

    if (!grid) return;

    if (!append) {
      grid.innerHTML = '';
      for (var i = 0; i < 3; i++) grid.appendChild(buildSkeleton());
    }

    var url = '/api/v1/news?page=' + page + '&limit=' + PAGE_SIZE;
    if (category && category !== 'all') url += '&category=' + encodeURIComponent(category);

    fetch(url)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!append) grid.innerHTML = '';
        var articles = (data.data && data.data.articles) || [];
        hasMore = data.data && data.data.hasMore;

        if (!articles.length && !append) {
          emptyEl.style.display = 'block';
          if (loadMoreWrap) loadMoreWrap.style.display = 'none';
          return;
        }

        emptyEl.style.display = 'none';
        articles.forEach(function (a) {
          grid.appendChild(buildCard(a));
        });
        revealCards(grid);

        if (loadMoreWrap) {
          loadMoreWrap.style.display = hasMore ? 'block' : 'none';
        }
      })
      .catch(function () {
        if (!append) {
          grid.innerHTML = '';
          emptyEl.style.display = 'block';
        }
      });
  }

  /* ── Init list page ── */

  function initListPage() {
    var filterBar = document.getElementById('news-filter');
    var loadMoreBtn = document.getElementById('load-more-btn');

    if (!filterBar) return;

    fetchNews(currentCategory, 1, false);

    filterBar.addEventListener('click', function (e) {
      var btn = e.target.closest('.filter-tab');
      if (!btn) return;
      filterBar.querySelectorAll('.filter-tab').forEach(function (t) {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      currentCategory = btn.dataset.category;
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
    if (!slug) {
      window.location.replace('news.html');
      return;
    }
    loadArticle(slug);
  }

  function loadArticle(slug) {
    var skeleton = document.getElementById('article-skeleton');
    var body = document.getElementById('article-body');
    var notFound = document.getElementById('article-404');
    var copyBtn = document.getElementById('copy-link-btn');

    fetch('/api/v1/news/' + encodeURIComponent(slug))
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data.ok || !data.data) {
          skeleton.style.display = 'none';
          notFound.style.display = 'block';
          return;
        }
        var article = data.data;
        renderArticle(article);
        skeleton.style.display = 'none';
        body.style.display = 'block';
        document.title = article.title + ' | Mina 補習班';
      })
      .catch(function () {
        skeleton.style.display = 'none';
        notFound.style.display = 'block';
      });

    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        navigator.clipboard.writeText(window.location.href)
          .then(function () { window.showToast && window.showToast('連結已複製！'); })
          .catch(function () { window.showToast && window.showToast('複製失敗，請手動複製網址。'); });
      });
    }
  }

  function renderArticle(article) {
    var catEl = document.getElementById('article-category');
    var dateEl = document.getElementById('article-date');
    var titleEl = document.getElementById('article-title');
    var coverImg = document.getElementById('article-cover-img');
    var contentEl = document.getElementById('article-content');

    if (catEl) {
      catEl.textContent = article.category;
      catEl.className = 'tag ' + tagClass(article.category);
    }
    if (dateEl) dateEl.textContent = formatDate(article.publishedAt);
    if (titleEl) titleEl.textContent = article.title;
    if (coverImg) {
      coverImg.src = article.coverImage || 'https://placehold.co/800x450/f0ece8/B8005F?text=Mina';
      coverImg.alt = article.title;
    }
    if (contentEl) contentEl.innerHTML = article.content || '';

    /* Carousel */
    if (article.category === '活動' && article.photos && article.photos.length >= 1) {
      var carousel = document.getElementById('photo-carousel');
      if (carousel) {
        carousel.classList.add('show');
        initCarousel(article.photos, article.title);
      }
    }
  }

  /* ── Carousel (from spec §十四) ── */

  function initCarousel(photos, articleTitle) {
    var items = photos.slice(0, 20);
    if (items.length === 0) return;

    var carousel = document.querySelector('.photo-carousel');
    if (!carousel) return;
    var track = carousel.querySelector('.carousel-track');
    var dotsEl = carousel.querySelector('.carousel-dots');
    var counter = carousel.querySelector('.carousel-counter');
    var current = 0;

    items.forEach(function (url, i) {
      var slide = document.createElement('div');
      slide.className = 'carousel-slide' + (i === 0 ? ' active' : '');
      var img = document.createElement('img');
      img.src = url;
      img.alt = articleTitle + ' 活動照片 ' + (i + 1);
      img.loading = 'lazy';
      slide.appendChild(img);
      track.appendChild(slide);

      if (items.length > 1 && items.length <= 10) {
        var dot = document.createElement('span');
        dot.className = 'dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('role', 'tab');
        dot.setAttribute('aria-label', '第 ' + (i + 1) + ' 張');
        dot.onclick = function () { goTo(i); };
        dotsEl.appendChild(dot);
      }
    });

    if (items.length === 1) {
      carousel.querySelector('.carousel-prev').hidden = true;
      carousel.querySelector('.carousel-next').hidden = true;
      if (dotsEl) dotsEl.hidden = true;
      if (counter) counter.hidden = true;
      return;
    }

    function goTo(n) {
      var slides = track.querySelectorAll('.carousel-slide');
      var dots = dotsEl.querySelectorAll('.dot');
      slides[current].classList.remove('active');
      if (dots[current]) dots[current].classList.remove('active');
      current = (n + items.length) % items.length;
      slides[current].classList.add('active');
      if (dots[current]) dots[current].classList.add('active');
      if (counter) counter.textContent = (current + 1) + ' / ' + items.length;
    }

    carousel.querySelector('.carousel-prev').onclick = function () { goTo(current - 1); };
    carousel.querySelector('.carousel-next').onclick = function () { goTo(current + 1); };

    var startX = 0;
    track.addEventListener('touchstart', function (e) {
      startX = e.touches[0].clientX;
    }, { passive: true });
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

  /* ── Route ── */

  document.addEventListener('DOMContentLoaded', function () {
    if (document.body.classList.contains('page-news-single')) {
      initSinglePage();
    } else if (document.body.classList.contains('page-news-list')) {
      initListPage();
    }
  });

}());
