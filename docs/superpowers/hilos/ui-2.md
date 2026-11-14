# Hilo ui-2 — Primitivas: botones píldora, chips, campo, toast y cardBase

- **Rama:** `equipo/ui-2-primitivas`
- **Dependencias declaradas:** ninguna
- **Tope de vueltas QA ↔ Constructor:** 4 (al tope decide el Productor)
- **Reglas:** append-only con `agentes/scripts/hilo.sh`; nunca se edita un turno anterior. Los VEREDICTO los lee DevOps antes de mergear.

### 2026-11-14 14:11 · Productor · encargo · vuelta 0

### Encargo: UI-2 — Primitivas: botones píldora, chips, campo, toast y cardBase

**Fuentes:**
- `docs/superpowers/specs/2026-11-14-migracion-identidad-prendie.md` (§3.1 ui-2)
- `docs/producto/UX_UI_SPEC.md` (§7.1, §7.18)
- `DESIGN.MD` (tokens, radios, contraste WCAG y pares obligatorios)
- Referencia visual: `docs/superpowers/mockups/2026-11-14-conversacion-v4.html` (aprobada por Felipe)

**Criterios de Aceptación:**
1. **Botones (`components/ui/button.tsx` y `components/chat/styles.ts`):**
   - Altura estándar 52 px (`h-[52px] px-6 text-base`), mediano 44 px (`h-11 px-[18px] text-sm`), todos con píldora completa (`rounded-full`, borde `1.5px`, trazo 2 en ícono `size-5`).
   - Variantes:
     - Principal: `bg-accion text-sobre-color` (lima, máximo uno visible por pantalla).
     - Inverso: `bg-inverso text-sobre-inverso`.
     - Contorno: `bg-transparent text-tinta border-linea-fuerte` (sobre inverso: `border-sobre-inverso text-sobre-inverso`).
     - Texto: `h-11 px-2 text-sm text-tinta underline underline-offset-4`.
     - Destructivo: `bg-error text-sobre-estado`.
   - Feedback: presión `active:scale-[0.97]` (140-150 ms), `disabled:opacity-45`.
2. **Chips (`components/ui/chip.tsx`, `chip-group.tsx`):**
   - Altura visual 36 px (`h-9 px-4 rounded-full border-[1.5px] border-linea-fuerte bg-transparent text-control text-tinta`), área táctil accesible de 44 px con pseudo-elemento `after:absolute after:-inset-1`.
   - Estado seleccionado (`aria-pressed="true"`): `bg-inverso border-inverso text-sobre-inverso`.
   - Regla de marca: **nunca lima** en chips.
3. **Field e Input (`components/ui/field.tsx`, `input.tsx`):**
   - Campo base: `min-h-12 w-full rounded-campo bg-hundido px-4 text-base font-medium text-tinta placeholder:text-tinta-suave` sin borde estático; foco con anillo azul de 3 px (`focus-visible:ring-3 focus-visible:ring-foco`).
   - Etiqueta en `text-control`; errores en `text-meta text-error` bajo el campo.
4. **Toast y Error (`components/ui/toast.tsx`, `empty-state.tsx`):**
   - Toast en región `aria-live="polite"`: `rounded-campo bg-inverso px-4 py-3 text-cuerpo text-sobre-inverso shadow-flotante animate-subir`.
   - Bloque de error: `rounded-campo border-[1.5px] border-error bg-superficie p-4 text-cuerpo text-tinta role="alert"` con ícono/título `text-error` y acción "Reintentar".
5. **Íconos (`components/ui/icons.tsx`):**
   - Trazo 2 (`strokeWidth={2}`), extremos y uniones redondeadas (`strokeLinecap="round" strokeLinejoin="round"`).
6. **`cardBase` (`components/chat/styles.ts`):**
   - Actualizar a: `rounded-tarjeta bg-superficie p-[18px]`.
   - Eliminar o reemplazar alias transitorios `acento` en `eyebrowAccent`.
7. **Calidad y Gates:**
   - `web/tests/tokens.test.ts` en verde (0 clases inventadas, todos los pares con contraste WCAG verificado).
   - Reducción medible de usos de alias transitorios (`acento`, `acento-suave`, `rounded-sm`, etc.).
   - `npm run lint` y `npm test` limpios sin regresiones.

### 2026-11-14 14:12 · Productor · decision · vuelta 0

Maqueta de referencia `docs/superpowers/mockups/2026-11-14-conversacion-v4.html` aprobada por Felipe para ui-2 y todo el bloque de migración a la identidad de Prendie. Los componentes deben replicar fielmente los tokens, tamaños (52 y 44 px en botones, 36 px en chips con 44 px táctil, campo hundido, foco azul 3 px, cardBase sin bordes duros) y comportamiento de la spec UX_UI_SPEC §7.1 y §7.18.
Paso a construcción.

### 2026-11-14 14:21 · Constructor · respuesta · vuelta 0

Implementacion completa de primitivas de interfaz segun la maqueta v4 aprobada y criterios del hilo ui-2:

1. **Botones (`components/ui/button.tsx`, `components/chat/styles.ts`):**
   - Forma pildora completa (`rounded-full`), borde de 1.5 px (`border-[1.5px]`).
   - Tamanos: estandar de 52 px (`h-[52px] px-6 text-base`) y mediano de 44 px (`h-11 px-[18px] text-sm`).
   - Variantes: principal lima (`bg-accion text-sobre-color`), inverso (`bg-inverso text-sobre-inverso`), contorno (`border-linea-fuerte text-tinta bg-transparent`; sobre inverso `border-sobre-inverso text-sobre-inverso`), texto (`h-11 px-2 text-sm text-tinta underline underline-offset-4`) y destructivo (`bg-error text-sobre-estado`).
   - Feedback: presion `active:scale-[0.97]` (140-150 ms con curva `ease-salida`) y deshabilitado `disabled:opacity-45`.
   - Icono con contenedor accesible y estilos `size-5 [&>svg]:size-5 [&>svg]:stroke-2`.
2. **Chips (`components/ui/chip.tsx`, `chip-group.tsx`):**
   - Altura visual 36 px (`h-9 px-4 rounded-full border-[1.5px] border-linea-fuerte bg-transparent text-control text-tinta`).
   - Area tactil accesible de 44 px mediante pseudo-elemento `after:absolute after:-inset-1`.
   - Estado seleccionado (`aria-pressed="true"` / `aria-checked="true"`): `bg-inverso border-inverso text-sobre-inverso`.
   - Regla de marca respetada: nunca lima en chips.
3. **Field e Input (`components/ui/field.tsx`, `input.tsx`):**
   - Campo base: `min-h-12 w-full rounded-campo bg-hundido px-4 text-base font-medium text-tinta placeholder:text-tinta-suave` sin borde duro estatico.
   - Foco con anillo azul de 3 px (`focus-visible:ring-3 focus-visible:ring-foco`).
   - Etiqueta en tipografia `text-control`; mensaje de error en `text-meta text-error` con icono de alerta.
4. **Toast y Error (`components/ui/toast.tsx`, `empty-state.tsx`):**
   - Toast en region `aria-live="polite"` (`fixed bottom-24`): `rounded-campo bg-inverso px-4 py-3 text-cuerpo text-sobre-inverso shadow-flotante animate-subir`.
   - Bloque de error accesible (`ErrorBlock`, `role="alert"`): `rounded-campo border-[1.5px] border-error bg-superficie p-4 text-cuerpo text-tinta` con icono y titulo `text-error`, mas boton de accion "Reintentar".
5. **Iconos (`components/ui/icons.tsx`):**
   - Actualizado trazo base a 2 px (`strokeWidth={2}`), con `strokeLinecap="round"` y `strokeLinejoin="round"`.
6. **`cardBase` y estilos del hilo (`components/chat/styles.ts`):**
   - `cardBase` actualizado a `rounded-tarjeta bg-superficie p-[18px]` (sin borde duro ni sombras).
   - Reemplazado alias transitorio `acento` en `eyebrowAccent` por `text-sobretitulo uppercase text-tinta`.
7. **Verificacion tecnica:**
   - Creada suite de pruebas unitarias en `web/tests/ui/primitives.test.ts` (13 pruebas pasando).
   - `cd web && npm run verify`: lint, typecheck y vitest (136/136 tests en verde, incluyendo `tokens.test.ts` sin clases inventadas).
   - `cd web && npm run build`: compilacion de produccion exitosa.

### 2026-11-14 14:26 · QA · veredicto · vuelta 0

Humo ejecutado en build de producción con AI_MODE=mock, PORT=3210 contra el asesor simulado en navegador móvil (390x844 y 375x812) y pruebas de renderizado computado de primitivas.

## Humo
- Botones píldora (buttonStyles/Button/ButtonLink): forma rounded-full con border-[1.5px] y tamaños estándar 52 px (h-[52px] px-6 text-base font-extrabold) y mediano 44 px (h-11 px-[18px] text-sm font-bold) → OK
- Variantes de botón: principal lima (bg-accion text-sobre-color), inverso (bg-inverso text-sobre-inverso), contorno (border-linea-fuerte text-tinta; sobre inverso border-sobre-inverso text-sobre-inverso), texto (h-11 px-2 text-sm text-tinta underline) y destructivo (bg-error text-sobre-estado) → OK
- Feedback de botón: active:scale-[0.97] (150ms ease-salida) y disabled:opacity-45; íconos con contenedor accesible size-5 [&>svg]:size-5 [&>svg]:stroke-2 → OK
- Chips (Chip/ChipGroup): altura visual 36 px (h-9 px-4 rounded-full border-[1.5px] border-linea-fuerte bg-transparent text-control text-tinta) → OK
- Área táctil accesible en chips: pseudo-elemento after:absolute after:-inset-1 (-4px) garantizando objetivo táctil >= 44 px → OK
- Selección de chips: bg-inverso border-inverso text-sobre-inverso con aria-pressed/aria-checked; regla de marca respetada (cero lima en chips) → OK
- Field e Input: min-h-12 (48 px), rounded-campo (20 px), bg-hundido, sin borde estático duro (border-0) y foco azul de 3 px (focus-visible:ring-3 focus-visible:ring-foco #2b4bff) → OK
- Mensajes de Field: etiqueta en text-control text-tinta; errores en text-meta text-error con IconAlert y role="alert" bajo el campo → OK
- Toast: región aria-live="polite" fija (bottom-24), rounded-campo (20 px) bg-inverso px-4 py-3 text-cuerpo text-sobre-inverso shadow-flotante con acción accesible → OK
- Bloque de error (ErrorBlock): role="alert", rounded-campo border-[1.5px] border-error bg-superficie p-4 text-cuerpo text-tinta con ícono/título text-error y botón "Reintentar" (44 px) → OK
- Íconos (icons.tsx): trazo base 2 px (strokeWidth={2}), strokeLinecap="round", strokeLinejoin="round", aria-hidden="true" → OK
- cardBase y estilos del chat (chat/styles.ts): cardBase actualizado a rounded-tarjeta (28 px) bg-superficie p-[18px] sin borde ni sombra; eyebrowAccent sin acento transitorio (text-sobretitulo uppercase text-tinta); botones compactos píldora rounded-full → OK
- Viewport móvil 390x844 y 375x812: sin desbordamiento ni scroll horizontal (hasHorizontalOverflow: false), zoom 200% verificado sin recorte → OK
- Suite técnica y frontera: npm run verify en verde (136/136 tests vitest, eslint, typecheck), npm run build con AI_MODE=mock exitoso; frontera respetada → OK
- Servidor de pruebas en puerto 3210 detenido tras finalizar las pruebas → OK

VEREDICTO: QA aprobado sha=25676980ae9112daac6de58cf756890f4b4e1e90

### 2026-11-14 14:26 · Diseño · nota · vuelta 0

Revisión visual sobre commit 25676980ae9112daac6de58cf756890f4b4e1e90 contra la maqueta aprobada v4 (docs/superpowers/mockups/2026-11-14-conversacion-v4.html) y tokens de DESIGN.MD.
Verificado en navegador a 390x844 (dev server puerto 3220, AI_MODE=mock):

1. Botones (button.tsx, styles.ts):
- Forma píldora completa (rounded-full) y borde 1.5px (border-[1.5px]).
- Alturas computadas: estándar 52px (h-[52px], px-6, text-base font-extrabold) y mediano 44px (h-11, px-[18px], text-sm font-bold).
- Variantes: principal en lima bg-accion (#C9F24D) con text-sobre-color (#121412); inverso bg-inverso (#121412) con text-sobre-inverso (#FFFFFF); contorno con border-linea-fuerte y texto tinta (sobre inverso: border-sobre-inverso y text-sobre-inverso); texto h-11 px-2 text-sm text-tinta subrayado; destructivo bg-error con text-sobre-estado.
- Feedback táctil: active:scale-[0.97] con curva ease-salida (150ms); disabled:opacity-45.
- Íconos: contenedor accesible size-5 con SVG trazo 2.

2. Chips (chip.tsx, chip-group.tsx):
- Altura visual 36px (h-9 px-4), borde 1.5px, tipografía text-control.
- Área táctil de 44px verificada mediante pseudo-elemento after:absolute after:-inset-1 (-4px a cada lado).
- Estado seleccionado: bg-inverso, border-inverso, text-sobre-inverso con ícono Check (16px).
- Regla de marca estricta: cero presencia de lima (bg-accion) en chips.

3. Campo e Input (field.tsx, input.tsx):
- Altura mínima 48px (min-h-12), radio rounded-campo (20px), fondo hundido (#E8E9E4), sin borde estático.
- Foco accesible con anillo azul de 3px (focus-visible:ring-3 focus-visible:ring-foco #2B4BFF, box-shadow de 3px verificado).
- Etiqueta en text-control text-tinta; mensajes de error en text-meta text-error acompañados de ícono de alerta.

4. CardBase y Estilos del Hilo (styles.ts):
- cardBase actualizado a rounded-tarjeta (28px) bg-superficie (#FFFFFF) p-[18px] sin borde estático ni sombra (superficie limpia sobre fondo).
- Sobretítulo: text-sobretitulo mayúsculas en text-tinta-suave (eyebrow) y text-tinta (eyebrowAccent), sin usos del alias transitorio acento.
- Botones compactos del hilo adaptados a rounded-full con tokens de Prendie.

5. Toast y ErrorBlock (toast.tsx, empty-state.tsx):
- Toast en aria-live="polite", fondo bg-inverso, rounded-campo, shadow-flotante y texto sobre-inverso.
- ErrorBlock con role="alert", rounded-campo (20px), borde 1.5px border-error (#C2341F), fondo superficie y acción Reintentar (h-11, subrayada).

6. Íconos (icons.tsx):
- Trazo base 2px (strokeWidth={2}), extremos y uniones redondeadas (round).

Veredicto visual: Conforme sin observaciones. Cero hallazgos abiertos.

### 2026-11-14 14:29 · Revisor · veredicto · vuelta 0

Revisión de código completada sin hallazgos:
1. Frontera: verificada con `bash agentes/scripts/verificar-frontera.sh equipo/ui-2-primitivas` (10 archivos modificados en components/ui, components/chat/styles.ts, tests y docs, todos dentro de la frontera permitida).
2. Seguridad y datos: componentes puramente presentacionales y de interacción accesible; sin datos sensibles, sin llamadas a IA desde cliente, sin exposición de secretos.
3. Reglas del repo y accesibilidad:
   - Botones: píldora completa (`rounded-full`, `border-[1.5px]`), tamaños estándar 52 px (`h-[52px]`) y mediano 44 px (`h-11`). Variantes lima `bg-accion text-sobre-color`, inverso `bg-inverso text-sobre-inverso`, contorno `border-linea-fuerte text-tinta` (y `border-sobre-inverso` sobre inverso), texto y destructivo. Ícono accesible `size-5 [&>svg]:size-5 [&>svg]:stroke-2`.
   - Chips: visual 36 px (`h-9`), táctil accesible de 44 px con `after:absolute after:-inset-1`. Selección en `bg-inverso border-inverso text-sobre-inverso` (nunca lima).
   - Field/Input: `min-h-12`, `rounded-campo`, `bg-hundido`, sin borde estático, foco azul 3 px (`ring-3 ring-foco`), etiqueta `text-control` y error accesible `text-meta text-error` con `role="alert"`.
   - Toast y ErrorBlock: toast en `aria-live="polite"` con `bg-inverso text-sobre-inverso`; `ErrorBlock` con `role="alert"`, `border-error` y acción "Reintentar".
   - Íconos: trazo uniforme 2 px (`strokeWidth={2}`), `strokeLinecap="round"`, `strokeLinejoin="round"`.
   - `cardBase`: `rounded-tarjeta bg-superficie p-[18px]` sin bordes duros ni sombras. `eyebrowAccent` sin alias transitorio `acento`.
4. Tokens y CSS: 100% de clases validadas contra `@theme` en `globals.css` y `DESIGN.MD`. Suite `tokens.test.ts` pasando con 0 clases inventadas.
5. Verificación técnica: `npm run verify` en verde (lint, typecheck, vitest 136/136 tests pasando, incluyendo los 13 de `tests/ui/primitives.test.ts`) y `npm run build` exitoso.
6. Hallazgos: 0 bloquea, 0 importante, 0 menor.

VEREDICTO: Revisor aprobado sha=25676980ae9112daac6de58cf756890f4b4e1e90
