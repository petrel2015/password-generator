/* =====================================================================
   PW·GEN — UI wiring: options → generator → display, copy, language.
   ===================================================================== */
(function () {
  'use strict';

  var PG = window.PG;
  var t = PG.i18n.t;
  var G = PG.generator;

  var els = {
    range: document.getElementById('len-range'),
    num: document.getElementById('len-num'),
    upper: document.getElementById('opt-upper'),
    lower: document.getElementById('opt-lower'),
    digits: document.getElementById('opt-digits'),
    symbols: document.getElementById('opt-symbols'),
    readable: document.getElementById('opt-readable'),
    blacklist: document.getElementById('opt-blacklist'),
    out: document.getElementById('pw-out'),
    entropy: document.getElementById('entropy-val'),
    strength: document.getElementById('strength-val'),
    meter: document.getElementById('meter'),
    copy: document.getElementById('btn-copy'),
    regen: document.getElementById('btn-regen'),
    warn: document.getElementById('warn'),
    langEn: document.getElementById('lang-en'),
    langZh: document.getElementById('lang-zh')
  };

  var lastPassword = '';
  var copyTimer = null;

  function clampLen(v) {
    v = parseInt(v, 10);
    if (isNaN(v)) v = 16;
    return Math.min(64, Math.max(4, v));
  }

  function options() {
    return {
      length: clampLen(els.num.value),
      upper: els.upper.checked,
      lower: els.lower.checked,
      digits: els.digits.checked,
      symbols: els.symbols.checked,
      readable: els.readable.checked,
      blacklist: els.blacklist.value
    };
  }

  function setMeter(level) {
    els.meter.dataset.level = level;
    var segs = els.meter.children;
    for (var i = 0; i < segs.length; i++) {
      segs[i].classList.toggle('on', i <= level);
    }
  }

  function render() {
    var opts = options();
    var classes = G.buildClasses(opts);

    if (classes.length === 0) {
      lastPassword = '';
      els.out.textContent = '——————';
      els.out.classList.add('empty');
      els.entropy.textContent = '—';
      els.strength.textContent = '—';
      els.strength.classList.remove('weak');
      setMeter(-1);
      els.copy.disabled = true;
      var noneSelected = !opts.upper && !opts.lower && !opts.digits && !opts.symbols;
      els.warn.textContent = t(noneSelected ? 'needClass' : 'emptyPool');
      els.warn.hidden = false;
      return;
    }

    els.warn.hidden = true;
    els.copy.disabled = false;

    var pw = G.generate(opts);
    lastPassword = pw;
    els.out.textContent = pw;
    els.out.classList.remove('empty');

    var bits = G.entropyBits(opts.length, classes.join('').length);
    var level = G.strengthLevel(bits);
    els.entropy.textContent = t('entropyBits', { n: Math.round(bits) });
    els.strength.textContent = t('strength' + level);
    els.strength.classList.toggle('weak', level === 0);
    setMeter(level);
  }

  /* ---- length controls stay in sync --------------------------------- */

  els.range.addEventListener('input', function () {
    els.num.value = els.range.value;
    render();
  });

  els.num.addEventListener('input', function () {
    els.range.value = clampLen(els.num.value);
    render();
  });

  els.num.addEventListener('change', function () {
    els.num.value = clampLen(els.num.value);
    render();
  });

  /* ---- option changes regenerate immediately -------------------------- */

  [els.upper, els.lower, els.digits, els.symbols, els.readable].forEach(function (box) {
    box.addEventListener('change', render);
  });

  els.blacklist.addEventListener('input', render);
  els.blacklist.addEventListener('change', render);

  els.regen.addEventListener('click', render);

  /* ---- copy ------------------------------------------------------------ */

  function copyText(text, done) {
    function legacy() {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { /* clipboard denied */ }
      document.body.removeChild(ta);
      return ok;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        done(true);
      }, function () {
        done(legacy());
      });
    } else {
      done(legacy());
    }
  }

  els.copy.addEventListener('click', function () {
    if (!lastPassword) return;
    copyText(lastPassword, function (ok) {
      if (!ok) return;
      els.copy.textContent = t('copied');
      els.copy.classList.add('btn-ok');
      clearTimeout(copyTimer);
      copyTimer = setTimeout(function () {
        els.copy.textContent = t('copy');
        els.copy.classList.remove('btn-ok');
      }, 1600);
    });
  });

  /* ---- language switch -------------------------------------------------- */

  function setLangButtonState() {
    var cur = PG.i18n.current();
    els.langEn.setAttribute('aria-pressed', String(cur === 'en'));
    els.langZh.setAttribute('aria-pressed', String(cur === 'zh'));
  }

  els.langEn.addEventListener('click', function () { PG.i18n.setLang('en'); });
  els.langZh.addEventListener('click', function () { PG.i18n.setLang('zh'); });

  PG.i18n.onChange(function () {
    setLangButtonState();
    render(); // refresh entropy / strength / warning strings
  });

  /* ---- init --------------------------------------------------------------- */

  PG.i18n.apply();
  setLangButtonState();
  render();
}());
