# Content notes

Validation: `tsc --noEmit --strict` passes on projects.ts + profile.ts; all 30 images[].src exist; total public/ ~936 KB, every file <= 250 KB.

## figma.site mapping (identified by opening each page)
- https://dot-decaf-40843684.figma.site/ -> landing-design. Content: "JR IMPRENTA", print shop services; palette #F4F0E6/#111/#20CBE1/#FF4A9B/#F5E829 and copy match the zip's App.tsx/index.css.
- https://blot-help-33996919.figma.site/ -> tienda-ropa. Content: "LUNE maison PARIS", women's clothing store. Brand colors from its CSS/page: plum #482E35 (promo strip), rose gold #B76E79, cream #F8F3ED (page bg). Store name "LUNE Maison" is taken from the page.
- https://peace-stain-61686602.figma.site/ -> nova (RESOLVED, now the 10th project): "NØVA", a car marketplace/financing concept (dark #0C0F0D, lime #C7FF4A, Manrope). Year 2026 uncertain. Not a shoe design, so AERA has no links.figma.
- https://aero-nu-three.vercel.app/ -> aera links.live (AERA — Calzado). No Figma URL exists for aera; links.figma left empty.

## Per project
- destiny-barber: year 2026 (first commit 2026-07-01, last 2026-10-13; business since 2018). Live shots fresh from destinybarberstudio.com (hero video renders as dark frame). Logo from webapp/public/logo-mark.png. Client approval confirmed by owner.
- elegance-dominio: year 2026 (2026-09-15..10-19). Branch/barber counts, Turnstile, "fork of Destiny" taken from brief, not re-verified in code. Client approval confirmed.
- reeteil: 2023-present from brief/CV (repos only start 2025-08-17; backend/frontend git). links.store = https://play.google.com/store/apps/details?id=com.shadow00.reeteilapp, VERIFIED (HTTP 200, og:title "Reeteil - Agente AI", description "B2B Sales Force managing orders, distribution and delivery 24/7"; a bogus id returns 404). Images are Play Store listing screenshots (feature graphic, chat, orders) + logo. No local app screenshots existed.
- quivo: 2024-present from CV (backend repo first commit 2025-11-27, expo app 2026-07). Only public URL found: https://control.myquivo.com (Quivo Control, fleet operations panel + landing) -> used as links.live; this is one component, not the NFC payments app. Brand colors from "MANUAL DE MARCA QUIVO V2.pdf": #4F22D6, #FF9900, #053C57. Logo = ICONO PRINCIPAL.png (purple minibus). Stack conflict: CV says Flutter; current mobile repo is Expo (old Flutter app archived as "quivo_mobile-flutter(old)"). Listed both. 38,000 Bs funding is from CV/brief, unverified in repo. Also exists: Quivo-ERP (internal, Next.js/Supabase, private) - not featured.
- kuska: year 2026 (2026-09-11..13). Solidity, gasless, QR delivery proof taken from brief/live page copy; contract code not re-read. Used live shots + local kuska-cover (the local stage/prod screenshots were not used).
- atletas-bo: year 2026 (first commit 2026-05-13, last 2026-09-24). Owner confirmed it is their own project: client "Own project". Repo is v0-scaffolded. Live = atletas-bo.vercel.app (atletas.bo domain pending per handoff). /admin,/dashboard are basic-auth gated. Role "Full-stack developer" assumed. Palette from globals.css: brand #1D9E75, wash #0E2A22.
- tienda-ropa: year 2026 UNCERTAIN (no dates available). Palette now real (see above), no longer provisional. Figma Make "Created with" banner was blocked in screenshots.
- aera: year 2026 (git 2026-10-08). Palette from brief. Live screenshots from the vercel URL (hero is a mostly static photo; scroll shot shows collection).
- landing-design: year 2026 (zip dated 2026-10-21). "JR Imprenta" client inferred from page; a folder "Landing JR Impresiones" exists locally but was not inspected. Owner confirmed it is not a real client: client "Concept (self-initiated)".

## Planet palette picks
landing-design: brief gave no colors; used cyan/pink/yellow from its CSS. atletas-bo and quivo base/accent/ring chosen by me from brand sources. speeds: 0.06 (inner) -> 0.01 (outer).

## Profile
Bio paraphrased from the brief. linkedin undefined (none provided). Education date "expected 2026" as given.

## Gaps / for owner
- Confirm: tienda-ropa year, Quivo public product URL (only control.myquivo.com found), Elegance facts.
- Mobile screenshots of figma.site/vercel sites use isMobile emulation; landing mobile shows header above the fold only.
- Scratch tooling (playwright-core, raw PNGs) lives in scratchpad/tools and scratchpad/raw, outside content/.
