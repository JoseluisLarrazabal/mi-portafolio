# Plan — Portafolio 3D "Sistema solar" (mi-portafolio)

## Contexto
CTO (Jose Luis Larrazabal) quiere portafolio interactivo estilo videojuego 3D: novedoso, intuitivo, creativo. Decisiones ya tomadas:
- Concepto: **sistema solar + nave**. Cada trabajo = planeta. Sol = About. Estación = Contact.
- Idioma: **solo inglés**.
- Deploy: **GitHub (JoseluisLarrazabal) + Vercel**.
- Email contacto: **cto.josel@team.myquivo.com**. GitHub: JoseluisLarrazabal. LinkedIn: pendiente (placeholder).
- Trabajos (9): DestinyBarber Studio, Elegance Dominio, Reeteil (AI commerce), Kuska, Quivo, Atletas.bo, Tienda de ropa femenina (Figma Make), AERA shoe page (Figma Make), Landing page design (Figma Make).
- Figma Make: CTO los publica y pasa URLs `*.figma.site` (pendiente; placeholder hasta entonces).
- Más trabajos llegarán después: agregar uno = 1 entrada de datos + carpeta de imágenes, sin tocar código 3D.

Hallazgos exploración: no hay stack 3D web previo (Carnaval/arcade son Unity). Stack web del CTO: Vite 8 + React 19 + TS 5.7 + Tailwind 4 + pnpm, deploy Vercel. Blender no instalado → planetas procedurales (shaders), sin modelado.

## Carpeta
`/home/shadowfreak/Documents/mi-portafolio` (guion en vez de espacio: rutas con espacios rompen scripts).

## Stack
Vite + React 19 + TS + Tailwind 4 + pnpm · `three` + `@react-three/fiber` v9 + `@react-three/drei` + `@react-three/postprocessing` (bloom) + `zustand` (estado nave/UI) · Vitest. Sin motor de física (vuelo cinemático basta).

## Diseño del juego
- **Mapa**: Sol centro (About: bio CV, skills, educación). Órbita interna = sitios de clientes (Destiny, Elegance). Media = productos/startups (Reeteil, Quivo, Kuska, Atletas.bo). Externa = exploraciones de diseño (3 Figma Make). Estación orbital = Contact. Cinturón de asteroides decorativo separa zonas.
- **Planeta por marca**: shader procedural (bandas de ruido + atmósfera fresnel + anillo opcional) con paleta real: Destiny `#211C3F/#4A3E66`, Elegance gris plomo + anillo oro `#C9A45C`, Reeteil `#3B82F6/#8B5CF6`, Kuska `#1C3F35/#C1440E`, AERA `#EBE7DF/#B5543E`; resto se extrae en Fase 0. Luna-holograma orbitando muestra screenshot del sitio.
- **Navegación intuitiva (mitiga riesgo del concepto)**: camino principal = click en planeta o en lista HUD → **autopiloto warp** (curva de cámara + streaks). Vuelo libre opcional: WASD/flechas, Shift boost, Space frenar, E atracar, M mapa, Esc cerrar. Móvil: joystick táctil propio (pointer events) + tap en planetas.
- **Atraque**: al acercarse, prompt "Dock [E]" → panel HTML overlay (accesible, no in-canvas): título, cliente, rol, año, resumen, features, chips de stack, galería, botones Live site / View in Figma.
- **Onboarding**: pantalla "Launch" + 3 tips. **Progreso**: "Planets explored 3/9" (localStorage), badge al completar + CTA contacto.
- **Modo sin vuelo**: botón "Skip the flight" → lista HTML accesible con los mismos datos. Automático si no hay WebGL; sugerido si `prefers-reduced-motion`. `<noscript>`/lista para SEO.
- **Audio**: loop ambiente + whoosh warp, CC0, muteado por default con toggle (recortable si suma peso).
- **Nave**: modelo CC0 Kenney Space Kit (`public/models/LICENSE`); fallback de primitivas.

## Archivos críticos
- `src/data/projects.ts` — tipo `Project` (slug, title, client, kind, role, year, summary, features, stack, links{live,figma}, images, planet{palette, size, orbit, speed, ring, surface}). Fuente única: escena, HUD, panel y modo lista leen de acá.
- `src/data/profile.ts` — bio, skills, contacto.
- `src/scene/` — `Universe.tsx`, `Sun.tsx`, `Planet.tsx` (+ `planet.glsl`), `Ship.tsx`, `Autopilot.ts`, `Station.tsx`, `AsteroidBelt.tsx` (instanced).
- `src/ui/` — `Hud.tsx`, `DockPanel.tsx`, `ListMode.tsx`, `Onboarding.tsx`, `Joystick.tsx`, `Loader.tsx`.
- `src/store.ts` — zustand.
- `public/projects/<slug>/*.webp` — screenshots/logos.
- `docs/handoff.md`, `docs/plan-portafolio-3d.md` (copia de este plan, regla 8), `README.md` ("cómo agregar un proyecto").

## Pasos (todo código = subagentes Sonnet; chairman Opus decide/revisa)
0. **Scaffold + contenido** (Sonnet x2 paralelo): (a) `git init`, Vite/React/TS/Tailwind/pnpm + deps 3D, volcar este plan a `docs/`, handoff inicial. (b) Fact sheets Quivo + Atletas.bo (no auditados aún) y paletas de los 3 Figma Make (zip landing); copiar/convertir a webp assets existentes (screenshots handoff Destiny, og/hero Elegance, cover Kuska, shoes AERA, logos Reeteil); screenshots Playwright de sitios vivos (destinybarberstudio.com, elegancedominio.com, kuska-beta.vercel.app) y AERA corriendo local. Escribir `projects.ts` + `profile.ts`.
1. **Bake-off visual (regla 7.b)**: lookup `ui-ux-pro-max` (portfolio, space game, dark) → brief compartido. Dos prototipos jugables mínimos (nave + 3 planetas + HUD + panel), HTML único con three.js CDN, publicados como Artifacts: **A** taste-skill (`design-taste-frontend` + `high-end-visual-design`: cinemático, glow realista) · **B** `impeccable` shape (estilizado/toon, flat-shaded). CTO elige A/B/híbrido.
2. **Mundo 3D** en stack real con dirección ganadora: sol, planetas procedurales, órbitas, nave, autopiloto, estación, cinturón, bloom, estrellas.
3. **UI**: HUD, dock panel, onboarding, modo lista, joystick, loader con progreso, progreso/badge, audio toggle.
4. **Performance**: Canvas lazy (`React.lazy`), `dpr [1,2]`, drei `PerformanceMonitor` (apaga bloom en gama baja), texturas webp, presupuesto JS inicial < 400 KB gz.
5. **Verificación + gates + cierre** (abajo), commit → push → PR → Vercel preview verde → merge → handoff → `/compact`.

## Trampas / decisiones
- Iframes de sitios clientes probablemente bloqueados (X-Frame-Options) → screenshots + link, no iframe.
- Links Figma Make y LinkedIn pendientes → campo opcional; botón oculto si falta (no links rotos).
- Reeteil no tiene web pública → mostrar app (logo, Play Store si CTO pasa link) y rol CTO.
- Atletas.bo/Quivo: si no hay URL pública, panel sin botón Live.
- Clientes reales (Destiny, Elegance): confirmar que aceptan aparecer (riesgo de CTO, no bloquea build).
- Repo GitHub público `mi-portafolio` (portafolio = vitrina). Nada de secretos en repo.
- Rama: commit inicial scaffold en `main` (repo nuevo, inevitable), luego `feat/*` + PR.

## Verificación
- `pnpm tsc --noEmit`, `pnpm build` sin errores.
- Vitest: validación de `projects.ts` (slugs únicos, campos requeridos, órbitas sin solapar, paletas hex válidas) + test de `Autopilot` (llega al target, sin NaN).
- Playwright MCP: carga sin errores de consola; click planeta → warp → dock → panel con datos/links correctos; teclado (Tab/Esc) en panel y modo lista; viewport móvil 390×844 joystick/tap; fallback sin WebGL muestra lista.
- Puppeteer: screenshots desktop + móvil para CTO.
- Gates antes de commit: `web-design-guidelines`, `impeccable audit`, `/code-review`, `/ponytail-review` (no hay backend/auth → `/security-review` no aplica; links externos con `rel="noopener noreferrer"`). Hook Codex automático.
- CI: preview Vercel verde → merge.
