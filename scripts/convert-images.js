#!/usr/bin/env node
/*
 * Stage 4 image pipeline — resize + re-encode source photos to optimised WebP.
 *
 * Local dev tool only (NOT part of the Vercel build). Requires sharp:
 *   PATH="/opt/homebrew/bin:$PATH" npm install sharp --no-save
 *
 * Reads raw sources from _stage4-src/ (gitignored) and writes optimised
 * WebP straight into assets/ at the confirmed names. Only downsizes — never
 * upscales — so a source already under the tier cap is just re-encoded.
 *
 *   Gallery grid thumbnails : max 800px longest edge,  quality 80
 *   Inline content images   : max 1200px longest edge, quality 80
 */

const sharp = require('sharp');
const path = require('path');

const SRC = path.join(__dirname, '..', '_stage4-src');
const OUT = path.join(__dirname, '..', 'assets');

// WebP quality. Override on the CLI, e.g. `node scripts/convert-images.js 70`.
const QUALITY = parseInt(process.argv[2], 10) || 75;

const jobs = [
  // --- Gallery tier: max 800px ---
  // (q:70 overrides applied to the heaviest, detail-dense shots)
  { in: 'Before & After/IMG_1266.webp', out: 'before-2.webp', max: 800, q: 70 },
  { in: 'Before & After/IMG_1285.webp', out: 'after-2.webp',  max: 800 },
  { in: 'Before & After/IMG_2295.webp', out: 'before-3.webp', max: 800 },
  { in: 'Before & After/IMG_2299.webp', out: 'after-3.webp',  max: 800 },
  { in: 'Before & After/IMG_2304.webp', out: 'before-4.webp', max: 800 },
  { in: 'Before & After/IMG_2326.webp', out: 'after-4.webp',  max: 800 },
  { in: 'Before & After/IMG_6174.webp', out: 'before-5.webp', max: 800, q: 70 },
  { in: 'Before & After/IMG_6599.webp', out: 'after-5.webp',  max: 800 },
  { in: 'Before & After/IMG_6645.webp', out: 'before-6.webp', max: 800 },
  { in: 'Before & After/IMG_6652.webp', out: 'after-6.webp',  max: 800 },

  // --- Inline content tier: max 1200px ---
  { in: 'Light/IMG_5028.webp',          out: 'conversion-benefit.webp',  max: 1200 },
  { in: 'Light/IMG_0043.webp',          out: 'roof-01.webp',             max: 1000, q: 70 },
  { in: 'Light/IMG_1209.webp',          out: 'roof-02.webp',             max: 1000, q: 70 },
  { in: 'Light/IMG_1661.webp',          out: 'roof-03.webp',             max: 1000, q: 70 },
  { in: 'Before & After/IMG_3520.webp', out: 'conversion-strength.webp', max: 1200, q: 70 },
  { in: 'Before & After/IMG_2486.jpg',  out: 'roof-04.webp',             max: 1000, q: 70 },

  // --- New batch: hero + matched before/after pair + how-it-works steps ---
  // Hero shots (landscape 1200x675) — used as hero background / imagery.
  { in: 'scraped/mainslider2.png', out: 'mainslider2.webp', max: 1200, q: 80 },
  { in: 'scraped/mainslider3.png', out: 'mainslider3.webp', max: 1200, q: 80 },
  // Mobile hero background — smaller/lighter; sits behind a dark overlay so a
  // lower quality is imperceptible. Served via CSS media query + preload.
  { in: 'scraped/mainslider3.png', out: 'mainslider3-mobile.webp', max: 768, q: 70 },
  // Matched before/after pair from one job — replaces the old before-1/after-1.
  { in: 'scraped/before.png',      out: 'before-1.webp',    max: 1200, q: 80 },
  { in: 'scraped/after.png',       out: 'after-1.webp',     max: 1200, q: 80 },
  // How-it-works step placeholders (portrait 479x584; step-05 source pending).
  { in: 'scraped/1.png',           out: 'step-01.webp',     max: 800,  q: 80 },
  { in: 'scraped/2.png',           out: 'step-02.webp',     max: 800,  q: 80 },
  { in: 'scraped/3.png',           out: 'step-03.webp',     max: 800,  q: 80 },
  { in: 'scraped/4.png',           out: 'step-04.webp',     max: 800,  q: 80 },
];

(async () => {
  console.log('src'.padEnd(22) + '→ ' + 'output'.padEnd(26) + 'in→out dims'.padEnd(24) + 'size');
  console.log('-'.repeat(84));
  for (const j of jobs) {
    const inPath = path.join(SRC, j.in);
    const outPath = path.join(OUT, j.out);
    const src = await sharp(inPath).metadata();
    const info = await sharp(inPath)
      .resize(j.max, j.max, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: j.q || QUALITY })
      .toFile(outPath);
    const kb = (info.size / 1024).toFixed(1) + 'KB';
    const dims = `${src.width}x${src.height} → ${info.width}x${info.height}`;
    console.log(
      path.basename(j.in).padEnd(22) +
      '→ ' + j.out.padEnd(26) +
      dims.padEnd(22) +
      ('q' + (j.q || QUALITY)).padEnd(5) +
      kb
    );
  }
  console.log('\nDone — ' + jobs.length + ' images written to assets/');
})().catch((err) => { console.error(err); process.exit(1); });
