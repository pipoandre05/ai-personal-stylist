# Hilo ui-3 — UI-3 a UI-5: Encabezado, Voces del asesor y persona, y Compositor

- **Rama:** `equipo/ui-3-base-hilo`
- **Dependencias declaradas:** ninguna
- **Tope de vueltas QA ↔ Constructor:** 4 (al tope decide el Productor)
- **Reglas:** append-only con `agentes/scripts/hilo.sh`; nunca se edita un turno anterior. Los VEREDICTO los lee DevOps antes de mergear.

### 2026-11-14 15:28 · Diseño · nota · vuelta 0

Maquetas de ui-3, ui-4 y ui-5 entregadas en docs/superpowers/mockups/ (390x844, tokens de Prendie, referencia v4):
- 2026-11-14-ui-3-encabezado.html
- 2026-11-14-ui-4-voces.html
- 2026-11-14-ui-5-compositor.html

Decisiones clave:
1. Encabezado h-14 sticky, wordmark provisional "Estilo" en Bricolage (font-display text-titulo). "Tu espacio" es botón contorno mediano con ícono de cuadrícula, aria-haspopup="dialog" y aria-expanded. Sin lima.
2. Asesor sin burbuja, text-destacado (Manrope 600 16/24); firma "Estilo" en text-sobretitulo solo en el primer bloque del turno.
3. Persona a la derecha: self-end max-w-[82%] bg-hundido rounded-campo text-cuerpo.
4. Compositor: barra superficie, foto contorno size-11, campo BLANCO con borde de tinta 1,5 px (linea-fuerte) por indicación de Felipe, no como dice hoy DESIGN.MD/UX_UI_SPEC §7.9 (hundido). Enviar inverso; Detener cuadrado size-3 mientras responde; placeholders contextuales; min-w-0 obligatorio a 360 px.
5. Pendiente integradora: alinear UX_UI_SPEC §7.9 y DESIGN.MD con el campo blanco.

Sin verificar: no vistas en navegador; sin validación Opus; sin consulta de factibilidad al Constructor (solo tokens y clases de la spec).

### 2026-11-14 15:41 · Constructor · respuesta · vuelta 0

Construcción del bloque base del hilo (UI-3 Encabezado, UI-4 Voces y UI-5 Compositor) completada según maquetas v4 aprobadas y especificaciones.

Cambios realizados:
1. UI-3 Encabezado (components/ui/app-header.tsx):
   - Alto 56 px (h-14), sticky, margen izquierdo pl-6 y derecho pr-4.
   - Wordmark "Estilo" en Bricolage (font-display text-titulo font-extrabold tracking-[-0.03em]).
   - Botón "Tu espacio": botón contorno mediano (h-11, píldora, border-[1.5px] border-linea-fuerte) con ícono de cuadrícula size-5, aria-haspopup="dialog" y aria-expanded reflejando la hoja. Sin lima.
2. UI-4 Voces (components/chat/advisor-message.tsx y person-message.tsx):
   - Asesor: sin burbuja ni avatar, ancho completo en text-destacado (Manrope 600 16/24), [&_p+p]:mt-3.
   - Firma "Estilo" en text-sobretitulo uppercase text-tinta-suave en el primer bloque del turno.
   - Énfasis en font-extrabold sin cursiva ni color (con parser de markdown para **negrita**).
   - Cursor streaming 2x16 respirando (animate-respirar) al final del último bloque.
   - Error del turno con border-l-[3px] border-error pl-3 text-destacado text-tinta y acción "Reintentar" (h-11).
   - Persona: a la derecha (self-end), max-w-[82%], contenedor bg-hundido rounded-campo px-4 py-3 text-cuerpo font-medium text-tinta.
   - Estado enviando en opacity-70; error en text-meta text-error "No se envió." con botón "Reintentar".
3. UI-5 Compositor (components/chat/composer.tsx, placeholder.ts, use-conversation.ts, conversation.tsx):
   - Barra en superficie (bg-superficie) con border-t border-linea px-4 pt-2.5 pb-seguro.
   - Botón foto contorno size-11 (44 px, border-[1.5px] border-linea-fuerte).
   - Campo de texto BLANCO (bg-superficie) con borde de tinta 1.5 px (border-[1.5px] border-linea-fuerte rounded-campo px-4 py-2.5 text-base font-medium text-tinta placeholder:text-tinta-suave focus-visible:ring-3 focus-visible:ring-foco min-w-0 flex-1) por decisión explícita de Felipe (18.5:1 contraste).
   - Botón Enviar inverso size-11 (bg-inverso text-sobre-inverso); botón Detener (cuadrado size-3 bg-sobre-inverso) mientras responde.
   - Placeholders contextuales implementados y probados en components/chat/placeholder.ts: sugerencias ("O dímelo con tus palabras"), tras foto ("Pregúntame por la foto…"), tras look ("¿Qué le cambiarías?"), reposo / respondiendo ("Escríbele a tu asesor…").
   - A 360 px el campo encoge con min-w-0 flex-1 sin desbordar el botón Enviar.
4. Verificaciones y tests:
   - 9 nuevos tests unitarios en web/tests/ui/thread-base.test.ts cubriendo todos los casos de placeholder contextual.
   - npm run verify limpio (eslint 0 warnings/0 errors, typecheck limpio, 145/145 tests vitest en verde).
   - Build de producción compilado exitosamente.

Commit: 82679f43ecf44e086c519af3875f2a9fadc9895f
Verificación: cd web && npm run verify && AI_MODE=mock npm run build
