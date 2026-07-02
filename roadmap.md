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

## Stage 8 - Final deploy & go-live review ✅ done

**Goal:** GitHub and Vercel were already connected back in Stage 2, so by this point every page should already be auto-deploying to the live Vercel URL as it's built. This stage is the final pre-launch pass: confirm the live deployment matches what was tested locally in Stage 7, double-check the build is picking up the optimised images and the live contact form, and fix anything that only shows up in production.

**Review outcome (all checks against the live Vercel URL):**

- All 10 pages return 200 with correct titles.
- All internal page links resolve, including the 4 roof-options anchor links → their `id` targets.
- 20 optimised `.webp` images load correctly; core assets (styles.css, main.js, Ibrand.woff2, all 6 accreditation logos) serve with correct content-types.
- Contact form **and** brochure form confirmed sending on production (`POST /api/contact` and `/api/brochure` both returned `{"ok":true}` 200). The serverless functions only run on Vercel (or `vercel dev`), so this was the first true end-to-end test of the forms — they work.
- No production-only regressions found.

**Known gaps at launch (accepted, tracked to post-launch):**

- **step-01 … step-04 images** on `how-it-works.html` were later supplied and added (see Stage 8.5). **step-05** still has no source photo and renders as a plain grey `.img-placeholder` box — the real photo drops straight into the existing path when supplied, no markup change. Still tracked under Stage 10.

**✅ RESOLVED — SMS shortcode:** the "Or text QUOTE to 60075" CTA on `contact.html` was placeholder copy. The client confirmed they don't offer an SMS service, so the button was removed entirely (see Stage 8.5).

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

## Stage 8.5 - Post-launch refinements, new photography & mobile/perf polish ✅ done

A batch of client-requested refinements, new photography, a full mobile-responsive pass and a performance-optimisation round, completed after the Stage 8 go-live review and before the Stage 9 domain cutover. Grouped by area:

**New photography & imagery**

- Homepage hero: added a photographic background (`mainslider3.webp` — red tiled roof / blue sky) behind a dark overlay for text readability, scoped to the homepage only via a `.hero-home` class.
- Homepage before/after slider: replaced `before-1`/`after-1` with a matched pair from a single job (stronger transformation), and enlarged the slider (5:4, `max-height` capped so the left copy column defines the row height).
- `how-it-works.html`: step-01 through step-04 photos supplied and added (step-05 still pending — see Stage 10).
- `mainslider2.webp` also exported and available (not yet placed). All new images run through the Stage 4 pipeline (`scripts/convert-images.js`) → optimised WebP.

**Performance optimisation (mobile Lighthouse ~83 → 97)**

- Self-hosted the Outfit font (variable woff2, `font-display: swap`); removed the render-blocking Google Fonts request and the unused Barlow Condensed. **No third-party font CDN dependency remains** (performance + GDPR win).
- Inlined + minified the critical CSS into `<head>` at build time; removed the render-blocking external stylesheet request.
- Hero background converted from a CSS `background-image` to a `<picture>`/`<img>` with `fetchpriority="high"`, a responsive 768px mobile source, and a homepage-scoped `<link rel="preload">` — fixes the LCP.
- Deferred `main.js` and moved slider/UI init to run after first paint (double-rAF); refactored the before/after slider to cache geometry and batch writes in `requestAnimationFrame` (eliminates the forced reflow).
- Resized oversized accreditation logos (fsb 55 KB → 11 KB, trustpilot 28 KB → 8 KB).

**Mobile responsive pass**

- Fixed sitewide horizontal scroll: `overflow-x: hidden` baseline plus the root-cause fix converting every `minmax(Npx, 1fr)` grid to `minmax(min(Npx, 100%), 1fr)`; heading `overflow-wrap: break-word`; hero trust-badge row `flex-wrap`.
- Accreditation logo aspect-ratio fix: `max-height` + `height: auto` so wide logos scale proportionally instead of squashing on narrow cells; explicit `width`/`height` attributes added for CLS.
- Sticky mobile CTA bar: hidden on load, slides in only once the hero CTAs scroll out of view (IntersectionObserver on `.hero-actions`, guarded against the first-callback flash); fixed its viewport overflow.
- Reduced navbar + hero top padding on mobile so the eyebrow, headline, subtext and both CTAs fit above the fold at 375px (mobile-scoped; desktop padding restored). Headline scales down via `clamp(28px, 8vw, 44px)`.
- Fixed a CSS cascade bug where the mobile navbar/hero overrides were declared before their base rules and lost — moved them after so the navbar aligns with page content (20px horizontal).

**Design / layout / content**

- Removed the cyan corner-accent triangle from the homepage hero (clashed with the new photo background); hero columns vertically balanced.
- Sitewide: replaced all em-dashes (—) with en-dashes (–).
- `about.html`: swapped the Our Values / trust-logos treatment (Values → light background, trust logos → dark homepage-style logo images); "Where We Work" set to 2 rows of 4; Values section given an off-white background for separation.
- `conservatory-conversion.html`: moved the "Talk to an Expert" dark banner to sit between the Benefits and Improve Your Space sections (restores the dark → light → dark rhythm).
- `before-and-afters.html`: removed the year from gallery card labels (kept the location).
- `contact.html`: removed the SMS "text QUOTE to 60075" button; moved the Google Map into the left column (between the contact details and the USP bar); removed the USP bar; updated the eyebrow "Visit, Call or Text" → "Visit or Call".
- Homepage hero paragraph copy changed to white (`#ffffff`) for readability over the photo.
- Navbar base vertical padding reduced (22px → 10px).

---

## Stage 9 - Domain cutover

**Goal:** point the live domain `conservatoryconversions.co.uk` (registered at GoDaddy) at the Vercel deployment, and — as a linked task — verify the domain in Resend so the contact/brochure forms can send from the real business address instead of the interim sandbox sender.

There are **two independent DNS jobs**, both done at GoDaddy but for different services: (A) the **site** (Vercel) and (B) **email sending** (Resend). They can run in parallel, but each has its own internal order, and the `MAIL_FROM` env swap must come last (see dependencies).

### A. Custom domain on Vercel

1. **Add the domain in Vercel** — Project → Settings → Domains → add `conservatoryconversions.co.uk` **and** `www.conservatoryconversions.co.uk`. Vercel then displays the exact DNS records to create and shows each domain as "Invalid Configuration" until they resolve.
2. **Add the DNS records at GoDaddy** (Domain → DNS → Manage Zones). GoDaddy does not support ALIAS/ANAME at the apex, so use Vercel's A-record method:
   - **Apex** (`@`): `A` record → `76.76.21.21` (Vercel's anycast IP — but always use the value Vercel shows, in case it changes).
   - **www**: `CNAME` → `cname.vercel-dns.com`.
   - Decide the canonical host in Vercel (redirect `www` → apex, or vice-versa) — Vercel handles the 308 redirect automatically once both are added.
   - Remove any old/conflicting `A`/`CNAME`/parking records GoDaddy had for `@`/`www` pointing at the previous host.
3. **SSL** — automatic. Once DNS resolves, Vercel provisions and renews a Let's Encrypt certificate with no action needed. HTTPS + HTTP→HTTPS redirect are on by default.
4. **Propagation** — usually minutes, up to ~24–48h worst case. Vercel flips the domain to "Valid Configuration" when ready. Verify the live site loads on the real domain over HTTPS.

### B. Resend domain verification (for real-sender email)

1. In **Resend** → Domains → add `conservatoryconversions.co.uk`. Resend generates DNS records — typically a **DKIM** record (`TXT`/`CNAME`), an **SPF** `TXT` (and an `MX` on a `send.` subdomain for return-path/feedback), and optionally a **DMARC** `TXT`.
2. Add those exact records at **GoDaddy** DNS.
3. Wait for Resend to show the domain as **Verified**.

### C. Swap the mail env vars (LAST — depends on B)

Once — and only once — the Resend domain shows **Verified**:

- In Vercel → Settings → Environment Variables set:
  - `MAIL_FROM` = `Conservatory Conversions <sales@conservatoryconversions.co.uk>`
  - `MAIL_TO` = `sales@conservatoryconversions.co.uk`
- **Redeploy** (env var changes only take effect on a new deployment).
- Send a live test through both the contact form and the brochure modal; confirm delivery from the new address.

### Order-of-operations dependencies

- **A and B are independent** and can be done in parallel (both are just GoDaddy DNS edits), but keep their records straight — the site records (A) and the email records (B) are separate entries in the same zone.
- **C depends on B.** Do **not** swap `MAIL_FROM` to `sales@…` before Resend reports the domain Verified — Resend rejects sends from an unverified from-domain, which would break the forms. Until then, the interim `onboarding@resend.dev` sender (Stage 5 default) keeps working, so there is **no delivery downtime**; the swap is a clean cutover after verification.
- **C requires a redeploy** to pick up the new env values.
- The site cutover (A) does **not** depend on email (B/C) — the site can go live on the real domain while email still uses the sandbox sender; swap the sender whenever Resend verifies.

**Rollback:** if anything misbehaves, the Vercel `*.vercel.app` URL keeps working throughout, and reverting the GoDaddy A/CNAME records restores the previous state.

---

## Stage 10 - Post-launch design & content optimisation (later, not yet planned in detail)

The current design is the client-approved baseline for getting the site live, not necessarily the final word. Once the core 10 pages are built and launched, expect a follow-up pass to revisit specific elements.

**Resolved during Stage 8.5:**

- ~~Hero section background image~~ — **done**: `mainslider3.webp` (red tiled roof / blue sky) added behind a dark overlay, homepage-scoped.
- ~~Before/after slider size and treatment~~ — **done**: enlarged to a 5:4 slider filling the right column, with a matched before/after pair.
- ~~Cyan triangle graphic top-right~~ — **done**: removed from the homepage hero (clashed with the new photo background).

**Still outstanding:**

- **step-05 image** on `how-it-works.html` — no source photo yet; renders as a plain grey `.img-placeholder` box (step-01–04 were supplied in Stage 8.5). Drops straight into the existing path when the photo is supplied, no markup change.
- **Accreditation bar logos** — if better source files become available for FENSA, FMB or Checkatrade (proper reversed / white-on-transparent versions), replace the current white-keyed PNGs generated by Claude Code.
- Mixed title case vs sentence case in heading copy (low priority).
