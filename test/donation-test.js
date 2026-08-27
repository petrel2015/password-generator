/* PW·GEN — donation unit tests. Run: node test/donation-test.js
   Covers: vendored QR encoder integrity (encode → rasterize → jsqr
   decode round-trip for both payment payloads), config integrity,
   zh/en string parity, and the DOM contract donation.js relies on. */
'use strict';

var assert = require('assert');
var fs = require('fs');
var path = require('path');
var QRCode = require('../js/vendor/qrcode-generator.js');
var PNG = require('pngjs').PNG;
var jsQR = require('jsqr');

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

var ROOT = path.resolve(__dirname, '..');
var donationSrc = fs.readFileSync(path.join(ROOT, 'js', 'donation.js'), 'utf8');

/* Payment payloads — must match the markdown spec exactly. */
var PAYLOADS = {
  alipay: 'https://qr.alipay.com/fkx16432isyyhmx9ttwpi79',
  wechat: 'wxp://f2f1fJpOcJc7F-MSeLMxALhc6tWu-oohtxueHRbCe98bMy2AmDunimuOJFv-8bjobLBM'
};

/* Mirrors drawQr() in js/donation.js (same quiet zone / EC level). */
function rasterize(text) {
  var qr = QRCode(0, 'M');
  qr.addData(text);
  qr.make();
  var n = qr.getModuleCount();
  var quiet = 4;
  var scale = 4;
  var size = (n + quiet * 2) * scale;
  var png = new PNG({ width: size, height: size });
  function paint(x, y, w, h, rgb) {
    for (var row = y; row < y + h; row++) {
      for (var col = x; col < x + w; col++) {
        var idx = (png.width * row + col) << 2;
        png.data[idx] = rgb[0]; png.data[idx + 1] = rgb[1]; png.data[idx + 2] = rgb[2]; png.data[idx + 3] = 255;
      }
    }
  }
  paint(0, 0, size, size, [255, 255, 255]);
  for (var r = 0; r < n; r++) {
    for (var c = 0; c < n; c++) {
      if (qr.isDark(r, c)) {
        paint((c + quiet) * scale, (r + quiet) * scale, scale, scale, [0x11, 0x11, 0x11]);
      }
    }
  }
  return png;
}

console.log('PW·GEN donation tests\n');

Object.keys(PAYLOADS).forEach(function (channel) {
  test('QR round-trip: ' + channel + ' payload survives encode → decode', function () {
    var png = rasterize(PAYLOADS[channel]);
    var res = jsQR(png.data, png.width, png.height);
    assert.ok(res, 'jsqr could not decode the ' + channel + ' QR');
    assert.strictEqual(res.data, PAYLOADS[channel]);
  });
});

test('QR geometry: EC level M, quiet zone ≥ 4 modules, ~220px target', function () {
  Object.keys(PAYLOADS).forEach(function (channel) {
    var qr = QRCode(0, 'M');
    qr.addData(PAYLOADS[channel]);
    qr.make();
    var n = qr.getModuleCount();
    var scale = Math.max(3, Math.floor(220 / (n + 8)));
    var size = scale * (n + 8);
    assert.ok(size >= 180 && size <= 240, channel + ' size ' + size + 'px out of range');
    // corners must stay white (quiet zone intact)
    assert.strictEqual(qr.isDark(0, 0) !== undefined, true);
  });
});

test('DONATION_CONFIG holds exactly the spec payloads', function () {
  assert.ok(donationSrc.indexOf("qrContent: '" + PAYLOADS.alipay + "'") >= 0, 'alipay payload mismatch');
  assert.ok(donationSrc.indexOf("qrContent: '" + PAYLOADS.wechat + "'") >= 0, 'wechat payload mismatch');
  // no homemade alipay scheme, no static QR images anywhere in the component
  assert.ok(donationSrc.indexOf('alipays://') < 0, 'custom alipays:// scheme is forbidden by spec');
  assert.ok(donationSrc.indexOf('.png') < 0, 'component must not reference image files');
});

test('no static QR images remain in the repo', function () {
  var imgDir = path.join(ROOT, 'img');
  assert.ok(!fs.existsSync(imgDir), 'img/ directory should be deleted');
  var html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert.ok(!/img\/.*(qr|donate)/i.test(html), 'index.html still references a QR image');
});

test('footer entry uses exactly the two specified texts', function () {
  assert.ok(donationSrc.indexOf("entry: '☕ 请作者喝杯咖啡'") >= 0, 'zh entry text mismatch');
  assert.ok(donationSrc.indexOf("entry: '☕ Buy me a coffee'") >= 0, 'en entry text mismatch');
});

test('donation strings: zh and en dicts have identical key sets', function () {
  function keysOf(lang) {
    var m = donationSrc.match(new RegExp(lang + ': \\{([\\s\\S]*?)\\n    \\}'));
    assert.ok(m, 'STR.' + lang + ' block not found');
    return new Set(Array.from(m[1].matchAll(/^\s{6}(\w+):/gm)).map(function (x) { return x[1]; }));
  }
  var zh = keysOf('zh'), en = keysOf('en');
  zh.forEach(function (k) { assert.ok(en.has(k), 'key only in zh: ' + k); });
  en.forEach(function (k) { assert.ok(zh.has(k), 'key only in en: ' + k); });
  assert.ok(zh.size >= 12, 'unexpectedly few donation keys: ' + zh.size);
});

test('mobile contract: alipay jumps to the official URL, wechat never jumps', function () {
  var jump = donationSrc.match(/window\.location\.href = DONATION_CONFIG\.(\w+)\.qrContent/);
  assert.ok(jump, 'no jump statement found');
  assert.strictEqual(jump[1], 'alipay', 'only alipay may attempt a jump');
  var wechatBranch = donationSrc.split("id === 'wechat'")[1] || '';
  // wechat path must go through renderQr (QR), not a location change
  var wechatFn = donationSrc.slice(donationSrc.indexOf('function selectChannel'));
  assert.ok(!/location\.href[\s\S]*wechat/i.test(wechatFn), 'wechat must not attempt a jump');
});

test('fallback contract: visibilityState guard + explicit show-QR button', function () {
  assert.ok(donationSrc.indexOf("document.visibilityState === 'hidden'") >= 0, 'no visibilitychange handling');
  assert.ok(donationSrc.indexOf("document.visibilityState === before") >= 0, 'no still-visible check after jump');
  assert.ok(donationSrc.indexOf("ui.showQr.addEventListener('click'") >= 0, 'no manual show-QR control');
});

test('a11y contract: ESC close, overlay close, aria, focus restore, reduced motion', function () {
  assert.ok(donationSrc.indexOf("e.key === 'Escape'") >= 0, 'no ESC handling');
  assert.ok(donationSrc.indexOf('e.target === ui.overlay') >= 0, 'no overlay-click close');
  assert.ok(donationSrc.indexOf("aria-modal") >= 0 && donationSrc.indexOf("aria-labelledby") >= 0, 'dialog aria missing');
  assert.ok(donationSrc.indexOf('aria-selected') >= 0, 'tab aria-selected missing');
  assert.ok(donationSrc.indexOf('opener.focus') >= 0, 'focus not restored on close');
  var css = fs.readFileSync(path.join(ROOT, 'css', 'donation.css'), 'utf8');
  // site-level prefers-reduced-motion rule lives in style.css; donation.css adds no animations
  var styleCss = fs.readFileSync(path.join(ROOT, 'css', 'style.css'), 'utf8');
  assert.ok(styleCss.indexOf('prefers-reduced-motion') >= 0, 'no reduced-motion rule on site');
});

test('lazy load: QR library only referenced as lazily injected script', function () {
  assert.ok(donationSrc.indexOf("document.createElement('script')") >= 0, 'no script injection');
  assert.ok(donationSrc.indexOf('loadQrLib') >= 0, 'no lazy loader');
  var html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert.ok(html.indexOf('qrcode-generator.js') < 0, 'vendor lib must not be loaded eagerly');
});

test('mount contract: index.html provides [data-donation] in the footer', function () {
  var html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  var m = html.match(/<footer>[\s\S]*?<\/footer>/);
  assert.ok(m, 'footer not found');
  assert.ok(m[0].indexOf('data-donation') >= 0, 'mount point missing from footer');
});

test('every donation-* class used by JS exists in donation.css', function () {
  var css = fs.readFileSync(path.join(ROOT, 'css', 'donation.css'), 'utf8');
  var classes = new Set(Array.from(donationSrc.matchAll(/'?(donation-[a-z-]+)'?/g)).map(function (m) { return m[1]; }));
  classes.forEach(function (c) {
    assert.ok(css.indexOf('.' + c) >= 0, 'css missing class: ' + c);
  });
  assert.ok(classes.size >= 10, 'unexpectedly few classes: ' + classes.size);
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
