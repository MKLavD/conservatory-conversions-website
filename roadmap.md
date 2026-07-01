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
│   ├── head.html           ✅ built - <head> contents, {{TITLE}} / {{DESCRIPTION}} tokens + iBrand preload link
│   ├── header.html         ✅ built - phone bar + navbar + mobile overlay
│   └── footer.html         ✅ built - brochure modal + footer + mobile CTA + <script>
├── src/
│   └── pages/
│       └── index.html      ✅ built - real editable source for the homepage
├── public/                  generated output - this is what Vercel serves
├── scripts/
│   └── convert-images.js   ✅ built - Node + sharp image pipeline, local dev only, never runs on Vercel
└── assets/
    ├── before-1.webp       ✅ real photo added (960×619, 64KB)
    ├── after-1.webp        ✅ real photo added (960×566, 71KB)
    ├── css/
    │   └── styles.css      ✅ built
    ├── js/
    │   └── main.js         ✅ built
    ├── fonts/
    │   ├── Ibrand.woff2    ✅ added - primary format, preloaded in head.html
    │   ├── Ibrand.woff     ✅ added - fallback
    │   └── Ibrand.ttf      ✅ added - last-resort fallback
    └── logos/
        ├── fensa.png       ✅ added - white-keyed transparent PNG
        ├── fmb.png         ✅ added - white-keyed transparent PNG
        ├── checkatrade.png ✅ added - white-keyed transparent PNG
        ├── fsb.webp        ✅ added - transparent background
        ├── trustpilot.webp ✅ added - transparent background
        └── which.png       ✅ added - transparent background
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

---

## Reference: image specs

Decided after testing - see notes below the table.

| Use on site | Max width |
|---|---|
| Hero / before-after slider | 1800-2000px |
| Gallery detail / lightbox | 1800-2000px |
| Gallery grid thumbnails | 700-800px |
| Inline content images | 1000-1200px |

- Convert everything to WebP. Quality setting: **80%**.
- Resize *before* exporting to WebP - resizing does more for file size than fine-tuning quality.
- Benchmark: ~65-70KB at 960px wide is a good, healthy result. Don't chase smaller - going much below ~40-50KB at that resolution risks visible artefacts on sky, glazing and brick textures.
- All `.HEIC` files **must** be converted regardless of size - HEIC isn't supported in Chrome, Firefox or Edge.
- **Note on `before-1.webp` / `after-1.webp`:** the generic 1800-2000px hero/slider spec above assumed a large, full-width treatment. The approved design's before/after slider is actually a compact ~475-500px-wide component, not full-bleed - at that size, source images around 950-1000px wide are enough for a sharp retina render. These two files are confirmed adequate as-is.
- **Note on inline content placeholders (added during Stage 3):** while converting `conservatory-conversion.html`, `roof-options.html` and `how-it-works.html`, the design's `PicsumImg` calls (external random-image placeholders) were replaced with local `.img-placeholder` divs pointing at fixed intended paths, all flat under `assets/`, all sized to the inline content images tier (max 1000-1200px):
  - `conservatory-conversion.html`: `conversion-benefit.webp`, `conversion-strength.webp`
  - `roof-options.html` (one per roof system, looped): `roof-01.webp`, `roof-02.webp`, `roof-03.webp`, `roof-04.webp`
  - `how-it-works.html` (one per step, looped): `step-01.webp` through `step-05.webp`

  These 11 filenames are already baked into the markup. `step-01` through `step-05` remain as `.img-placeholder` divs - no source photos yet.

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

---

## Stage 2 - Connect GitHub & Vercel ✅ done

- [x] GitHub repo created: MKLavD/conservatory-conversions-website (private)
- [x] Vercel connected, auto-deploy on push to `main` confirmed
- [x] `vercel.json` uses `buildCommand: node build.js` and `outputDirectory: public`
- [x] Live Vercel URL: https://conservatory-conversions-website.vercel.app

---

## Stage 3 - Build the remaining pages ✅ done

All 10 pages built and live. All internal links resolve.

- [x] All pages converted from `page-*.jsx` to static HTML following the established pattern
- [x] `roof-options.html` anchor links added; homepage "Our Systems" cards updated to link to `#solid-tiled-roof`, `#hybrid-roof-system`, `#internal-insulation`, `#full-conservatory-conversion`
- [x] "SEE HOW IT WORKS" CTA button added to homepage Technology section, linking to `how-it-works.html`

---

## Stage 4 - Image pipeline ✅ done

- [x] `scripts/convert-images.js` built (Node + sharp) - local dev only, never runs on Vercel
- [x] 16 photos converted and live
- [x] `_stage4-src/` holds raw originals (gitignored)
- [x] `step-01` through `step-05` remain as `.img-placeholder` divs - no source photos yet. When they arrive, add 5 mappings to `scripts/convert-images.js` and re-run. Paths already baked into `how-it-works.html` markup - zero markup rework needed.

**Check before assuming work's needed:** `before-1.webp` and `after-1.webp` are confirmed adequate for the compact slider component - no re-export needed.

**Drop-in replacement, not a rename:** the 11 inline content images on `conservatory-conversion.html`, `roof-options.html` and `how-it-works.html` already have fixed paths baked into the markup. Stage 4 is a straight export-and-drop-in once the real photos are sourced.

---

## Stage 4.5 - Design polish ✅ done

Post-build design improvements made before Stage 5. All live.

- [x] Stats cards grid - balanced to clean 3x2 layout, equal height cards
- [x] CTA button glow - non-hover glow intensity reduced and set to gentle pulse animation (keyframe, ~2-3s cycle, ease-in-out)
- [x] CTA button variants - three context-aware variants implemented:
  - Dark sections: cyan fill, white text, cyan glow + pulse
  - Light/white sections: navy fill, white text (cyan on hover), cyan glow + pulse
  - Cyan sections: navy fill, cyan text (white on hover), white glow + pulse
- [x] Homepage hero - column split changed from 50/50 to 60/40 (copy/image)
- [x] Homepage hero - trust badges moved from below CTAs (left column) to below slider (right column); Trustpilot 4.9/5 rating added to right column
- [x] Homepage hero - trust badges changed from pill style to plain inline text with icons, all on one line
- [x] Homepage hero - vertical alignment set to centre; slider height capped at `max-height: 340px` so left column defines the row height
- [x] Homepage hero - "Our Systems" cards made fully clickable (whole card, not just "Learn More" text)
- [x] Capitalisation sweep - section headings, card titles, accordion questions (FAQ + finance), finance step-card titles changed from all-caps to title case via CSS. Nav, buttons, eyebrows, badges, labels kept all-caps.
- [x] Global container max-width changed from 1280px to 1440px
- [x] Contact page - USP box hover animation removed (purely informational components)
- [x] Contact page - "Or download our brochure first" link removed from below form submit button
- [x] Contact page - submit button label changed from "Send My Free Quote Request" to "Get My Free Quote"
- [x] Contact page - Google Maps embed added (19 Arthur Street, Belfast), responsive via CSS
- [x] iBrand font - self-hosted via `@font-face`, applied to h1-h6 headings only. Single weight (400), `font-synthesis: none` prevents faux-bold. woff2 preloaded in `head.html`.
- [x] Stat card `.num` elements switched to iBrand font
- [x] Footer logo alignment fixed; social icon circle centering fixed
- [x] Accreditation bar - text-only labels replaced with real logo images (FENSA, Checkatrade, FMB, FSB, Trustpilot, Which?). All rendered white via `filter: brightness(0) invert(1)`. FENSA, FMB and Checkatrade white-keyed locally by Claude Code from supplied source files. Individual logo heights tuned for visual balance.

---

## Stage 5 - Contact form backend ✅ done

**Goal:** replace the current client-side-only "fake success" brochure form (see the `TODO` comment in `main.js`) and wire up the real contact form with an actual backend, since there's no CMS or third-party form plugin doing this for us.

**Decision made:** Vercel serverless function + Resend. Chosen for full ownership and no third-party branding.

**What was built:**

- `api/contact.js` — `POST /api/contact`; validates name/phone/postcode/email (required) plus style/roof/message, emails the submission, sets `reply_to` to the enquirer.
- `api/brochure.js` — `POST /api/brochure`; validates name/email/postcode, emails the lead.
- `lib/mail.js` — shared Resend HTTP helper using the runtime's built-in `fetch` (no SDK dependency). HTML-escapes all user input; trims `RESEND_API_KEY` before building the `Authorization` header.
- `assets/js/main.js` — the two fake-success blocks now do real `fetch` POSTs with a "Sending…" loading state, unchanged success UX, and an inline error message on failure.
- `.gitignore` — added `.env*` and `.vercel/` so a local key can never be committed.

Vercel auto-detects the root `/api` directory as serverless functions independently of the static build (`buildCommand: node build.js`, `outputDirectory: public`), so no config change was needed. Only internal notification emails are sent — no customer autoresponder yet (can be added later if wanted).

**⚠️ TODO before/at go-live — swap the temporary email addresses:**

Currently sending **from** `onboarding@resend.dev` (Resend's shared sandbox sender, no domain verification needed) **to** `dan@laventusdigital.co.uk`. These are interim defaults baked into `lib/mail.js`.

Once the GoDaddy DNS for `conservatoryconversions.co.uk` is added and **verified in Resend**, switch both addresses to `sales@conservatoryconversions.co.uk`. This is done purely by setting two **Vercel environment variables** — **no code change needed**:

- `MAIL_FROM` = `Conservatory Conversions <sales@conservatoryconversions.co.uk>`
- `MAIL_TO` = `sales@conservatoryconversions.co.uk`

Note: while on the sandbox sender, Resend only delivers to the Resend account's own email — verifying the domain lifts that restriction.

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

The current design is the client-approved baseline for getting the site live, not necessarily the final word. Once the core 10 pages are built and launched, expect a follow-up pass to revisit specific elements.

**Already identified:**

- Hero section background image - currently text-only, no background photo
- Before/after slider size and treatment - flagged during homepage build as worth reconsidering
- step-01 through step-05 images - no source photos yet, placeholders in markup
- Mixed title case vs sentence case in heading copy (low priority)
- Cyan triangle graphic top-right may look disconnected at 1440px
- Accreditation bar logos - if better source files become available for FENSA, FMB or Checkatrade (proper reversed/white-on-transparent versions), replace the current white-keyed PNGs generated by Claude Code
