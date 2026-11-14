# DESIGN.MD — Estilo (ai-personal-stylist)

> Resumen operativo de diseño (≤ 8KB). Detalle completo: `docs/producto/UX_UI_SPEC.md`.
> Tokens en `web/src/app/globals.css` (`@theme`). **Solo modo claro en el MVP.**

## 1. Paleta activa (tokens Tailwind `@theme`)

Paleta default de Tailwind eliminada (`--color-*: initial`): solo existen estos colores (+ `transparent`,
`current`). Opacidad: `bg-tinta/50`.

| Token | Hex | Uso |
|---|---|---|
| `fondo` | `#F6F2EC` | Papel hueso. Fondo de toda la app (columna). |
| `superficie` | `#FFFDF9` | Tarjetas, hojas, inputs; texto sobre `acento` o `tinta`. |
| `hundido` | `#ECE6DC` | Chip sin seleccionar, marcador de foto, fondo desktop fuera de la columna. |
| `tinta` | `#1F1B17` | Texto principal, botón primario, pestaña activa. |
| `tinta-suave` | `#5C534A` | Texto secundario, metadatos, íconos inactivos. |
| `linea` | `#DDD5C9` | Divisores decorativos. Nunca como único borde de un control. |
| `linea-fuerte` | `#8F8478` | Borde de inputs y controles (3.3:1 sobre `fondo`, cumple 1.4.11). |
| `acento` | `#7A2E2A` | Granate. Foco, selección, enlaces, palabra en cursiva editorial. Máx. 1 uso fuerte por pantalla. |
| `acento-suave` | `#F3E4DF` | Chip seleccionado, mensaje de la persona, selección de texto. |
| `exito` / `exito-suave` | `#2E5E43` / `#E3EEE6` | Confirmaciones. |
| `alerta` / `alerta-suave` | `#7F5300` / `#F6EBD3` | Confianza baja, luz insuficiente. |
| `error` / `error-suave` | `#A12F28` / `#F7E1DE` | Errores y acción destructiva. |

**Accesibilidad crítica** (WCAG 2.x, calculado; AA texto normal ≥ 4.5:1):

| Texto | Fondo | Ratio |
|---|---|---|
| `tinta` | `fondo` | 15.34 |
| `tinta` | `superficie` | 16.84 |
| `tinta` | `acento-suave` | 13.83 |
| `tinta-suave` | `fondo` | 6.75 |
| `tinta-suave` | `hundido` | 6.06 |
| `superficie` | `acento` | 9.18 |
| `acento` | `fondo` | 8.36 |
| `acento` | `acento-suave` | 7.54 |
| `exito` | `exito-suave` | 6.30 |
| `alerta` | `alerta-suave` | 5.65 |
| `error` | `error-suave` | 5.68 |
| `linea-fuerte` (borde UI) | `fondo` | 3.28 (≥ 3:1 no-texto) |

Otros tokens: radios `rounded-xs` 2px · `rounded-sm` 4px · `rounded-md` 8px · `rounded-lg` 14px · `rounded-full`;
sombra única `shadow-flotante`; contenedor `max-w-app` (520px); curvas `ease-estilo`, `ease-salida`;
animaciones `animate-aparecer`, `animate-subir`, `animate-respirar`; utilidades `pt-seguro`, `pb-seguro`.
`pb-con-barra` y `bottom-sobre-barra` quedan en `globals.css` pero **no se usan** (ya no hay barra inferior, DP-17).

## 2. Tipografía

| Rol | Clase | Familia | Pesos |
|---|---|---|---|
| Display | `font-display` | Bodoni Moda (opsz 6–96, cursiva) | 400–600; solo ≥ 20px |
| Cuerpo | `font-body` | Hanken Grotesk | 400 texto, 500 etiquetas, 600 botones |

Escala: `text-4xl` portada · `text-3xl` título de pantalla · `text-2xl` título de OutfitCard ·
`text-base` cuerpo (mín. 16px en inputs) · `text-sm` metadatos · `text-xs` + `uppercase tracking-[0.14em]`
solo para sobretítulos ("Para mañana"). Nunca Inter / Roboto / Arial / system / Playfair.

## 3. Componentes — reglas operacionales

**Navegación (DP-17): conversación primero.** La pantalla principal es el hilo `/asesor`, a pantalla completa.
No hay barra de pestañas ni `/bienvenida` ni `/closet/nueva`. Encabezado del hilo: wordmark "Estilo" + botón
"Tu espacio" (abre hoja con Tu clóset, Tus looks, Tu perfil y paleta, Cerrar sesión). Vistas de Tu espacio:
"Volver a la conversación" arriba, sin botones de crear.

- **Hilo:** onboarding = primera conversación; una pregunta por turno con **respuestas sugeridas** (chips sobre
  el compositor; modo múltiple con "Listo"). Nunca "paso X de Y", barra de progreso ni formularios por pasos.
- **Resultados = tarjetas en el hilo:** look (OutfitCard), prenda (GarmentCard: "Está bien" / "Corregir"),
  paleta (PaletteCard: orientativa, confianza, "Ajustar"), consentimiento de selfie, nota de memoria con "Deshacer"
  (sin fondo ni borde). Tarjetas: `rounded-md border border-linea bg-superficie p-4`.
- **Compositor:** `sticky bottom-0` en el flujo (no `fixed`), con botón de foto, campo y enviar (`size-11 rounded-full`).
- **Pensando:** siempre dice qué hace ("Revisando tu clóset…"), `role="status"`.

- **Botón:** `h-12 rounded-sm`, primario `bg-tinta text-superficie`, uno por pantalla. Texto en mayúscula inicial.
- **Chip:** `min-h-11 rounded-full`; seleccionado `bg-acento-suave text-acento border-acento` + check SVG.
- **Tarjetas y fotos de prenda:** `rounded-md`, sin sombra, borde `linea` solo si el fondo se confunde.
- **Sombra:** solo `shadow-flotante` y solo en toast, hoja "Tu espacio" y "Ir al último mensaje".
- **Fondos:** sólidos. Sin degradados; sin glassmorphism; `backdrop-blur` solo en encabezados y compositor (`bg-fondo/90`).
- **Chat:** el asesor NO va en burbuja: texto editorial a ancho completo. La persona sí: `bg-acento-suave rounded-lg`, alineado a la derecha.
- **Outfit:** siempre como OutfitCard (fotos reales), nunca como lista de texto. Siempre con "Por qué funciona".
- **Íconos:** SVG inline, trazo 1.5px, 24px, `currentColor`. Sin librerías de íconos.
- **Objetivo táctil:** ≥ 44px (`min-h-11 min-w-11`). Separación ≥ 8px.
- **Animación:** solo `transform` + `opacity`; 150–320ms; `prefers-reduced-motion` respetado globalmente.
- **Layout:** móvil primero; ≥ 768px la app es una columna `mx-auto max-w-app bg-fondo` sobre `hundido`.

## 4. Assets disponibles

| Asset | Ruta | Uso |
|---|---|---|
| Logotipo provisional | (texto) "Estilo" en `font-display italic` | Hasta definir marca (A-05). |
| Maqueta de referencia | `docs/superpowers/mockups/2026-11-14-mvp.html` | Una conversación de principio a fin (v0.2). |
| Íconos PWA | pendiente (`web/public/`) | Fondo `tinta`, "E" en `superficie`. |

## 5. Voz y copy

Tono en 3 adjetivos: **cercano, preciso, seguro**. Tuteo chileno neutro ("tienes", "quieres"; sin voseo ni
modismos). Sin emoji. Botones = verbo + objeto ("Guardar look", "Agregar prenda", "Tomar selfie").
Siempre explica el porqué (DP-11). Sobre el cuerpo habla de calce y proporción (DP-12). La paleta es
"orientativa", con confianza visible (DP-05).

Nunca dice: "defecto", "disimular", "corregir tu figura", "cuerpo ideal", "Ups", "algo salió mal" sin decir
qué hacer, "IA mágica", "diagnóstico" (de color), "cómpralo".

## 6. Errores comunes en código — nunca hacer

```
❌  bg-white / bg-black / #000   →  ✅  bg-superficie / bg-tinta
❌  text-gray-500 / text-zinc-*   →  ✅  text-tinta-suave   (la paleta default no existe: falla en silencio)
❌  border-gray-200               →  ✅  border-linea (decorativo) / border-linea-fuerte (control)
❌  Inter / Roboto / font-sans    →  ✅  font-body ; títulos font-display
❌  rounded-2xl / rounded-xl      →  ✅  rounded-sm (botón) · rounded-md (tarjeta) · rounded-full (chip)
❌  burbuja para el asesor        →  ✅  texto editorial sin fondo
❌  shadow-lg en tarjetas         →  ✅  sin sombra; shadow-flotante solo toast/hoja
❌  bg-gradient / morado "IA"     →  ✅  fondo sólido
❌  transition-all / animar height →  ✅  transition-[transform,opacity]
❌  h-screen                      →  ✅  min-h-dvh
❌  barra de pestañas / BottomNav →  ✅  hilo + hoja "Tu espacio" (DP-17)
❌  onboarding con pasos/progreso →  ✅  preguntas en el hilo + respuestas sugeridas
❌  compositor position:fixed    →  ✅  sticky bottom-0 + pb-seguro
❌  middleware.ts                 →  ✅  src/proxy.ts
❌  clase de color que no existe en @theme (Tailwind calla) → revisar contra la tabla §1
```

## 7. Cuándo usar cada skill de diseño

| Skill | Cuándo |
|---|---|
| `frontend-design` + `ui-ux-pro-max` | SIEMPRE JUNTAS al construir o rediseñar páginas/componentes. Con una sola el gate sigue avisando. |
| `impeccable` | SIEMPRE al final de cualquier cambio de UI, antes de declarar terminado. |
| `ckm-design` | Piezas visuales de marca: KV, banners, íconos, social. |
| `ckm-brand` | Copy y tono. |

**Gate estructural:** `design-gate.sh` / `design-skill-flag.sh`, cableados en `.claude/settings.json`.
