/* =====================================================================
   PW·GEN — i18n
   English / 简体中文. Detection: saved choice > browser language.
   Static markup uses data-i18n / data-i18n-placeholder /
   data-i18n-alt / data-i18n-aria-label attributes;
   dynamic strings call PG.i18n.t(key, params).
   ===================================================================== */
(function (global) {
  'use strict';

  var PG = global.PG = global.PG || {};
  var STORE_KEY = 'pg-lang';

  var DICT = {
    en: {
      title: 'PW·GEN — Password Generator',
      brand: 'PW·GEN',
      langAria: 'Language',
      h1a: 'Password',
      h1b: 'Generator',
      lead: 'Strong, random passwords — generated entirely in your browser. Nothing is stored, nothing leaves this page.',

      secPw: '01 — Password',
      copy: 'Copy',
      copied: 'Copied',
      copyAria: 'Copy password to clipboard',
      entropyBits: '{n} bits',
      strength0: 'Weak',
      strength1: 'Fair',
      strength2: 'Strong',
      strength3: 'Excellent',
      regen: 'Regenerate',
      needClass: 'Select at least one character set.',

      secSettings: '02 — Settings',
      legendSets: 'Character sets',
      length: 'Length',
      optUpper: 'Uppercase (A–Z)',
      optLower: 'Lowercase (a–z)',
      optDigits: 'Digits (0–9)',
      optSymbols: 'Symbols (!@#$%…)',
      readable: 'Human-readable',
      readableHint: 'Excludes look-alike characters (0/O, 1/l/I, 2/Z …) and keeps only clearly visible symbols.',
      blacklist: 'Blacklist',
      blacklistPh: 'e.g. 0OoIl1',
      blacklistHint: 'Every character typed here is removed from the candidate pool. If a set is emptied entirely, it is skipped.',
      emptyPool: 'No usable characters left — adjust the blacklist.',

      footer: 'All generation happens locally in your browser — no network requests, no storage, no tracking.',

      donateTag: 'Buy me a coffee ￥4.9',
      donateAlipay: 'Alipay',
      donateWechat: 'WeChat',
      donateModalAria: '{channel} tip QR code',
      donateClose: 'Close',
      donateQrAlt: '{channel} QR code',
      donateAlipayHint: 'Long-press or save the QR, then scan with Alipay',
      donateWechatHint: 'Long-press or save the QR, then scan with WeChat'
    },

    zh: {
      title: 'PW·GEN — 密码生成器',
      brand: 'PW·GEN',
      langAria: '语言',
      h1a: '密码',
      h1b: '生成器',
      lead: '在浏览器本地生成高强度随机密码。不存储、不联网，密码不会离开这个页面。',

      secPw: '01 — 密码',
      copy: '复制',
      copied: '已复制',
      copyAria: '复制密码到剪贴板',
      entropyBits: '{n} 比特',
      strength0: '较弱',
      strength1: '一般',
      strength2: '强',
      strength3: '极佳',
      regen: '重新生成',
      needClass: '请至少选择一种字符类型。',

      secSettings: '02 — 设置',
      legendSets: '字符类型',
      length: '长度',
      optUpper: '大写字母 (A–Z)',
      optLower: '小写字母 (a–z)',
      optDigits: '数字 (0–9)',
      optSymbols: '符号 (!@#$%…)',
      readable: '人类易读',
      readableHint: '剔除易混淆字符（0/O、1/l/I、2/Z 等），符号仅保留清晰醒目的子集。',
      blacklist: '黑名单',
      blacklistPh: '如 0OoIl1',
      blacklistHint: '在此输入的每个字符都会从候选池中剔除；若某类字符被全部排除，该类将不参与生成。',
      emptyPool: '没有可用字符了——请调整黑名单。',

      footer: '全部生成过程在本地浏览器完成——无网络请求、无存储、无追踪。',

      donateTag: '请我喝杯咖啡 ￥4.9',
      donateAlipay: '支付宝',
      donateWechat: '微信',
      donateModalAria: '{channel}赞赏二维码',
      donateClose: '关闭',
      donateQrAlt: '{channel}收款码',
      donateAlipayHint: '长按或保存二维码，打开支付宝扫一扫',
      donateWechatHint: '长按或保存二维码，打开微信扫一扫'
    }
  };

  var listeners = [];
  var lang = detect();

  function detect() {
    try {
      var saved = global.localStorage && global.localStorage.getItem(STORE_KEY);
      if (saved && DICT[saved]) return saved;
    } catch (e) { /* storage unavailable */ }
    var nav = global.navigator;
    var langs = nav && nav.languages && nav.languages.length ? nav.languages : [nav && nav.language || 'en'];
    for (var i = 0; i < langs.length; i++) {
      var tag = String(langs[i] || '').toLowerCase();
      if (tag.indexOf('zh') === 0) return 'zh';
      if (tag.indexOf('en') === 0) return 'en';
    }
    return 'en';
  }

  function t(key, params) {
    var table = DICT[lang] || DICT.en;
    var s = table[key] != null ? table[key] : (DICT.en[key] != null ? DICT.en[key] : key);
    if (params) {
      Object.keys(params).forEach(function (k) {
        s = s.split('{' + k + '}').join(String(params[k]));
      });
    }
    return s;
  }

  function apply() {
    var root = global.document;
    if (!root) return;
    root.querySelectorAll('[data-i18n]').forEach(function (elm) {
      elm.textContent = t(elm.getAttribute('data-i18n'));
    });
    root.querySelectorAll('[data-i18n-placeholder]').forEach(function (elm) {
      elm.setAttribute('placeholder', t(elm.getAttribute('data-i18n-placeholder')));
    });
    root.querySelectorAll('[data-i18n-aria-label]').forEach(function (elm) {
      elm.setAttribute('aria-label', t(elm.getAttribute('data-i18n-aria-label')));
    });
    root.querySelectorAll('[data-i18n-alt]').forEach(function (elm) {
      elm.setAttribute('alt', t(elm.getAttribute('data-i18n-alt')));
    });
    var titleEl = root.querySelector('title');
    if (titleEl) titleEl.textContent = t('title');
    root.documentElement.setAttribute('lang', lang === 'zh' ? 'zh-CN' : 'en');
  }

  function setLang(next) {
    if (!DICT[next]) return;
    lang = next;
    try {
      global.localStorage && global.localStorage.setItem(STORE_KEY, next);
    } catch (e) { /* storage unavailable */ }
    apply();
    listeners.forEach(function (fn) { fn(lang); });
  }

  PG.i18n = {
    t: t,
    apply: apply,
    setLang: setLang,
    current: function () { return lang; },
    onChange: function (fn) { listeners.push(fn); },
    DICT: DICT
  };
}(typeof window !== 'undefined' ? window : globalThis));
