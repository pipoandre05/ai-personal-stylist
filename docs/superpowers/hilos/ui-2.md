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
