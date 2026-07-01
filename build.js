#!/usr/bin/env node
/*
 * Static site build script — zero dependencies (Node core only).
 *
 * Stitches the shared partials in partials/ around the per-page content in
 * src/pages/ and writes finished, deployable HTML into public/. Also copies
 * assets/ across. Run `node build.js` for a one-shot build, or
 * `node build.js --watch` to rebuild automatically on change.
 *
 * Each src/pages/*.html file starts with a metadata comment:
 *
 *   <!--
 *   title: Page title for <title> and the browser tab
 *   description: Meta description for SEO
 *   -->
 *   <main> ... page body ... </main>
 *
 * The active nav link is set automatically: whichever nav <a data-nav> points
 * at the page being built gets class="active".
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PARTIALS_DIR = path.join(ROOT, 'partials');
const PAGES_DIR = path.join(ROOT, 'src', 'pages');
const ASSETS_DIR = path.join(ROOT, 'assets');
const OUT_DIR = path.join(ROOT, 'public');

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

// Conservative CSS minifier: strip comments, collapse whitespace, and trim
// spaces around structural tokens. Deliberately leaves value internals (e.g.
// calc() operands, multi-keyword values) as single-spaced so nothing breaks.
function minifyCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,>])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim();
}

// Per-page extra <head> markup, keyed by page filename. Injected at {{HEAD_EXTRA}}.
const HEAD_EXTRA = {
  'index.html':
    '<link rel="preload" as="image" href="/assets/mainslider3-mobile.webp" media="(max-width: 768px)" fetchpriority="high">\n' +
    '<link rel="preload" as="image" href="/assets/mainslider3.webp" media="(min-width: 769px)" fetchpriority="high">',
};

// Parse the leading <!-- key: value --> metadata block; return { meta, body }.
function parsePage(raw) {
  const meta = {};
  const match = raw.match(/^\s*<!--([\s\S]*?)-->/);
  let body = raw;
  if (match) {
    match[1].split('\n').forEach((line) => {
      const idx = line.indexOf(':');
      if (idx === -1) return;
      const key = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).trim();
      if (key) meta[key] = value;
    });
    body = raw.slice(match[0].length);
  }
  return { meta, body: body.trim() };
}

// Add class="active" to the nav link whose href matches this page.
function setActiveNav(headerHtml, pageFile) {
  const escaped = pageFile.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp('(<a href="' + escaped + '")( data-nav)', 'g');
  return headerHtml.replace(re, '$1$2 class="active"');
}

// Use a function replacer so `$` in page content is never treated specially.
function inject(template, token, value) {
  return template.split(token).join(value);
}

function build() {
  const head = read(path.join(PARTIALS_DIR, 'head.html'));
  const header = read(path.join(PARTIALS_DIR, 'header.html'));
  const footer = read(path.join(PARTIALS_DIR, 'footer.html'));

  // Inline the stylesheet (minified) so it isn't a render-blocking request.
  // url(../…) paths are rewritten to absolute /assets/… so they still resolve
  // once the CSS lives in the document head instead of /assets/css/.
  let inlineCss = minifyCss(read(path.join(ASSETS_DIR, 'css', 'styles.css')));
  inlineCss = inlineCss.replace(/url\((['"]?)\.\.\//g, 'url($1/assets/');
  const styleTag = '<style>' + inlineCss + '</style>';

  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const pages = fs.readdirSync(PAGES_DIR).filter((f) => f.endsWith('.html'));
  for (const pageFile of pages) {
    const { meta, body } = parsePage(read(path.join(PAGES_DIR, pageFile)));

    let headFilled = inject(head, '{{TITLE}}', meta.title || 'Conservatory Conversions');
    headFilled = inject(headFilled, '{{DESCRIPTION}}', meta.description || '');
    // Per-page <head> extras. The homepage hero uses a photographic background;
    // preload it (responsive, high priority) so it isn't discovered late by the
    // CSS parser — the LCP fix. Media attributes match the CSS breakpoint so only
    // the version that will actually be used is fetched.
    headFilled = inject(headFilled, '{{HEAD_EXTRA}}', HEAD_EXTRA[pageFile] || '');
    headFilled = inject(headFilled, '{{INLINE_CSS}}', styleTag);

    const headerFilled = setActiveNav(header, pageFile);

    const html =
      '<!DOCTYPE html>\n' +
      '<html lang="en">\n' +
      '<head>\n' +
      headFilled.trim() + '\n' +
      '</head>\n' +
      '<body>\n\n' +
      headerFilled.trim() + '\n\n' +
      body + '\n\n' +
      footer.trim() + '\n' +
      '</body>\n' +
      '</html>\n';

    fs.writeFileSync(path.join(OUT_DIR, pageFile), html);
    console.log('  built  ' + pageFile + (meta.title ? '  —  ' + meta.title : ''));
  }

  // Copy assets/ verbatim into public/assets/
  if (fs.existsSync(ASSETS_DIR)) {
    fs.cpSync(ASSETS_DIR, path.join(OUT_DIR, 'assets'), {
      recursive: true,
      filter: (src) => !src.endsWith('.DS_Store'),
    });
  }

  console.log('Built ' + pages.length + ' page(s) → public/');
}

function watch() {
  build();
  console.log('\nWatching for changes (Ctrl+C to stop)…');
  let pending = null;
  const rebuild = () => {
    clearTimeout(pending);
    pending = setTimeout(() => {
      try {
        build();
      } catch (err) {
        console.error('Build error:', err.message);
      }
    }, 100);
  };
  for (const dir of [PARTIALS_DIR, PAGES_DIR, ASSETS_DIR]) {
    if (fs.existsSync(dir)) fs.watch(dir, { recursive: true }, rebuild);
  }
}

if (process.argv.includes('--watch')) {
  watch();
} else {
  build();
}
