# DESIGN.MD — Estilo (ai-personal-stylist)

> Identidad visual tomada de Prendie por decisión del dueño (DP-23); estructura propia (Tailwind v4, `@theme`, nombres
> en español); sin su logotipo, voz ni componentes de dominio. Detalle: `docs/producto/UX_UI_SPEC.md`.
> **[N]** token nuevo · **[C]** cambia de valor, respecto de `globals.css` hoy.

## 1. Color — solo tema Día en el MVP

Noche queda fuera: la paleta y las fotos se juzgan sobre claro, y duplica la verificación. Se suma luego sin renombrar.

| Token | Hex | Rol |
|---|---|---|
| `fondo` [C] | `#F2F2EE` | Fondo de la app. |
| `superficie` [C] | `#FFFFFF` | Tarjetas, hoja, chips sobre foto. |
| `hundido` [C] | `#E8E9E4` | Campo, mensaje de la persona, mesa de prendas, esqueletos. |
| `linea` [C] | `#D6D8D2` | Divisores. Nunca borde de control. |
| `linea-fuerte` [C] | `#121412` | Borde de controles (1.5 px). |
| `tinta` [C] | `#121412` | Texto e íconos. |
| `tinta-suave` [C] | `#5E625D` | Metadatos. |
| `inverso` [N] | `#121412` | Énfasis: look recién propuesto, chip elegido, enviar. |
| `sobre-inverso` / `-suave` [N] | `#FFFFFF` / `#B9BDB7` | Texto sobre `inverso`. |
| `accion` [N] | `#C9F24D` | Lima: **una acción principal por pantalla**. |
| `memoria` [N] | `#C9B8FF` | Lavanda: lo que el asesor sabe de ti. |
| `falta` [N] | `#FF8A57` | Naranja: lo que falta, lo que se compra, confianza baja. |
| `sobre-color` [N] | `#121412` | Texto sobre `accion`, `memoria`, `falta`. |
| `exito` [C] · `error` [C] | `#0B7285` · `#C2341F` | Guardado / errores; siempre con palabra. |
| `sobre-estado` [N] | `#FFFFFF` | Texto sobre `exito`, `error`. |
| `foco` [N] | `#2B4BFF` | Anillo de foco. |

**Reglas.** `accion`, `memoria` y `falta` son **solo superficies** con texto `sobre-color`: como texto o ícono sobre
claro no llegan a 3:1. Lima nunca en chips. Un estado nunca va solo por color. Se eliminan `acento`, `acento-suave`,
`alerta*`, `exito-suave`, `error-suave` (ver §7).

**Contraste** (WCAG 2.x, calculado; texto ≥ 4.5, no-texto ≥ 3):

| Texto / fondo | Ratio | Texto / fondo | Ratio |
|---|---|---|---|
| tinta / fondo | 16.49 | sobre-color / accion | 14.36 |
| tinta / superficie | 18.51 | sobre-color / memoria | 10.39 |
| tinta / hundido | 15.17 | sobre-color / falta | 7.95 |
| tinta-suave / fondo | 5.53 | sobre-estado / exito | 5.59 |
| tinta-suave / superficie | 6.21 | sobre-estado / error | 5.52 |
| tinta-suave / hundido | 5.09 | exito / fondo | 4.98 |
| sobre-inverso / inverso | 18.51 | error / fondo | 4.92 |
| sobre-inverso-suave / inverso | 9.72 | foco / fondo · / inverso | 5.27 · 3.13 |
| **accion / fondo** | **1.15 ✗** | **falta / superficie** | **2.33 ✗** |

## 2. Tipografía

`font-display` [C] Bricolage Grotesque (800; títulos, números, wordmark) · `font-body` [C] Manrope (todo lo demás;
nunca < 500 en texto corrido). Estilos [N] (tamaño/interlínea, peso, tracking):

| Clase | Valor | Uso |
|---|---|---|
| `text-titular` | 40/1.05 · 800 · −0.03em | Portada, estados vacíos |
| `text-titulo` | 26/1.1 · 800 · −0.02em | Título de look, de hoja, de vista |
| `text-titulo-s` | 18/1.2 · 800 · −0.01em | Ítems de "Tu espacio", secciones |
| `text-destacado` | 16/24 · 600 | **Voz del asesor** |
| `text-cuerpo` | 15/22 · 500 | Persona, porqué, texto corrido |
| `text-nombre` | 14/20 · 800 | Nombre de prenda, precio |
| `text-control` | 14/18 · 700 | Botones medianos, chips |
| `text-meta` | 12/16 · 500 | Tienda, fecha, datos del rastro |
| `text-sobretitulo` | 12/16 · 700 · 0.12em, mayúsculas | Rótulos |

**Asesor vs. persona** (ya no hay serif): asesor sin contenedor, a ancho completo, `text-destacado`; persona en bloque
`bg-hundido` a la derecha, `text-cuerpo`. Énfasis del asesor: `font-extrabold`, sin cursiva ni color.
Wordmark provisional "Estilo" en `font-display` 800 (logotipo por definir, A-05).

## 3. Forma, profundidad, movimiento

- **Radios [N]:** `rounded-insignia` 12 (etiquetas, evidencia, miniaturas) · `rounded-campo` 20 (campo, mensaje) ·
  `rounded-foto` 24 (prenda, mesa) · `rounded-tarjeta` 28 (tarjetas, hoja) · `rounded-full` (botones, chips, avatares).
- **Bordes:** controles `border-[1.5px] border-linea-fuerte`; tarjetas sin borde (blanco sobre `fondo`).
- **Sombra:** ninguna en la interfaz. `shadow-flotante` [C] `0 8px 24px rgb(18 20 18/.18)` solo en lo que flota (hoja,
  toast, "Ir al final"). `drop-shadow-prenda` [N] es parte de la foto recortada, no de la interfaz.
- **Foco:** `outline-3 outline-foco outline-offset-2` en todo lo interactivo.
- **Espacio:** base 4; margen lateral 24 (`px-6`); tarjetas `p-[18px]`.
- **Íconos:** trazo 2 px, extremos redondeados, 24 px, `currentColor`. Táctil ≥ 44 px.
- **Movimiento** (v3): `ease-salida` [C] `cubic-bezier(.23,1,.32,1)` · `ease-viaje` [N] `cubic-bezier(.45,0,.1,1)` ·
  `animate-aparecer` [C] 260 ms + 6 px · `animate-respirar` [C] opacidad, 1.2 s · `animate-esqueleto` [N] 1.6 s.
  Solo `transform`, `opacity`, `filter`. Reducido: solo opacidad.

## 4. Componentes — reglas

- Hilo `/asesor` a pantalla completa; encabezado "Estilo" + "Tu espacio" (hoja). Sin pestañas (DP-17).
- **Botón** píldora: 52 px (`text-base font-extrabold`) o 44 px en tarjetas (`text-sm`). Principal `bg-accion
  text-sobre-color` (uno por pantalla) · inverso `bg-inverso` · contorno · texto subrayado.
- **Chip** (filtro, selección múltiple): 36 px visibles + área de 44, contorno 1.5; elegido `bg-inverso`.
  Sugerencias y refinamientos son **botones de contorno de 44 px**, no chips.
- **Tarjeta de resultado:** `rounded-tarjeta bg-superficie p-[18px]`. **Look recién propuesto en `bg-inverso`** con
  "Guardar look" en `accion`; vuelve a `superficie` al llegar otro look o al descartarlo.
- Rastro que queda; porqué con evidencia; pieza faltante en `falta`; nota de memoria en `memoria`.
- Compra: tienda, precio visto con fecha, "Enlace con comisión", "Ver en la tienda ↗". Nunca "Comprar".
- Compositor `sticky bottom-0` + `pb-seguro`; campo `bg-hundido rounded-campo`; enviar `bg-inverso`.

## 5. Imágenes de prenda

Recortada, enderezada, sobre `bg-hundido`, `rounded-foto`, al 78 % del alto, `drop-shadow-prenda`; 4:5 (clóset) o 1:1
(opciones, miniaturas). Sin recorte: foto entera 4:5 `object-cover`. Nunca un bloque de color.

## 6. Voz (propia de Estilo, no la de Prendie)

Cercano, preciso, seguro; tuteo chileno neutro, sin chilenismos de marca ni emoji. prenda · look · clóset · paleta ·
asesor · persona. Porqué siempre (DP-11); cuerpo = calce (DP-12); paleta orientativa (DP-05).
Nunca: "defecto", "disimular", "cuerpo ideal", "Ups", "diagnóstico", "cómpralo", "círculo", "apañe".

## 7. Cambios en el código

`globals.css`: todo lo marcado [C] y [N]; se eliminan 6 colores (§1) y `rounded-xs/sm/md/lg`. `layout.tsx`: Bodoni
Moda → Bricolage Grotesque, Hanken → Manrope, `themeColor` `#f2f2ee`. Bloques: `…/specs/2026-11-14-migracion-identidad-prendie.md` §1.

## 8. Nunca hacer

```
❌ text-accion / ícono lima en claro →  ✅ lima solo de fondo, texto sobre-color
❌ dos botones bg-accion visibles     →  ✅ uno; el resto inverso o contorno
❌ chip lima / chip de 36 sin área 44 →  ✅ elegido bg-inverso; after:-inset-1
❌ sombra en tarjeta o chip           →  ✅ blanco sobre fondo; sombra solo flotante
❌ text-acento / bg-acento-suave      →  ✅ alias transitorios: no usar
❌ rounded-md / rounded-lg            →  ✅ insignia · campo · foto · tarjeta
❌ Bodoni, serif o cursiva            →  ✅ font-display / font-body
❌ etiqueta colgante, círculo, Busco  →  ✅ son de Prendie, no de Estilo
❌ transition-all / h-screen / fixed  →  ✅ transform+opacity / min-h-dvh / sticky
```

## 9. Skills de diseño (mapa: `docs/tecnico/skills-de-diseno.md`)

| Skill | Cuándo |
|---|---|
| `frontend-design` + `ui-ux-pro-max` | Siempre juntas al construir o rediseñar. |
| `emil-design-eng` | Animación, micro-interacción, estados del hilo. |
| `stageshow` | Maquetas y demos de alta fidelidad. |
| `impeccable` | Siempre al cerrar un cambio de UI. |
| `design-critique` · `accessibility-review` | Antes de mostrar a Felipe; WCAG AA. |
