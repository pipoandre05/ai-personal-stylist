# Línea B (producto) — App móvil nativa (React Native + Expo)

> **Borrador para la sesión de discovery.** §1.1 a §1.3 resumen el DTR para que la sesión no tenga que abrirlo: son
> insumo, no decisión. Lo decidible empieza en §1.4.

Fecha: 2026-11-26 · Base: repo `ai-personal-stylist` (local `main` en #9; `origin/main` en #33, que es lo que está en
producción), vault `proyectos/ai-personal-stylist*.md`, DTR v0.1, DECISION_LOG v0.8 (+ DP-25 en `origin/main`),
PRODUCT_BACKLOG v0.1, PLAN_GENERAL, COMO_PIENSA_EL_ASESOR v1.1, criterio-del-asesor, investigación del carrito y
revisión en producción del 2026-11-14. Documento de trabajo: todo lo que dice "propuesta" no está decidido.

Convenciones: **[REPO]** está escrito en el repo · **[CÓDIGO]** visto en `origin/main` · **[PROP]** propuesta de esta
investigación · **[SUP]** supuesto sin evidencia.

---

## 0. Antes de empezar: tres cosas que el registro todavía no dice

1. **La app nativa no está en el DECISION_LOG.** DP-03 dice "canal del MVP: PWA" y DT-10 dice "sin push ni datos
   offline". La decisión "React Native + Expo" necesita su fila (propuesta: **DT-22**, o el número que siga libre;
   DP-24 está reservado para la talla del carrito) y DT-10 necesita revisarse: push y caché de solo lectura dejan de
   estar prohibidos en la app nativa.
2. **El backlog está atrasado respecto del código.** Las 75 historias figuran "Pendiente", pero en producción ya hay
   asesor real, lector de 40 tiendas, regla de formalidad, sesiones y Tu espacio. La sección 1.4 de abajo se armó con
   el git log y el vault, no con el backlog.
3. **Nombre para las tiendas de apps.** DP-25 hizo que el asesor se llame **Prendie**, que también es el nombre del
   proyecto hermano. A-05 (marca definitiva) sigue abierta. Publicar en App Store y Google Play fija un nombre público:
   decidirlo antes de crear las fichas.

---

## 1. Dónde está el producto

### 1.1 Propuesta de valor [REPO]

- **Promesa (DP-01):** "Te ayudo a verte como quieres verte, con lo que ya tienes y con lo que realmente vale la pena comprar".
- **Unidad de valor (DP-02):** el outfit completo para una ocasión; hasta una compra se muestra dentro de un look.
- **Caso de uso que manda (DP-19):** "Quiero saber qué ponerme el fin de semana para un evento. Y si en mi clóset no hay
  algo que me sirva, que me busque opciones".
- **Forma (DP-17, DP-18):** conversación primero, un solo asesor que también es personal shopper; clóset, looks y
  perfil son "Tu espacio", vistas secundarias.
- **Defensa (DTR §3):** la memoria acumulada de la persona (clóset digitalizado, paleta, historial de aciertos y
  rechazos). Eso no lo tiene un buscador y sube el costo de cambiarse.
- **Diferencia (DTR §8):** frente al buscador parte de la persona; frente a la app de clóset asesora y explica; frente
  al estilista de tienda es neutral (DP-10); frente al estilista humano, disponible a diario.

### 1.2 Segmentos [REPO]

Segmento inicial (DP-13): 25 a 45 años, Santiago, presupuesto medio, compra online, quiere "comprar menos, pero mejor".
Sin segmentar por género en datos. Personas de trabajo (hipótesis, no entrevistas):

| Persona | Dolor | Primer valor | Qué le aporta lo nativo |
|---|---|---|---|
| **Camila, 32**, oficina híbrida | "Tengo ropa y no sé qué ponerme" | Outfit diario con lo que tiene | Look del día a su hora, registro de uso, widget |
| **Matías, 38**, cambió de rol | "Quiero mejorar mi imagen sin estilista" | Paleta + renovación gradual | Selfie guiada, compartir referencias, plan de compra pausado |
| **Fernanda, 28**, vida social, presupuesto acotado | "Compro cosas que después no uso" | Look para el evento con una sola compra justificada | Compartir link desde Instagram antes de comprar, recordatorio de la víspera, "lo pienso 48 h" |

### 1.3 North Star y métricas [REPO]

- **North Star:** outfits útiles por persona activa por semana (útil = guardado o calificado "me encanta"/"me sirve").
- **Activación:** primer outfit útil en la primera sesión (mínimo 3 prendas; meta de onboarding 5).
- **Métricas definidas (DTR §25):** finalización del onboarding, perfil completo, paleta obtenida, prendas por persona
  a 1/7/30 días, corrección del reconocimiento, outfits generados/guardados, aceptación (`love`+`ok`), días activos por
  semana, retención semanas 1/2/4, prendas faltantes por categoría, clics a tienda (V1.1), costo de IA por persona.
- **Sin metas numéricas:** se fijan con las dos primeras semanas de piloto. **No hay línea base todavía** (el piloto con
  testers externos espera la revisión legal A-02).
- **Instrumentación [CÓDIGO]:** `track()` escribe en `analytics_events` con la sesión; `trackAiUsage` registra tokens.
- **Hipótesis que la app nativa toca directamente:** H-01 (digitalizar ≥ 20 prendas), H-07 (¿se vuelve sin WhatsApp?),
  S-03 (5 prendas bastan), H-02 (qué ocasión urge más).

### 1.4 Construido vs pendiente

**En producción (`origin/main`, PRs 1 a 33) [CÓDIGO + vault]:**

| Capacidad | Referencia |
|---|---|
| Cuenta email + contraseña, consentimientos, memoria visible y borrable, borrado de datos | RF-01, RF-02 · E1 (`privacy.ts`, `consents.ts`, `memory.ts`) |
| Conversación con asesor real (Opus 5.5), contrato v2: pasos, evento, refinar, evidencia, **dos looks** (seguro y atrevido), opciones de compra | RF-08, RF-09, RF-10 · E5, E6 · D-04 |
| Foto en el chat y desde Tu espacio; alta de prenda por foto con reconocimiento | RF-06, RF-16 · E4-H01/H02, E5-H08 |
| Paleta preliminar desde selfie (la selfie no se conserva) | RF-05 · E3 · R-04 |
| Clima por ciudad (Open-Meteo) | RF-13 · E5-H06 |
| Regla de formalidad: el servidor decide si el clóset alcanza (gala sin margen) | D-03, N4 |
| Lector de tiendas aislado: 40 tiendas (32 Shopify, 8 VTEX), hasta 12 por búsqueda | DP-18, DT-18 · RF-18 (adelantado) |
| Sesiones (Conversaciones), inicio de cero, respuestas rápidas | UI-20, R-16 |
| Tu espacio: clóset, looks, yo, paleta | UI-15, UI-18 · RF-04, RF-07 |
| PWA instalable con service worker de shell; marca Prendie y mascota; recorrido de entrada | RF-14 · DP-25 · UI-24, UI-26 |
| Eventos de producto y uso de IA | RF-15 · E8-H04/H05 |

**Pendiente [REPO + vault]:**

| Pendiente | Referencia | Por qué importa a la app |
|---|---|---|
| Banco de pruebas y evals del asesor | BF-11, T-17, T-18, S-01, S-02 | Sin esto no se sabe si un look del día por aviso será bueno |
| Criterio en archivos, no en el prompt | BF-13 | — |
| **Registro de uso de la semana** (D-11 decidido, sin `wear_log` en código) | D-11, RF-21, E9-H03 | Base de "qué me puse", costo por uso y desafíos |
| "Carrito listo" (rama `feat/carrito-listo`, DP-24 reservada) | investigación del carrito, D-1 a D-7 aprobadas | Afecta cómo la app abre la tienda |
| N8 (¿una compra mejoraría el look?) y N13b (motivo del rechazo) como reglas | COMO_PIENSA §5 | — |
| **Tiempo de respuesta 20 a 50 s** (look ~33 s, búsqueda ~24 s) | revisión 2026-11-14 | Principal razón para el aviso "tu look está listo" |
| Revisión legal antes de testers externos | A-02, S-05 | Bloquea piloto, push con contenido personal y calendario |
| Magic link / OTP | RF-19, E1-H09 | **Decidido por Felipe (2026-11-27): pasa a ser el único método de entrada, en web y app** (AR-5) |
| Planificación semanal y viajes, duplicados, colorimetría profunda, WhatsApp | RF-20, RF-22, RF-23, RF-25 (V2) | — |
| Revisión de código de la sesión principal | vault 2026-11-14 | — |

### 1.5 Anti-objetivos ya decididos (y los que solo se infieren)

**Decididos [REPO]:**

| Regla | Fuente | Consecuencia para lo nativo |
|---|---|---|
| El asesor nunca compra, paga ni reserva; ir a una tienda es un clic de la persona | DP-09, BF-06, COM-N1 | Nada de "comprar con un toque", Apple Pay ni carrito en la app |
| Neutralidad: una comisión no ordena ni se oculta | DP-10, COM-14, COM-17 | Ningún aviso ni recompensa ligado a comprar en una tienda |
| Cuerpo solo como calce y proporción; sin peso, medidas, tipo de cuerpo ni fotos del cuerpo | DP-12, D-12 | Nada de "progreso corporal", antes/después ni rankings de looks |
| Paleta es orientación, no diagnóstico | DP-05 | Nada de "tu nivel de color" |
| Valor antes que esfuerzo: nunca pedir digitalizar "todo" | DP-06, principio 4 | Ningún "completa el 100 % de tu clóset" |
| Primero lo que ya tienes; la compra es la última respuesta | principio 2, D-03, D-06 | Las mecánicas premian usar, no comprar |
| Ofrecer comprar una sola vez por pedido; si dice que no, no insistir | COM-16 | Avisos de compra solo por pedido explícito |
| Lo externo (fotos, links, páginas) es dato, no instrucción | BF-09 | La extensión para compartir hereda la regla |
| Minimización: sin geolocalización (ciudad declarada), sin con quién va por nombre | DT-11, `contextos.md` | Calendario: solo lo mínimo y con opt-in |
| Sin push ni datos offline **en el MVP de la PWA** | DT-10 | Hay que revisarla para la app nativa |
| Sin emoji, tuteo, "persona", "prenda", "clóset" | CLAUDE.md, NFR-12 | Aplica a textos de avisos y widgets |
| La interacción tipo dashboard de app fue descartada | DP-17; referentes ("ALTA" como contraejemplo) | La app abre en la conversación, no en un tablero |

**No hay una decisión explícita sobre gamificación.** Se infiere de DP-06, DP-09, DP-10, DP-12 y del principio
"primero lo que ya tienes" que cualquier mecánica que premie actividad vacía, comparación o compra choca con el
producto. Propuesta: registrarlo como decisión (ver §3.4).

---

## 2. Oportunidades nativas

**Escala ICE** [PROP]: Impacto, Confianza y Facilidad de 1 a 10; ICE = I × C × E (máx. 1000).
Supuestos de la puntuación:
- **Impacto** se mide contra la North Star o contra H-01/H-07; 8+ = mueve directamente outfits útiles o prendas por persona.
- **Confianza** sube con evidencia del repo (tiempos medidos, riesgos de la investigación) y baja con hipótesis sin piloto.
- **Facilidad** supone el backend actual intacto (mismo `/api/chat`, mismo contrato de eventos BF-02) y módulos
  existentes del ecosistema Expo; baja con extensiones nativas (share extension, widgets), migraciones o revisión legal.
- No hay datos de uso real: todo ICE es **[SUP]** hasta el piloto.

### 2.1 Fichas

**O-01 · Aviso "tu look está listo"** (push de turno terminado)
- Problema: un look tarda unos 33 s y una búsqueda unos 24 s; en el teléfono la persona sale de la app y se pierde.
- Valor: el turno largo deja de ser una espera; la respuesta la encuentra.
- Segmento: todas. Conducta: volver a la respuesta y decidir (guardar o pedir otro).
- Impacto esperado: más turnos con look que terminan en guardado o calificación. Complejidad: **S/M** (token de push
  por dispositivo + envío al terminar el turno; el servidor ya sabe cuándo termina).
- Dependencias: tabla de tokens de dispositivo (migración), consentimiento de avisos, A-02 para el texto (no poner
  contenido personal en la pantalla bloqueada).
- Métrica: % de turnos completados con la app en segundo plano que se abren antes de 10 min; outfits útiles por turno.
- ICE: I7 · C8 · E8 = **448**.

**O-02 · Cámara nativa para fotografiar prendas**
- Problema: digitalizar es la barrera crítica (DTR §23, H-01). La cámara web y el selector del navegador son lentos.
- Valor: encuadre guiado (prenda sola, fondo liso, luz), ráfaga "siguiente prenda" sin volver al chat, compresión y
  borrado de EXIF en el dispositivo (DT-04 se mantiene).
- Segmento: Camila y Matías. Conducta: catalogar.
- Impacto: más prendas por persona a 7 días; menos corrección del reconocimiento. Complejidad: **M**.
- Dependencias: `POST /api/garments` existente; recorte de fondo en el dispositivo es opcional y posterior.
- Métrica: prendas por persona a 1 y 7 días; segundos por prenda; % prendas `ready` sin edición.
- ICE: I8 · C7 · E7 = **392**.

**O-03 · Varias prendas desde la galería de una vez** (una foto = una prenda, respeta DP-06)
- Problema: mucha gente ya tiene fotos de su ropa (ventas, viajes, capturas).
- Valor: elegir 10 fotos y que entren como 10 prendas en cola, con estado por prenda.
- Conducta: catalogar. Complejidad: **S/M** (cola de subida; límite por lote para costo de visión).
- Dependencias: tope de llamadas de visión por día (A-03, NFR-11).
- Métrica: prendas por sesión de carga; tasa de `failed`.
- ICE: I7 · C7 · E8 = **392**.

**O-04 · Compartir un link de producto desde otra app → "¿vale la pena?"**
- Problema: la compra impulsiva ocurre en Instagram o en la tienda, no en Prendie (Fernanda; JTBD-4).
- Valor: compartir el link al asesor y recibir, dentro de un look, si combina, si ya tiene algo parecido y qué outfits
  desbloquea (RF-17, E7-H03). Es la promesa "lo que realmente vale la pena comprar" en el momento exacto.
- Conducta: pausar antes de comprar. Complejidad: **M** (extensión de compartir; en Expo requiere build propio y plugin).
- Dependencias: la evaluación de compra (RF-17) en el asesor; el lector solo lee bien las 40 tiendas Shopify/VTEX, para el
  resto el asesor trabaja con lo que diga la ficha o pide una foto; BF-09 (el contenido del link es dato).
- Métrica: links compartidos por persona activa al mes; % que termina en "ya tienes algo parecido" o look armado;
  clics a tienda **por debajo** de evaluaciones (guardarraíl: si todo termina en compra, no está funcionando).
- ICE: I8 · C6 · E5 = **240**.

**O-05 · Compartir una captura o foto de un look ("arma esto con lo mío")**
- Problema: la inspiración está en redes; reconstruirla con el propio clóset es difícil.
- Valor: camino inverso (D-13): define el look, mira equivalentes en el clóset, dice qué lo completa.
- Conducta: usar lo que ya tiene antes de comprar. Complejidad: **M** (misma extensión que O-04).
- Métrica: % de looks inspirados que se resuelven solo con el clóset.
- ICE: I6 · C5 · E6 = **180**.

**O-06 · Entrar sin contraseña (magic link y código)**
- Problema: email y contraseña (DT-03) es fricción en el teléfono.
- Valor: entrar solo con el email; la sesión persiste (el problema de la PWA en iOS desaparece en la app).
- Conducta: activación. Complejidad: **S/M**. Supabase lo trae (`signInWithOtp`). Como no hay login social, Apple no
  exige Sign in with Apple (4.8).
- Decisión de Felipe (2026-11-27): magic link siempre (AR-5). El mismo correo lleva un código de 6 dígitos, para el caso
  en que el link abre en otro navegador.
- Métrica: % de inicio de onboarding → cuenta creada.
- ICE: I6 · C8 · E7 = **336**.

**O-07 · Look del día por aviso (opt-in, a la hora que elige la persona)**
- Problema: el hábito "¿qué me pongo hoy?" (JTBD-1, O-4) no tiene disparador; H-07 duda que la PWA genere regreso.
- Valor: a la hora elegida, un aviso con el clima y una pregunta, no un look ya armado ("Hoy 9 a 22 °C. ¿Te armo algo
  para la oficina?"); el look se arma al abrir, con contexto fresco.
- Conducta: pedir el look del día. Complejidad: **M** (programación por persona y zona horaria; clima ya existe).
- Dependencias: O-01 (infraestructura de push), preferencias (MOB-E4-H04), A-02.
- Métrica: % de avisos que terminan en un look útil ese día; desactivaciones por semana (guardarraíl).
- Regla de apagado [PROP]: si la persona ignora 5 avisos seguidos, la app propone espaciarlos y no insiste.
- ICE: I8 · C4 · E6 = **192**.

**O-08 · Recordatorio de la víspera de un evento**
- Problema: el caso que manda es el evento del fin de semana; hoy el evento vive en `messages.parts` y no tiene fecha
  consultable.
- Valor: "Mañana es el matrimonio. ¿Dejamos el look listo?" con el look guardado o la pieza faltante.
- Conducta: preparar con tiempo (y comprar solo si hace falta, con tiempo de despacho: COM-13).
- Complejidad: **M** (migración: ocasiones con fecha; aviso programado).
- Métrica: % de eventos con look guardado antes del día; compras de último minuto (descriptiva).
- ICE: I7 · C6 · E5 = **210**.

**O-09 · "Me lo puse" en un toque (registro de uso)**
- Problema: D-11 (no repetir en la semana) supone que el asesor sabe qué se usó; hoy "guardar" se toma como usado.
- Valor: el asesor no repite, se calcula costo por uso y aparecen prendas olvidadas.
- Conducta: registrar uso (base de toda la gamificación útil). Complejidad: **M** (`wear_log`, ya modelado en DATA_MODEL
  como V2; acción desde aviso o desde la tarjeta).
- Métrica: personas con ≥ 2 registros por semana; prendas usadas por primera vez en 30 días.
- ICE: I6 · C5 · E5 = **150**.

**O-10 · Progreso del clóset por categorías base**
- Problema: la persona no sabe cuánto cargar; "todo" asusta (DP-06).
- Valor: muestra qué puede armar el asesor ("Con un calzado más te armo looks de oficina"), no un porcentaje.
- Conducta: catalogar lo que desbloquea más. Complejidad: **S** (datos ya existen; la regla de formalidad sabe qué falta).
- Métrica: % de personas que pasa de "falta una base" a "alcanza" en 7 días.
- ICE: I6 · C6 · E8 = **288**.

**O-11 · Clóset y looks sin conexión (solo lectura)**
- Problema: en la tienda o el mall, con mala señal, "¿ya tengo algo parecido?".
- Valor: consultar el clóset sin red. El asesor sigue necesitando conexión.
- Complejidad: **M** (caché local de fotos con URLs firmadas que vencen; borrado al cerrar sesión o al borrar datos).
- Dependencias: revisar DT-10; A-02 (fotos guardadas en el dispositivo).
- Métrica: aperturas del clóset sin conexión. ICE: I4 · C5 · E4 = **80**.

**O-12 · Calendario**
- (a) **Escribir**: agregar el look guardado al evento del calendario. Bajo riesgo. I3 · C5 · E7 = **105**.
- (b) **Leer**: detectar ocasiones próximas (opt-in, solo títulos y fechas de 14 días, elegidos por la persona; nunca
  asistentes ni ubicación). Alto valor potencial para el caso que manda, alto riesgo de privacidad. I6 · C3 · E4 = **72**.
- Dependencias: A-02; `contextos.md` ("con quién va, por nombre, nunca entra").

**O-13 · Widget "look de hoy"** (pantalla de inicio o bloqueada)
- Valor: ver el look guardado para hoy y el clima sin abrir. Complejidad: **L** (en iOS es un objetivo nativo aparte).
- Dependencias: O-09 o look asignado a un día (RF-20). ICE: I5 · C3 · E2 = **30**.

**O-14 · Háptica sutil**: al guardar un look, al agregar una prenda, al elegir una opción. Respeta la configuración del
sistema. Complejidad **S**. ICE: I2 · C7 · E9 = **126**. Se hace dentro de otras historias, no como ítem propio.

**O-15 · Bloqueo con Face ID / huella (opcional)**: la app guarda fotos y datos personales. **S**.
ICE: I3 · C5 · E8 = **120**.

**O-16 · Selfie guiada para la paleta** (aviso de luz antes de enviar). **M**. Ataca S-02 (credibilidad).
ICE: I4 · C5 · E5 = **100**.

**O-17 · Dictado**: el teclado del sistema ya dicta; un botón de micrófono propio puede esperar ("cámara sí, voz después",
referentes). ICE: I4 · C4 · E6 = **96**.

**Descartadas**: Live Activity del turno (I3 · C3 · E2 = 18; costo alto, valor marginal sobre O-01); avisos de ofertas o
de "novedades en tiendas" (contradicen DP-10 y "primero lo que ya tienes"); Apple Pay o checkout en la app (DP-09).

### 2.2 Ranking

| # | Oportunidad | ICE | Talla | Horizonte |
|---|---|---|---|---|
| 1 | O-01 Aviso de turno listo | 448 | S/M | Now |
| 2 | O-02 Cámara nativa de prendas | 392 | M | Now |
| 2 | O-03 Galería en lote | 392 | S/M | Now |
| 4 | O-06 Sin contraseña | 336 | S/M | Now |
| 5 | O-10 Progreso del clóset | 288 | S | Next (Now si sobra) |
| 6 | O-04 Compartir link → ¿vale la pena? | 240 | M | Now (es el diferenciador nativo) |
| 7 | O-08 Víspera del evento | 210 | M | Next |
| 8 | O-07 Look del día | 192 | M | Next |
| 9 | O-05 Compartir look de inspiración | 180 | M | Next |
| 10 | O-09 Me lo puse | 150 | M | Next |
| — | O-14 Háptica | 126 | S | Dentro de otras |
| 11 | O-15 Face ID | 120 | S | Later |
| 12 | O-12a Calendario escritura | 105 | S | Later |
| 13 | O-16 Selfie guiada | 100 | M | Later |
| 14 | O-17 Dictado | 96 | S | Later |
| 15 | O-11 Offline | 80 | M | Later |
| 16 | O-12b Calendario lectura | 72 | M | Later (tras A-02) |
| 17 | O-13 Widget | 30 | L | Later |

O-04 sube a Now pese a su ICE porque es **la única oportunidad que solo existe en nativo y que ataca la promesa de
compra consciente**; sin ella la app es una PWA con cámara.

---

## 3. Gamificación con propósito

### 3.1 Criterios de evaluación [PROP]

Una mecánica entra solo si cumple las cinco:
1. **Refuerza una conducta que produce outfits útiles o compra consciente**, no actividad (abrir la app, mandar mensajes).
2. **No compara personas** ni expone fotos o cuerpo (DP-12).
3. **No premia comprar** ni hace a una tienda más visible (DP-09, DP-10).
4. **Tiene recuperación sin culpa**: perder un día no borra el progreso ni genera un aviso de reproche.
5. **Tiene métrica de conducta y una de guardarraíl** (lo que no debe subir).

Y una regla de voz: el asesor habla como "una amiga que sabe" (D-10). Nada de "¡Felicitaciones!", puntos, trofeos ni
confeti; el reconocimiento es una frase útil en el hilo ("Esta chaqueta ya armó 6 looks").

### 3.2 Propuestas que se quedan

| Mecánica | Conducta que refuerza | Cómo se ve | Recuperación | Métrica | Guardarraíl | Prioridad |
|---|---|---|---|---|---|---|
| **Lo que puedo armarte** (progreso por capacidad, no por porcentaje) | Catalogar lo que desbloquea más | En Tu espacio: "Puedo armarte: casual, alcanza · oficina: falta un calzado · evento: falta una base". Hitos dichos por el asesor ("Con esto ya te armo looks de oficina") | No hay pérdida: es un estado del clóset | % que pasa de "falta" a "alcanza" en 7 días; prendas por persona a 7 días | Prendas cargadas que nunca entran a un look en 30 días (cargar por cargar) | Next (P1) |
| **Me lo puse + constancia semanal** | Registrar uso | Contador de ventana, no racha: "Registraste lo que usaste 4 de las últimas 6 semanas" | Ventana móvil; una semana sin registro no resetea nada; modo pausa (viaje, enfermedad) | Personas con ≥ 2 registros/semana | Desactivación del aviso de registro | Next (P1) |
| **Versatilidad por prenda** | Usar lo que ya tiene | En la ficha de la prenda: "Ha estado en 6 looks · usada 9 veces" | — | Prendas con ≥ 3 looks | — | Next (P2) |
| **Costo por uso** | Valorar lo que tiene; comprar mejor | Solo si la persona ingresó precio: "$4.000 por uso". Para prendas sin uso: "Aún no la usas. ¿Te armo algo con ella?" (nunca "desperdicio") | — | Prendas con precio y uso | Que no se convierta en culpa: medir si la gente borra precios | Later (P2) |
| **Redescubre tu clóset** (desafío opt-in, mensual) | Usar prendas sin uso en 60 días | El asesor propone 3 looks con prendas olvidadas; la persona elige si participa | Se puede abandonar sin aviso; no hay "fallaste" | % de prendas olvidadas usadas en el mes | Compras durante el desafío (no debería subir) | Later (P3) |
| **Pausa de compras** (opt-in) | No comprar por impulso durante un período que la persona define | El asesor no ofrece comprar (suspende D-06) salvo que la persona lo pida; al final, resumen de qué resolvió con lo suyo | La persona la termina cuando quiera | Looks útiles sin compra durante la pausa | — | Later (P3) |
| **Lo pienso 48 h** | Enfriar la compra | Al compartir un link (O-04), opción "Déjalo en pausa": a las 48 h el asesor pregunta "¿Todavía lo quieres? Te muestro 3 looks con eso y lo que ya tienes parecido" | Si no responde, se archiva sin insistir | % de pausas que terminan sin compra; satisfacción | Que el recordatorio aumente compras: comparar con grupo sin pausa | Next (P2) |
| **Resumen de temporada** (cada 3 meses) | Reflexión | Prendas más usadas, combinaciones nuevas, compras evaluadas y cuántas resolvió con lo suyo | — | Apertura y respuesta | — | Later (P3) |

### 3.3 Propuestas que se descartan

| Mecánica | Por qué se descarta |
|---|---|
| **Racha diaria de uso** (abrir la app o pedir un look cada día) | Premia actividad, no valor; induce abrir por miedo a perder la racha; la culpa al cortarla choca con la voz. La North Star mide outfits útiles, no aperturas |
| **Insignias decorativas** ("Primer look", "10 prendas", "Fashionista") | No cambian conducta; contradicen "Outfit, no prenda" y la seriedad del criterio. Los hitos útiles se dicen en el hilo (§3.2) |
| **Niveles de estilo / XP / "nivel de estilista"** | Califica a la persona y su gusto; implica un juicio estético sobre ella. Choca con D-10 y DP-12 |
| **Puntos canjeables por descuentos en tiendas** | Incentiva comprar y ata el ranking a acuerdos comerciales (DP-10). Además es una relación comercial no divulgada |
| **Rankings, votaciones de looks, comparación con otras personas** | Expone fotos y cuerpos; comparación social; riesgo DP-12 y de privacidad de fotos (DT-04) |
| **Desafíos de compra** ("arma tu cápsula de otoño comprando 5 piezas") | Contradice "lo que realmente vale la pena comprar" y COM-02 (a lo más una compra clave) |
| **Avisos de recuperación con culpa** ("Te extrañamos", "Tu clóset te espera") | Presión emocional; la regla es: si no responde, el asesor espacia o se calla |
| **"Completa tu clóset al 100 %"** | Contradice DP-06: nunca se pide digitalizar todo |
| **Desafíos de cuerpo o de "verse mejor" en X días** | DP-12 y principio 8 |

### 3.4 Decisión propuesta para el registro [PROP]

> **DP-26 (propuesta) — Gamificación al servicio del clóset, nunca del consumo.** Una mecánica de progreso solo se
> acepta si refuerza catalogar, usar lo que ya se tiene o pausar una compra; tiene recuperación sin pérdida; no compara
> personas; no premia comprar ni da visibilidad a una tienda; y se mide con una métrica de conducta y un guardarraíl.
> Prohibidas: rachas diarias de uso, insignias decorativas, niveles de estilo, puntos canjeables, rankings sociales y
> avisos de reproche.

> **DP-27 (propuesta) — Contrato de avisos.** Todo aviso es opt-in por tipo; máximo uno no pedido por día; respeta
> horas de silencio; nunca promociona productos, ofertas ni tiendas; la pantalla bloqueada no muestra contenido personal
> (prendas, evento, cuerpo) salvo que la persona lo active; **el contenido que viaja por el servicio de avisos (Expo Push
> Service, fuera de Chile) no lleva datos personales: solo un texto genérico y el id de la conversación**, y la app pide
> el detalle a la API al abrirse; tras 5 avisos ignorados de un tipo, la app propone espaciar.
> Solo existen avisos que la persona pidió o que responden a algo que ella empezó (turno, evento, pausa de compra).

---

## 4. Sesión de discovery y planificación (Felipe + IA, 2 h 40 min)

**Objetivo:** salir con (1) el alcance del MVP móvil cortado, (2) las decisiones nuevas listas para el registro y (3) el
plan de medición, sin tocar código.

**Formato:** Felipe solo, con Claude como facilitador y abogado del diablo. Un documento de trabajo vivo; cada bloque
termina con un artefacto escrito.

### 4.1 Insumos (se preparan antes, 30 min, los arma la IA)

- Este documento.
- Datos de `analytics_events` de producción (aunque sean solo de Felipe y cercanos): turnos por día y hora, tiempo por
  turno, prendas por persona, looks guardados vs propuestos.
- Defectos abiertos de la revisión del 2026-11-14 y tiempos medidos.
- DP-03, DT-10, D-11, COM-16 y la investigación del carrito (D-1 a D-7).
- Tres capturas de referentes móviles (Whering, Acloset, Indyx) para contrastar con DP-17.

### 4.2 Agenda

| Bloque | Min | Ejercicio | Salida |
|---|---|---|---|
| 1. Marco | 10 | Releer la promesa, el caso que manda y la North Star. Escribir en una frase "qué hace la app que la PWA no puede" | Frase de posicionamiento de la app |
| 2. Para quién primero | 20 | Elegir la persona primaria del MVP móvil (Camila diario vs Fernanda eventos). La IA argumenta la contraria | Persona primaria y su JTBD |
| 3. Árbol de oportunidades | 30 | Resultado = outfits útiles/semana → oportunidades (§2) → soluciones. La IA marca qué rama no tiene evidencia | Árbol con 3 ramas priorizadas |
| — Pausa | 10 | — | — |
| 4. Ética y voz | 20 | Pasar §3 por las 5 reglas; escribir 5 avisos reales en la voz del asesor y rechazar los que suenen a app de compras | DP-26 y DP-27 corregidas; textos de avisos |
| 5. Priorización | 25 | Corregir ICE con lo que Felipe sabe y la IA no; aplicar reglas de decisión (§4.3) | Lista Now/Next/Later firmada |
| 6. Mapa de historias | 25 | Recorrido "evento del fin de semana" en la app: qué historia cubre cada paso; dibujar la línea de corte del MVP | MVP móvil cortado (§5) |
| 7. Medición y experimentos | 15 | Por cada historia del MVP: evento, métrica, guardarraíl, criterio de abandono | Plan de medición |
| 8. Cierre | 5 | Decisiones para el registro; qué arranca mañana | Filas DT-22, DP-26, DP-27; próximos pasos |

### 4.3 Reglas de decisión

1. **Entra a Now** solo si: sirve al caso que manda o a la North Star; no depende de una aprobación pendiente (A-02, A-05)
   salvo la cuenta de desarrollador; no rompe DP-09, DP-10 ni DP-12; y tiene un evento de medición definido.
2. **Desempate:** gana la que hace crecer la memoria acumulada (clóset + feedback), que es la defensa del producto.
3. **Veto:** cualquier cosa que suba clics a tienda sin subir outfits útiles se rechaza.
4. **Avisos:** cada tipo debe mostrar, a las dos semanas, que una parte relevante termina en un look útil; si no, se
   apaga. El umbral se fija con los datos de esas dos semanas, como el DTR hace con las metas.
5. **Paridad:** la app no copia todo lo de la PWA; copia la conversación y Tu espacio, y suma lo nativo. Lo que no está
   en la app se sigue usando en la PWA.
6. **Lo que la IA no decide:** marca, gasto, legal y cuentas externas son de Felipe.

### 4.4 Preguntas que la sesión debe cerrar

- ¿La app reemplaza a la PWA o conviven? (Propuesta: conviven; la PWA queda como acceso web y de respaldo.)
- ¿Nombre en las tiendas: Prendie, otro o esperar A-05?
- ¿Se revisa DT-10 para la app (push + caché de solo lectura)?
- ¿Se adelanta el registro de uso (D-11) que hoy no existe en código?
- ¿La compra en la app abre la tienda en un navegador dentro de la app o en el navegador del sistema? (Con "Carrito
  listo", el carrito vive en el navegador de la persona: abrir en el navegador del sistema evita perder el carrito.)

---

## 5. Backlog móvil propuesto

**Formato de ID** [PROP]: el backlog usa `E1-H01` (épica-historia), `T-xx`, `NFR-xx`, y los commits usan `UI-xx`.
`MOB-` no existe en ningún documento. Propuesta: épicas `MOB-E1`…`MOB-E6`, historias `MOB-E1-H01`, tareas `MOB-T-01`.
Compatible con el campo `id` de `.torre/plan.yaml` (DT-16). Mismos campos y escalas del backlog (P0–P3, S/M/L/XL).

### Épicas

| Épica | Objetivo | Relación |
|---|---|---|
| MOB-E1 Base nativa | La conversación y Tu espacio en la app, con la sesión que no se pierde | RF-01, RF-08 a RF-11 · BF-01, BF-02 |
| MOB-E2 Captura del clóset | Digitalizar más rápido de lo que permite la web | RF-06, RF-07 · H-01, DP-06 |
| MOB-E3 Compartir hacia el asesor | Llevar la decisión de compra y la inspiración al asesor desde cualquier app | RF-17 · D-13, COM-16 |
| MOB-E4 Avisos útiles | Que la respuesta y el día a día encuentren a la persona, sin presión | H-07 · DP-27 (prop.) |
| MOB-E5 Uso y valor del clóset | Registrar lo que se usa y ver el valor de lo que ya se tiene | RF-21 · D-11 · DP-26 (prop.) |
| MOB-E6 Contexto del día a día | Calendario, sin conexión, widget | RF-20 · DT-10 |

### MOB-E1 Base nativa

- **ID:** MOB-E1-H01 · **Prioridad:** P0 · **Complejidad:** M · **Dependencias:** MOB-T-01, MOB-T-02
- **Historia:** Como persona quiero entrar solo con mi email, sin contraseña, y que la app me recuerde para no perder mi clóset ni tener que acordarme de nada.
- **Criterios:**
  1. Dado que escribo mi email y toco "Enviarme el acceso", entonces recibo un correo con un link y un código de 6 dígitos. Si no tengo cuenta, al entrar se crea (filas en `profiles` y `style_profiles`) y llego a la conversación.
  2. Dado que toco el link en el teléfono, entonces la app se abre con la sesión iniciada. Si el link abre en otro navegador, puedo escribir el código en la app y entro igual.
  3. Dado que ya tenía cuenta con email y contraseña, cuando entro con ese email, entonces veo el mismo clóset y las mismas conversaciones que en la PWA.
  4. Dado que pido el acceso dos veces en menos de 60 s, entonces la app me dice cuánto esperar. Si el código venció, puedo pedir otro.
  5. Dado que cierro la app o reinicio el teléfono, cuando la abro, entonces sigo con sesión iniciada; el token se guarda en el almacenamiento seguro del sistema.
  6. Se registra `signup_completed` con `platform` (`ios`/`android`) y método, una sola vez por cuenta.

- **ID:** MOB-E1-H02 · **Prioridad:** P0 · **Complejidad:** L · **Dependencias:** MOB-E1-H01; contrato de eventos v2 (BF-02)
- **Historia:** Como persona quiero conversar con el asesor en la app y ver los looks, las prendas y las opciones de compra como tarjetas para decidir qué ponerme igual que en la web.
- **Criterios:**
  1. Dado que escribo "¿Qué me pongo hoy?", cuando el asesor responde, entonces veo el rastro de pasos, el texto en streaming y los dos looks como tarjetas con las fotos reales de mis prendas.
  2. Dado que el asesor muestra opciones de compra, cuando toco "Ver en la tienda", entonces se abre la tienda fuera del asesor; nada se compra ni se agrega sin que yo lo haga (DP-09).
  3. Dado que guardo o rechazo un look con motivo, entonces el resultado es el mismo que en la PWA (`outfit_saved`, `outfit_feedback`, memoria visible en Tu espacio).
  4. Dado que pierdo la conexión a mitad de un turno, cuando vuelvo, entonces veo un aviso y puedo reintentar sin duplicar el mensaje.

- **MOB-E1-H03** (P1, S) Como persona quiero ver Tu espacio (clóset, looks, lo que sé de ti, paleta) en la app para consultar sin escribir.
- **MOB-E1-H04** (P2, S) Como persona quiero una respuesta háptica sutil al guardar un look o agregar una prenda para saber que quedó, respetando la configuración del sistema.
- **MOB-E1-H05** (P3, S) Como persona quiero bloquear la app con Face ID o huella para proteger mis fotos.

### MOB-E2 Captura del clóset

- **ID:** MOB-E2-H01 · **Prioridad:** P0 · **Complejidad:** M · **Dependencias:** MOB-E1-H02; `POST /api/garments`
- **Historia:** Como persona quiero fotografiar mis prendas una tras otra con una guía de encuadre para armar mi clóset en pocos minutos.
- **Criterios:**
  1. Dado que abro la cámara de prendas, cuando encuadro, entonces veo una guía ("una prenda, fondo liso, buena luz") y puedo tomar la foto sin salir de la cámara.
  2. Dado que tomo una foto, entonces se comprime en el teléfono (≤ 1280 px, JPEG, sin EXIF) antes de subir y puedo seguir con la siguiente mientras se reconoce la anterior.
  3. Dado que el reconocimiento termina, cuando reviso la prenda, entonces puedo confirmarla o corregirla en un paso; si falla, queda para completar a mano (R-06, R-07).
  4. Se registra `garment_added` con `source: camera` y `platform`; ninguna foto sale del bucket privado sin URL firmada.

- **ID:** MOB-E2-H02 · **Prioridad:** P0 · **Complejidad:** M · **Dependencias:** MOB-E2-H01; tope diario de visión (A-03)
- **Historia:** Como persona quiero elegir varias fotos de mi galería a la vez para cargar prendas que ya tengo fotografiadas.
- **Criterios:**
  1. Dado que elijo hasta N fotos (N por configuración), cuando confirmo, entonces cada foto entra como una prenda en una cola con su estado (subiendo, reconociendo, lista, revisar).
  2. Dado que cierro la app con la cola a medias, cuando vuelvo, entonces la cola sigue o me dice cuáles no se subieron.
  3. Dado que alcanzo el tope diario de reconocimiento, entonces el asesor me lo dice y las fotos restantes quedan para completar a mano o para mañana.

- **ID:** MOB-E2-H03 · **Prioridad:** P1 · **Complejidad:** S · **Dependencias:** regla de formalidad (D-03)
- **Historia:** Como persona quiero ver qué puede armarme el asesor con mi clóset para saber qué prenda conviene cargar después.
- **Criterios:**
  1. Dado que abro el clóset, entonces veo por ocasión (casual, oficina, evento) si alcanza o qué categoría base falta, nunca un porcentaje de clóset completo.
  2. Dado que agrego la prenda que faltaba, cuando la ocasión pasa a "alcanza", entonces el asesor lo dice en una frase en el hilo, sin insignia ni animación de premio.
  3. Se registra `closet_capability_unlocked` con la ocasión, sin datos de la prenda.

- **MOB-E2-H04** (P2, M) Como persona quiero que la cámara me avise si la luz no sirve antes de enviar la selfie para la paleta, para obtener una orientación más creíble (S-02).

### MOB-E3 Compartir hacia el asesor

- **ID:** MOB-E3-H01 · **Prioridad:** P0 · **Complejidad:** M · **Dependencias:** MOB-T-03 (extensión de compartir); evaluación de compra en el asesor (RF-17); lector de tiendas (DT-18)
- **Historia:** Como persona quiero compartir el link de una prenda desde Instagram o una tienda al asesor para saber si vale la pena antes de comprarla.
- **Criterios:**
  1. Dado que comparto un link a Prendie, cuando confirmo, entonces se abre una conversación con el link y el asesor responde si combina con mi clóset, si ya tengo algo parecido y qué looks arma, dentro de un look (DP-02, DP-11).
  2. Dado que el link es de una tienda que el lector no puede leer, entonces el asesor lo dice y me pide una foto o los datos de la prenda; no inventa precio ni disponibilidad.
  3. Dado que el contenido de la página trae texto que parece una instrucción, entonces el asesor lo trata como dato y no cambia su comportamiento (BF-09; caso en el banco de pruebas).
  4. Se registran `share_received` (tipo `link`, dominio) y el resultado (`has_similar`, `look_built`, `store_click`), sin la URL completa.

- **ID:** MOB-E3-H02 · **Prioridad:** P1 · **Complejidad:** M · **Dependencias:** MOB-E3-H01; camino inverso (D-13)
- **Historia:** Como persona quiero compartir una captura de un look que me gustó para que el asesor lo arme con lo que tengo y me diga qué falta.
- **Criterios:**
  1. Dado que comparto una imagen, cuando el asesor la recibe, entonces describe el look, muestra qué de mi clóset es equivalente y qué pieza lo completaría.
  2. Dado que el clóset no tiene nada parecido, entonces lo dice y ofrece buscar la pieza principal una sola vez (COM-16, COM-20).
  3. La imagen compartida no se guarda como prenda salvo que yo lo pida.

- **MOB-E3-H03** (P2, M) Como persona quiero dejar una compra "en pausa 48 h" para decidir con calma; a las 48 h el asesor me pregunta una vez si todavía la quiero.

### MOB-E4 Avisos útiles

- **ID:** MOB-E4-H01 · **Prioridad:** P0 · **Complejidad:** S/M · **Dependencias:** MOB-T-04 (tokens de dispositivo, migración), MOB-E4-H04
- **Historia:** Como persona quiero que me avisen cuando el asesor termine mi look si salí de la app para no quedarme esperando.
- **Criterios:**
  1. Dado que envié un pedido y la app pasó a segundo plano, cuando el turno termina, entonces recibo un aviso ("Tu look está listo") que abre esa conversación.
  2. Dado que la app sigue abierta, entonces no recibo aviso.
  3. El aviso no muestra prendas, evento ni texto del asesor en la pantalla bloqueada, salvo que yo lo active.
  4. Se registran `push_sent` y `push_opened` con el tipo `turn_ready`.

- **ID:** MOB-E4-H02 · **Prioridad:** P1 · **Complejidad:** M · **Dependencias:** MOB-E4-H01, clima (RF-13)
- **Historia:** Como persona quiero, si lo activo, un aviso a la hora que elijo con el clima del día para pedir mi look sin pensarlo.
- **Criterios:**
  1. Dado que activé "Look del día" para lunes a viernes a las 7:30, entonces recibo un aviso con el clima de mi ciudad y una pregunta, no un look ya armado.
  2. Dado que ignoro 5 avisos seguidos, entonces la app me propone espaciarlos y no envía más hasta que responda.
  3. Dado que abro el aviso, entonces el asesor arma el look con el contexto del momento (clima, lo usado en la semana: D-11).

- **ID:** MOB-E4-H03 · **Prioridad:** P1 · **Complejidad:** M · **Dependencias:** MOB-T-05 (ocasiones con fecha, migración), MOB-E4-H01
- **Historia:** Como persona quiero un aviso la víspera de un evento que le conté al asesor para llegar con el look listo.
- **Criterios:**
  1. Dado que conté un evento con fecha, cuando falta un día, entonces recibo un aviso que abre el look guardado o, si no hay, la conversación del evento.
  2. Dado que falta una pieza y la fecha no da para despacho, entonces el asesor lo dice (COM-13) y no ofrece comprar por defecto.
  3. Dado que desactivé los avisos de eventos, entonces no recibo ninguno.

- **ID:** MOB-E4-H04 · **Prioridad:** P0 (si hay cualquier aviso) · **Complejidad:** S · **Dependencias:** MOB-E1-H01
- **Historia:** Como persona quiero elegir qué avisos recibo y en qué horario para que la app no me moleste.
- **Criterios:**
  1. Dado que entro a Avisos, entonces veo cada tipo apagado salvo "Tu look está listo", que se pide junto con el permiso del sistema.
  2. Dado que defino horas de silencio, entonces ningún aviso no pedido llega en ese rango.
  3. Ningún tipo de aviso promociona productos, ofertas o tiendas (DP-27 prop.).

### MOB-E5 Uso y valor del clóset

- **ID:** MOB-E5-H01 · **Prioridad:** P1 · **Complejidad:** M · **Dependencias:** MOB-T-06 (`wear_log`, migración)
- **Historia:** Como persona quiero marcar con un toque que usé un look para que el asesor no me lo repita en la semana y sepa qué uso de verdad.
- **Criterios:**
  1. Dado un look guardado, cuando toco "Me lo puse", entonces queda registrado con la fecha y sus prendas cuentan como usadas en la semana (D-11).
  2. Dado que guardé un look y no lo usé, cuando lo digo, entonces deja de contar como usado (D-11).
  3. El registro guarda solo prenda y fecha; nunca dónde ni con quién (`contextos.md`).
  4. La constancia se muestra como ventana ("4 de las últimas 6 semanas"), nunca como racha que se rompe.

- **MOB-E5-H02** (P2, S) Como persona quiero ver las prendas que no uso hace 60 días y pedir un look con ellas.
- **MOB-E5-H03** (P2, S) Como persona quiero ver el costo por uso de una prenda si ingresé su precio.
- **MOB-E5-H04** (P3, M) Como persona quiero activar "Redescubre tu clóset" un mes, con 3 looks con prendas olvidadas.
- **MOB-E5-H05** (P3, S) Como persona quiero activar una pausa de compras para que el asesor no me ofrezca comprar mientras dure.
- **MOB-E5-H06** (P3, M) Como persona quiero un resumen de temporada con lo que más usé y las compras que resolví con lo mío.

### MOB-E6 Contexto del día a día

- **MOB-E6-H01** (P2, S) Como persona quiero agregar un look guardado al evento de mi calendario.
- **MOB-E6-H02** (P2, M) Como persona quiero consultar mi clóset y mis looks sin conexión, solo para ver (revisa DT-10; borrado local al cerrar sesión o borrar datos).
- **MOB-E6-H03** (P3, M) Como persona quiero, si lo autorizo, que el asesor vea los próximos eventos que elija de mi calendario para proponerme prepararlos (tras A-02).
- **MOB-E6-H04** (P3, L) Como persona quiero un widget con el look de hoy y el clima.

### Tareas habilitadoras

| ID | Tarea | Habilita |
|---|---|---|
| MOB-T-01 | Proyecto Expo con build propio, cuentas de Apple Developer y Google Play (Felipe), entornos apuntando a `AI_MODE=mock` y a producción | Todo |
| MOB-T-02 | Entrada sin contraseña: `signInWithOtp`, una plantilla de correo con link y código (`{{ .Token }}`), deep link con esquema propio, `verifyOtp` para el código, almacenamiento seguro de la sesión. **SMTP propio en Supabase** (el correo por defecto solo envía al equipo y hasta 2 por hora). Mismo cambio en la web (AR-5) | MOB-E1-H01 |
| MOB-T-03 | Extensión de compartir (iOS y Android) que entrega link o imagen a la app | MOB-E3 |
| MOB-T-04 | Tabla de tokens de dispositivo con RLS y envío de avisos desde el servidor al terminar el turno (`after()`) | MOB-E4 |
| MOB-T-05 | Ocasiones con fecha consultable (hoy el evento vive en `messages.parts`) | MOB-E4-H03, MOB-E6 |
| MOB-T-06 | `wear_log` (ya modelado en DATA_MODEL como V2) | MOB-E5 |
| MOB-T-07 | Eventos de analítica móviles (`platform`, `share_received`, `push_sent/opened`, `closet_capability_unlocked`, `garment_worn`) | Medición |
| MOB-T-08 | Fichas de tienda: privacidad (inventario de datos desde DATA_MODEL, más Expo Push Service y EAS Observe como encargados), capturas, nombre (A-05) | Publicación |
| MOB-T-09 | API para la app: Bearer solo en `authenticate()` de las rutas (las Server Actions lo rechazan, con test), servicios compartidos y `api/v1/*` para lecturas y mutaciones (ver `01-arquitectura.md` §3) | MOB-E1 y todo lo demás |
| MOB-T-10 | Borrar la cuenta desde la app: `deleteMyData` expuesto en `api/v1` (Apple 5.1.1(v)) | Publicación |
| MOB-T-11 | Consentimiento explícito antes de enviar fotos o datos a la IA de un tercero (Apple 5.1.2(i)); revisar si los consentimientos actuales cubren el texto | Publicación, MOB-E2 |

**Prioridad de T-09 a T-11:** P0. Sin ellas no hay app que publicar.

**Nivel "feature":** cada oportunidad O-xx de §2 es la feature que agrupa sus historias. O-06 (entrar) y la paridad
forman MOB-E1. O-02 y O-03 (captura) y O-10 forman MOB-E2. O-04 y O-05 forman MOB-E3. O-01, O-07 y O-08 forman MOB-E4.
O-09 forma MOB-E5. O-11 a O-17 forman MOB-E6 y las historias P2 y P3.

Conteo: 6 épicas, 26 historias (12 con criterios: el MVP móvil y lo que lo rodea) y 11 tareas.

---

## 6. Roadmap funcional

### Now — MVP móvil: "el asesor en tu bolsillo"
Recorrido completo del caso que manda en la app, con lo que solo el teléfono hace bien.
- MOB-E1-H01, MOB-E1-H02, MOB-E1-H03 (paridad de conversación y Tu espacio)
- MOB-E2-H01, MOB-E2-H02 (captura rápida)
- MOB-E3-H01 (compartir link → ¿vale la pena?)
- MOB-E4-H01 + MOB-E4-H04 (aviso de turno listo y preferencias)
- MOB-E1-H04 (háptica, dentro de las anteriores)
- MOB-T-01 a T-04, T-07 a T-11

**Excepciones a la regla 1 de §4.3, declaradas a propósito:**
- MOB-E4-H01 depende de A-02 solo en el texto del aviso. Se construye con texto genérico, sin contenido personal, y
  se ajusta cuando A-02 cierre.
- MOB-T-08 depende de A-05 (el nombre). Es requisito para publicar, no para construir.

**Paridad sin discusión de producto:** MOB-E1-H01 y H02 replican lo que la PWA ya hace. No esperan la sesión de
priorización y pueden construirse apenas estén el esqueleto, el equipo y la API (A5, A6 y A7 en
`06-roadmap-riesgos.md`).

**Salida de Now:** el caso del evento del fin de semana funciona de punta a punta en iOS y Android; prendas por persona
a 7 días y outfits útiles por semana medidos por plataforma; avisos sin quejas de exceso.

### Next — hábito sin presión
- MOB-E2-H03 (lo que puedo armarte)
- MOB-E4-H02 (look del día), MOB-E4-H03 (víspera del evento) + MOB-T-05
- MOB-E5-H01 (me lo puse) + MOB-T-06
- MOB-E3-H02 (compartir inspiración), MOB-E3-H03 (lo pienso 48 h)
- Integración con "Carrito listo" cuando se mergee (abrir el carrito en el navegador del sistema)

**Salida de Next:** respuesta a H-07 con datos (¿los avisos útiles generan regreso?); D-11 funcionando con uso real.

### Later — profundidad
- MOB-E5-H02 a H06 (sin uso, costo por uso, desafío, pausa de compras, resumen de temporada)
- MOB-E6-H01 a H04 (calendario, sin conexión, widget), MOB-E2-H04 (selfie guiada), MOB-E1-H05 (Face ID)
- Planificación semanal (RF-20) y viajes como evolución de E5/E6

### Lo que puede empezar ya, sin dependencias técnicas

1. **La sesión de discovery** (§4) con los insumos que ya existen.
2. **Registrar las decisiones**: fila para la app nativa (propuesta DT-22), revisión de DT-10, DP-26 y DP-27 en borrador.
3. **Instrumentar la PWA para responder preguntas de la app**: a qué hora piden "¿qué me pongo?" (hora por defecto del
   look del día), cuántos turnos terminan con la pestaña oculta (`visibilitychange`, valida O-01), cuántos links pegan
   en el chat (demanda de O-04), prendas por sesión de carga (O-02/O-03). Son eventos en `analytics_events`, sin
   datos personales (NFR-08). **La hace la sesión integradora**, no el equipo de bots: el nombre del evento vive en
   `lib/domain/types.ts`, `track()` corre solo en el servidor y medir `visibilitychange` exige una ruta en
   `app/api/`. Las tres cosas están fuera de la frontera de los bots.
4. **Prueba de puerta falsa en la PWA instalada** (**pendiente de aprobación**, porque contradice DT-10 vigente: sin push
   en el MVP): Web Push en iOS 16.4+ y Android para "Avísame cuando esté listo" mediría la demanda de O-01 antes de
   tener la app.
5. **Textos de avisos y de los hitos del clóset** en la voz del asesor (skill `ux-copy`), revisados contra DP-12 y D-10.
6. **Maquetas HTML** de cámara de prendas, hoja de compartir y preferencias de avisos en
   `docs/superpowers/mockups/` (el flujo del repo exige maqueta aprobada antes de construir).
7. **Cinco conversaciones con personas del piloto**: cuándo se visten, dónde descubren ropa, si compartirían un link
   antes de comprar. Diario de una semana si se puede.
8. **Acciones de Felipe**: cuentas de Apple Developer y Google Play, nombre público (A-05), revisión legal (A-02) con
   el alcance ampliado (avisos, caché local, calendario).
9. **Diccionario de eventos móviles** (MOB-T-07) y métricas por plataforma, antes de la primera línea de código.

### Métricas de la línea móvil

| Tipo | Métrica |
|---|---|
| North Star (la misma) | Outfits útiles por persona activa por semana, por plataforma |
| Entrada | Prendas por persona a 7 días; segundos por prenda; links compartidos por persona/mes; % de turnos con aviso que se abren; registros de uso por semana |
| Guardarraíl | Clics a tienda por outfit útil (no debe subir por avisos o mecánicas); desactivación de avisos; desinstalaciones; % de compras evaluadas que terminan en "ya tienes algo parecido" (debe ser > 0) |
| Costo | Costo de IA por persona activa (S-04): la cámara en lote y los avisos suben llamadas |

---

## 7. Riesgos de la línea móvil

| Riesgo | Mitigación |
|---|---|
| La app duplica la PWA y se mantienen dos interfaces | Mismo backend y contrato BF-02; paridad acotada a conversación + Tu espacio |
| Avisos que se sienten como app de compras | DP-27; ningún aviso de producto; apagado automático |
| La latencia (20–50 s) sigue siendo el problema real | O-01 la amortigua; bajar el tiempo sigue siendo trabajo del asesor |
| Costo de visión con carga en lote | Tope diario por persona (A-03), cola |
| Privacidad: fotos en caché local, calendario, pantalla bloqueada | A-02 ampliada; caché cifrada y borrable; contenido oculto en pantalla bloqueada |
| Revisión de las tiendas de apps (contenido generado por IA, inicio de sesión, privacidad) | Fichas de privacidad desde DATA_MODEL. Sin login social no se exige Sign in with Apple; sí hace falta un acceso de revisión para Apple (AR-5b) |
| Nombre "Prendie" compartido con el proyecto hermano | Decidir A-05 antes de publicar |
