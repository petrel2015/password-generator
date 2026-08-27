/* PW·GEN — generator unit tests. Run: node test/generator-test.js */
'use strict';

var assert = require('assert');
var G = require('../js/generator.js');

var passed = 0;
var failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('  ok  ' + name);
  } catch (e) {
    failed++;
    console.log('FAIL  ' + name + '\n      ' + e.message);
  }
}

/* Deterministic LCG — not secure, fine for structural tests. */
function lcg(seed) {
  var s = seed >>> 0;
  return function () { s = (1664525 * s + 1013904223) >>> 0; return s; };
}

var base = { length: 16, upper: true, lower: true, digits: true, symbols: true, readable: false };
var readable = Object.assign({}, base, { readable: true });

console.log('PW·GEN generator tests\n');

test('full character classes are unfiltered', function () {
  var classes = G.buildClasses(base);
  assert.strictEqual(classes.length, 4);
  assert.strictEqual(classes[0], 'ABCDEFGHIJKLMNOPQRSTUVWXYZ');
  assert.strictEqual(classes[1], 'abcdefghijklmnopqrstuvwxyz');
  assert.strictEqual(classes[2], '0123456789');
  assert.strictEqual(classes[3], G.CHARSETS.symbols);
});

test('readable mode removes every look-alike character', function () {
  var classes = G.buildClasses(readable);
  var pool = classes.join('');
  for (var i = 0; i < G.READABLE_EXCLUDE.length; i++) {
    assert.ok(pool.indexOf(G.READABLE_EXCLUDE.charAt(i)) < 0,
      'pool still contains "' + G.READABLE_EXCLUDE.charAt(i) + '"');
  }
  assert.strictEqual(classes[2], '347'); // digits minus 0 1 2 5 6 8 9
});

test('readable symbols are the visible subset only', function () {
  var classes = G.buildClasses({ length: 16, symbols: true, readable: true });
  assert.strictEqual(classes[0], '!@#$%^&*-_=+?~');
  assert.strictEqual(classes.length, 1);
});

test('no selection yields no classes', function () {
  assert.strictEqual(G.buildClasses({ length: 16 }).length, 0);
});

test('blacklist removes characters from every class', function () {
  var classes = G.buildClasses(Object.assign({}, base, { blacklist: 'ABCxyz78!' }));
  var pool = classes.join('');
  'ABCxyz78!'.split('').forEach(function (ch) {
    assert.ok(pool.indexOf(ch) < 0, 'pool still contains blacklisted "' + ch + '"');
  });
  assert.strictEqual(classes[0], 'DEFGHIJKLMNOPQRSTUVWXYZ');
  assert.strictEqual(classes[2], '01234569');
});

test('blacklist emptied classes are dropped', function () {
  var classes = G.buildClasses(Object.assign({}, base, { blacklist: '0123456789' }));
  assert.strictEqual(classes.length, 3);
  classes.forEach(function (set) {
    assert.ok(/[A-Za-z]/.test(set) || G.CHARSETS.symbols.indexOf(set) >= 0);
  });
});

test('blacklist emptying the whole pool yields no classes and throws', function () {
  var all = G.CHARSETS.upper + G.CHARSETS.lower + G.CHARSETS.digits + G.CHARSETS.symbols;
  var opts = Object.assign({}, base, { blacklist: all + all }); // duplicates are fine
  assert.strictEqual(G.buildClasses(opts).length, 0);
  assert.throws(function () { G.generate(opts, lcg(1)); }, /no character class/);
});

test('blacklist combines with readable mode', function () {
  var opts = Object.assign({}, readable, { blacklist: 'aeiou347!@' });
  var rng = lcg(99);
  for (var run = 0; run < 200; run++) {
    var pw = G.generate(opts, rng);
    for (var i = 0; i < 'aeiou347!@'.length; i++) {
      assert.ok(pw.indexOf('aeiou347!@'.charAt(i)) < 0, 'blacklisted char in ' + pw);
    }
    for (var j = 0; j < G.READABLE_EXCLUDE.length; j++) {
      assert.ok(pw.indexOf(G.READABLE_EXCLUDE.charAt(j)) < 0, 'readable-excluded char in ' + pw);
    }
  }
});

test('generate respects length and covers every selected class', function () {
  [4, 5, 8, 16, 31, 64].forEach(function (len) {
    var opts = Object.assign({}, base, { length: len });
    var pw = G.generate(opts, lcg(len));
    assert.strictEqual(pw.length, len, 'wrong length ' + len);
    var pool = G.buildClasses(opts).join('');
    for (var i = 0; i < pw.length; i++) {
      assert.ok(pool.indexOf(pw.charAt(i)) >= 0, 'char outside pool: ' + pw.charAt(i));
    }
    assert.ok(/[A-Z]/.test(pw), 'no uppercase at len ' + len);
    assert.ok(/[a-z]/.test(pw), 'no lowercase at len ' + len);
    assert.ok(/[0-9]/.test(pw), 'no digit at len ' + len);
  });
});

test('readable output contains no excluded characters, many runs', function () {
  var rng = lcg(42);
  for (var run = 0; run < 200; run++) {
    var pw = G.generate(readable, rng);
    for (var i = 0; i < G.READABLE_EXCLUDE.length; i++) {
      var ch = G.READABLE_EXCLUDE.charAt(i);
      assert.ok(pw.indexOf(ch) < 0, 'excluded char "' + ch + '" in output ' + pw);
    }
  }
});

test('generate throws with no class selected', function () {
  assert.throws(function () { G.generate({ length: 16 }, lcg(1)); }, /no character class/);
});

test('generate throws when length below class count', function () {
  assert.throws(function () {
    G.generate({ length: 3, upper: true, lower: true, digits: true, symbols: true }, lcg(1));
  }, /shorter than/);
});

test('entropy is length × log2(pool)', function () {
  assert.ok(Math.abs(G.entropyBits(16, 91) - 16 * Math.log(91) / Math.LN2) < 1e-9);
  assert.strictEqual(G.entropyBits(16, 1), 0);
  assert.ok(Math.abs(G.entropyBits(16, 94) - 104.87) < 0.05);
});

test('strength thresholds at 40 / 60 / 80 bits', function () {
  assert.strictEqual(G.strengthLevel(0), 0);
  assert.strictEqual(G.strengthLevel(39.9), 0);
  assert.strictEqual(G.strengthLevel(40), 1);
  assert.strictEqual(G.strengthLevel(59.9), 1);
  assert.strictEqual(G.strengthLevel(60), 2);
  assert.strictEqual(G.strengthLevel(79.9), 2);
  assert.strictEqual(G.strengthLevel(80), 3);
});

test('randomInt stays in range under many draws', function () {
  var rng = lcg(7);
  for (var i = 0; i < 5000; i++) {
    var v = G.randomInt(rng, 7);
    assert.ok(v >= 0 && v < 7, 'out of range: ' + v);
  }
});

test('default rng (Web Crypto) works end to end', function () {
  var pw = G.generate(base); // throws if crypto unavailable
  assert.strictEqual(pw.length, 16);
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
