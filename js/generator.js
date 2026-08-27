/* =====================================================================
   PW·GEN — password generator core (pure logic, no DOM)

   UMD: usable from the browser (window.PG.generator) and from Node
   (module.exports) so the test suite can exercise it directly.

   Randomness comes from the Web Crypto API via rejection sampling,
   so every character is drawn without modulo bias.
   ===================================================================== */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.PG = root.PG || {};
    root.PG.generator = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var CHARSETS = {
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lower: 'abcdefghijklmnopqrstuvwxyz',
    digits: '0123456789',
    symbols: "!@#$%^&*()-_=+[]{};:'\",.<>?/~\\`|"
  };

  /* Easy-to-type mode: characters dropped because they look alike —
     0/O/o, 1/l/I/i, 2/Z/z, 5/S/s, 8/B, 6/b, 9/g/q. Symbols are replaced
     wholesale with a subset of clearly visible marks. */
  var TYPE_EXCLUDE = '0Oo1lIi2Zz5Ss8B6b9gq';
  var TYPE_SYMBOLS = '!@#$%^&*-_=+?~';

  /* Easy-to-read-aloud mode: characters dropped because they sound alike
     when spoken. B C D E G P T V Z all end in the same "ee" vowel and are
     hard to tell apart by ear; N ("en") is dropped in favour of M ("em");
     1/7 go because Mandarin "yī"/"qī" are easily confused. Symbols shrink
     to marks with short, distinct spoken names. */
  var SPEAK_EXCLUDE = 'BCDEGNPTVZbcdegnptvz17';
  var SPEAK_SYMBOLS = '!@#$%*+=?';

  var CLASS_KEYS = ['upper', 'lower', 'digits', 'symbols'];

  function getCrypto() {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) return crypto;
    if (typeof require === 'function') {
      try { return require('crypto').webcrypto; } catch (e) { /* older Node */ }
    }
    return null;
  }

  function defaultRng() {
    var c = getCrypto();
    if (!c) throw new Error('Web Crypto API unavailable');
    return function () {
      var buf = new Uint32Array(1);
      c.getRandomValues(buf);
      return buf[0];
    };
  }

  /* Uniform integer in [0, max) via rejection sampling. */
  function randomInt(rng, max) {
    if (max <= 0) throw new Error('max must be positive');
    var range = 4294967296;
    var limit = range - (range % max);
    var v;
    do { v = rng(); } while (v >= limit);
    return v % max;
  }

  function filterOut(set, excluded) {
    var out = '';
    for (var i = 0; i < set.length; i++) {
      if (excluded.indexOf(set.charAt(i)) < 0) out += set.charAt(i);
    }
    return out;
  }

  /* One string of allowed characters per selected class, after any
     easy-type / easy-speak filtering, separator removal and blacklist.
     A class emptied by filtering is dropped; empty array when nothing
     usable remains. */
  function buildClasses(opts) {
    var blacklist = opts.blacklist || '';
    var sep = opts.groupSep || '';
    var classes = [];
    for (var i = 0; i < CLASS_KEYS.length; i++) {
      var key = CLASS_KEYS[i];
      if (!opts[key]) continue;
      var set = CHARSETS[key];
      if (opts.easyType) set = key === 'symbols' ? TYPE_SYMBOLS : filterOut(set, TYPE_EXCLUDE);
      if (opts.easySpeak) set = key === 'symbols' ? SPEAK_SYMBOLS : filterOut(set, SPEAK_EXCLUDE);
      if (sep) set = filterOut(set, sep);
      if (blacklist) set = filterOut(set, blacklist);
      if (set) classes.push(set);
    }
    return classes;
  }

  function pick(set, rng) {
    return set.charAt(randomInt(rng, set.length));
  }

  /* Guaranteed at least one character from every selected class,
     remaining positions drawn from the joined pool, then a full
     Fisher–Yates shuffle so the guaranteed characters are not
     predictably front-loaded. */
  function generate(opts, rng) {
    rng = rng || defaultRng();
    var classes = buildClasses(opts);
    if (classes.length === 0) throw new Error('no character class selected');
    if (opts.length < classes.length) {
      throw new Error('length shorter than number of selected classes');
    }
    var pool = classes.join('');
    var chars = [];
    for (var i = 0; i < classes.length; i++) chars.push(pick(classes[i], rng));
    for (var j = classes.length; j < opts.length; j++) chars.push(pick(pool, rng));
    for (var k = chars.length - 1; k > 0; k--) {
      var swap = randomInt(rng, k + 1);
      var tmp = chars[k];
      chars[k] = chars[swap];
      chars[swap] = tmp;
    }
    return chars.join('');
  }

  function entropyBits(length, poolSize) {
    if (poolSize <= 1) return 0;
    return length * Math.log(poolSize) / Math.LN2;
  }

  /* Easy-to-dictate layout: blocks of `size` characters joined by `sep`.
     The separators are pure formatting — they carry no entropy, and
     buildClasses keeps them out of the candidate pool. */
  function groupPassword(pw, size, sep) {
    size = size || 4;
    var groups = [];
    for (var i = 0; i < pw.length; i += size) {
      groups.push(pw.slice(i, i + size));
    }
    return groups.join(sep || '-');
  }

  /* 0 weak · 1 fair · 2 strong · 3 excellent */
  function strengthLevel(bits) {
    if (bits < 40) return 0;
    if (bits < 60) return 1;
    if (bits < 80) return 2;
    return 3;
  }

  return {
    CHARSETS: CHARSETS,
    TYPE_EXCLUDE: TYPE_EXCLUDE,
    TYPE_SYMBOLS: TYPE_SYMBOLS,
    SPEAK_EXCLUDE: SPEAK_EXCLUDE,
    SPEAK_SYMBOLS: SPEAK_SYMBOLS,
    buildClasses: buildClasses,
    generate: generate,
    groupPassword: groupPassword,
    entropyBits: entropyBits,
    strengthLevel: strengthLevel,
    randomInt: randomInt
  };
}));
