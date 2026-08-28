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
      kicker: 'PW·GEN · Randomness · Local · Zero network',
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
      blacklist: 'Blacklist',
      blacklistPh: 'e.g. 0OoIl1',
      blacklistHint: 'Every character typed here is removed from the candidate pool. If a set is emptied entirely, it is skipped.',
      emptyPool: 'No usable characters left — adjust the blacklist.',

      secAdvanced: '03 — Advanced',
      legendAdvanced: 'Advanced options',
      easyType: 'Easy to type',
      easyTypeHint: 'Excludes look-alike characters (0/O, 1/l/I, 2/Z …) and keeps only clearly visible symbols.',
      easySpeak: 'Easy to read aloud',
      easySpeakHint: 'Excludes characters that sound alike when spoken (B/C/D/E/G/P/T/V/Z, M/N, 1/7), so every character is heard unambiguously.',
      easyDictate: 'Easy to dictate',
      easyDictateHint: 'Splits the password into blocks of four with a separator (e.g. k3WF-pmQx) so it can be read out chunk by chunk. The separator never appears inside the password itself.',
      sepAria: 'Group separator',

      footer: 'All generation happens locally in your browser — no network requests, no storage, no tracking.',
      methodTitle: 'Methodology & Notes',
      methodBody: 'Entropy is estimated as length × log₂(pool size) in bits, using the effective character pool after every option and blacklist character are applied. Randomness is drawn from the Web Crypto API (crypto.getRandomValues) with rejection sampling, so no modulo bias is introduced. Group separators are display-only and never reduce entropy.',
      disc: 'Strength labels are heuristic · entropy assumes uniform random selection · everything is generated on this device.'
    },

    zh: {
      title: 'PW·GEN — 密码生成器',
      brand: 'PW·GEN',
      langAria: '语言',
      h1a: '密码',
      h1b: '生成器',
      kicker: 'PW·GEN · 随机 · 本地 · 零网络',
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
      blacklist: '黑名单',
      blacklistPh: '如 0OoIl1',
      blacklistHint: '在此输入的每个字符都会从候选池中剔除；若某类字符被全部排除，该类将不参与生成。',
      emptyPool: '没有可用字符了——请调整黑名单。',

      secAdvanced: '03 — 高级选项',
      legendAdvanced: '高级选项',
      easyType: '易输入',
      easyTypeHint: '剔除外形易混淆的字符（0/O、1/l/I、2/Z 等），符号仅保留清晰醒目的子集，照着抄写不易看错。',
      easySpeak: '易朗读',
      easySpeakHint: '剔除读音易混淆的字符（同发 /iː/ 音的 B/C/D/E/G/P/T/V/Z、相近的 M/N、中文易混的 1/7），逐字朗读不会听混。',
      easyDictate: '易复述',
      easyDictateHint: '按 4 位一组用连字符或下划线分段（如 k3WF-pmQx），逐段复述、抄写更省力；分隔符本身不会出现在密码字符中。',
      sepAria: '分组分隔符',

      footer: '全部生成过程在本地浏览器完成——无网络请求、无存储、无追踪。',
      methodTitle: '方法论与说明',
      methodBody: '熵值按「长度 × log₂(字符池大小)」比特估算，字符池为应用全部选项与黑名单后的有效集合。随机数取自浏览器 Web Crypto（crypto.getRandomValues），并采用拒绝采样以避免模偏差；分组分隔符仅用于展示，不参与生成、不降低熵。',
      disc: '强度评级为启发式估计 · 熵值假设字符均匀随机抽取 · 全部在本机生成。'
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
