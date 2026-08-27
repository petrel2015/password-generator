/* PW·GEN — UI wiring tests. Run: node test/app-test.js

   Loads the real js/app.js + js/i18n.js + js/generator.js against a
   minimal DOM stub (no browser, no dependencies) and simulates user
   interactions: advanced-option toggles, separator switching, grouping
   display, and the entropy readout that must follow the effective pool. */
'use strict';

var assert = require('assert');

/* ---- tiny DOM stub ---------------------------------------------------- */

function El(opts) {
  opts = opts || {};
  this.id = opts.id || '';
  this.value = opts.value != null ? opts.value : '';
  this.checked = !!opts.checked;
  this.disabled = !!opts.disabled;
  this.hidden = false;
  this.textContent = '';
  this.dataset = {};
  this.attrs = {};
  this.handlers = {};
  this.children = opts.children || [];
  var self = this;
  var classes = {};
  this.classList = {
    add: function (c) { classes[c] = true; },
    remove: function (c) { delete classes[c]; },
    toggle: function (c, force) {
      var on = force === undefined ? !classes[c] : !!force;
      if (on) classes[c] = true; else delete classes[c];
      return on;
    },
    contains: function (c) { return !!classes[c]; }
  };
}
El.prototype.addEventListener = function (type, fn) {
  (this.handlers[type] = this.handlers[type] || []).push(fn);
};
El.prototype.setAttribute = function (k, v) { this.attrs[k] = String(v); };

function fire(el, type) {
  (el.handlers[type] || []).forEach(function (fn) { fn(); });
}

var sepDash = new El({ value: '-', checked: true, disabled: true });
var sepUnder = new El({ value: '_', disabled: true });
var sepSwitch = new El({ id: 'sep-switch' });

var ids = [
  'len-range', 'len-num', 'opt-upper', 'opt-lower', 'opt-digits',
  'opt-symbols', 'opt-easytype', 'opt-easyspeak', 'opt-dictate',
  'opt-blacklist', 'pw-out', 'entropy-val', 'strength-val', 'meter',
  'btn-copy', 'btn-regen', 'warn', 'lang-en', 'lang-zh'
];
var byId = {};
ids.forEach(function (id) { byId[id] = new El({ id: id }); });
byId['len-num'].value = '16';
byId['len-range'].value = '16';
byId['opt-upper'].checked = true;
byId['opt-lower'].checked = true;
byId['opt-digits'].checked = true;
byId['opt-symbols'].checked = true;
byId['meter'].children = [new El(), new El(), new El(), new El()];
byId['sep-switch'] = sepSwitch; // getElementById route for the switch

var documentStub = {
  getElementById: function (id) { return byId[id]; },
  querySelectorAll: function (selector) {
    return selector.indexOf('group-sep') >= 0 ? [sepDash, sepUnder] : [];
  },
  querySelector: function () { return null; },
  documentElement: { setAttribute: function () {} }
};

/* ---- load the real scripts ---------------------------------------------

   The page scripts resolve `window` / `document` from the global scope,
   so define them before require() evaluates the files. */

global.window = { document: documentStub };
window.PG = { generator: require('../js/generator.js') };
global.document = documentStub;

require('../js/i18n.js');
require('../js/app.js');

/* ---- helpers ------------------------------------------------------------- */

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

function tick(box, on) {
  box.checked = on;
  fire(box, 'change');
}

function pickSep(el) {
  sepDash.checked = el === sepDash;
  sepUnder.checked = el === sepUnder;
  fire(el, 'change');
}

function groupedFormat(sep) {
  var g = '[^\\s' + sep + ']{4}';
  return new RegExp('^' + g + '(' + sep + g + ')+$');
}

var G = require('../js/generator.js');

console.log('PW·GEN UI wiring tests\n');

test('init renders a 16-char password with full-pool entropy', function () {
  var out = byId['pw-out'].textContent;
  assert.strictEqual(out.length, 16, 'output: ' + out);
  assert.strictEqual(byId['entropy-val'].textContent, '105 bits');
});

test('separator picker starts disabled with the switch dimmed', function () {
  assert.strictEqual(sepDash.disabled, true);
  assert.strictEqual(sepUnder.disabled, true);
  assert.ok(sepSwitch.classList.contains('disabled'));
});

test('ticking dictate groups output in fours with hyphens and enables the picker', function () {
  tick(byId['opt-dictate'], true);
  var out = byId['pw-out'].textContent;
  assert.ok(groupedFormat('-').test(out), 'not grouped with -: ' + out);
  assert.strictEqual(sepDash.disabled, false);
  assert.strictEqual(sepUnder.disabled, false);
  assert.ok(!sepSwitch.classList.contains('disabled'));
  // separators are layout only: strip them and 16 characters remain
  assert.strictEqual(out.replace(/-/g, '').length, 16);
});

test('switching to underscore regroups without hyphens', function () {
  pickSep(sepUnder);
  var out = byId['pw-out'].textContent;
  assert.ok(groupedFormat('_').test(out), 'not grouped with _: ' + out);
  assert.strictEqual(out.replace(/_/g, '').length, 16);
});

test('easy-speak filtering applies to the grouped output and the entropy readout', function () {
  tick(byId['opt-easyspeak'], true);
  var out = byId['pw-out'].textContent;
  for (var i = 0; i < G.SPEAK_EXCLUDE.length; i++) {
    var ch = G.SPEAK_EXCLUDE.charAt(i);
    assert.ok(out.indexOf(ch) < 0, 'speak-excluded "' + ch + '" in ' + out);
  }
  // pool 94 → 49 (grouping removes '_' which the speak set never contained)
  assert.strictEqual(byId['entropy-val'].textContent, '90 bits');
});

test('stacking easy-type drops the readout to the 35-char pool', function () {
  tick(byId['opt-easytype'], true);
  var out = byId['pw-out'].textContent;
  for (var i = 0; i < G.TYPE_EXCLUDE.length; i++) {
    var ch = G.TYPE_EXCLUDE.charAt(i);
    assert.ok(out.indexOf(ch) < 0, 'type-excluded "' + ch + '" in ' + out);
  }
  assert.strictEqual(byId['entropy-val'].textContent, '82 bits');
});

test('unticking dictate removes separators and re-disables the picker', function () {
  tick(byId['opt-dictate'], false);
  var out = byId['pw-out'].textContent;
  assert.strictEqual(out.length, 16, 'still grouped: ' + out);
  assert.ok(out.indexOf('-') < 0 && out.indexOf('_') < 0, 'separator leaked: ' + out);
  assert.strictEqual(sepDash.disabled, true);
  assert.strictEqual(sepUnder.disabled, true);
  assert.ok(sepSwitch.classList.contains('disabled'));
});

test('blacklist combines with the advanced filters', function () {
  byId['opt-blacklist'].value = 'AF';
  fire(byId['opt-blacklist'], 'input');
  var out = byId['pw-out'].textContent;
  assert.ok(out.indexOf('A') < 0 && out.indexOf('F') < 0, 'blacklisted char in ' + out);
  byId['opt-blacklist'].value = '';
  fire(byId['opt-blacklist'], 'input');
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
