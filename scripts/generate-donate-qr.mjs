/* =====================================================================
   PW·GEN — donate QR generator (dev-only, run once; not part of the site)

   Usage:
     npm install qrcode        // brings pngjs as its dependency
     node scripts/generate-donate-qr.mjs

   Style: paper-white background, near-black square modules, and a small
   Swiss-flag mark (red square, white cross) at the centre — error
   correction level H absorbs the covered modules.
   ===================================================================== */
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import QRCode from "qrcode";
import { PNG } from "pngjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = path.join(projectRoot, "img");

/* 收款链接（来源：chess-reversal-lab scripts/generate-donate-qr.mjs） */
const codes = [
  { name: "alipay-qr", url: "https://qr.alipay.com/fkx16432isyyhmx9ttwpi79" },
  { name: "wechat-qr", url: "wxp://f2f1fJpOcJc7F-MSeLMxALhc6tWu-oohtxueHRbCe98bMy2AmDunimuOJFv-8bjobLBM" },
];

const INK = { r: 0x11, g: 0x11, b: 0x11 };
const PAPER = { r: 0xff, g: 0xff, b: 0xff };
const RED = { r: 0xd5, g: 0x2b, b: 0x1e };

const WIDTH = 560;   // target canvas; actual size snaps to whole modules
const MARGIN = 3;    // quiet zone in modules

function paint(png, x, y, w, h, color) {
  for (let row = y; row < y + h; row++) {
    for (let col = x; col < x + w; col++) {
      const idx = (png.width * row + col) << 2;
      png.data[idx] = color.r;
      png.data[idx + 1] = color.g;
      png.data[idx + 2] = color.b;
      png.data[idx + 3] = 0xff;
    }
  }
}

for (const { name, url } of codes) {
  const qr = QRCode.create(url, { errorCorrectionLevel: "H" });
  const size = qr.modules.size;
  const total = size + 2 * MARGIN;
  const scale = Math.floor(WIDTH / total);
  const canvas = scale * total;

  const png = new PNG({ width: canvas, height: canvas });
  paint(png, 0, 0, canvas, canvas, PAPER);
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (qr.modules.get(r, c)) {
        paint(png, (c + MARGIN) * scale, (r + MARGIN) * scale, scale, scale, INK);
      }
    }
  }

  /* Centre mark: 6×6-module red plate with a white cross (Swiss flag). */
  const L = 6;
  const arm = 2, span = 4; // cross arms: 2 modules thick, 4 modules long
  const origin = Math.floor((total - L) / 2) * scale;
  paint(png, origin, origin, L * scale, L * scale, RED);
  const mid = origin + Math.floor((L - arm) / 2) * scale;
  const long = Math.floor((L - span) / 2) * scale;
  paint(png, mid, origin + long, arm * scale, span * scale, PAPER);           // vertical
  paint(png, origin + long, mid, span * scale, arm * scale, PAPER);           // horizontal

  const outFile = path.join(outputDirectory, `${name}.png`);
  fs.writeFileSync(outFile, PNG.sync.write(png));
  console.log(`Generated ${outFile} (${canvas}×${canvas}, version modules ${size})`);
}
