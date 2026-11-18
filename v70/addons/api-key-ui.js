/* LifeQuest V70: Gemini credentials now live only in the Render backend.
   No API key controls, no key saved in browser storage, no public credentials. */
(() => {
  'use strict';
  const KEY = 'english-town-ai';
  const ENDPOINT = 'https://lifequest-ai-v70-gemini.onrender.com/api/gemini';
  const MODEL = 'gemini-2.5-flash';

  // Remove any previous browser-stored Gemini API key from older LifeQuest editions.
  // Keep other player preferences such as their language learning model settings.
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
    if (saved && typeof saved === 'object' && 'geminiKey' in saved) {
      delete saved.geminiKey;
      localStorage.setItem(KEY, JSON.stringify(saved));
    }
  } catch (_) {}

  if (window.LIFEQUEST_AI_CONFIG) {
    window.LIFEQUEST_AI_CONFIG.GEMINI_API_KEY = '';
    window.LIFEQUEST_AI_CONFIG.PROXY_URL = ENDPOINT;
    window.LIFEQUEST_AI_CONFIG.MODEL = MODEL;
  }

  // The original NPC provider uses a compiled constant, Pt = '/api/gemini',
  // rather than LIFEQUEST_AI_CONFIG.PROXY_URL. On a Static Site that path 404s.
  // Redirect *only* this exact legacy API path; never intercept unrelated traffic.
  const originalFetch = window.fetch.bind(window);
  window.fetch = function(input, init) {
    if (typeof input === 'string' || input instanceof URL) {
      try {
        const url = new URL(input, location.href);
        if (url.origin === location.origin && url.pathname === '/api/gemini') {
          return originalFetch(ENDPOINT, init);
        }
      } catch (_) {}
    }
    return originalFetch(input, init);
  };

  // The game defines LQGemini asynchronously after the title screen. Install
  // the availability probe when that object arrives, not only if already loaded.
  let checkedUntil = 0, lastResult = false, pending = null;
  function proxyAvailable() {
    if (pending) return pending;
    if (Date.now() < checkedUntil) return Promise.resolve(lastResult);
    pending = originalFetch(ENDPOINT, {
      method: 'GET', cache: 'no-store', signal: AbortSignal.timeout(45000),
    }).then(async (response) => {
      const data = response.ok ? await response.json() : {};
      lastResult = data.ok === true;
      checkedUntil = Date.now() + (lastResult ? 90000 : 12000);
      return lastResult;
    }).catch(() => {
      lastResult = false;
      checkedUntil = Date.now() + 12000;
      return false;
    }).finally(() => { pending = null; });
    return pending;
  }
  function wireHelpers(helpers) {
    if (helpers && typeof helpers === 'object') {
      helpers.proxyAvailable = proxyAvailable;
    }
    return helpers;
  }
  if (window.LQGemini) {
    wireHelpers(window.LQGemini);
  } else {
    // The original boot loader assigns window.LQGemini before initializing
    // the NPC provider. Wire it synchronously on that first assignment.
    let value;
    Object.defineProperty(window, 'LQGemini', {
      configurable: true, enumerable: true,
      get() { return value; },
      set(next) {
        value = wireHelpers(next);
        Object.defineProperty(window, 'LQGemini', {
          configurable: true, enumerable: true, writable: true, value,
        });
      },
    });
  }

  // Gameplay and storage settings remain. Only the former Gemini key
  // entry, Save/Test/Clear and Show/Hide controls disappear.
  function tidyLabels() {
    for (const el of document.querySelectorAll('[data-act="settings"] span')) {
      el.textContent = '⚙️ Storage & data';
    }
    for (const el of document.querySelectorAll('[data-menu-shortcut="settings"]')) {
      el.textContent = '⚙️ Storage';
    }
    const status = document.querySelector('#settings .status');
    if (status && !status.textContent.trim()) {
      status.textContent = 'Gemini is configured by the site administrator in Render.';
    }
    const btn = document.getElementById('lq-api-quick');
    if (btn) btn.remove();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tidyLabels, { once: true });
  } else {
    tidyLabels();
  }
})();
