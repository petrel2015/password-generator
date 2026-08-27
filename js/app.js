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
    easyType: document.getElementById('opt-easytype'),
    easySpeak: document.getElementById('opt-easyspeak'),
    dictate: document.getElementById('opt-dictate'),
    sepSwitch: document.getElementById('sep-switch'),
    sepRadios: Array.prototype.slice.call(document.querySelectorAll('input[name="group-sep"]')),
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
    var sep = '';
    if (els.dictate.checked) {
      sep = els.sepRadios.some(function (r) { return r.checked && r.value === '_'; }) ? '_' : '-';
    }
    return {
      length: clampLen(els.num.value),
      upper: els.upper.checked,
      lower: els.lower.checked,
      digits: els.digits.checked,
      symbols: els.symbols.checked,
      easyType: els.easyType.checked,
      easySpeak: els.easySpeak.checked,
      groupSep: sep,
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
    if (opts.groupSep) pw = G.groupPassword(pw, 4, opts.groupSep);
    lastPassword = pw; // the grouped string is what gets copied and dictated
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

  [els.upper, els.lower, els.digits, els.symbols, els.easyType, els.easySpeak].forEach(function (box) {
    box.addEventListener('change', render);
  });

  els.dictate.addEventListener('change', function () {
    updateSepState();
    render();
  });

  els.sepRadios.forEach(function (radio) {
    radio.addEventListener('change', render);
  });

  els.blacklist.addEventListener('input', render);
  els.blacklist.addEventListener('change', render);

  els.regen.addEventListener('click', render);

  /* Separator picker only makes sense while grouping is on. */

  function updateSepState() {
    var on = els.dictate.checked;
    els.sepRadios.forEach(function (radio) { radio.disabled = !on; });
    els.sepSwitch.classList.toggle('disabled', !on);
  }

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
  updateSepState();
  render();
}());
