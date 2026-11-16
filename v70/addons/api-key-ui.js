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

  // Render Free may cold-start. Retry failed probes after a short window instead
  // of caching the initial offline result forever (as the original game did).
  if (window.LQGemini) {
    let checkedUntil = 0, lastResult = false, pending = null;
    window.LQGemini.proxyAvailable = () => {
      if (pending) return pending;
      if (Date.now() < checkedUntil) return Promise.resolve(lastResult);
      pending = fetch(ENDPOINT, {
        method: 'GET', cache: 'no-store',
        signal: AbortSignal.timeout(25000),
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
    };
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
