# Hilo ui-0 — Página no encontrada con la voz de Estilo

- **Rama:** `equipo/ui-0-no-encontrado`
- **Dependencias declaradas:** ninguna
- **Tope de vueltas QA ↔ Constructor:** 4 (al tope decide el Productor)
- **Reglas:** append-only con `agentes/scripts/hilo.sh`; nunca se edita un turno anterior. Los VEREDICTO los lee DevOps antes de mergear.

### 2026-11-14 13:34 · Productor · encargo · vuelta 0

Historia ui-0 (humo del equipo): pulir web/src/app/not-found.tsx con la voz y los tokens de Estilo. Único archivo de código permitido: web/src/app/not-found.tsx (frontera OK).
Criterios de aceptación (fuentes: CLAUDE.md § Vocabulario y voz; tokens vigentes de web/src/app/globals.css; DP-17):
1. Tutea, cercano y seguro, sin emoji; sin jerga técnica ("Error 404" fuera o secundario); vocabulario del proyecto (asesor, clóset, look).
2. Un solo CTA con verbo y objeto que devuelva a la conversación con el asesor (ruta /asesor), alineado con DP-17 (el hilo es la pantalla principal).
3. Solo tokens existentes hoy en globals.css (fondo, tinta, tinta-suave, acento, font-display, etc.): sin colores ni tamaños hardcodeados. DESIGN.MD está en transición a v3; manda globals.css.
4. Mobile-first 390x844 y 375x812: sin scroll horizontal, objetivo táctil >= 44 px, foco visible, contraste AA, un único h1.
5. Verificación sin sesión (QA no tiene cuenta): si la 404 no es visible sin sesión por el proxy, QA lo declara; no se improvisan credenciales.
Diferido: ilustración o maqueta compleja. La 404 no tiene spec propia en docs/producto/ (criterios definidos por el Productor).

### 2026-11-14 13:34 · Diseño · nota · vuelta 0

Maqueta: docs/superpowers/mockups/2026-11-14-ui-0.html (390x844 y 375x812, un estado). Validación Opus omitida por decisión del Productor.

Texto exacto:
- h1 (único): "No encuentro esta página."
- Apoyo: "Puede que el enlace esté mal escrito o que ya no exista. Volvamos a la conversación y seguimos con tu look."
- CTA único: "Volver al asesor" → /asesor
- Se elimina "Error 404".

Tokens por elemento (solo globals.css):
- Screen className="justify-center px-5" (bg-fondo).
- Filete decorativo aria-hidden: w-10 h-0.5 bg-acento mb-5.
- h1: font-display text-4xl, color tinta (hereda).
- Apoyo: mt-3 max-w-sm text-tinta-suave.
- CTA: ButtonLink primary fullWidth (h-12 = 48 px, bg-tinta text-superficie), contenedor mt-6. Foco: outline acento global.

Criterios: 1 voz tuteo/sin emoji/sin jerga; 2 un CTA verbo+objeto a /asesor; 3 solo tokens; 4 sin scroll horizontal, 48 px táctil, un h1, contraste tinta-suave ~7:1; 5 no aplica a la maqueta.
Sin cambios al contrato; factibilidad trivial (no se consultó al Constructor).
