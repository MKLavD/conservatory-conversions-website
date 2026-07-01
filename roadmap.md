# Conservatory Conversions - website rebuild roadmap

This file is the single source of truth for the rebuild. Work through the stages top to bottom, tick each one off as it's done, and use the starter prompt to kick off that stage in Claude Code. Treat each starter prompt as a strong opening move, not a script to follow rigidly - once you're inside the codebase, let Claude Code adapt to whatever it actually finds.

---

## Project summary

Rebuilding conservatoryconversions.co.uk as a static HTML/CSS/JS site, hosted on Vercel. No CMS - all content edits go through code. Branding and visual design were produced in a separate Claude Design project and have been signed off by the client; this rebuild's job is to implement that approved design properly for the initial build, not redesign it now - a follow-up pass on look and content is expected once the core site is live (see Stage 10).

**Stack:** plain HTML, CSS, vanilla JS. Build tooling: a small zero-dependency Node partials script (see Stage 1).

**Local folder structure:**

```
website/
├── index.html.reference    retired - old root index.html, dead/reference-only, safe to delete once on git
├── build.js                ✅ built - generates public/ from partials/ + src/pages/, supports --watch
├── package.json            ✅ built - "build": node build.js · "dev": node build.js --watch
├── .gitignore               excludes public/, node_modules, .DS_Store
├── partials/
│   ├── head.html           ✅ built - <head> contents, {{TITLE}} / {{DESCRIPTION}} tokens
│   ├── header.html         ✅ built - phone bar + navbar + mobile overlay
│   └── footer.html         ✅ built - brochure modal + footer + mobile CTA + <script>
├── src/
│   └── pages/
│       └── index.html      ✅ built - real editable source for the homepage
├── public/                  generated output - this is what Vercel serves
└── assets/
    ├── before-1.webp       ✅ real photo added (960×619, 64KB - likely fine for the compact slider, see Stage 4 note)
    ├── after-1.webp        ✅ real photo added (960×566, 71KB - likely fine for the compact slider, see Stage 4 note)
    ├── css/
    │   └── styles.css      ✅ built
    └── js/
        └── main.js         ✅ built
```

---

## Reference: page list

Matches the nav structure already designed (`chrome.jsx`). Flat URLs, no subfolders.

| File | Nav label | Status |
|---|---|---|
| `index.html` | HOME | ✅ built |
| `conservatory-roofing.html` | ROOFING | ✅ built |
| `conservatory-conversion.html` | CONVERSIONS | ✅ built |
| `before-and-afters.html` | BEFORE & AFTERS | ✅ built |
| `finance.html` | FINANCE | ✅ built |
| `faq.html` | FAQ | ✅ built |
| `about.html` | ABOUT | ✅ built |
| `contact.html` | CONTACT | ✅ built |
| `roof-options.html` | (linked from homepage cards, not in main nav) | ✅ built |
| `how-it-works.html` | (CTA button in the homepage's "Built With Bespoke Insulated Roof Systems" section, not in main nav) | ✅ built |

Each of these has a matching `page-*.jsx` file in the original Claude Design project (e.g. `page-faq.jsx`) containing the approved copy and layout - export these from the design project and hand them to Claude Code one at a time, following the exact conversion pattern already used for `index.html` (React/JSX → static HTML, `map()` loops manually unrolled into HTML, `Reveal` components → `.reveal` divs with `data-delay`, inline SVGs kept as-is).

**Note - anchor links needed:** ✅ **done.** The four `roof-options.html` system sections now carry anchor IDs (`#solid-tiled-roof`, `#hybrid-roof-system`, `#internal-insulation`, `#full-conservatory-conversion`), and the homepage's four "Our Systems" "Learn More" links point to the matching anchors. The "COMPARE ALL OPTIONS" button correctly stays a plain link to the page top.

---

## Reference: image specs

Decided after testing - see notes below the table.

| Use on site | Max width |
|---|---|
| Hero / before-after slider | 1800–2000px |
| Gallery detail / lightbox | 1800–2000px |
| Gallery grid thumbnails | 700–800px |
| Inline content images | 1000–1200px |

- Convert everything to WebP. Quality setting: **80%**.
- Resize *before* exporting to WebP - resizing does more for file size than fine-tuning quality.
- Benchmark: ~65–70KB at 960px wide is a good, healthy result. Don't chase smaller - going much below ~40–50KB at that resolution risks visible artefacts on sky, glazing and brick textures.
- All `.HEIC` files **must** be converted regardless of size - HEIC isn't supported in Chrome, Firefox or Edge.
- **Note on `before-1.webp` / `after-1.webp`:** the generic 1800–2000px hero/slider spec above assumed a large, full-width treatment. The approved design's before/after slider is actually a compact ~475–500px-wide component, not full-bleed - at that size, source images around 950–1000px wide are enough for a sharp retina render. These two files are likely already adequate as-is; confirm once the slider is built and rendering in a real browser, rather than re-exporting pre-emptively.
- **Note on inline content placeholders (added during Stage 3):** while converting `conservatory-conversion.html`, `roof-options.html` and `how-it-works.html`, the design's `PicsumImg` calls (external random-image placeholders) were replaced with local `.img-placeholder` divs pointing at fixed intended paths, all flat under `assets/`, all sized to the inline content images tier (max 1000–1200px):
  - `conservatory-conversion.html`: `conversion-benefit.webp`, `conversion-strength.webp`
  - `roof-options.html` (one per roof system, looped): `roof-01.webp`, `roof-02.webp`, `roof-03.webp`, `roof-04.webp`
  - `how-it-works.html` (one per step, looped): `step-01.webp` through `step-05.webp`

  These 11 filenames are already baked into the markup - see the matching Stage 4 note below.
- **Note on the before/after gallery images (added during Stage 3):** the `before-and-afters.html` project gallery uses 10 more local images, at the **Gallery grid thumbnails tier (700–800px)** - sequential, flat under `assets/`, matching the existing `before-1`/`after-1` convention:
  - `before-2.webp` through `before-6.webp`
  - `after-2.webp` through `after-6.webp`

  (`before-1.webp` / `after-1.webp` already exist and are reused for project 1.) These render as cover-fit cards with a before/after toggle and never open a larger lightbox, so the thumbnail tier is correct - the 1800–2000px detail tier would be wasted bytes. Like the inline placeholders, the paths are baked into the markup, so Stage 4 is a straight export-and-drop-in.
- **Note on the contact-page map (added during Stage 3):** the "Map — 19 Arthur Street, Belfast" block on `contact.html` is a styled placeholder (diagonal-stripe panel), **not a live map**. It needs a real embed (e.g. a Google Maps iframe or a static map image) before go-live - **flagged for Stage 8 (final pre-launch review)**, or sooner if a real map is wanted during the build.

---

## Stage 0 - Environment ✅ done

- [x] Folder structure created on disk
- [x] Claude Code installed in VS Code, pointed at the `website` folder
- [x] Homepage (`index.html`, `styles.css`, `main.js`) built and verified locally

---

## Stage 1 - Decide the shared-markup approach ✅ done

**Goal:** decide how the navbar, top phone bar, mobile menu overlay and footer get shared across 10 pages, before building any more of them. The options:

- **A. Build script with partials** - `partials/` folder for shared chunks, a short Node script stitches them into each page and writes finished static HTML to `public/`, which Vercel deploys. No more editing the nav 10 times.
- **B. Plain duplication** - copy the header/footer markup into every page by hand. Zero tooling, more upkeep.

**Decision: Option A** - partials + build script, chosen for the long-term maintenance benefit across 10 pages and because it lines up with the Vercel build step set up in Stage 2 below.

- [x] `partials/`, `src/pages/`, `build.js`, `package.json` built
- [x] Verified against the original `index.html` (now `index.html.reference`): diff showed only the intended `data-nav` markers and auto-injected `active` class
- [x] `build.js` itself verified (not just its logic): Node installed locally, real build run and diffed clean against the working Python stand-in Claude Code used while Node was unavailable
- [x] Old root `index.html` retired - renamed to `index.html.reference`, banner-marked as dead/reference-only

**Starter prompt:**

```
I'm building a 10-page static HTML/CSS/JS site (no framework). index.html is
already built and working - open it and use it as the reference for the
design system and shared components (navbar, top phone bar, mobile overlay,
footer).

I want to avoid duplicating that header/footer markup across 10 separate
files. Propose a lightweight approach: a partials/ folder with the shared
chunks, and a short Node build script (no dependencies beyond what's needed)
that stitches partials into page-specific content and outputs finished
static HTML into a public/ folder. Show me the plan before writing any code.
```

---

## Stage 2 - Connect GitHub & Vercel (early)

**Goal:** rather than waiting until the whole site is built, connect the GitHub repo and Vercel project straight after Stage 1, so every page built from here on can be checked on a live Vercel URL as soon as it's pushed - the same commit → deploy → live URL workflow used on previous projects. This means setting up `vercel.json` with the correct `buildCommand` and `outputDirectory` now, matching the Stage 1 build script's output (`public/`), rather than leaving it until the end of the project.

**Starter prompt:**

```
Now that the partials/build-script approach from Stage 1 is working locally,
help me get this project into a GitHub repo and connected to Vercel for
auto-deployment, this early in the build rather than at the end. Set up
vercel.json with the correct buildCommand and outputDirectory so Vercel runs
the build script and serves the public/ output. Walk me through each step,
including anything I need to do in the GitHub and Vercel web interfaces
myself. Once this is done I should be able to push any change and see it
live on the Vercel URL.
```

---

## Stage 3 - Build the remaining pages

**Goal:** convert each `page-*.jsx` file into a static HTML page, one at a time, following the same pattern as `index.html`.

**Starter prompt** (repeat per page, swapping in the relevant file):

```
Here's page-faq.jsx from the original design project [paste content]. Convert
it into a static HTML page the same way index.html was converted from
page-home.jsx - same design system, same component patterns (Reveal →
.reveal + data-delay, map() loops unrolled into real HTML, inline SVG icons
kept as-is). Use the shared partials from Stage 1 for the header/footer.
```

**Reminder for `roof-options.html` specifically:** ✅ **done** (commit 708022e). Each roof-type section has its own anchor ID and the four homepage "Learn More" links point to the matching anchor.

**Reminder for `how-it-works.html` specifically:** ✅ **done** (commit 9bfda8c). A left-aligned solid-orange "See How It Works" CTA now sits under the closing paragraph of the homepage's "Built with bespoke insulated roof systems" section, linking to this page (its primary entry point, since it isn't in the main nav).

---

## Stage 4 - Image pipeline ✅ done (with caveats below)

**Goal:** batch-convert all HEIC/JPG photos to optimised WebP using the specs above.

**Status:** 16 source photos converted to WebP via `scripts/convert-images.js` (Node + sharp, installed locally with `--no-save` so it never touches the Vercel build; sources staged in the gitignored `_stage4-src/`, only the optimised `assets/*.webp` outputs are committed). Gallery tier max 800px, inline max 1200px, quality 75 baseline with q70 on the detail-dense outliers; `roof-01..04` additionally trimmed to max 1000px to lighten the roof-options page (~773KB → ~557KB combined). Every output was visually inspected - no artefacts on glazing, brick or sky. The heaviest files are detail-bound (foliage, gravel, brick, tile granules), not quality-bound, confirmed by how little further compression achieved. Now live with real photos: `before-and-afters.html`, `conservatory-conversion.html`, `roof-options.html`.

**Caveats / still outstanding:**
- **`step-01.webp` through `step-05.webp`** (the five `how-it-works.html` step images) remain as `.img-placeholder` divs - no source photos supplied yet. Names/paths are already baked into the markup, so it's a straight drop-in: add the five mappings to `scripts/convert-images.js` and re-run once the photos arrive.
- **`before-1.webp` / `after-1.webp`** (homepage hero slider) were left untouched this run and still await **visual in-browser confirmation** that they're sharp enough at the slider's real rendered size (~475-500px wide) - see the slider note under "Reference: image specs" above. Re-export only if they actually look soft.

**Starter prompt:**

```
I have a folder of HEIC and JPG photos that need converting to WebP. Specs:

- Hero / gallery detail images: resize to max 2000px on the longest edge
- Gallery thumbnails: resize to max 800px
- Inline content images: resize to max 1200px
- Export all as WebP, quality 80
- Target roughly 65-70KB for a 960px-wide image as a sanity check

Write a script (Node + sharp, or another tool you'd recommend) that batch
processes everything in [folder path] and outputs the results to a separate
folder, sorted by which size tier each one needs. Ask me which photos belong
in which tier if it's not obvious from the filename.
```

**Check before assuming work's needed:** `before-1.webp` and `after-1.webp` were initially flagged as undersized against the generic 1800-2000px hero spec, but the approved design's before/after slider actually renders far smaller than that (~475-500px wide) - these files are likely already fine. Confirm the rendered size once the slider's built before spending time re-exporting them. See the note under "Reference: image specs" above.

**Drop-in replacement, not a rename:** the 11 inline content images on `conservatory-conversion.html`, `roof-options.html` and `how-it-works.html` already have fixed paths baked into the markup via `.img-placeholder` (see "Reference: image specs" above for the full filename list). For these specific files, Stage 4 is a straight export-and-drop-in once the real photos are sourced - no markup or path changes needed, since the naming and the inline-content size tier (max 1000-1200px) are already decided.

---

## Stage 5 - Contact form backend

**Goal:** replace the current client-side-only "fake success" brochure form (see the `TODO` comment in `main.js`) and wire up the real contact form with an actual backend, since there's no CMS or third-party form plugin doing this for us.

**Decision needed first:** Vercel serverless function + a transactional email service (e.g. Resend), or a drop-in third-party form service (e.g. Formspree, Web3Forms). The former is fully yours and unbranded; the latter is faster to set up.

**Starter prompt:**

```
I need to wire up the contact form and the brochure-download modal form to
actually send submissions somewhere - right now main.js just fakes a
success state client-side (see the TODO comment). I want to use [Vercel
serverless function + Resend / Formspree / Web3Forms - pick one]. Walk me
through the setup and write the necessary code.
```

---

## Stage 6 - SEO architecture improvements (optional, post-launch)

**Context:** the original live site has dead nav links and no individual pages for several services it lists in the footer (EPDM roofing, conservatory insulation, extensions & new builds). The approved design's 10 pages don't currently include these as standalone pages either. Worth adding later for SEO value, once the core 10 pages are live.

**Starter prompt:**

```
I want to add new SEO landing pages for: EPDM flat roofing, conservatory
insulation, and extensions & new builds. Use the same design system and
page template as the rest of the site. I'll provide the content for each -
help me draft a content outline for each page first, then build them once
I've approved the copy.
```

---

## Stage 7 - Local testing

**Goal:** test the full site locally with a real local server (not just double-clicking files), to catch any relative-path issues before deploying.

**Starter prompt:**

```
Set up a simple local dev server for this static site (no build framework)
so I can test all pages together, including relative asset paths and
internal links. Recommend the simplest option.
```

---

## Stage 8 - Final deploy & go-live review

**Goal:** GitHub and Vercel were already connected back in Stage 2, so by this point every page should already be auto-deploying to the live Vercel URL as it's built. This stage is the final pre-launch pass: confirm the live deployment matches what was tested locally in Stage 7, double-check the build is picking up the optimised images and the live contact form, and fix anything that only shows up in production.

**Starter prompt:**

```
We've already got GitHub and Vercel connected and auto-deploying since
Stage 2. Do a final pre-launch review of the live Vercel URL: check every
page renders correctly, verify all internal links and the optimised images,
and confirm the contact form actually sends submissions on production (not
just locally). Flag anything that differs from what we tested in Stage 7's
local server.
```

---

## Stage 9 - Domain cutover (later, not yet planned in detail)

Once the new site is live on a Vercel preview URL and approved, the existing domain (conservatoryconversions.co.uk) needs pointing at it. Not yet scoped - revisit once Stage 8 is done.

---

## Stage 10 - Post-launch design & content optimisation (later, not yet planned in detail)

The current design is the client-approved baseline for getting the site live, not necessarily the final word. Once the core 10 pages are built and launched, expect a follow-up pass to revisit specific elements - e.g. the before/after slider's size and treatment (flagged during the homepage build as worth reconsidering, see "Reference: image specs" above). Not yet scoped - revisit once Stage 8 is done.
