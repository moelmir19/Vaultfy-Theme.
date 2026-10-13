/* Vaultfy — progressive enhancement of native Twsaa category navigation.
 * Category names and destinations always come from the live /category response.
 * Artwork comes from the platform response (when available) or the merchant's
 * existing homeContent/list_of_items images mapped to a matching category.
 */
(function () {
  'use strict';

  const byId = id => document.getElementById(id);
  const whenReady = callback => document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', callback, { once: true })
    : callback();

  function pathname(href) {
    if (!href || /^\s*(?:#|javascript:)/i.test(href)) return '';
    try {
      const url = new URL(href, location.href);
      if (url.origin !== location.origin || url.pathname === '/' || url.pathname.startsWith('/customer/')) return '';
      return decodeURIComponent(url.pathname).replace(/\/$/, '');
    } catch (_) { return ''; }
  }

  function categoryName(name) {
    return (name || '').trim().replace(/\s+/g, ' ').replace(/^قسم\s+/u, '').trim().toLocaleLowerCase();
  }

  function safeImage(src) {
    if (!src) return '';
    try {
      const url = new URL(src, location.href);
      return ['https:', 'http:'].includes(url.protocol) ? url.href : '';
    } catch (_) { return ''; }
  }

  function nativeCategoryImage(value, cdnBase) {
    if (!value) return '';
    const direct = String(value);
    if (/^https?:\/\//i.test(direct)) return safeImage(direct);
    if (/^(?:data:|javascript:|\/\/)/i.test(direct)) return '';
    return safeImage(cdnBase.replace(/\/$/, '') + '/' + direct.replace(/^\//, ''));
  }

  function parseCategories(body, cdnBase) {
    let response;
    try { response = JSON.parse(body); } catch (_) { response = body; }
    let raw = response;
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      raw = raw.categories || raw.data?.categories || raw.data || raw.html || '';
    }
    if (Array.isArray(raw)) {
      return raw.filter(cat => cat && cat.status !== 0).map(cat => ({
        path: pathname(cat.url || cat.link || ('/' + (cat.url_path || cat.slug || ''))),
        name: String(cat.name || cat.title || '').trim(),
        image: nativeCategoryImage(cat.image_url || cat.category_image_url || cat.image, cdnBase)
      })).filter(cat => cat.name && cat.path);
    }
    const doc = new DOMParser().parseFromString(String(raw || ''), 'text/html');
    let links = Array.from(doc.querySelectorAll('li[parent] > a'));
    if (!links.length) links = Array.from(doc.querySelectorAll('li > a'));
    return links.map(link => ({
      path: pathname(link.getAttribute('href')),
      name: (link.textContent || '').trim().replace(/\s+/g, ' '),
      image: nativeCategoryImage(link.dataset.image || link.querySelector('img')?.getAttribute('src') || '', cdnBase)
    })).filter(cat => cat.path && cat.name);
  }

  function mediaIndex(grid) {
    const byPath = new Map(), byName = new Map();
    grid.querySelectorAll('.vf-up-category-card').forEach(card => {
      const path = pathname(card.getAttribute('href'));
      const name = categoryName(card.querySelector('.vf-up-category-name')?.textContent);
      const image = safeImage(card.querySelector('img')?.getAttribute('src'));
      if (!image) return;
      if (path) byPath.set(path, image);
      if (name) byName.set(name, image);
    });
    return { byPath, byName };
  }

  function renderCard(category, image) {
    const anchor = document.createElement('a');
    anchor.className = 'vf-up-category-card';
    anchor.href = category.path;
    const poster = document.createElement('span');
    poster.className = 'vf-up-category-poster';
    const art = document.createElement('span');
    art.className = 'vf-up-category-art';
    if (image) {
      const img = document.createElement('img');
      img.src = image;
      img.alt = category.name;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.addEventListener('error', () => {
        art.classList.add('vf-up-no-image');
        img.remove();
      }, { once: true });
      art.appendChild(img);
    } else {
      art.classList.add('vf-up-no-image');
      art.setAttribute('aria-label', 'صورة القسم غير مضافة بعد');
    }
    const callToAction = document.createElement('span');
    callToAction.className = 'vf-up-category-cta';
    callToAction.textContent = document.documentElement.lang === 'en' ? 'Click here' : 'اضغط هنا';
    const label = document.createElement('span');
    label.className = 'vf-up-category-name';
    label.textContent = category.name;
    poster.append(art, callToAction);
    anchor.append(poster, label);
    return anchor;
  }

  function setupHeader() {
    const menuButton = byId('vf-menu-toggle');
    const navigation = byId('vf-primary-menu');
    const searchButton = byId('vf-search-toggle');
    const searchPanel = byId('vf-search-panel');
    const closeMenu = () => {
      navigation?.classList.remove('vf-open');
      menuButton?.setAttribute('aria-expanded', 'false');
    };
    menuButton?.addEventListener('click', () => {
      const isOpen = navigation.classList.toggle('vf-open');
      menuButton.setAttribute('aria-expanded', String(isOpen));
      if (isOpen) {
        searchPanel?.classList.remove('vf-search-open');
        searchButton?.setAttribute('aria-expanded', 'false');
      }
    });
    searchButton?.addEventListener('click', () => {
      const isOpen = searchPanel.classList.toggle('vf-search-open');
      searchButton.setAttribute('aria-expanded', String(isOpen));
      if (isOpen) {
        closeMenu();
        searchPanel.querySelector('input')?.focus();
      }
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        closeMenu();
        searchPanel?.classList.remove('vf-search-open');
        searchButton?.setAttribute('aria-expanded', 'false');
      }
    });
    navigation?.addEventListener('click', event => {
      if (event.target.closest('a')) closeMenu();
    });
  }

  whenReady(() => {
    setupHeader();
    const grid = byId('vf-up-category-grid');
    if (!grid) return;
    const status = byId('vf-up-category-status');
    const savedMedia = mediaIndex(grid);

    fetch('/category', { method: 'GET', credentials: 'same-origin',
      headers: { 'Accept': 'text/html, application/json' } })
      .then(response => {
        if (!response.ok) throw new Error('Category endpoint unavailable');
        return response.text();
      })
      .then(body => {
        const unique = new Set();
        const categories = parseCategories(body, grid.dataset.storageBase || '').filter(category => {
          if (unique.has(category.path)) return false;
          unique.add(category.path);
          return true;
        });
        if (!categories.length) throw new Error('No categories in response');
        const fragment = document.createDocumentFragment();
        for (const category of categories) {
          const image = category.image || savedMedia.byPath.get(category.path) ||
            savedMedia.byName.get(categoryName(category.name)) || '';
          fragment.appendChild(renderCard(category, image));
        }
        grid.replaceChildren(fragment);
        if (status) status.hidden = true;
      })
      .catch(() => {
        // The merchant's server-rendered cards remain usable while offline.
        if (status && !grid.childElementCount) {
          status.hidden = false;
          status.textContent = 'الأقسام غير متاحة حاليًا';
        }
      });
  });
})();
