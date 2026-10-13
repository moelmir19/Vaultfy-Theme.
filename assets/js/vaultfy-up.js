/* Vaultfy category hydration. Reads only the native Twsaa /category endpoint.
 * Never requests competitor data and never interferes with cart or checkout.
 */
(function () {
  'use strict';
  function onReady(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback, { once: true });
    } else {
      callback();
    }
  }

  function pathname(href) {
    if (!href || href.trim() === '#') return null;
    try {
      var url = new URL(href, window.location.origin);
      if (url.origin !== window.location.origin) return null;
      if (url.pathname === '/' || url.pathname.includes('/customer/')) return null;
      return url.pathname.replace(/\/$/, '') || '/';
    } catch (_) {
      return null;
    }
  }

  function categoryLinks(markup) {
    var source = new DOMParser().parseFromString(markup, 'text/html');
    var nodes = Array.from(source.querySelectorAll('li[parent] > a'));
    // Fallback if the native platform returns an ordinary navigation list.
    if (!nodes.length) nodes = Array.from(source.querySelectorAll('li > a'));
    var seen = new Set();
    return nodes.reduce(function (items, link) {
      var path = pathname(link.getAttribute('href'));
      var name = (link.textContent || '').trim().replace(/\s+/g, ' ');
      if (!path || !name || seen.has(path)) return items;
      seen.add(path);
      items.push({ path: path, name: name });
      return items;
    }, []);
  }

  function categoryCard(category, previous) {
    var anchor = document.createElement('a');
    anchor.href = category.path;
    anchor.className = 'vf-up-category-card';
    var image = document.createElement('span');
    image.className = 'vf-up-category-image';
    var existing = previous.get(category.path);
    var img = existing && existing.querySelector('img');
    if (img) {
      var copy = img.cloneNode(false);
      copy.loading = 'lazy';
      copy.alt = category.name;
      image.appendChild(copy);
    } else {
      var letter = document.createElement('span');
      letter.className = 'vf-up-category-placeholder';
      letter.textContent = category.name.replace(/^قسم\s+/, '').trim().slice(0, 1);
      letter.setAttribute('aria-hidden', 'true');
      image.appendChild(letter);
    }
    var label = document.createElement('span');
    label.className = 'vf-up-category-name';
    label.textContent = category.name;
    anchor.append(image, label);
    return anchor;
  }

  onReady(function () {
    var grid = document.getElementById('vf-up-category-grid');
    if (!grid) return;
    var fallback = document.getElementById('vf-up-category-status');
    var existing = new Map();
    grid.querySelectorAll('a.vf-up-category-card').forEach(function (item) {
      var path = pathname(item.getAttribute('href'));
      if (path) existing.set(path, item);
    });

    fetch('/category', {
      method: 'GET',
      credentials: 'same-origin',
      headers: { 'Accept': 'text/html, application/json' }
    }).then(function (response) {
      if (!response.ok) throw new Error('Native category endpoint unavailable');
      return response.text();
    }).then(function (body) {
      var markup = body;
      try {
        var json = JSON.parse(body);
        markup = typeof json === 'string' ? json : json.html || '';
      } catch (_) {}
      var categories = categoryLinks(markup);
      if (!categories.length) throw new Error('No categories returned');
      var fragment = document.createDocumentFragment();
      categories.forEach(function (category) {
        fragment.appendChild(categoryCard(category, existing));
      });
      grid.replaceChildren(fragment);
      if (fallback) fallback.hidden = true;
    }).catch(function () {
      // Preserve merchant-configured, server-rendered category cards on failure.
      if (fallback) {
        fallback.hidden = grid.childElementCount !== 0;
        if (!fallback.hidden) fallback.textContent = 'الأقسام غير متاحة حاليًا';
      }
    });
  });
})();
