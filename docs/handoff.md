# Handoff — mi-portafolio

Documento vivo. Estado actual arriba.

## Estado (2026-10-25) — EN PRODUCCIÓN
- **Live:** https://mi-portafolio-theta-tawny.vercel.app (Vercel prod desde `main`; `mi-portafolio.vercel.app` es de otra persona). PR #1 mergeado (squash `43d44a6`).
- Fix previo al merge: `og:image`/`twitter:image` absolutos, `og:url` y `canonical` apuntando a la URL de prod; `vite.config.ts` usa `import.meta.dirname`.
- Verificado en prod: Playwright carga, "Begin flight" muestra sistema solar + HUD + autopiloto, 0 errores de consola.
- Revisiones del fix: `/code-review` low (0 hallazgos), ponytail-review (ship). Codex no corrido.
- Deployment Protection: SSO en `all_except_custom_domains` → previews piden login de Vercel; dominio de prod es público.

## Estado (2026-10-22)
- Plan aprobado: [plan-portafolio-3d.md](plan-portafolio-3d.md). Dirección visual elegida: **A (cinemático)** — prototipo https://claude.ai/artifact/DLtWCwRqaTAE6tTGCitqJT (B descartado: https://claude.ai/artifact/89rWLJ4J34dwtKYE2dM7FK).
- PR `feat/universe`: mundo 3D completo + UI.
  - Escena (`src/scene/`): sol (About), 10 planetas con shader por marca, estación (Contact), cinturón de asteroides, nave, warp/autopiloto (`flight.ts`, testeado), nebulosa horneada en cubemap, bloom (se apaga + dpr 1 en gama baja), etiquetas con culling de solapes.
  - UI (`src/ui/`): Launch, HUD (destinos colapsables, progreso, sonido, lista), DockPanel (galería + lightbox), ListMode accesible (fallback sin WebGL), Joystick táctil, Toasts de onboarding, Boundary (error 3D → lista), audio WebAudio sin assets.
  - Estado: `src/store.ts` (zustand, `mp:visited` en localStorage); input compartido `src/input.ts`; probe WebGL cacheado `src/webgl.ts`.
  - Bundle: inicial 81 KB gz sin three; chunk lazy Universe 275 KB gz.
  - Verificado: typecheck, 36/36 tests, build; Playwright 1440/1024/768/390.
  - Revisiones: `/code-review` (10 hallazgos), ponytail-review (7), auditoría web-design-guidelines + impeccable (16) → todos aplicados salvo warning `THREE.Clock` (viene de R3F).
- Datos: 10 trabajos (destiny-barber, elegance-dominio, reeteil, quivo, kuska, atletas-bo, tienda-ropa/LUNE, aera, landing-design/JR Imprenta, nova). Notas de fuentes en `docs/content-notes.md`.

## No verificado / riesgos
- Joystick y su layout vs botón Dock en dispositivo táctil real (Playwright no emula coarse pointer).
- FPS reales en GPU/teléfono (headless usa render por software).
- Pérdida de contexto WebGL y fallback del Boundary no ejercitados en vivo.
- Al comprar dominio: reemplazar las 4 apariciones de `mi-portafolio-theta-tawny.vercel.app` en `index.html` y agregar el dominio en Vercel.
- `og:image` es `.webp`: no verificado que LinkedIn/WhatsApp lo muestren; si no, pasar a `.jpg`/`.png`.
- Codex: no corrido manualmente (hook automático, falla en silencio).

## Decisiones
- Concepto sistema solar + nave. Solo inglés. GitHub + Vercel.
- Nave de primitivas (no modelo Kenney): el prototipo A se veía bien, cero assets.
- Contacto: cto.josel@team.myquivo.com · GitHub JoseluisLarrazabal · LinkedIn pendiente.
- 9 trabajos: destiny-barber, elegance-dominio, reeteil, quivo, kuska, atletas-bo, tienda-ropa, aera, landing-design.
- Destiny y Elegance aprobaron aparecer (confirmado por CTO 2026-10-22).
- URLs publicadas recibidas: aero-nu-three.vercel.app (AERA) + 3 `*.figma.site` (mapeo por contenido en Fase 0b).

## Pendientes del CTO
- LinkedIn. (Play Store Reeteil encontrado: com.shadow00.reeteilapp.)
- Dominio propio (pendiente de compra).
