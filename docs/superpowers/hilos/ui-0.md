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

### 2026-11-14 13:35 · Productor · decision · vuelta 0

Maqueta aprobada (commit c69b727, docs/superpowers/mockups/2026-11-14-ui-0.html). Validada contra los 5 criterios del encargo y DP-17:
1. Voz: tutea, sin emoji, sin "Error 404"; el asesor habla en primera persona. OK.
2. CTA único "Volver al asesor" hacia /asesor (verbo + objeto, vuelve a la conversación). OK.
3. Solo tokens de globals.css (fondo, tinta, tinta-suave, acento, superficie, font-display). OK; el Constructor debe confirmar que ButtonLink admite ancho completo y h-12 sin tocar components/ui fuera de la frontera (components/** es frontera permitida, pero no se cambia ButtonLink salvo que sea imprescindible; si no, usar className).
4. Mobile 390 y 375, objetivo táctil 48 px, un solo h1, foco por outline global. OK.
5. Verificación sin sesión: la declara QA.
Decisión: texto exacto de la maqueta es el texto final. Validación Opus del protocolo omitida por decisión del Productor (ahorro de cuota; humo del equipo). Maqueta no vista en navegador por Diseño; QA y Diseño la contrastan con lo construido.

### 2026-11-14 13:36 · QA · nota · vuelta 0

Plan de humo ui-0 (build de producción, AI_MODE=mock, PORT=3210, navegador a 390x844 y luego 375x812).

HALLAZGO DE VISIBILIDAD SIN SESIÓN (probado hoy sobre la rama, sha previo a la implementación, con build real):
- /ruta-que-no-existe -> 307 a /entrar (200). /asesor sin sesión -> 307 a /entrar. Causa: web/src/lib/auth/proxy-rules.ts, toda ruta no pública sin sesión redirige a /entrar; la 404 con un enlace roto normal NO se ve sin sesión.
- Sí se ve la 404 sin sesión (HTTP 404, renderiza not-found.tsx) en rutas que el proxy deja pasar: /no-existe.json, /robots.txt (pública y sin archivo), y rutas con extensión de asset (.png, .json, .js, .css, .txt...). /api/no-existe también da 404 (HTML del layout).
- Conclusión: la 404 se verifica sin sesión con http://localhost:3210/no-existe.json (y /robots.txt como segunda ruta). No hay credenciales ni cuenta; la 404 desde una ruta de aplicación autenticada queda "no verificable por QA" y se declara. Esto cumple el criterio 5. Sin cambios de código pedidos.
- Estado actual (antes de construir): muestra "Error 404", h1 "Esta página no existe.", CTA "Ir al asesor".

Comprobaciones (una por criterio, tras el commit del Constructor):
1. Voz (crit. 1): h1 exacto "No encuentro esta página."; apoyo exacto de la maqueta; sin "Error 404", sin emoji, tuteo, sin jerga.
2. CTA único (crit. 2): un solo enlace/botón "Volver al asesor", href=/asesor; al tocarlo sin sesión llega a /entrar (esperado por el proxy, se anota, no es fallo); contar enlaces/botones del cuerpo = 1.
3. Tokens (crit. 3): revisar el diff de not-found.tsx: solo clases de tokens (bg-fondo, text-tinta, text-tinta-suave, bg-acento, font-display, ButtonLink primary); cero hex, cero px arbitrarios, cero colores de Tailwind por defecto. Verificar en navegador el color computado del filete = acento.
4a. Mobile (crit. 4): a 390x844 y 375x812 sin scroll horizontal (scrollWidth <= innerWidth), sin scroll vertical innecesario, contenido centrado vertical.
4b. Táctil: alto del CTA >= 44 px (maqueta dice 48).
4c. Foco: Tab lleva el foco al CTA con outline acento visible; Enter activa.
4d. Contraste AA: tinta/fondo y tinta-suave/fondo >= 4.5:1; CTA superficie/tinta.
4e. Un único h1 en el DOM (document.querySelectorAll('h1').length===1) y filete aria-hidden.
5. Visibilidad sin sesión (crit. 5): /no-existe.json y /robots.txt devuelven 404 con la página; /ruta-que-no-existe redirige a /entrar (declarado). Estado HTTP 404 en ambas.
6. Fidelidad a la maqueta: comparar captura 390x844 con docs/superpowers/mockups/2026-11-14-ui-0.html (espaciado, filete, jerarquía).
7. Recarga y volver atrás: recargar la 404 la mantiene; atrás desde la 404 vuelve a la página previa; texto grande del sistema (200%) sin recorte.
8. Regresión mínima: / y /entrar siguen cargando 200; npm run build sin errores; el diff solo toca web/src/app/not-found.tsx (verificar-frontera.sh).
Paralelo: Revisor y QA y Diseño pueden correr a la vez sobre el mismo sha; al terminar apago el servidor.

### 2026-11-14 13:39 · Constructor · respuesta · vuelta 0

Implementado web/src/app/not-found.tsx segun la maqueta y criterios aprobados:
- Filete decorativo: w-10 h-0.5 bg-acento mb-5 (aria-hidden="true").
- h1 unico: "No encuentro esta página." (font-display text-4xl).
- Apoyo: "Puede que el enlace esté mal escrito o que ya no exista. Volvamos a la conversación y seguimos con tu look." (mt-3 max-w-sm text-tinta-suave).
- CTA unico: ButtonLink primary fullWidth hacia /asesor con texto "Volver al asesor" en contenedor mt-6.
- Sin "Error 404", sin emoji, tuteo en primera persona del asesor.
- Solo tokens vigentes de globals.css.
- Verificado: npm run verify (lint, typecheck, vitest) en verde, npm run build OK, frontera verificada.
