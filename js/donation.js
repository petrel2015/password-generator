/* =====================================================================
   PW·GEN — donation (generic footer entry + QR dialog)

   Self-contained "buy the author a coffee" drop-in for static sites:

     1. Put <div data-donation></div> in the page footer.
     2. Load this file with defer (optionally after a host i18n that
        exposes PG.i18n.current() / PG.i18n.onChange() — the component
        then follows the site language; without one it falls back to
        the browser language).
     3. Style with css/donation.css (uses the site's CSS variables).

   Behaviour:
   - Desktop: dialog with 支付宝 / 微信支付 tabs; the QR for the
     selected channel is generated live in the browser. No app-launch
     attempts on desktop.
   - Mobile: tapping 支付宝 opens the official payment URL directly
     (no homemade URL scheme). If the page is still visible a moment
     later — or the user asks explicitly — the QR fallback appears.
     WeChat always shows the QR: wxp:// deep links are payment payloads
     and not reliably interceptable from a browser.
   - No static QR images, no third-party QR services, no analytics,
     no payment-result tracking.

   QR encoder: js/vendor/qrcode-generator.js (MIT), lazy-loaded the
   first time the dialog opens — zero cost before that.
   ===================================================================== */
(function () {
  'use strict';

  /* ---- 1. payment config --------------------------------------------- */

  var DONATION_CONFIG = {
    alipay: {
      qrContent: 'https://qr.alipay.com/fkx16432isyyhmx9ttwpi79'
    },
    wechat: {
      qrContent: 'wxp://f2f1fJpOcJc7F-MSeLMxALhc6tWu-oohtxueHRbCe98bMy2AmDunimuOJFv-8bjobLBM'
    }
  };
  var DEFAULT_CHANNEL = 'alipay';

  /* ---- 2. strings (zh / en) ------------------------------------------- */

  var STR = {
    zh: {
      entry: '☕ 请作者喝杯咖啡',
      title: '请作者喝杯咖啡 ☕',
      desc: '如果这个小工具帮到了你，可以请作者喝杯咖啡。',
      alipay: '支付宝',
      wechat: '微信支付',
      hintAlipay: '打开支付宝扫一扫',
      hintWechat: '打开微信扫一扫',
      opening: '正在打开支付宝…',
      fallback: '没有自动打开？请使用支付宝扫码',
      showQr: '显示二维码',
      close: '关闭',
      qrError: '二维码生成失败，请重试。'
    },
    en: {
      entry: '☕ Buy me a coffee',
      title: 'Buy me a coffee ☕',
      desc: 'If this little tool helped you, you can buy the author a coffee.',
      alipay: 'Alipay',
      wechat: 'WeChat Pay',
      hintAlipay: 'Scan with Alipay',
      hintWechat: 'Scan with WeChat',
      opening: 'Opening Alipay…',
      fallback: "Didn't open automatically? Scan the QR code instead.",
      showQr: 'Show QR code',
      close: 'Close',
      qrError: 'Could not generate the QR code. Please try again.'
    }
  };

  function currentLang() {
    if (window.PG && window.PG.i18n && window.PG.i18n.current) {
      return window.PG.i18n.current();
    }
    return /zh/i.test(navigator.language || 'en') ? 'zh' : 'en';
  }

  function t(key) {
    var lang = currentLang();
    return (STR[lang] && STR[lang][key]) || STR.en[key] || key;
  }

  /* ---- 3. QR rendering (vendor lib, canvas, dark-on-white) ------------ */

  var QR_LIB_SRC = 'js/vendor/qrcode-generator.js';
  var EC_LEVEL = 'M';
  var QUIET_ZONE = 4;
  var TARGET_SIZE = 220;
  var qrLibPromise = null;

  function loadQrLib() {
    if (window.qrcode) return Promise.resolve();
    if (!qrLibPromise) {
      qrLibPromise = new Promise(function (resolve, reject) {
        var s = document.createElement('script');
        s.src = QR_LIB_SRC;
        s.onload = function () { resolve(); };
        s.onerror = function () {
          qrLibPromise = null; // allow a retry on the next attempt
          reject(new Error('QR library failed to load'));
        };
        document.head.appendChild(s);
      });
    }
    return qrLibPromise;
  }

  function createQr(text) {
    for (var type = 1; type <= 40; type++) {
      try {
        var qr = window.qrcode(type, EC_LEVEL);
        qr.addData(text);
        qr.make();
        return qr;
      } catch (e) { /* payload does not fit this version — try the next */ }
    }
    throw new Error('payload too large for QR');
  }

  /* Crisp integer-sized modules, devicePixelRatio-aware, white card. */
  function drawQr(canvas, text) {
    var qr = createQr(text);
    var n = qr.getModuleCount();
    var scale = Math.max(3, Math.floor(TARGET_SIZE / (n + QUIET_ZONE * 2)));
    var dpr = Math.min(window.devicePixelRatio || 1, 3);
    var size = scale * (n + QUIET_ZONE * 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#111111';
    for (var r = 0; r < n; r++) {
      for (var c = 0; c < n; c++) {
        if (qr.isDark(r, c)) {
          ctx.fillRect(
            (c + QUIET_ZONE) * scale * dpr,
            (r + QUIET_ZONE) * scale * dpr,
            scale * dpr, scale * dpr);
        }
      }
    }
  }

  /* ---- 4. dialog DOM (built once, reused on every open) ---------------- */

  var ui = {};
  var selected = DEFAULT_CHANNEL;
  var bodyMode = 'idle'; // idle | attempting | qr | fallback | error
  var jumpTimer = null;
  var lastRender = null;  // Promise for the current channel's QR draw
  var opener = null;      // element to restore focus to on close

  function el(tag, cls, parent) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (parent) parent.appendChild(e);
    return e;
  }

  function build() {
    var mount = document.querySelector('[data-donation]');
    if (!mount) return false;

    ui.entry = el('button', 'donation-entry', mount);
    ui.entry.type = 'button';

    ui.overlay = el('div', 'donation-overlay', document.body);
    ui.overlay.hidden = true;
    ui.dialog = el('div', 'donation-dialog', ui.overlay);
    ui.dialog.setAttribute('role', 'dialog');
    ui.dialog.setAttribute('aria-modal', 'true');

    ui.close = el('button', 'donation-close', ui.dialog);
    ui.close.type = 'button';
    ui.close.textContent = '×';

    ui.title = el('h3', 'donation-title', ui.dialog);
    ui.title.id = 'donation-title';
    ui.dialog.setAttribute('aria-labelledby', 'donation-title');

    ui.desc = el('p', 'donation-desc', ui.dialog);

    ui.tabs = el('div', 'donation-tabs', ui.dialog);
    ui.tabs.setAttribute('role', 'tablist');
    ui.tab = {};
    ['alipay', 'wechat'].forEach(function (id) {
      var b = el('button', 'donation-tab', ui.tabs);
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-controls', 'donation-body');
      b.setAttribute('data-channel', id);
      ui.tab[id] = b;
    });

    ui.body = el('div', 'donation-body', ui.dialog);
    ui.body.id = 'donation-body';
    ui.body.setAttribute('role', 'tabpanel');

    ui.qr = el('canvas', 'donation-qr', ui.body);
    ui.opening = el('p', 'donation-opening', ui.body);
    ui.fallback = el('p', 'donation-fallback-msg', ui.body);
    ui.showQr = el('button', 'donation-show-qr', ui.body);
    ui.showQr.type = 'button';
    ui.hint = el('p', 'donation-hint', ui.body);
    ui.error = el('p', 'donation-error', ui.body);

    return true;
  }

  /* ---- 5. state & rendering --------------------------------------------- */

  function showBody(mode) {
    bodyMode = mode;
    ui.qr.hidden = !(mode === 'qr' || mode === 'fallback');
    ui.opening.hidden = mode !== 'attempting';
    ui.fallback.hidden = mode !== 'fallback';
    ui.showQr.hidden = mode !== 'attempting';
    ui.hint.hidden = !(mode === 'qr' || mode === 'fallback');
    ui.error.hidden = mode !== 'error';
  }

  function applyTexts() {
    ui.entry.textContent = t('entry');
    ui.title.textContent = t('title');
    ui.desc.textContent = t('desc');
    ui.tab.alipay.textContent = t('alipay');
    ui.tab.wechat.textContent = t('wechat');
    ui.close.setAttribute('aria-label', t('close'));
    ui.opening.textContent = t('opening');
    ui.fallback.textContent = t('fallback');
    ui.showQr.textContent = t('showQr');
    ui.hint.textContent = t(selected === 'alipay' ? 'hintAlipay' : 'hintWechat');
    ui.error.textContent = t('qrError');
    ui.tab.alipay.setAttribute('aria-selected', String(selected === 'alipay'));
    ui.tab.wechat.setAttribute('aria-selected', String(selected === 'wechat'));
  }

  function renderQr(channel, mode) {
    lastRender = loadQrLib().then(function () {
      drawQr(ui.qr, DONATION_CONFIG[channel].qrContent);
      if (selected === channel) showBody(mode);
    }, function () {
      if (selected === channel) showBody('error');
    });
  }

  /* Mobile Alipay: open the official URL, keep a QR fallback ready.
     No absolute failure judgment — the page may simply stay visible
     while the OS handoff happens, so the fallback also stays
     available via the explicit "show QR" button. */
  function attemptAlipay() {
    showBody('attempting');
    renderQr('alipay', 'attempting'); // pre-render behind the scenes
    var before = document.visibilityState;
    window.location.href = DONATION_CONFIG.alipay.qrContent;
    jumpTimer = setTimeout(function () {
      if (document.visibilityState === before) {
        lastRender.then(function () {
          if (bodyMode === 'attempting') showBody('fallback');
        }, function () { showBody('error'); });
      }
    }, 1300);
  }

  function selectChannel(id) {
    selected = id;
    applyTexts();
    clearTimeout(jumpTimer);
    if (id === 'alipay' && isMobile()) {
      attemptAlipay();
    } else {
      renderQr(id, 'qr');
    }
  }

  function isMobile() {
    return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  }

  function openDialog() {
    opener = document.activeElement;
    ui.overlay.hidden = false;
    selectChannel(selected);
    ui.close.focus();
  }

  function closeDialog() {
    ui.overlay.hidden = true;
    clearTimeout(jumpTimer);
    if (opener && opener.focus) opener.focus();
  }

  /* ---- 6. wiring ----------------------------------------------------------- */

  function wire() {
    ui.entry.addEventListener('click', openDialog);

    ui.tab.alipay.addEventListener('click', function () { selectChannel('alipay'); });
    ui.tab.wechat.addEventListener('click', function () { selectChannel('wechat'); });

    ui.tabs.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      var next = selected === 'alipay' ? 'wechat' : 'alipay';
      selectChannel(next);
      ui.tab[next].focus();
    });

    ui.showQr.addEventListener('click', function () {
      clearTimeout(jumpTimer);
      lastRender.then(function () { showBody('qr'); }, function () { showBody('error'); });
    });

    ui.close.addEventListener('click', closeDialog);
    ui.overlay.addEventListener('click', function (e) {
      if (e.target === ui.overlay) closeDialog();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !ui.overlay.hidden) closeDialog();
    });

    // Left the page (app opened) → stop the fallback timer; came back
    // while still "attempting" → the jump did not complete, show the QR.
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') {
        clearTimeout(jumpTimer);
      } else if (bodyMode === 'attempting') {
        lastRender.then(function () { showBody('fallback'); }, function () { showBody('error'); });
      }
    });

    // Minimal focus trap while the dialog is open.
    ui.dialog.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var focusables = [ui.close, ui.tab.alipay, ui.tab.wechat, ui.showQr]
        .filter(function (b) { return !b.hidden; });
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });

    if (window.PG && window.PG.i18n && window.PG.i18n.onChange) {
      window.PG.i18n.onChange(applyTexts);
    }
  }

  if (build()) {
    applyTexts();
    wire();
  }
}());
