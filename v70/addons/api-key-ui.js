/* LIFEQUEST V70 API KEY EDITION — interface enhancement only; no real keys in source. */
(() => {
  'use strict';
  const CONFIG_KEY = 'english-town-ai';
  const MODEL_DEFAULT = 'gemini-2.5-flash';
  const GEMINI_API = 'https://generativelanguage.googleapis.com/v1beta/models/';
  const byId = (id) => document.getElementById(id);
  let menuEnhanced = false;

  function getConfig() {
    try {
      const config = JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}');
      return config && typeof config === 'object' && !Array.isArray(config) ? config : {};
    } catch (_) { return {}; }
  }

  function currentModel() {
    const cfg = getConfig();
    return String(cfg.geminiModel || window.LIFEQUEST_AI_CONFIG?.MODEL || MODEL_DEFAULT).trim() || MODEL_DEFAULT;
  }

  function validKey(key) {
    return typeof key === 'string' && key.length >= 20 && key.length < 512 && !/\s/.test(key);
  }

  async function checkGeminiKey(key, model) {
    if (!validKey(key)) throw new Error('API key không hợp lệ về định dạng (cần tối thiểu 20 ký tự, không có dấu cách).');
    const selected = String(model || MODEL_DEFAULT).trim();
    if (!/^[a-zA-Z0-9._-]{1,100}$/.test(selected)) throw new Error('Tên model không hợp lệ.');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(GEMINI_API + encodeURIComponent(selected), {
        method: 'GET',
        headers: { 'x-goog-api-key': key },
        signal: controller.signal,
        cache: 'no-store',
      });
      if (response.status === 429) throw new Error('Google đang giới hạn yêu cầu (429). Thử lại sau.');
      if (response.status === 401 || response.status === 403) throw new Error('Key bị từ chối (401/403). Kiểm tra quyền truy cập và giới hạn API.');
      if (response.status === 404) throw new Error('Model không tồn tại hoặc chưa được cấp quyền (404). Hãy thử model khác.');
      if (!response.ok) throw new Error('Google trả về lỗi HTTP ' + response.status + '.');
      const metadata = await response.json();
      if (Array.isArray(metadata.supportedGenerationMethods) && !metadata.supportedGenerationMethods.includes('generateContent')) {
        throw new Error('Model này không hỗ trợ tạo nội dung.');
      }
      return selected;
    } catch (error) {
      if (error?.name === 'AbortError') throw new Error('Kết nối quá 12 giây. Kiểm tra mạng và thử lại.');
      if (error instanceof TypeError) throw new Error('Không thể kết nối Google AI từ trình duyệt. Kiểm tra mạng hoặc chính sách CORS.');
      throw error;
    } finally { clearTimeout(timer); }
  }

  function enhanceSettings() {
    const panel = byId('settings');
    if (!panel || panel.dataset.lqApiEnhanced) return;
    panel.dataset.lqApiEnhanced = 'true';
    const block = panel.querySelector('div[hidden][aria-hidden="true"]');
    const key = byId('ai-key'), model = byId('ai-model');
    const save = byId('ai-save'), test = byId('ai-test'), clear = byId('ai-clear');
    if (!block || !key || !model || !save || !test || !clear) return;
    panel.querySelector('h3').textContent = '🔑 Kết nối Gemini AI';
    const intro = panel.querySelector('h3 + p');
    if (intro) intro.textContent = 'Nhập API key của riêng bạn để dùng Gemini cho hội thoại NPC, gợi ý câu và AI Coach. Không cần key vẫn có thể chơi ở chế độ offline.';
    block.hidden = false;
    block.removeAttribute('aria-hidden');
    block.classList.add('lq-api-controls');
    const keyLabel = document.createElement('label');
    keyLabel.htmlFor = 'ai-key'; keyLabel.textContent = 'Gemini API Key';
    block.insertBefore(keyLabel, key);
    key.type = 'password'; key.autocomplete = 'off'; key.spellcheck = false;
    key.placeholder = 'Dán Gemini API key vào đây'; key.maxLength = 511;
    const show = document.createElement('button');
    show.type = 'button'; show.className = 'lq-api-toggle'; show.textContent = 'Hiện key';
    show.setAttribute('aria-label', 'Hiện hoặc ẩn API key');
    show.addEventListener('click', () => {
      const visible = key.type === 'password';
      key.type = visible ? 'text' : 'password';
      show.textContent = visible ? 'Ẩn key' : 'Hiện key';
    });
    key.insertAdjacentElement('afterend', show);
    const modelLabel = document.createElement('label');
    modelLabel.htmlFor = 'ai-model'; modelLabel.textContent = 'Model Gemini';
    block.insertBefore(modelLabel, model);
    model.placeholder = MODEL_DEFAULT;
    model.setAttribute('list', 'lq-api-models');
    const models = document.createElement('datalist');
    models.id = 'lq-api-models';
    for (const value of ['gemini-2.5-flash', 'gemini-2.5-flash-lite']) {
      const item = document.createElement('option'); item.value = value; models.appendChild(item);
    }
    model.insertAdjacentElement('afterend', models);
    const buttons = document.createElement('div');
    buttons.className = 'lq-api-actions'; block.appendChild(buttons);
    save.textContent = '💾 Lưu key'; test.textContent = '🔌 Kiểm tra kết nối'; clear.textContent = '🗑️ Xóa key';
    buttons.append(save, test, clear);
    const note = document.createElement('p');
    note.className = 'lq-api-privacy';
    note.textContent = '🔒 Key chỉ lưu trong bộ nhớ của trình duyệt này và được gửi trực tiếp đến Google khi sử dụng AI. Không đưa key vào GitHub/Render. Không nhập trên máy dùng chung; ai truy cập trình duyệt này đều có thể dùng hoặc xem key đã lưu. API có thể phát sinh chi phí tùy tài khoản.';
    block.appendChild(note);
    const helper = document.createElement('a');
    helper.textContent = 'Lấy API key trên Google AI Studio';
    helper.href = 'https://aistudio.google.com/apikey'; helper.target = '_blank'; helper.rel = 'noopener noreferrer';
    block.appendChild(helper);
    const nativeStatus = panel.querySelector('.status');
    if (nativeStatus) nativeStatus.setAttribute('aria-live', 'polite');
  }

  function openSettings() {
    const settings = byId('settings');
    if (!settings) return;
    enhanceSettings();
    const config = getConfig();
    byId('ai-key').value = String(config.geminiKey || window.LIFEQUEST_AI_CONFIG?.GEMINI_API_KEY || '');
    byId('ai-key').type = 'password';
    byId('ai-model').value = currentModel();
    settings.style.display = 'block';
    const status = settings.querySelector('.status');
    if (status) status.textContent = config.geminiKey ? 'Đã lưu key trong trình duyệt. Bấm Kiểm tra kết nối để xác thực.' : 'Chưa có key: chế độ AI offline. Bạn vẫn có thể chơi bình thường.';
    settings.scrollTop = 0;
    setTimeout(() => byId('ai-key')?.focus({ preventScroll: true }), 60);
  }

  function enhanceMenu() {
    if (menuEnhanced) return;
    const headright = byId('l11-headright');
    if (!headright) return;
    const btn = document.createElement('button');
    btn.type = 'button'; btn.id = 'lq-api-quick';
    btn.textContent = '🔑 API Key'; btn.title = 'Cài đặt và kiểm tra Gemini API Key';
    btn.setAttribute('aria-label', 'Mở phần nhập Gemini API key');
    btn.addEventListener('click', openSettings);
    headright.insertBefore(btn, headright.firstChild);
    menuEnhanced = true;
  }

  function enhanceTitle() {
    const title = byId('lq-title');
    if (!title || title.dataset.lqApiTitle) return;
    const key = title.querySelector('#lq-title-key');
    const row = title.querySelector('.key-row');
    const status = title.querySelector('#lq-title-keystate');
    if (!key || !row || !status) return;
    title.dataset.lqApiTitle = 'true';
    const intro = title.querySelector('.keybox p');
    if (intro) intro.textContent = 'Nhập key Gemini của bạn để bật AI Coach và hội thoại NPC. Nhấn Kiểm tra để xác thực; nhấn Start để lưu key trong trình duyệt. Bạn có thể bỏ qua và chơi offline.';
    const check = document.createElement('button');
    check.type = 'button'; check.id = 'lq-title-keytest';
    check.textContent = 'Kiểm tra'; check.setAttribute('aria-label', 'Kiểm tra Gemini API key');
    row.appendChild(check);
    const warning = document.createElement('p');
    warning.className = 'lq-key-warning';
    warning.textContent = 'Key không được gửi lên GitHub hoặc Render. Tránh nhập trên máy dùng chung; key lưu trên trình duyệt có thể bị các script của trang truy cập.';
    title.querySelector('.keybox').appendChild(warning);
    check.addEventListener('click', async () => {
      const apiKey = key.value.trim() || String(getConfig().geminiKey || '').trim();
      status.classList.remove('err'); status.textContent = 'Đang kiểm tra…'; check.disabled = true;
      try {
        const model = await checkGeminiKey(apiKey, currentModel());
        status.textContent = '✅ Kết nối thành công: ' + model + '. Nhấn Start để lưu key.';
      } catch (error) {
        status.classList.add('err');
        status.textContent = error?.message || 'Không thể kiểm tra API key.';
      } finally { check.disabled = false; }
    });
  }

  function setup() {
    enhanceSettings(); enhanceTitle(); enhanceMenu();
    const observer = new MutationObserver(() => {
      enhanceTitle(); enhanceMenu();
      if (menuEnhanced) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), 120000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup, { once: true });
  else setup();
})();