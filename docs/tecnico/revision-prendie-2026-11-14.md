# Revisión en producción del cambio a Prendie (PR 24) — 2026-11-14

Sitio revisado: https://web-nine-bice-71.vercel.app · código leído en `origin/main` (`a8c7d09`, solo lectura).

Dos pasadas: la primera sin sesión (portada, `/entrar`, marca) y la segunda con la sesión de Felipe (asesor, turnos
reales, Conversaciones, Tu espacio, página no encontrada). Se recorrieron los 8 puntos.

**Mensajes de prueba dejados: 3 turnos**, todos en una sola conversación nueva, "¿Qué me pongo hoy?" (14 nov, 19:06):
"¿Qué me pongo hoy?", "Quiero unos zapatos nuevos" y "¿Cómo te llamas?". No se guardó ni descartó ningún look, no se
abrió ninguna tienda y no se tocó "Cerrar sesión", "Borrar mi cuenta" ni "Archivar prenda".

## Cómo se revisó

- La ventana de Chrome no aceptó cambiar de tamaño (quedó en 1470 px de ancho). Teléfono vertical y apaisado se
  revisaron cargando el sitio en un marco del mismo origen de 390×740/780 y 844×390; escritorio, en la ventana real
  (1470×800, columna de 45rem). No se llegó a 844 de alto: el área visible era de 745 a 800 px.
- **No hubo emulación de pantalla táctil** (`pointer: coarse` falso). En apaisado se aplicaron las reglas de mouse:
  columna centrada con franjas y campo bajo el saludo. Eso no es un defecto confirmado del teléfono; lo que depende
  solo del alto sí es válido.
- Consola y red: sin errores, sin avisos de hidratación y sin peticiones fallidas en portada, asesor y sesión pasada.
- Tiempos medidos: look en unos 33 s, búsqueda en tiendas en unos 24 s, respuesta simple en unos 20 s.

## Defectos confirmados (vistos en producción)

| Id | Gravedad | Pantalla y tamaño | Qué pasa | Qué se esperaba | Cómo reproducirlo | Archivo probable |
|---|---|---|---|---|---|---|
| D-11 | **Bloquea la demo** | Opciones de compra en el hilo, todos los tamaños | Tocar una opción de compra **no hace nada**: no se marca "Elegida", no aparece la ficha y por lo tanto **"Ver en la tienda" nunca aparece**. El texto dice "Toca una opción para ver el detalle" y no pasa nada, sin aviso ni petición a la red. Ocurre cuando la búsqueda no está ligada a un look (pedir zapatos directamente). [Captura](../superpowers/mockups/capturas/revision-prendie-05-opcion-sin-efecto.png) | La opción queda elegida, se abre la ficha con tienda, precio, fecha y "Ver en la tienda ↗" | 1. En `/asesor` escribir "Quiero unos zapatos nuevos". 2. Esperar las opciones. 3. Tocar la opción 1 | `web/src/components/chat/use-conversation.ts:509` (`if (!outfitId) return;` descarta la elección cuando `for_outfit_id` es nulo); `web/src/lib/actions/shopping.ts` exige `outfitId` |
| D-12 | Se nota | Hilo del asesor, todos los tamaños | El asesor **dice lo mismo dos veces en un turno**. En "¿Cómo te llamas?" la respuesta completa sale repetida con leves cambios; en "¿Qué me pongo hoy?" repite la frase del clima ("Hoy es sábado, sin lluvia, entre 16 y 28 °C. Te armo dos opciones." y luego "Hoy en Santiago está nublado… te armé dos opciones."). Queda guardado así: al recargar sigue duplicado. Pasó en 2 de 3 turnos. [Captura](../superpowers/mockups/capturas/revision-prendie-04-respuesta-duplicada.png) | Una sola respuesta por turno | 1. En una conversación con looks o búsqueda, preguntar "¿Cómo te llamas?". 2. Leer la respuesta | `web/src/app/api/chat/route.ts:265-281` (texto acumulado entre vueltas de herramientas: el modelo escribe antes y después de `suggest_replies` o `propose_outfit`) y `web/src/lib/agent/system-prompt.ts` |
| D-13 | Se nota | Opciones de compra | De las 3 opciones para Felipe, una es de mujer ("Botín Mujer Newton Ridge Plus", Columbia). El propio asesor lo advierte en el texto: "es un modelo de mujer, así que no la consideraría", pero igual se muestra | Solo opciones que calcen con la sección de ropa de la persona; si quedan 2, mostrar 2 | 1. Con el perfil de Felipe, escribir "Quiero unos zapatos nuevos" | `web/src/lib/shopping/rank.ts`, `web/src/lib/shopping/real-product-search.ts` (filtro por audiencia) |
| D-01 | Se nota | Marca: pestaña del navegador, ícono de la PWA instalada | Todos los íconos siguen siendo la letra **"E"** de Estilo. `icon.svg`, `icon-192.png`, `icon-512.png` y `apple-touch-icon.png` son una "E" blanca sobre negro (solo se cambió el `aria-label` a "Prendie"). `favicon.ico` es una "E" serif en cursiva, de la identidad anterior a DP-23. [Captura](../superpowers/mockups/capturas/revision-prendie-02-iconos-letra-e.png) | Ícono de Prendie (mascota o inicial "P") | 1. Abrir `/`. 2. Mirar el ícono de la pestaña. 3. Abrir `/icon-512.png` | `web/public/icon.svg`, `web/public/icon-192.png`, `web/public/icon-512.png`, `web/public/apple-touch-icon.png`, `web/src/app/favicon.ico` |
| D-14 | Se nota | Portada `/` con sesión iniciada, todos los tamaños | Con sesión iniciada, abrir la dirección raíz muestra otra vez el recorrido de entrada con "Ya tengo cuenta" y "Crear mi cuenta", en vez de llevar al asesor | Con sesión, `/` lleva a `/asesor` | 1. Iniciar sesión. 2. Abrir `/` | `web/src/lib/auth/proxy-rules.ts` (`proxyRedirect` solo redirige `/entrar`), `web/src/app/page.tsx` |
| D-02 | Se nota | Portada `/`, teléfono apaisado (844×390) | En las pantallas 2, 3 y 4 del recorrido el contenido se corta arriba y abajo (15 a 30 px por lado): desaparece el rótulo y la última fila de píldoras queda cortada. [Captura](../superpowers/mockups/capturas/revision-prendie-01-portada-apaisado-cortada.jpg) | Todo el texto visible, o la zona de botones más compacta en pantallas bajas | 1. Abrir `/` con 844×390. 2. Tocar "Siguiente" | `web/src/components/onboarding/intro-carousel.tsx:118` |
| D-16 | Se nota | Opciones de compra, escritorio | En la columna de escritorio la tercera opción queda cortada a la derecha y con mouse no hay cómo llegar a ella: no hay flechas y la barra de desplazamiento está oculta (solo trackpad o teclado). [Captura](../superpowers/mockups/capturas/revision-prendie-09-carrusel-escritorio.jpg) | Las tres opciones visibles en escritorio, o flechas para avanzar | 1. Abrir en escritorio una conversación con opciones de compra | `web/src/components/chat/v2/shopping-options.tsx:107-124` |
| D-17 | Detalle | Rastro de pasos del hilo | El rastro repite pasos: "…armé el look · armé el look". En la búsqueda, "Busqué en 7 tiendas · 40 resultados · elegí 3" aparece dos veces seguidas (como paso y como primera línea de la tarjeta) | Cada paso una vez ("armé dos looks") y la línea de búsqueda en un solo lugar | 1. "¿Qué me pongo hoy?" y abrir el rastro. 2. Pedir zapatos | `web/src/components/chat/v2/thread-items-v2.ts`, `web/src/components/chat/v2/shopping-options.tsx:98` |
| D-18 | Detalle | Opciones de compra | Las fotos de tienda con fondo blanco se ven como un rectángulo blanco flotando sobre la mesa gris, con sombra; contrasta con las prendas del clóset, que van recortadas | Foto recortada, o foto entera cubriendo la mesa (`DESIGN.MD` §5) | Ver cualquier opción de compra | `web/src/components/chat/v2/shopping-options.tsx:139-145`, `web/src/components/chat/v2/piece.tsx` |
| D-19 | Detalle | Tarjeta de look, teléfono vertical | La prenda sin foto (cinturón) muestra el nombre cortado con dos puntos: "Cinturón de cuero..". [Captura](../superpowers/mockups/capturas/revision-prendie-08-cinturon-sin-foto.png) | Nombre completo o cortado con "…" | 1. "¿Qué me pongo hoy?". 2. Mirar la pieza 4 del segundo look | `web/src/components/chat/v2/piece.tsx` |
| D-20 | Detalle | Hoja "Tu espacio" y `/yo` | "Lo que sé de ti" dice "Todavía no te conozco" y "Aún no recuerdo nada de ti", mientras la misma pantalla muestra "Tu estilo: Casual, Urbano, Deportivo" y el asesor usa el nombre y el "estilo clásico que te gustaría tener" | Un texto que no niegue lo que sí sabe ("Aún no guardo recuerdos de la conversación") | 1. Abrir "Tu espacio". 2. Abrir "Lo que sé de ti" | `web/src/components/ui/space-sheet.tsx`, `web/src/components/espacio/memory-list.tsx` |
| D-21 | Detalle | Encabezado del asesor | El botón de menú se anuncia como "Sesiones" y el panel que abre se titula "Conversaciones" | Mismo nombre en ambos ("Conversaciones") | Inspeccionar el `aria-label` del botón de menú | `web/src/components/ui/app-header.tsx:62` |
| D-22 | Detalle | Página no encontrada (con sesión) | El título de la pestaña es el genérico "Prendie — tu asesor de imagen". En apaisado la mascota queda pegada al borde superior y la página desborda 4 px. [Captura](../superpowers/mockups/capturas/revision-prendie-07-no-encontrada-apaisado.png) | Título "No encontrada — Prendie"; mascota con margen superior o más chica en pantallas bajas | 1. Con sesión, abrir `/no-existe-xyz` en 844×390 | `web/src/app/not-found.tsx` |
| D-06 | Detalle | Ruta inexistente, sin sesión | Sin sesión, cualquier ruta desconocida redirige a `/entrar`: la página no encontrada con la mascota no se muestra a quien no ha entrado | Página no encontrada también sin sesión | 1. Ventana privada. 2. Abrir `/no-existe-xyz` | `web/src/lib/auth/proxy-rules.ts` |
| D-23 | Detalle | Respuestas rápidas tras la búsqueda | Para botines de hombre sin taco se ofrece el ajuste "Taco más bajo" | Ajustes que calcen con lo buscado | 1. Pedir zapatos con el perfil de Felipe | `web/src/components/chat/suggested-replies.tsx` |
| D-24 | Detalle | Panel "Conversaciones" | Dos conversaciones con el mismo título "¿Qué me pongo hoy?"; solo se distinguen por la hora | Título que resuma lo conversado, o fecha relativa más visible | 1. Usar dos veces la sugerencia "¿Qué me pongo hoy?". 2. Abrir el panel | `web/src/lib/domain/conversation-title.ts` |
| D-25 | Detalle | Voz del asesor | A "¿Cómo te llamas?" responde "Soy tu asesor de imagen en Prendie, puedes llamarme Prendie": Prendie como lugar y como nombre a la vez | "Soy Prendie, tu asesor de imagen" | 1. Preguntar "¿Cómo te llamas?" | `web/src/lib/agent/system-prompt.ts:6` ("Eres el asesor de imagen de «Prendie»") |
| D-03 | Detalle | Portada `/`, teléfono apaisado | El recorrido se ve sin mascota en sus cinco pantallas (se esconde con alto ≤ 620 px). Es decisión del código; se anota porque la mascota es el hilo conductor | Una cabeza chica junto al rótulo cabría | 1. Abrir `/` con 844×390 | `web/src/components/onboarding/intro-carousel.tsx:120` |
| D-04 | Detalle | Portada `/`, teléfono vertical | La mascota cambia de altura entre pantallas (unos 50 px) y en el último paso los puntos y el botón se mueven 4 px ("Crear mi cuenta" mide 52 px, "Siguiente" 48). [Captura](../superpowers/mockups/capturas/revision-prendie-03-portada-vertical-ultima.png) | Mascota y botones a la misma altura en las cinco pantallas | 1. Abrir `/`. 2. Tocar "Siguiente" cuatro veces | `web/src/components/onboarding/intro-carousel.tsx:118` y `:158` |
| D-05 | Detalle | Portada `/` | No hay botón visible para retroceder; solo deslizar, puntos o flechas del teclado | Un "Atrás" desde la pantalla 2, o confirmar que deslizar basta | 1. Abrir `/`. 2. Tocar "Siguiente" | `web/src/components/onboarding/intro-carousel.tsx` |
| D-07 | Detalle | Service worker | La caché se llama `estilo-shell-v1` y guarda los íconos con prioridad a la caché: al corregir D-01, quien ya instaló la app seguirá viendo la "E" | Subir la versión de la caché junto con los íconos | En la consola: `caches.keys()` | `web/public/sw.js:3` |
| D-08 | Detalle | Documentos del repo | `DESIGN.MD` sigue titulado "Estilo", dice "Voz (propia de Estilo, no la de Prendie)" y prohíbe la "etiqueta colgante" en §8, que hoy es la mascota. `CLAUDE.md` dice "Nombre provisional en la UI: Estilo". Es lectura obligatoria para trabajo de interfaz | Ambos al día con DP-25 | Leer `DESIGN.MD` líneas 1, 67, 85, 101, 122 | `DESIGN.MD`, `CLAUDE.md` |
| D-09 | Detalle | Lector de tiendas (hacia afuera) | Se identifica ante las tiendas como `EstiloShopReader/1.0` | `PrendieShopReader` (un test lo fija) | Leer el archivo | `web/src/lib/shopping/safe-fetch.ts:8`, `web/tests/shopping-reader-infra.test.ts:89` |
| D-10 | Detalle | Portada `/` (código) | "Siguiente" mide 48 px con `text-sm font-bold` (el sistema pide 52 px) y los puntos usan `transition-all`, prohibido en `DESIGN.MD` §8 | Botón inverso del sistema; transición de `transform` u `opacity` | Leer el archivo | `web/src/components/onboarding/intro-carousel.tsx:148` y `:158` |

Fuera del PR 24, visto de paso: en `/entrar?modo=crear` la casilla "Acepto los términos y la política de privacidad"
no enlaza a ningún documento (`web/src/app/entrar/auth-form.tsx`); en "Tus looks" vacío el texto dice "para qué
ocasión vistes" (`web/src/app/(app)/looks/page.tsx`).

## Sospechas (no confirmadas en un dispositivo real)

| Id | Gravedad estimada | Qué podría pasar | Qué se sabe | Cómo confirmarlo |
|---|---|---|---|---|
| S-01 | Se nota | En `/asesor` nuevo, al abrir el teclado la mascota del saludo desaparece y el saludo salta | Mecanismo confirmado achicando el marco de 780 a 480 px de alto: la mascota se esconde y el saludo sube unos 200 px ([captura](../superpowers/mockups/capturas/revision-prendie-06-inicio-sin-mascota-alto-bajo.png)). Falta saber si el teclado real achica el viewport: Chrome de Android sí respeta `interactiveWidget: "resizes-content"`; Safari de iPhone normalmente no | En un teléfono real, abrir `/asesor` y tocar el campo. Archivos: `web/src/components/chat/start-screen.tsx:53`, `web/src/app/layout.tsx:31` |
| S-04 | Detalle | En la primera visita el saludo puede decir "De vuelta, Felipe." | Se vio "De vuelta, Felipe." entre las variantes; `greeting.ts` elige al azar sin saber si hay conversaciones previas | Entrar con una cuenta nueva varias veces |
| S-05 | Detalle | Al "Agregar a inicio" en iPhone el nombre sugerido puede salir como "Prendie — tu asesor de imagen" | No hay `apple-mobile-web-app-title` en el `<head>`; depende de la versión de iOS | Safari de iPhone → Compartir → Agregar a inicio |
| S-06 | Detalle | Bordes de 1 px donde el sistema pide 1.5 y `rounded-lg` (alias transitorio) en el panel | Leído en `sessions-sheet.tsx:86` y `:110`, `app-header.tsx:63`, `start-screen.tsx:75`; a simple vista no se distingue | Inspeccionar estilos |

Sospechas de la primera pasada ya resueltas: S-02 (nombre del asesor) pasó a D-25, S-03 a D-21 y S-07 a D-14.

## Regresiones de los cuatro defectos corregidos hoy

| Defecto | Resultado |
|---|---|
| Panel de sesiones visible estando cerrado | No volvió: cerrado no se ve (`display: none`) en vertical, apaisado y escritorio |
| Hoja "Tu espacio" anclada arriba y cortada | No volvió: anclada abajo; en apaisado cabe con desplazamiento interno |
| Saludo que cambia al cargar (error de hidratación) | Sin avisos de hidratación en consola. No se pudo observar el primer instante de la carga |
| Teléfono apaisado tratado como escritorio | **No verificable** sin pantalla táctil; con mouse a 844 px se aplica la disposición de escritorio, que es lo esperado |

## Lo que NO se pudo revisar y por qué

| Punto | Motivo |
|---|---|
| Teléfono apaisado con pantalla táctil real (ancho completo, campo fijo abajo en sesión nueva) | La herramienta no emula `pointer: coarse` |
| Safari de iPhone, zonas seguras, teclado, instalación de la PWA | No hay dispositivo real |
| Alto de 844 px | El área visible del navegador llegaba a 745 a 800 px |
| Guardar un look, "No es para mí", vista de looks con contenido | Cambian datos de Felipe; "Tus looks" solo se vio vacío |
| Paleta calculada y memoria con contenido | La cuenta no tiene paleta ni recuerdos; solo se vieron los estados vacíos |
| Ficha de una opción con "Ver en la tienda" | No se pudo abrir por D-11 |
| Pantalla de error "No pude cargar esta pantalla" con la mascota | No se puede provocar sin romper algo |
| Mandar una foto, editar o archivar una prenda | Fuera de los límites de la revisión |

## Lo que quedó bien

- El nombre es consistente en la interfaz: títulos de pestaña ("Tu asesor — Prendie", "Tu clóset — Prendie", etc.), encabezado, firma de cada turno, `manifest` y portada. No queda "Estilo" en ningún texto visible.
- La mascota en el hilo funciona como se pensó: cabeza chica junto a "PRENDIE", se balancea mientras piensa, pasa a "ta-dá" cuando llega un look y no queda pegada en "pensando" al terminar.
- El turno de look es sólido: dos looks ("Más seguro" y "Más atrevido") con fotos del clóset, porqué, clima real y respuestas rápidas sobre el campo de texto.
- Conversaciones y Tu espacio funcionan en los tres tamaños: abrir, cerrar con Escape, sesión pasada en `/asesor/<id>` abierta al final del hilo, "Nueva conversación" con saludo contextual.
- La voz cumple: tutea, sin emoji, botones con verbo y objeto, "Es solo una orientación, no un diagnóstico" en paleta, y el asesor no ofrece comprar.

## Resumen

- Confirmados: **24** (1 bloquea la demo, 6 se notan, 17 de detalle). Sospechas: **4** (1 se notaría, 3 de detalle).
- Arreglar primero: **D-11** (elegir una opción de compra no hace nada y "Ver en la tienda" no aparece), **D-12** (el asesor repite su respuesta dentro del turno) y **D-01** con D-07 (íconos con la "E" de Estilo y su caché).
- Después: D-13 (opción de mujer para un hombre), D-14 (`/` con sesión muestra el recorrido) y D-02 (recorrido cortado en apaisado).
- Sin regresión visible en tres de los cuatro arreglos de hoy; el del teléfono apaisado queda sin verificar por falta de pantalla táctil.
- No revisado: dispositivo real (Safari de iPhone, táctil apaisado, teclado) y los estados con datos (looks guardados, paleta, memoria).
- Mensajes de prueba dejados en las conversaciones de Felipe: **3 turnos en 1 conversación** ("¿Qué me pongo hoy?", 14 nov 19:06).
