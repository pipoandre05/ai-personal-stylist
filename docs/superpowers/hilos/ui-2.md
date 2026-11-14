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
