# FUNCTIONAL_SPECS — AI Personal Stylist ("Estilo", nombre provisional DP-15)

Versión 0.1 — 2026-11-14. Documento dueño de: specs funcionales por feature. Historias y criterios de aceptación
de detalle: `PRODUCT_BACKLOG.md`. Decisiones: `DECISION_LOG.md`. Contratos de endpoints, herramientas del agente,
eventos SSE y tablas: núcleo de contratos del integrador, `TECHNICAL_ARCHITECTURE.md`, `AGENT_ARCHITECTURE.md` y el SQL
`web/supabase/migrations/20261114000000_esquema_inicial.sql`. Aquí se nombran, no se redefinen.

Convención de origen: **[INV]** investigación · **[PS]** conclusión de Product Strategy · ID de decisión (DP/DT) o
supuesto (S). Una regla sin marca es consecuencia directa de un contrato o decisión citado en la misma spec.
Los textos de UI entre comillas son copy definitivo para el MVP (español de Chile, tuteo, sin emoji); `UX_UI_SPEC.md`
puede pulirlos sin cambiar su sentido.

## Índice

| Spec | Feature | RF | Historias | Versión |
|---|---|---|---|---|
| SPEC-01 | Registro e inicio de sesión | RF-01 | E1-H01, E1-H02, E1-H03 | MVP |
| SPEC-02 | Consentimiento y control de datos | RF-02 | E1-H04 … E1-H08 | MVP |
| SPEC-03 | Onboarding conversacional progresivo | RF-03 | E2-H01 … E2-H05 | MVP |
| SPEC-04 | Perfil de imagen | RF-04 | E2-H06, E2-H07, E2-H08 | MVP |
| SPEC-05 | Paleta preliminar | RF-05 | E3-H01 … E3-H05 | MVP |
| SPEC-06 | Alta de prenda por foto | RF-06 | E4-H01, E4-H02, E4-H03, E4-H08 | MVP |
| SPEC-07 | Galería del clóset | RF-07 | E4-H04 … E4-H07 | MVP |
| SPEC-08 | Chat con el agente | RF-08 | E5-H01 … E5-H05, E5-H10 | MVP |
| SPEC-09 | Generación de outfit | RF-09 | E6-H01, E6-H02, E6-H07 | MVP |
| SPEC-10 | Tarjeta visual del outfit | RF-10 | E6-H03 | MVP |
| SPEC-11 | Guardar, descartar y feedback | RF-11 | E6-H04, E6-H05, E6-H06, E6-H08 | MVP |
| SPEC-12 | Prenda faltante | RF-12 | E7-H01, E7-H02 | MVP |
| SPEC-13 | Clima en la recomendación | RF-13 | E5-H06, E5-H07 | MVP |
| SPEC-14 | PWA instalable y navegación | RF-14 | E8-H01, E8-H02, E8-H03 | MVP |
| SPEC-15 | Eventos de producto | RF-15 | E8-H04, E8-H05, E8-H06 | MVP |
| SPEC-16 | Foto dentro del chat | RF-16 | E5-H08, E5-H09 | MVP |
| SPEC-17 | ¿Vale la pena comprar esto? | RF-17 | E7-H03, E7-H04 | V1.1 |
| SPEC-18 | Búsqueda de productos en vivo | RF-18 | E7-H05, E7-H06 | V1.1 |
| SPEC-19 | Magic link / OTP | RF-19 | E1-H09 | V1.1 |

---

## SPEC-01 Registro e inicio de sesión

**RF:** RF-01 · **Historias:** E1-H01, E1-H02, E1-H03 · **Versión:** MVP · hoy (recuperación de contraseña: MVP)

### Objetivo
Que una persona cree su cuenta o entre en menos pasos que los que tiene cualquier formulario de registro, y que la
sesión persista en la PWA instalada.

### Contexto
DT-03 fija email + contraseña para el piloto; magic link pasa a V1.1 (SPEC-19). El login anónimo queda descartado
porque se pierde al instalar la PWA en iOS. El esquema crea `profiles` y `style_profiles` por trigger al registrarse.

### Problema
Si entrar cuesta, la persona no llega al primer outfit; si la sesión se pierde, el clóset digitalizado "desaparece"
para ella.

### Descripción funcional
Una sola ruta `/entrar` con dos modos, "Crear cuenta" e "Iniciar sesión", alternables sin recargar. Tras entrar, el
destino depende del estado del onboarding. Recuperación de contraseña desde "Iniciar sesión". Cerrar sesión desde `/yo`.

### Flujo principal (crear cuenta)
1. La persona toca "Empezar" en `/` y llega a `/entrar` en modo "Crear cuenta".
2. Ingresa email y contraseña.
3. Marca las casillas de consentimiento cuando SPEC-02 esté activo (fuera del corte de hoy; ver OBS-04).
4. Toca "Crear cuenta".
5. El sistema crea el usuario en Supabase Auth; el trigger crea `profiles` y `style_profiles`.
6. Se registra `signup_completed`.
7. La persona llega a `/bienvenida`.

### Flujos alternativos
- **A1 Iniciar sesión:** email + contraseña → si `profiles.onboarding_completed_at` es nulo, `/bienvenida`; si no, `/asesor`; si venía de una ruta protegida, vuelve a esa ruta (siempre que el onboarding esté completo).
- **A2 Email ya registrado:** se muestra el error y el enlace "Iniciar sesión" con el email ya escrito.
- **A3 Recuperar contraseña:** "¿Olvidaste tu contraseña?" → email → mensaje neutro → enlace del correo → definir nueva contraseña → sesión iniciada → destino según A1.
- **A4 Ruta protegida sin sesión:** `src/proxy.ts` redirige a `/entrar` conservando la ruta pedida.
- **A5 Cerrar sesión:** `/yo` → "Cerrar sesión" → `/`.

### Reglas de negocio
- RN-01 El email se normaliza a minúsculas y sin espacios antes de enviarse.
- RN-02 La contraseña tiene al menos 8 caracteres [PS]. No se exigen símbolos ni mayúsculas (fricción sin beneficio claro en el piloto).
- RN-03 Los mensajes de error de inicio de sesión no revelan si el email existe.
- RN-04 `signup_completed` se registra una sola vez por cuenta.
- RN-05 Una persona con sesión que entra a `/entrar` es redirigida a su destino según A1.
- RN-06 La sesión persiste entre aperturas de la PWA hasta que la persona la cierre o expire según la configuración de Supabase Auth.

### Estados
- Entidad: usuario `sin cuenta` → `con sesión` → `sin sesión` (cerró sesión).
- Pantalla: inicial (formulario vacío) · cargando (botón deshabilitado con "Creando tu cuenta…" / "Entrando…") · éxito (redirección) · error (mensaje bajo el formulario, campos conservados).

### Validaciones
- Email: formato válido (zod `email`), obligatorio.
- Contraseña: obligatoria, ≥ 8 caracteres (RN-02).
- Validación en cliente al salir del campo y en servidor al enviar.

### Manejo de errores
| Caso | Texto visible |
|---|---|
| Email inválido | "Revisa tu email, parece que le falta algo." |
| Contraseña corta | "Tu contraseña necesita al menos 8 caracteres." |
| Email ya registrado | "Ya tienes una cuenta con este email. Inicia sesión." |
| Credenciales incorrectas | "El email o la contraseña no coinciden. Inténtalo de nuevo." |
| Límite de correos (recuperación) | "No pudimos enviar el correo ahora. Inténtalo en unos minutos." |
| Recuperación enviada | "Si existe una cuenta con ese email, te llegará un enlace para crear una nueva contraseña." |
| Error de red o servidor | "No pudimos conectarnos. Revisa tu conexión e inténtalo de nuevo." |

### Criterios de aceptación
Los de E1-H01, E1-H02 y E1-H03 en `PRODUCT_BACKLOG.md`.

### Dependencias
T-01, T-02, T-03. SPEC-02 para consentimientos. SPEC-19 lo complementa en V1.1.

### Consideraciones de UX
- Teclado de email (`type="email"`, `autocomplete="email"`), `autocomplete="new-password"` / `current-password` para gestores de contraseñas.
- Botón "Mostrar" en la contraseña.
- Sin captcha ni confirmación de email en el piloto (decisión a revisar con A-02).

### Consideraciones técnicas
Supabase Auth con `@supabase/ssr` (cookies). Mutaciones como Server Actions con zod. Protección en `src/proxy.ts`,
nunca `middleware.ts`. Tablas: `profiles`, `style_profiles` (trigger `handle_new_user`). Evento `signup_completed`.

---

## SPEC-02 Consentimiento y control de datos

**RF:** RF-02 · **Historias:** E1-H04 … E1-H08 · **Versión:** MVP (hoy: ver memoria y borrar todo)

### Objetivo
Que la persona decida qué fotos entrega, vea lo que el asesor recuerda de ella y pueda borrarlo todo sin pedirlo a nadie.

### Contexto
La privacidad de fotos corporales es riesgo crítico [INV] §14. La selfie podría ser dato sensible (S-05); la revisión
legal es requisito antes de invitar testers externos (A-02). El esquema tiene `consents` (`terms`, `photo_processing`,
`face_photo`, versionados), `memory_facts` visible y borrable, y la función `delete_my_data()`.

### Problema
Un asesor que "sabe cosas" de ti y guarda tu cara genera desconfianza si no puedes ver ni borrar lo que tiene.

### Descripción funcional
Tres piezas: (1) consentimientos granulares en el momento en que se necesitan; (2) sección "Lo que el asesor sabe de
ti" en `/yo` con hechos de memoria borrables uno a uno; (3) "Borrar mis datos" en `/yo`, que elimina fotos y datos.

### Flujo principal (borrar mis datos)
1. En `/yo`, sección "Privacidad", la persona toca "Borrar mis datos".
2. Ve la pantalla de confirmación con la lista de lo que se borra y lo que no (RN-09).
3. Escribe "BORRAR" en el campo de confirmación; el botón "Borrar todo" se habilita.
4. Al confirmar, el cliente lista y borra todos los objetos bajo `user-media/{user_id}/` (`garments`, `selfies`, `chat`).
5. Con Storage vacío, el cliente llama a `delete_my_data()`.
6. Se muestra "Listo. Borramos tus datos y tus fotos." y la persona llega a `/bienvenida`.

### Flujos alternativos
- **A1 Consentimiento al crear cuenta:** casillas "Acepto los términos" y "Acepto que procesen las fotos de mis prendas", no marcadas. Ambas obligatorias para crear la cuenta; generan filas `terms` y `photo_processing`.
- **A2 Consentimiento de rostro:** al iniciar la selfie (SPEC-05) sin `face_photo` vigente, se muestra la explicación con "Acepto" y "Ahora no".
- **A3 Borrar un hecho de memoria:** en la lista, "Borrar" junto a cada hecho → se elimina sin confirmación adicional y se ofrece "Deshacer" durante unos segundos.
- **A4 Revocar consentimiento:** en "Privacidad", cada consentimiento vigente tiene "Revocar" → `revoked_at = now()`.
- **A5 Fallo a mitad del borrado:** si falla el paso 4 o 5, se muestra el error y "Reintentar"; el reintento repite desde el paso 4.

### Reglas de negocio
- RN-01 Un consentimiento está vigente si existe una fila del `kind` con `revoked_at` nulo y `version` igual a la versión vigente del texto.
- RN-02 Sin `photo_processing` vigente no se puede subir ninguna foto (prenda ni chat).
- RN-03 Sin `face_photo` vigente no se puede subir selfie; el resto del producto funciona.
- RN-04 Ningún consentimiento viene premarcado.
- RN-05 La versión del texto se guarda en `consents.version`; un cambio de versión pide aceptar de nuevo en el siguiente uso de la función afectada (MVP, no hoy).
- RN-06 Borrar un hecho de memoria lo elimina de la tabla; no se usa en ningún turno posterior.
- RN-07 Al revocar `face_photo` se ofrece "Borrar también mis selfies", que borra los objetos de `selfies/`; la paleta ya calculada se mantiene salvo que la persona la borre.
- RN-08 El borrado total borra primero Storage y después las tablas (orden indicado en el SQL).
- RN-09 La confirmación lista: se borran prendas y sus fotos, selfies y paletas, conversaciones, outfits y feedback, lo que el asesor recuerda, consentimientos y tu perfil de estilo; no se borran tu cuenta (email) ni los registros de uso anónimos de la app (ver OBS-02 y OBS-03).
- RN-10 El borrado total es idempotente: repetirlo no produce error.

### Estados
- Entidad consentimiento: `vigente` · `revocado` · `desactualizado` (versión anterior).
- Entidad hecho de memoria: `existe` · `borrado`.
- Pantalla memoria: vacío ("Todavía no recuerdo nada de ti. Lo que me cuentes en el chat aparecerá aquí y podrás borrarlo.") · cargando (esqueleto de lista) · éxito (lista) · error ("No pudimos cargar lo que recuerdo de ti. Reintentar").
- Pantalla borrado: confirmación · borrando ("Borrando tus fotos…", luego "Borrando tus datos…") · éxito · error.

### Validaciones
- Confirmación de borrado: el texto debe ser exactamente "BORRAR" (sin distinguir mayúsculas).
- Borrar un hecho: el `id` debe pertenecer a la persona (RLS).

### Manejo de errores
| Caso | Texto visible |
|---|---|
| Falla el borrado de fotos | "No pudimos borrar todas tus fotos. No borramos nada más todavía. Reintentar" |
| Falla `delete_my_data()` | "Tus fotos ya se borraron, pero no pudimos terminar con tus datos. Reintentar" |
| Falla borrar un hecho | "No pudimos borrar esto. Inténtalo de nuevo." |
| Falla revocar | "No pudimos guardar tu cambio. Inténtalo de nuevo." |
| Subir foto sin consentimiento | "Para analizar tus fotos necesitamos tu permiso." + casilla y "Continuar" |

### Criterios de aceptación
Los de E1-H04 … E1-H08.

### Dependencias
T-01, T-04, T-16. SPEC-05 (consentimiento de rostro). SPEC-08 (origen de los hechos). A-02 antes de testers externos.

### Consideraciones de UX
- Lenguaje llano: "Lo que el asesor sabe de ti", no "memoria" ni "hechos".
- El botón de borrado total usa estilo destructivo y nunca es la acción primaria de la pantalla.
- Cada hecho muestra su origen en palabras: "Me lo dijiste en el chat", "Lo aprendí de tu opinión sobre un look", "De tu bienvenida".

### Consideraciones técnicas
Tablas `consents`, `memory_facts`; función `delete_my_data()` (security invoker); Storage `user-media` con política
de borrado propia. Borrar un hecho y revocar consentimientos son Server Actions. El borrado de Storage lo hace el
cliente con su sesión (T-16) porque no se usa service role (DT-02).

---

## SPEC-03 Onboarding conversacional progresivo

**RF:** RF-03 · **Historias:** E2-H01 … E2-H05 · **Versión:** MVP · hoy (retomar: MVP)

### Objetivo
Llevar a la persona desde "recién creé la cuenta" hasta su primer outfit útil en la primera sesión (activación, DP-04),
sin que el camino se sienta como un formulario.

### Contexto
RF-03 fija ≤ 6 pasos con chips, saltables. La ruta `/bienvenida` recorre perfil → selfie opcional → primeras prendas →
primer outfit. DP-06 fija meta de 5 prendas y mínimo 3. [INV] §14 identifica la digitalización como barrera crítica.

### Problema
Los onboardings de estilo piden mucho antes de dar algo. Cada pregunta extra antes del primer valor es una oportunidad
de abandono [PS].

### Descripción funcional
Seis pasos presentados como mensajes del asesor, uno por pantalla, con respuestas en chips. Lo que no se pregunta aquí
lo aprende el asesor en el chat (`remember`) o la persona lo completa en `/yo`. El resultado no es un "paso": es el
primer outfit, que cierra el onboarding.

| Paso | `step` en el evento | Pregunta del asesor | Respuesta | Guarda en | Saltable |
|---|---|---|---|---|---|
| 1 | `datos` | "Hola, soy tu asesor de imagen. ¿Cómo te digo y en qué ciudad vives?" | Texto corto opcional (nombre) + chips de ciudad (Santiago preseleccionada) | `profiles.display_name`, `profiles.city` | Sí |
| 2 | `secciones` | "¿De qué secciones sueles comprar ropa?" | Chips múltiples: Mujer, Hombre, Unisex | `style_profiles.clothing_sections` | Sí |
| 3 | `ocasiones` | "¿Para qué ocasiones te cuesta más decidir qué ponerte?" | Chips múltiples (lista de SPEC-04) | `style_profiles.occasions` | Sí |
| 4 | `estilo` | "¿Cómo describirías tu estilo hoy y hacia dónde te gustaría ir?" | Dos grupos de chips (actual y aspiracional) + selector de 3 niveles de riesgo | `current_style`, `aspirational_style`, `risk_level` | Sí |
| 5 | `paleta` | "Si quieres, con una selfie te muestro qué colores te podrían favorecer." | Flujo SPEC-05 | `color_analyses` | Sí |
| 6 | `prendas` | "Ahora súbeme entre 3 y 5 prendas que uses harto. Con eso te armo tu primer look." | Flujo SPEC-06 en bucle | `garments` | Sí ("Lo hago después") |

### Flujo principal
1. La persona llega a `/bienvenida` tras crear su cuenta.
2. Ve el paso 1 con el indicador "Paso 1 de 6" y responde o salta.
3. Al tocar "Continuar", la respuesta se guarda (Server Action) y se registra `onboarding_step_completed {step}`.
4. Repite para los pasos 2, 3 y 4.
5. Paso 5: acepta el consentimiento de rostro y sigue SPEC-05, o toca "Ahora no".
6. Paso 6: agrega prendas con SPEC-06; ve un contador "{n} de 5" y la guía de cobertura (RN-08).
7. Con 3 o más prendas `ready`, se habilita "Armar mi primer look".
8. Al tocarlo, se fija `onboarding_completed_at`, se registra `onboarding_completed` y se envía al agente el mensaje de RN-10.
9. La tarjeta del outfit (SPEC-10) aparece en `/bienvenida` con guardar, feedback y "Ir a mi asesor".

### Flujos alternativos
- **A1 Saltar un paso:** "Saltar" avanza sin guardar ni emitir evento.
- **A2 Volver:** "Atrás" muestra el paso anterior con sus respuestas.
- **A3 Saltar el paso 6 ("Lo hago después"):** se fija `onboarding_completed_at`, se registra `onboarding_completed` y la persona llega a `/asesor`, donde el asesor la invita a agregar prendas.
- **A4 Retomar (E2-H04):** al volver a `/bienvenida`, se abre el primer paso sin respuesta (RN-06).
- **A5 Menos de 3 prendas al intentar el look:** botón deshabilitado con "Te faltan {n} prendas para armar un look".
- **A6 Falla el primer outfit:** se muestra el error de SPEC-08 y "Reintentar"; el onboarding ya quedó completo.

### Reglas de negocio
- RN-01 Máximo 6 pasos, en el orden de la tabla. Ningún paso tiene más de una pregunta principal.
- RN-02 No se preguntan en el onboarding: tallas, presupuesto, marcas, calce, restricciones de comodidad ni colores que no usa (se completan en `/yo` o los aprende el asesor).
- RN-03 Todos los pasos son saltables. El único requisito duro es tener 3 prendas `ready` para pedir el primer outfit (DP-06).
- RN-04 Ningún paso exige escribir; el nombre es el único texto y es opcional.
- RN-05 Cada paso se guarda al continuar; no hay un "guardar todo" al final.
- RN-06 "Primer paso sin respuesta" se calcula así: paso 1 si `display_name` es nulo y `city` es la por defecto y nunca se confirmó; pasos 2–4 si su campo está vacío; paso 5 si no hay `color_analyses` activo; paso 6 si hay menos de 3 prendas. Los pasos saltados se consideran sin respuesta (se vuelven a ofrecer, se pueden saltar otra vez).
- RN-07 La meta visible es 5 prendas; el mínimo funcional es 3 (DP-06).
- RN-08 Guía de cobertura [PS]: el paso 6 muestra qué categorías ya hay y sugiere, en este orden, una parte de arriba, una parte de abajo (o un vestido), un calzado, un abrigo y una prenda más. Es sugerencia, no bloqueo.
- RN-09 Si la persona ya tiene `onboarding_completed_at`, `/bienvenida` redirige a `/asesor`.
- RN-10 El mensaje del primer look es "Ármame un look para {primera ocasión elegida}" o, sin ocasiones, "Ármame un look para el día a día".
- RN-11 El evento `onboarding_step_completed` lleva `step` con los valores de la tabla.

### Estados
- Entidad: `onboarding pendiente` (`onboarding_completed_at` nulo) → `completo`.
- Pantalla por paso: inicial · guardando (botón "Continuar" con indicador) · éxito (siguiente paso) · error (mensaje bajo los chips, respuesta conservada).
- Paso 6: vacío ("Todavía no tienes prendas") · subiendo/reconociendo (SPEC-06) · con prendas (contador y cobertura).
- Cierre: generando look ("Estoy armando tu primer look…") · éxito (tarjeta) · error (A6).

### Validaciones
- Nombre: opcional, 1–40 caracteres, sin saltos de línea.
- Ciudad: una de la lista de ciudades soportadas (ver OBS-10).
- Chips: solo valores de las listas de SPEC-04; listas sin duplicados.
- `risk_level`: 1, 2 o 3.

### Manejo de errores
| Caso | Texto visible |
|---|---|
| Falla al guardar un paso | "No pudimos guardar tu respuesta. Inténtalo de nuevo." |
| Falla al cargar el onboarding | "Algo falló al cargar tu bienvenida. Reintentar" |
| Falla el primer look | "No pude armar tu look esta vez. Reintentar" |

### Criterios de aceptación
Los de E2-H01 … E2-H05.

### Dependencias
SPEC-01, SPEC-02 (consentimientos), SPEC-04 (listas de valores), SPEC-05, SPEC-06, SPEC-08, SPEC-09, SPEC-10.

### Consideraciones de UX
- Cada paso se ve como una burbuja del asesor y las respuestas como chips grandes; la respuesta elegida queda como burbuja de la persona al avanzar, para que se sienta conversación.
- "Saltar" es un enlace secundario, siempre visible, nunca escondido.
- El indicador "Paso n de 6" evita la sensación de formulario infinito.
- El paso 6 celebra cada prenda agregada con su foto en miniatura, sin animaciones largas.

### Consideraciones técnicas
Ruta `/bienvenida` (sesión). Server Actions con zod por paso sobre `profiles` y `style_profiles`. El primer look usa
`POST /api/chat` con el mensaje de RN-10 (crea conversación). Eventos `onboarding_step_completed {step}`,
`onboarding_completed`.

---

## SPEC-04 Perfil de imagen

**RF:** RF-04 · **Historias:** E2-H06, E2-H07, E2-H08 · **Versión:** MVP · hoy (básico)

### Objetivo
Mostrar en `/yo` todo lo que define cómo asesora el agente y permitir editarlo con los mismos chips del onboarding.

### Contexto
El perfil estructurado es la capa 1 de memoria (DT-07). [INV] §10 lista los componentes del perfil de imagen; DP-12
excluye medidas y peso.

### Problema
Un perfil invisible genera recomendaciones que la persona no entiende ni puede corregir.

### Descripción funcional
`/yo` muestra bloques: "Tú" (nombre, ciudad), "Tu estilo" (secciones, ocasiones, estilo actual, aspiracional, riesgo),
"Tu paleta" (resumen y acceso a `/yo/paleta`), "Preferencias" (calce, comodidad, colores que no usas, tallas, marcas,
presupuesto), "Lo que el asesor sabe de ti" y "Privacidad" (SPEC-02). Cada bloque se edita en una hoja inferior.

### Flujo principal
1. La persona abre la pestaña Yo.
2. Ve sus bloques; los campos vacíos dicen "Sin definir".
3. Toca "Editar" en un bloque; se abre una hoja con chips o campos.
4. Cambia valores y toca "Guardar".
5. El cambio se persiste y la hoja se cierra con "Guardado".

### Flujos alternativos
- **A1 Cancelar:** cerrar la hoja descarta cambios no guardados.
- **A2 Valor libre:** en estilo, marcas y colores que no usas, "Otro" permite escribir una etiqueta corta.

### Reglas de negocio
- RN-01 Listas de valores del MVP [PS]:
  - Secciones: `mujer`, `hombre`, `unisex`.
  - Ocasiones: `dia_a_dia`, `oficina`, `reuniones`, `citas`, `eventos`, `matrimonios`, `fin_de_semana`, `deporte`, `viajes`, `entrevistas`.
  - Estilo (actual y aspiracional): `casual`, `clasico`, `minimalista`, `elegante`, `deportivo`, `urbano`, `romantico`, `bohemio`, `moderno`, `relajado`.
  - Calce: `holgado`, `entallado`, `oversize`, `tiro_alto`, `tiro_medio`, `largo_midi`, `manga_larga`.
  - Riesgo: 1 "A lo seguro", 2 "Un poco de novedad", 3 "Me atrevo".
- RN-02 Las etiquetas libres ("Otro") tienen 2–30 caracteres; máximo 10 por campo.
- RN-03 Presupuestos: enteros ≥ 0 en CLP, opcionales.
- RN-04 Tallas: objeto con claves `top`, `bottom`, `shoes`, valores de texto corto (máx. 10 caracteres).
- RN-05 No existen campos de medidas, peso ni "tipo de cuerpo" (DP-12).
- RN-06 Cualquier cambio aplica desde el siguiente turno del agente.

### Estados
- Pantalla: cargando (esqueleto) · éxito · error de carga · hoja de edición: inicial, guardando, guardado, error.

### Validaciones
Las de RN-01 a RN-04, en cliente y en servidor (zod).

### Manejo de errores
| Caso | Texto visible |
|---|---|
| Falla al guardar | "No pudimos guardar tus cambios. Inténtalo de nuevo." |
| Etiqueta libre inválida | "Usa entre 2 y 30 caracteres." |
| Presupuesto inválido | "Ingresa un monto en pesos, sin puntos ni decimales." |

### Criterios de aceptación
Los de E2-H06, E2-H07, E2-H08.

### Dependencias
SPEC-03 (mismas listas), SPEC-05 (resumen de paleta), SPEC-02.

### Consideraciones de UX
- Los montos se muestran con formato chileno ($45.000) aunque se ingresen sin puntos.
- Las etiquetas de chips se muestran en lenguaje natural ("Día a día"), no con el valor interno.

### Consideraciones técnicas
Lectura en Server Component; edición con Server Actions + zod sobre `profiles` y `style_profiles`. Ruta `/yo`.

---

## SPEC-05 Paleta preliminar

**RF:** RF-05 · **Historias:** E3-H01 … E3-H05 · **Versión:** MVP · hoy

### Objetivo
Entregar una paleta orientativa desde una selfie, honesta sobre su precisión y corregible por la persona.

### Contexto
DP-05 la incluye en el MVP como "paleta preliminar", diverge de [INV] §13 (que la ubica en V2). S-02: una selfie con
luz natural permite orientación, no diagnóstico. Contrato: `POST /api/color-analysis` y `analyzeColor`.

### Problema
La persona no sabe qué colores le favorecen [INV] §2; un diagnóstico automático presentado como certeza destruye
confianza cuando se equivoca.

### Descripción funcional
Captura guiada de selfie → análisis → resultado con estación tentativa, subtono, contraste, confianza, aviso de luz,
colores recomendados, neutros y a evitar, y explicación → acciones "Me hace sentido", "Corregir" y "Repetir selfie".
`/yo/paleta` muestra la paleta activa en cualquier momento.

### Flujo principal
1. Desde el paso 5 del onboarding o desde `/yo/paleta`, la persona toca "Tomar selfie".
2. Si no tiene `face_photo` vigente, ve y acepta el consentimiento (SPEC-02 A2).
3. Ve la guía: "Busca luz natural de frente, sin filtros y con la cara despejada".
4. Saca la foto o la elige de la galería.
5. El cliente comprime y sube a `user-media/{user_id}/selfies/{uuid}.jpg`.
6. Se llama a `POST /api/color-analysis` con `photo_path`; la pantalla muestra "Estoy mirando tus colores…".
7. Se muestra el resultado (RN-03) y se registra `color_analysis_completed {confidence}`.
8. La persona toca "Me hace sentido" y vuelve al flujo de origen.

### Flujos alternativos
- **A1 Luz insuficiente** (`lighting_ok` falso): banner "La luz de tu foto no es la ideal, así que esta paleta es más tentativa. Si puedes, repítela cerca de una ventana." con "Repetir selfie" como acción primaria.
- **A2 Confianza baja:** etiqueta "Muy tentativa" y sugerencia de repetir; la paleta igual queda activa.
- **A3 Sin rostro visible** (`is_face_visible` falso): no se crea paleta activa (ver OBS-07); se muestra el error y "Repetir selfie".
- **A4 Corregir:** "Corregir" abre un selector de estación (4 opciones con muestra y descripción breve) y, opcional, subtono y contraste → se crea un `color_analyses` con `source = 'manual'` que pasa a ser el activo.
- **A5 Elegir a mano sin selfie:** desde `/yo/paleta` vacío, "Elegir a mano" abre el mismo selector; `photo_path` queda nulo.
- **A6 Repetir selfie:** vuelve al paso 3; el nuevo análisis desactiva el anterior.

### Reglas de negocio
- RN-01 Solo una paleta activa por persona (índice `color_analyses_one_active`); crear una nueva desactiva la anterior.
- RN-02 La paleta se presenta siempre como orientación: el texto fijo "Esto es una orientación, no un diagnóstico profesional. Tú tienes la última palabra." aparece en el resultado y en `/yo/paleta`.
- RN-03 El resultado muestra: estación tentativa ("Podrías ser Otoño"), subtono, contraste, confianza en palabras, colores recomendados, neutros, a evitar y `rationale`.
- RN-04 Textos de confianza: `alta` "Confianza alta: la foto tenía buena luz y se distingue bien tu tono." · `media` "Confianza media: úsala como punto de partida." · `baja` "Confianza baja: tómala como una pista, no como una regla."
- RN-05 [PS] Si `lighting_ok` es falso, la confianza que se guarda y se muestra no puede ser `alta`; se rebaja a `media`.
- RN-06 Una paleta `manual` muestra "Elegida por ti" en lugar de la confianza; sus colores recomendados, neutros y a evitar salen de una tabla fija por estación (ver OBS-08).
- RN-07 El agente usa la paleta activa como contexto y nunca la afirma como certeza ("según tu paleta preliminar…").
- RN-08 La paleta no se usa para opinar sobre rasgos físicos; solo sobre colores de ropa.
- RN-09 La selfie no se muestra en el chat ni se envía al agente orquestador; solo la usa `analyzeColor`.

### Estados
- Entidad: `activa` · `inactiva` (histórica); origen `ai` o `manual`.
- Pantalla: vacío (sin paleta: "Todavía no tienes paleta" + "Tomar selfie" + "Elegir a mano") · subiendo · analizando · éxito · error.

### Validaciones
- Imagen JPEG/PNG/WebP, ≤ 5 MB después de comprimir (límite del bucket).
- `photo_path` con prefijo `{user_id}/selfies/`.
- Selector manual: estación obligatoria; subtono y contraste opcionales con valores del esquema.

### Manejo de errores
| Caso | Texto visible |
|---|---|
| Sin rostro visible | "No logré ver bien tu cara. Prueba con una foto de frente y con buena luz." |
| Falla la subida | "No pudimos subir tu foto. Revisa tu conexión e inténtalo de nuevo." |
| Falla el análisis | "No pude analizar tu foto esta vez. Puedes repetirla o elegir tu paleta a mano." |
| Archivo no soportado | "Usa una foto en formato JPG, PNG o WebP." |

### Criterios de aceptación
Los de E3-H01 … E3-H05.

### Dependencias
SPEC-02 (consentimiento `face_photo`), T-04, T-05, T-06, SPEC-08 (contexto).

### Consideraciones de UX
- Cada color con nombre visible ("Terracota"), no solo la muestra (accesibilidad).
- La estación se dice en condicional ("Podrías ser…"), nunca "Eres…".
- "Corregir" tiene el mismo peso visual que "Me hace sentido".

### Consideraciones técnicas
`POST /api/color-analysis` (`{ photo_path }` → `201 { analysis }`, desactiva la anterior). Función `analyzeColor` con
`VISION_MODEL`. Tabla `color_analyses`. La corrección manual es Server Action. Evento `color_analysis_completed {confidence}`,
`ai_usage`. Ruta `/yo/paleta`.

---

## SPEC-06 Alta de prenda por foto

**RF:** RF-06 · **Historias:** E4-H01, E4-H02, E4-H03, E4-H08 · **Versión:** MVP · hoy (alta desde el chat: MVP)

### Objetivo
Que agregar una prenda cueste una foto y un toque de confirmación.

### Contexto
DP-06: pocas prendas como estrategia (meta 5, mínimo 3), una foto = una prenda, el agente pide lo que falta a medida
que lo necesita. S-01: la calidad del reconocimiento está por validar. [INV] §11: digitalizar es "autónoma, con revisión".

### Problema
Digitalizar el clóset es tedioso y es la barrera de entrada más crítica [INV] §14.

### Descripción funcional
`/closet/nueva` captura o elige una foto, la comprime, la sube y llama a `POST /api/garments`, que reconoce la prenda
de forma síncrona y la crea. La persona revisa los campos ya completados y confirma o corrige. Si el reconocimiento
falla, completa a mano lo mínimo.

**Estrategia de pocas prendas [PS sobre DP-06]:**
1. No se pide un inventario: se pide "lo que más usas".
2. El onboarding pide 3–5 con guía de cobertura (SPEC-03 RN-08).
3. Después, el clóset crece por demanda: cuando el agente necesita una categoría, la pide con un acceso directo (E4-H08).
4. La confirmación es de un toque cuando el reconocimiento es bueno; corregir es opcional.

### Flujo principal
1. La persona toca "Agregar prenda" (Clóset, onboarding o acción del chat).
2. Elige "Sacar foto" o "Elegir de la galería".
3. El cliente convierte a JPEG, reduce a ≤ 1280 px y elimina EXIF.
4. Sube a `user-media/{user_id}/garments/{uuid}.jpg`.
5. Llama a `POST /api/garments` con `photo_path`; ve "Estoy reconociendo tu prenda…".
6. Recibe la prenda en `ready` y ve la confirmación: foto + nombre, categoría, subcategoría, colores, estampado, formalidad, temporadas y ocasiones.
7. Toca "Guardar prenda" (si no cambió nada, no hay escritura extra).
8. Vuelve al origen con la prenda visible; en el onboarding, el contador sube.

### Flujos alternativos
- **A1 Reconocimiento fallido** (`status: 'failed'`): formulario con la foto y campos vacíos; aviso "No logré reconocer esta prenda. Completa al menos la categoría y la guardamos."
- **A2 No parece una prenda** (`is_garment` falso, ver OBS-09): aviso "Esta foto no parece una prenda." con "Cambiar foto" y "Guardar igual".
- **A3 Corrección:** la persona cambia campos y guarda → `user_edited = true`, evento `garment_edited`.
- **A4 Alta pedida por el asesor:** abre `/closet/nueva?categoria={category}`; la categoría queda preseleccionada como sugerencia y, al guardar, se vuelve a la conversación con el botón "Pedir el look de nuevo".
- **A5 Agregar otra:** tras guardar, "Agregar otra" reinicia en el paso 2.
- **A6 Abandono tras el reconocimiento:** la prenda ya existe con lo reconocido y aparece en el clóset.

### Reglas de negocio
- RN-01 Una foto = una prenda en el MVP (DP-06). Si la foto tiene varias, se reconoce la principal; la guía de captura lo advierte.
- RN-02 La compresión ocurre en el cliente antes de subir; al servidor solo viaja `photo_path`.
- RN-03 El servidor rechaza `photo_path` que no empiece con el `user_id` de la sesión.
- RN-04 La categoría es una de: `top`, `bottom`, `dress`, `outerwear`, `shoes`, `bag`, `accessory` (etiquetas UI: Parte de arriba, Parte de abajo, Vestido o enterito, Abrigo, Calzado, Cartera o bolso, Accesorio).
- RN-05 Formalidad 1–5 (1 deportivo, 5 gala), con etiquetas en palabras en la UI.
- RN-06 [PS] Cuando `confidence` del reconocimiento es baja, los campos inciertos se resaltan con "Revisa esto" (umbral a definir, ver OBS-09).
- RN-07 `garment_added {category, recognized}` se registra al crearse la prenda (`recognized` = el endpoint devolvió `ready`).
- RN-08 [PS] Una prenda `failed` completada a mano pasa a `ready` al guardarse, para que `get_closet` la incluya (ver OBS-06).
- RN-09 La foto de la prenda no se recorta ni se edita en el MVP.
- RN-10 Sin `photo_processing` vigente no se abre la captura (SPEC-02 RN-02).

### Estados
- Entidad prenda: `processing` (transitorio) · `ready` · `failed`; además `favorite`, `archived_at`, `user_edited`.
- Pantalla: selección de origen · comprimiendo/subiendo ("Subiendo tu foto…") · reconociendo · confirmación (éxito) · formulario manual (fallo de IA) · error de subida o red.

### Validaciones
- Archivo de imagen; tras comprimir ≤ 5 MB.
- Al guardar: categoría obligatoria; nombre 1–60 caracteres (si queda vacío se usa la subcategoría o la categoría); formalidad 1–5; temporadas en `verano`, `invierno`, `entretiempo`; colores con nombre y hex válido.

### Manejo de errores
| Caso | Texto visible |
|---|---|
| Falla la subida | "No pudimos subir tu foto. Revisa tu conexión e inténtalo de nuevo." |
| Archivo no soportado | "Usa una foto en formato JPG, PNG o WebP." |
| Falla el endpoint (no `failed`, sino error) | "Algo falló al guardar tu prenda. Inténtalo de nuevo." |
| Falla al guardar correcciones | "No pudimos guardar tus cambios. Inténtalo de nuevo." |
| Sin permiso de cámara | "Para sacar la foto necesitas dar permiso a la cámara. También puedes elegirla de tu galería." |

### Criterios de aceptación
Los de E4-H01, E4-H02, E4-H03, E4-H08.

### Dependencias
SPEC-02 (consentimiento), T-04, T-05, T-06, T-14. SPEC-09 (pedido de prendas faltantes del clóset).

### Consideraciones de UX
- Guía de captura breve: "Una prenda por foto, extendida o colgada, con buena luz."
- En la confirmación, el botón primario es "Guardar prenda"; la edición está a la vista pero no obliga.
- Mostrar la foto ya comprimida de inmediato (sensación de rapidez) mientras se reconoce.

### Consideraciones técnicas
`POST /api/garments` (`{ photo_path }` → `201 { garment }` con `ready` o `failed`; síncrono). Función `describeGarment`
con `VISION_MODEL`. Tabla `garments`. Correcciones con Server Action + zod. Eventos `garment_added`, `garment_edited`,
`ai_usage`. Rutas `/closet/nueva`.

---

## SPEC-07 Galería del clóset

**RF:** RF-07 · **Historias:** E4-H04 … E4-H07 · **Versión:** MVP · hoy (filtro y detalle) / MVP (favoritos, archivado)

### Objetivo
Ver y mantener el clóset digital: encontrar una prenda, corregirla, marcarla favorita o archivarla.

### Contexto
Las prendas se leen con RLS en Server Components; las fotos se sirven con URL firmada de corta duración (DT-04).

### Problema
Un clóset digital que no se puede ordenar ni corregir pierde fidelidad con el clóset real y degrada las recomendaciones.

### Descripción funcional
`/closet`: grilla de fotos con nombre, filtro por categoría (con conteo), filtro "Favoritas" y acceso a "Archivadas".
`/closet/[id]`: detalle con foto grande, campos editables, favorita, archivar/restaurar.

### Flujo principal
1. La persona abre la pestaña Clóset; ve sus prendas activas, más recientes primero.
2. Toca un filtro de categoría; la grilla se reduce.
3. Toca una prenda; abre `/closet/[id]`.
4. Edita un campo y guarda, o marca favorita, o archiva.

### Flujos alternativos
- **A1 Archivar:** "Archivar" → la prenda sale de la grilla, aparece "Archivada. Deshacer".
- **A2 Restaurar:** en "Archivadas", "Restaurar" → `archived_at` nulo.
- **A3 Prenda inexistente o ajena:** `/closet/[id]` muestra "No encontramos esta prenda." con vuelta al clóset.

### Reglas de negocio
- RN-01 La grilla muestra prendas con `archived_at` nulo; orden `created_at` descendente.
- RN-02 Filtros: "Todas" + 7 categorías + "Favoritas"; las categorías sin prendas se muestran con conteo 0 y deshabilitadas.
- RN-03 Archivar no borra; las prendas archivadas no aparecen en `get_closet` y siguen visibles en outfits guardados con la etiqueta "Archivada".
- RN-04 En el MVP no existe "eliminar prenda" desde la galería; el borrado de datos es total (SPEC-02). Ver OBS-11.
- RN-05 Editar marca `user_edited = true`.

### Estados
- Pantalla: vacío ("Tu clóset está vacío. Empieza con 5 prendas que uses harto." + "Agregar prenda") · vacío con filtro ("No tienes prendas en esta categoría.") · cargando (grilla esqueleto) · éxito · error ("No pudimos cargar tu clóset. Reintentar").

### Validaciones
Las de SPEC-06 para la edición.

### Manejo de errores
| Caso | Texto visible |
|---|---|
| Falla al guardar | "No pudimos guardar tus cambios. Inténtalo de nuevo." |
| Falla archivar/restaurar | "No pudimos mover esta prenda. Inténtalo de nuevo." |
| Foto no carga | Imagen de reemplazo con el nombre de la prenda |

### Criterios de aceptación
Los de E4-H04 … E4-H07.

### Dependencias
SPEC-06, T-10.

### Consideraciones de UX
- Grilla de 2 columnas en móvil; foto cuadrada recortada solo en la vista (no en el archivo).
- El filtro es una fila de chips desplazable horizontalmente.
- Botón flotante "Agregar prenda" siempre visible en `/closet`.

### Consideraciones técnicas
Rutas `/closet`, `/closet/[id]`. Server Components + Server Actions (editar, favorita, archivar). Tabla `garments`.
URLs firmadas generadas en el servidor. Evento `garment_edited`.

---

## SPEC-08 Chat con el agente

**RF:** RF-08 · **Historias:** E5-H01 … E5-H05, E5-H10 · **Versión:** MVP · hoy

### Objetivo
Una conversación fluida con un asesor que conoce a la persona, usa herramientas y explica siempre el porqué.

### Contexto
DT-06 (un orquestador con herramientas), DT-07 (memoria en tres capas), DT-08 (SSE con outfits como eventos). El diseño
del agente (prompt, evals) es de `AGENT_ARCHITECTURE.md`; aquí solo el comportamiento visible.

### Problema
Las recomendaciones genéricas son riesgo crítico [INV] §14; un chat sin memoria obliga a repetir el contexto.

### Descripción funcional
`/asesor` muestra un saludo (con clima, SPEC-13), chips de ocasión, la conversación más reciente y un campo de texto.
Las respuestas llegan en streaming; los outfits aparecen como tarjetas (SPEC-10); los recuerdos nuevos, como una nota
discreta; el uso de herramientas, como un indicador de actividad.

### Flujo principal
1. La persona escribe o toca un chip de ocasión.
2. Se envía `POST /api/chat` con `text` (y `conversation_id` si existe).
3. Si es nueva, llega `conversation { id }` y la UI lo guarda.
4. Llegan `text_delta` y se pintan en la burbuja del asesor.
5. Cuando llega `tool` `start`, se muestra el indicador correspondiente (RN-04); con `end`, desaparece.
6. Si llega `outfit`, se inserta la tarjeta en la posición del flujo.
7. Si llega `memory`, se muestra "Lo voy a recordar: {fact}" con enlace "Ver en Yo".
8. Con `done`, la burbuja queda cerrada y se habilita el campo de texto.

### Flujos alternativos
- **A1 Error durante el turno** (`error` o corte de red): lo ya recibido se conserva, se muestra el error y "Reintentar" reenvía el mismo texto.
- **A2 Nueva conversación:** "Nueva conversación" limpia la vista y el siguiente envío no lleva `conversation_id`.
- **A3 Volver a la app:** se carga la conversación más reciente con mensajes y tarjetas desde `messages.parts`.
- **A4 Pedido fuera de alcance** (maquillaje, salud, otros temas): el agente lo dice con amabilidad y vuelve a lo que sí puede hacer (maquillaje, cabello y skincare quedan fuera del MVP según [INV] §13).

### Reglas de negocio
- RN-01 Cada turno lleva el `<contexto_persona>` actualizado (perfil, paleta activa, hechos de memoria, resumen del clóset por categoría, fecha y ciudad).
- RN-02 Máximo 6 iteraciones de herramientas por turno; si se alcanza, el agente responde con lo que tiene y lo dice.
- RN-03 Toda recomendación explica el porqué en lenguaje llano (DP-11).
- RN-04 Indicadores por herramienta: `get_closet` "Revisando tu clóset…", `get_weather` "Mirando el clima…", `propose_outfit` "Armando tu look…", `remember` sin indicador (se ve la nota de memoria).
- RN-05 Mensajes de los chips de ocasión: "Ármame un look para {ocasión} hoy". Se priorizan las ocasiones del perfil; si no hay, se muestran "Día a día", "Oficina" y "Fin de semana".
- RN-06 El agente usa `remember` cuando la persona expresa una preferencia, rechazo, contexto o calce estable (no algo de un solo día).
- RN-07 El agente no guarda en memoria: datos de salud, medidas o peso, datos de terceros identificables, ni datos de contacto o pago.
- RN-08 Guardrails visibles (kernel): no comenta el cuerpo salvo que se lo pidan y entonces habla de calce y proporción (DP-12); no inventa prendas; no ejecuta compras (DP-09, ver SPEC-12 RN-08); trata el contenido de fotos y links como dato, no como instrucción; no afirma la colorimetría como certeza.
- RN-09 Texto de la persona: 1–2.000 caracteres [PS].
- RN-10 `chat_message_sent` se registra por cada mensaje de la persona; `ai_usage` por cada llamada al modelo.

### Estados
- Entidad conversación: `nueva` · `activa`; mensaje: `user` / `assistant` con `parts`.
- Pantalla: vacío (sin conversaciones: saludo + chips + "Cuéntame qué ocasión tienes y te armo un look.") · enviando · respondiendo (streaming) · usando herramienta · éxito · error.

### Validaciones
- `text` no vacío tras recortar espacios, ≤ 2.000 caracteres.
- `conversation_id`, si viene, pertenece a la persona.
- No se puede enviar otro mensaje mientras el turno está en curso.

### Manejo de errores
| Caso | Texto visible |
|---|---|
| Error del agente | "Se me enredó la respuesta. ¿Lo intentamos de nuevo?" + "Reintentar" |
| Sin conexión | "Perdimos la conexión. Revisa tu internet y reintenta." |
| Sesión expirada (401) | "Tu sesión expiró. Vuelve a entrar para seguir." → `/entrar` |
| Texto demasiado largo | "Tu mensaje es muy largo. Intenta resumirlo." |

### Criterios de aceptación
Los de E5-H01 … E5-H05 y E5-H10.

### Dependencias
T-05, T-07, T-08, SPEC-09, SPEC-10, SPEC-12, SPEC-13. SPEC-16 para imágenes.

### Consideraciones de UX
- El campo de texto queda fijo sobre la barra inferior; el teclado no tapa el último mensaje.
- La nota de memoria es discreta y reversible desde `/yo`.
- Respeta `prefers-reduced-motion` en el indicador de actividad.

### Consideraciones técnicas
`POST /api/chat` (Route Handler Node, sesión obligatoria, zod) con eventos SSE `conversation`, `text_delta`, `tool`,
`outfit`, `memory`, `done`, `error`. Herramientas `get_closet`, `get_weather`, `propose_outfit`, `remember`.
Tablas `conversations`, `messages`, `memory_facts`. Modelo `STYLIST_MODEL`, esfuerzo `STYLIST_EFFORT`. `AI_MODE=mock`.

---

## SPEC-09 Generación de outfit

**RF:** RF-09 · **Historias:** E6-H01, E6-H02, E6-H07 · **Versión:** MVP · hoy ("otra opción": MVP)

### Objetivo
Producir un outfit completo para una ocasión, con prendas reales de la persona y una explicación clara.

### Contexto
DP-02: la unidad de valor es el outfit completo. DP-11: siempre el porqué. El contrato `propose_outfit` valida
pertenencia y una regla de composición mínima. S-03: 5 prendas bastarían para un primer outfit útil.

### Problema
"Tengo ropa, pero no sé qué ponerme" [INV] §2. Un look inventado o incompleto destruye la confianza.

### Descripción funcional
Ante un pedido de look, el agente consulta el clóset (`get_closet`), opcionalmente el clima (`get_weather`), elige
prendas que cumplen la composición y las preferencias, y llama a `propose_outfit`. El servidor valida, persiste y emite
el evento `outfit`. Si el clóset no alcanza, el agente lo dice y pide la prenda que falta en lugar de inventar.

### Flujo principal
1. La persona pide un look (texto, chip u onboarding).
2. El agente identifica ocasión y fecha (por defecto, hoy).
3. Llama a `get_closet` (con `category`/`occasion` si ayuda).
4. Si la fecha está dentro de 7 días, llama a `get_weather`.
5. Elige prendas según RN-01 a RN-08.
6. Llama a `propose_outfit` con título, ocasión, `garment_ids`, `rationale` y, si corresponde, `missing_piece` (SPEC-12).
7. El servidor valida; si es válido, persiste en `proposed` y emite `outfit`.
8. El agente cierra con una frase corta y una pregunta de feedback.

### Flujos alternativos
- **A1 Validación fallida:** `propose_outfit` devuelve un error legible; el agente corrige la selección y reintenta dentro de las 6 iteraciones.
- **A2 Clóset con menos de 3 prendas activas:** sin `propose_outfit`; responde según RN-11.
- **A3 Falta una categoría base** (p. ej., no hay parte de abajo ni vestido): sin `propose_outfit`; responde según RN-12.
- **A4 Hay base pero falta algo que lo completaría:** propone el outfit con `missing_piece` (SPEC-12).
- **A5 Otra opción:** RN-14.
- **A6 La persona rechaza una prenda puntual ("sin esa chaqueta"):** el agente propone un nuevo outfit sin ella y, si es un rechazo estable, usa `remember`.

### Reglas de negocio
Reglas validadas por `propose_outfit` (contrato del kernel):
- RN-01 Todas las prendas pertenecen a la persona.
- RN-02 Base obligatoria: al menos una `top` y una `bottom`, o un `dress`.
- RN-03 Máximo 1 `shoes` y máximo 1 `outerwear`.

Reglas de composición que aplica el agente al elegir [PS], verificables por evals (no por el validador; ver OBS-05):
- RN-04 Solo prendas activas (no archivadas) y en `ready`.
- RN-05 Máximo 2 `top` (capas), 1 `bottom`, 1 `bag`, 2 `accessory`; `dress` no se combina con `bottom`.
- RN-06 Incluye calzado si la persona tiene al menos uno adecuado a la ocasión.
- RN-07 Coherencia: la formalidad de las prendas no difiere en más de 2 niveles entre sí y se ajusta a la ocasión; las temporadas son compatibles con el clima si se consultó; si llueve, se prioriza abrigo y calzado adecuados si existen.
- RN-08 Respeta el perfil y la memoria: no usa colores en `colors_disliked`, respeta `comfort_constraints`, `fit_preferences` y hechos `dislike`; prioriza favoritas cuando son pertinentes; usa la paleta activa como criterio, no como regla absoluta.

Reglas de explicación y de faltantes:
- RN-09 El `rationale` explica en 2 a 4 frases por qué funciona: ocasión, combinación de colores (y paleta si aplica), formalidad y clima si aplica. Sin jerga técnica ni comentarios sobre el cuerpo.
- RN-10 El título es corto y descriptivo ("Oficina relajada con capas").
- RN-11 Con menos de 3 prendas activas, el agente responde: "Con {n} prendas todavía no puedo armarte un look completo. Súbeme {lo que falta según la guía de cobertura} y lo armamos." con la acción "Agregar prenda".
- RN-12 Si falta una categoría base, el agente nombra exactamente la categoría ("Me falta una parte de abajo para armarlo") y ofrece "Agregar parte de abajo" (E4-H08); además puede describir qué prenda conviene (ver OBS-12).
- RN-13 Nunca menciona como propia una prenda que no vino de `get_closet`.
- RN-14 "Otra opción" envía "Muéstrame otra opción para {ocasión}"; la nueva propuesta no repite el mismo conjunto de `garment_ids` si existe otra combinación válida; si no existe, lo dice.
- RN-15 No repite un conjunto que la persona marcó `no` para una ocasión equivalente.

### Estados
- Entidad outfit: `proposed` → `saved` | `discarded` (SPEC-11).
- Pantalla: armando (indicador de `propose_outfit`) · éxito (tarjeta) · faltan prendas (mensaje + acción) · error (SPEC-08).

### Validaciones
Las del contrato `propose_outfit` (RN-01 a RN-03) y el esquema de `outfits`/`outfit_items`.

### Manejo de errores
| Caso | Texto visible |
|---|---|
| No logra un outfit válido en 6 iteraciones | "No logré armar un look que cumpla todo con tu clóset actual. ¿Me das más detalles de la ocasión o agregamos una prenda?" |
| Error general | El de SPEC-08 |

### Criterios de aceptación
Los de E6-H01, E6-H02, E6-H07.

### Dependencias
SPEC-06, SPEC-08, SPEC-10, SPEC-12, SPEC-13, T-07, T-17.

### Consideraciones de UX
- El look aparece como tarjeta, no como lista de texto.
- Después de la tarjeta, una sola pregunta corta ("¿Te sirve para hoy?").

### Consideraciones técnicas
Herramientas `get_closet`, `get_weather`, `propose_outfit`. Tablas `outfits`, `outfit_items`. Evento SSE `outfit` con
el DTO del kernel. Evento de producto `outfit_proposed {occasion, items}`.

---

## SPEC-10 Tarjeta visual del outfit

**RF:** RF-10 · **Historias:** E6-H03 · **Versión:** MVP · hoy

### Objetivo
Mostrar el outfit como composición con las fotos reales de las prendas, sin try-on (DP-08).

### Contexto
El DTO de outfit incluye `items` con `photo_url` firmada. El try-on poco realista es riesgo crítico [INV] §14.

### Problema
Una lista de nombres de prendas no permite imaginar el look.

### Descripción funcional
Componente único reutilizado en chat, onboarding y Looks: cabecera (título, ocasión, clima), composición de fotos,
explicación, bloque de prenda faltante y barra de acciones (SPEC-11).

### Flujo principal
1. Llega un evento `outfit` o se carga un outfit persistido.
2. Se ordenan los ítems (RN-02) y se pintan las fotos.
3. Se muestran explicación, clima y prenda faltante si existen.
4. La persona toca una foto y ve la prenda en grande con su nombre (sin salir de la tarjeta).

### Flujos alternativos
- **A1 URL expirada:** al recargar la vista se pide un DTO nuevo con URLs vigentes.
- **A2 Prenda archivada:** se muestra con la etiqueta "Archivada".
- **A3 Foto no disponible:** recuadro con el nombre y la categoría.

### Reglas de negocio
- RN-01 La tarjeta solo usa fotos de prendas de la persona; nunca imágenes generadas en el MVP.
- RN-02 Orden visual: `outerwear`, `top`, `dress`, `bottom`, `shoes`, `bag`, `accessory`; dentro de la misma categoría, por `position`.
- RN-03 La explicación se muestra completa (sin "ver más") si tiene 4 frases o menos.
- RN-04 El clima se muestra como "{mín}°–{máx}° · {resumen}" solo si `weather` existe.
- RN-05 El estado se refleja: guardado muestra "Guardado"; descartado se colapsa (SPEC-11).

### Estados
- Pantalla: cargando (esqueleto de composición) · éxito · error parcial (foto faltante, A3).

### Validaciones
El DTO debe traer al menos los ítems que cumplen la base de SPEC-09 RN-02; si no, se registra error y se muestra A3.

### Manejo de errores
| Caso | Texto visible |
|---|---|
| Foto no carga | Recuadro "{nombre de la prenda}" |
| Falla al cargar el outfit en Looks | "No pudimos cargar este look. Reintentar" |

### Criterios de aceptación
Los de E6-H03.

### Dependencias
SPEC-09, SPEC-11, SPEC-12, T-10.

### Consideraciones de UX
- Composición en cuadrícula tipo "flat lay" con la prenda base más grande.
- Cada foto con `alt` igual al nombre de la prenda.
- La tarjeta cabe en el ancho de un móvil sin desplazamiento horizontal.

### Consideraciones técnicas
DTO de outfit del kernel (`id, title, occasion, rationale, status, weather?, missing_piece?, items[]`). `photo_url`
firmada en el servidor. Tablas `outfits`, `outfit_items`, `garments`.

---

## SPEC-11 Guardar, descartar y feedback

**RF:** RF-11 · **Historias:** E6-H04, E6-H05, E6-H06, E6-H08 · **Versión:** MVP · hoy

### Objetivo
Convertir cada outfit en una señal: guardado (útil), descartado o evaluado, y que esa señal alimente la memoria.

### Contexto
North Star: outfits útiles por persona activa por semana (útil = guardado o feedback `love`/`ok`). DP-11: la
corrección se guarda como memoria. Esquema: `outfits.status`, `outfit_feedback` (único por persona y outfit),
`memory_facts.source = 'feedback'`.

### Problema
Sin feedback el asesor no aprende y las recomendaciones se vuelven genéricas [INV] §14.

### Descripción funcional
Barra de acciones en la tarjeta: "Guardar", "Descartar" y tres botones de feedback. "No me gusta" abre motivos.
`/looks` lista guardados e historial.

### Flujo principal (feedback)
1. La persona toca "Me encanta", "Me sirve" o "No me gusta".
2. Con `love` u `ok`, se guarda de inmediato.
3. Con `no`, se abre una hoja con chips de motivo y un campo opcional; "Enviar".
4. Se hace upsert en `outfit_feedback` y se registra `outfit_feedback {rating}`.
5. Se aplica RN-06 (memoria) y, si se creó un hecho, se muestra "Lo voy a tener en cuenta".

### Flujos alternativos
- **A1 Guardar:** `status = 'saved'`, evento `outfit_saved`, la tarjeta muestra "Guardado".
- **A2 Descartar:** `status = 'discarded'`, tarjeta colapsada con "Deshacer" (vuelve a `proposed`).
- **A3 Cambiar feedback:** tocar otra opción reemplaza el anterior (upsert).
- **A4 Looks:** "Guardados" (por defecto) e "Historial"; cada ítem abre la tarjeta.

### Reglas de negocio
- RN-01 Un outfit tiene un solo feedback por persona; el último gana.
- RN-02 Guardar y dar feedback son independientes; un outfit puede estar guardado y con `no`.
- RN-03 Descartar no borra el outfit ni su feedback.
- RN-04 Motivos de `no`: "No es mi estilo", "No es para la ocasión", "No me gustan los colores", "No me queda cómodo", "Ya me lo pongo mucho", "Otro" (texto ≤ 280).
- RN-05 `love` y `ok` no piden motivo.
- RN-06 [PS] Feedback → memoria (Server Action, ver OBS-13):
  - `no` con motivo: inserta un hecho `kind = 'dislike'`, `source = 'feedback'`, texto "No le gustó el look «{título}» para {ocasión}: {motivo}".
  - `love`: inserta un hecho `kind = 'preference'`, `source = 'feedback'`, texto "Le encantó el look «{título}» para {ocasión}".
  - `ok`: no crea hecho.
  - Cambiar el feedback no borra hechos anteriores; la persona los gestiona en `/yo`.
  - El texto se recorta a 280 caracteres (restricción del esquema).
- RN-07 Outfit útil = `saved` o feedback `love`/`ok` (definición del kernel).
- RN-08 "Historial" muestra `proposed` y `saved`, no `discarded`.

### Estados
- Entidad outfit: `proposed` · `saved` · `discarded`. Feedback: ninguno · `love` · `ok` · `no`.
- Pantalla Looks: vacío ("Todavía no guardas looks. Pídele uno a tu asesor." + "Ir al asesor") · cargando · éxito · error.

### Validaciones
- `rating` en `love`, `ok`, `no`; `reason` ≤ 280 caracteres.
- El outfit pertenece a la persona (RLS).

### Manejo de errores
| Caso | Texto visible |
|---|---|
| Falla guardar | "No pudimos guardar este look. Inténtalo de nuevo." |
| Falla descartar | "No pudimos descartar este look. Inténtalo de nuevo." |
| Falla feedback | "No pudimos registrar tu opinión. Inténtalo de nuevo." |

### Criterios de aceptación
Los de E6-H04, E6-H05, E6-H06, E6-H08.

### Dependencias
SPEC-10, SPEC-02 (memoria visible), SPEC-15.

### Consideraciones de UX
- Los tres botones de feedback tienen texto, no solo íconos.
- La actualización es optimista con reversión si falla.

### Consideraciones técnicas
Server Actions + zod sobre `outfits`, `outfit_feedback`, `memory_facts`. Ruta `/looks`. Eventos `outfit_saved`,
`outfit_feedback {rating}`, `memory_added` cuando se crea un hecho.

---

## SPEC-12 Prenda faltante

**RF:** RF-12 · **Historias:** E7-H01, E7-H02 · **Versión:** MVP · hoy ("Ya la tengo": MVP)

### Objetivo
Decir qué prenda completaría o mejoraría un outfit y por qué, sin vender productos (DP-07, paso MVP).

### Contexto
DP-07 define el Personal Shopper en tres pasos; el MVP solo describe la prenda. DT-09 fija el orden de acceso a
catálogos para V1.1+. DP-09: ninguna compra sin autorización. [INV] §13 incluía productos reales en el MVP; DP-07 lo
posterga por falta de feeds y acuerdos.

### Problema
"No sé qué me falta" y "compro cosas que no combinan" [INV] §2.

### Descripción funcional
Al proponer un outfit, el agente puede incluir `missing_piece` con categoría, descripción y por qué. La tarjeta lo
muestra como bloque "Lo que completaría este look", con "Ya la tengo" y, en V1.1, "Buscar opciones" (SPEC-18).

### Flujo principal
1. El agente arma un outfit válido y detecta que una prenda lo mejoraría o lo completaría.
2. Incluye `missing_piece` en `propose_outfit`.
3. La tarjeta muestra el bloque con categoría, descripción y por qué.
4. La persona lo lee; puede tocar "Ya la tengo".

### Flujos alternativos
- **A1 "Ya la tengo":** abre `/closet/nueva` con la categoría preseleccionada (SPEC-06 A4).
- **A2 Pedido de compra en el chat:** el agente responde según RN-08.
- **A3 Clóset sin base:** no hay outfit; aplica SPEC-09 RN-12.

### Reglas de negocio
- RN-01 Como máximo una prenda faltante por outfit (el esquema guarda un objeto).
- RN-02 Solo se incluye si cumple al menos una condición [PS]: (a) el outfit carece de calzado o abrigo necesarios para la ocasión o el clima; (b) una prenda concreta subiría la formalidad o coherencia para la ocasión; (c) la prenda desbloquearía varios outfits con lo que ya tiene.
- RN-03 La descripción es genérica y accionable: categoría, color sugerido (preferentemente de la paleta activa), material o corte si importa. Sin marcas ni productos.
- RN-04 El "por qué" dice qué mejora y cuántos looks más desbloquea si se puede estimar con el clóset actual; si no, no inventa números.
- RN-05 Respeta `colors_disliked`, `comfort_constraints` y `brands_excluded` (estas últimas aplican desde V1.1).
- RN-06 Sin productos, marcas, precios ni links en el MVP.
- RN-07 No se sugiere prenda faltante si el outfit está completo y no hay mejora clara.
- RN-08 Ante cualquier pedido de comprar, pagar o "agrégalo al carro", el agente responde que no realiza compras ni pagos, que la decisión y el pago son de la persona en el sitio del retailer, y ofrece describir la prenda (MVP) o buscar opciones (V1.1). Nunca pide ni guarda datos de pago (DP-09).

### Estados
- Bloque: ausente · presente. (No tiene estados propios de carga: llega con el outfit.)

### Validaciones
`missing_piece` con `category` en las categorías del esquema, `description` y `why` no vacíos.

### Manejo de errores
Si `missing_piece` llega malformado, la tarjeta se muestra sin el bloque y se registra el error (sin mensaje a la persona).

### Criterios de aceptación
Los de E7-H01, E7-H02.

### Dependencias
SPEC-09, SPEC-10, SPEC-06. SPEC-18 en V1.1.

### Consideraciones de UX
- El bloque se distingue visualmente de las prendas propias (contorno punteado o ícono de "pendiente"), para que no parezca parte del clóset.
- Título: "Lo que completaría este look".

### Consideraciones técnicas
Campo `missing_piece` de `propose_outfit` y de `outfits` (`{ category, description, why }`). DTO de outfit.

---

## SPEC-13 Clima en la recomendación

**RF:** RF-13 · **Historias:** E5-H06, E5-H07 · **Versión:** MVP (uso por el agente: hoy, ver OBS-01)

### Objetivo
Que el look sea adecuado al clima del día en la ciudad de la persona.

### Contexto
DT-11: Open-Meteo por ciudad declarada, sin geolocalización. S-06: la ciudad basta. Herramienta `get_weather`
(hasta 7 días).

### Problema
Un look correcto en estilo pero inadecuado al clima no sirve.

### Descripción funcional
El agente consulta el pronóstico cuando pide o deduce una fecha dentro de 7 días y lo usa en la selección y la
explicación. El outfit guarda el clima. `/asesor` muestra el clima del día en el saludo.

### Flujo principal
1. La persona pide un look para hoy, mañana o un día de la semana.
2. El agente llama a `get_weather` con la fecha.
3. Usa mín., máx. y lluvia para elegir (SPEC-09 RN-07).
4. El outfit se persiste con `weather` y la tarjeta lo muestra.

### Flujos alternativos
- **A1 Fecha a más de 7 días:** no consulta; el agente dice "Todavía no hay pronóstico confiable para esa fecha; lo armé pensando en la temporada."
- **A2 Falla Open-Meteo:** sigue sin clima y el `rationale` dice "No pude ver el clima, así que revisa el pronóstico antes de salir."
- **A3 Ciudad sin definir:** se usa el valor por defecto `Santiago`.

### Reglas de negocio
- RN-01 Solo ciudad del perfil; nunca ubicación del dispositivo.
- RN-02 Ventana de pronóstico: hoy a 7 días.
- RN-03 La falta de clima nunca bloquea un outfit.
- RN-04 Temperaturas en °C enteros; lluvia como probabilidad o "Sin lluvia".
- RN-05 El saludo de `/asesor` falla en silencio (sin clima, sin error).

### Estados
- Clima: disponible · no disponible.
- Saludo: cargando (sin bloque) · con clima · sin clima.

### Validaciones
`date` en formato `YYYY-MM-DD` dentro de la ventana.

### Manejo de errores
Textos de A1 y A2, dichos por el agente. Sin pantallas de error propias.

### Criterios de aceptación
Los de E5-H06, E5-H07.

### Dependencias
T-09, SPEC-04 (ciudad), SPEC-09.

### Consideraciones de UX
El clima en la tarjeta es un dato de apoyo, en tamaño secundario.

### Consideraciones técnicas
Herramienta `get_weather`; campo `outfits.weather`. Open-Meteo sin clave (geocodificación de la ciudad + pronóstico).

---

## SPEC-14 PWA instalable y navegación

**RF:** RF-14 · **Historias:** E8-H01, E8-H02, E8-H03 · **Versión:** MVP · hoy (aviso sin conexión: MVP)

### Objetivo
Una app instalable, mobile-first, con navegación de 4 pestañas.

### Contexto
DP-03 (PWA en el MVP), DT-10 (manifest + service worker mínimo, sin datos offline ni push), arquitectura de
información del kernel (Asesor, Clóset, Looks, Yo). Nombre provisional "Estilo" (DP-15).

### Problema
Sin instalación, la vuelta diaria depende de recordar una URL (H-07).

### Descripción funcional
Manifest con nombre, íconos, colores y `display: standalone`; service worker que cachea el shell y una página sin
conexión; barra inferior con 4 pestañas en las rutas con sesión, salvo onboarding.

### Flujo principal
1. La persona abre la app en Chrome Android; el navegador ofrece instalar.
2. Instala; abre desde la pantalla de inicio en modo standalone.
3. Navega con la barra inferior.

### Flujos alternativos
- **A1 iOS:** en `/yo`, "Instalar la app" muestra los pasos: botón Compartir → "Agregar a pantalla de inicio".
- **A2 Sin conexión:** se muestra la página sin conexión con "Reintentar".

### Reglas de negocio
- RN-01 Pestañas en orden: Asesor (`/asesor`), Clóset (`/closet`), Looks (`/looks`), Yo (`/yo`).
- RN-02 La barra no aparece en `/`, `/entrar` ni `/bienvenida`.
- RN-03 El service worker no cachea respuestas con datos personales ni fotos (solo el shell estático).
- RN-04 Sin notificaciones push en el MVP (DT-10).
- RN-05 Texto sin conexión: "Estás sin conexión. Tu asesor necesita internet para ayudarte." + "Reintentar".

### Estados
Instalada · no instalada; en línea · sin conexión.

### Validaciones
Manifest válido según las herramientas de instalación de Chrome.

### Manejo de errores
Texto de RN-05.

### Criterios de aceptación
Los de E8-H01, E8-H02, E8-H03.

### Dependencias
T-11, T-15.

### Consideraciones de UX
Respeta áreas seguras (notch, barra de gestos) en modo standalone; pestañas con ícono y texto.

### Consideraciones técnicas
`manifest` y service worker mínimo; nombre "Estilo". Detalle de implementación en `TECHNICAL_ARCHITECTURE.md`.

---

## SPEC-15 Eventos de producto

**RF:** RF-15 · **Historias:** E8-H04, E8-H05, E8-H06 · **Versión:** MVP · hoy (básico)

### Objetivo
Medir activación, North Star y costo de IA desde el primer día.

### Contexto
DT-12: tabla propia `analytics_events` escrita desde el servidor. S-04: costo por usuario sin medir. La lista de
eventos y la North Star son del kernel; las métricas y metas, del DTR.

### Problema
Sin datos del piloto no se pueden responder S-03, H-01, H-02 ni A-03.

### Descripción funcional
Un helper de servidor registra los eventos del kernel en los puntos de la tabla siguiente.

| Evento | Se registra cuando | Spec |
|---|---|---|
| `signup_completed` | Se crea la cuenta | SPEC-01 |
| `onboarding_step_completed {step}` | Se continúa un paso respondido | SPEC-03 |
| `onboarding_completed` | Se completa o se salta el paso 6 | SPEC-03 |
| `color_analysis_completed {confidence}` | Se crea un análisis por IA | SPEC-05 |
| `garment_added {category, recognized}` | El endpoint crea la prenda | SPEC-06 |
| `garment_edited` | Se guardan correcciones de una prenda | SPEC-06, SPEC-07 |
| `chat_message_sent` | La persona envía un mensaje | SPEC-08 |
| `outfit_proposed {occasion, items}` | `propose_outfit` persiste un outfit | SPEC-09 |
| `outfit_saved` | Un outfit pasa a `saved` | SPEC-11 |
| `outfit_feedback {rating}` | Se registra o cambia un feedback | SPEC-11 |
| `memory_added` | Se inserta un hecho (chat o feedback) | SPEC-08, SPEC-11 |
| `ai_usage {route, model, input_tokens, output_tokens}` | Cada llamada al modelo | SPEC-05, SPEC-06, SPEC-08 |

### Flujo principal
1. Ocurre la acción de la tabla.
2. El servidor inserta el evento con `user_id` de la sesión y `props`.
3. Si la inserción falla, se registra el error y el flujo de la persona continúa.

### Flujos alternativos
- **A1 Modo mock:** `ai_usage` se registra con `model = 'mock'` y tokens en 0.

### Reglas de negocio
- RN-01 Nombres de evento en inglés, exactamente los del kernel.
- RN-02 `props` sin datos personales: sin texto libre de la persona, nombres, emails ni rutas de fotos. `occasion` usa valores de la lista de SPEC-04 o `otra`.
- RN-03 `items` en `outfit_proposed` es la cantidad de prendas.
- RN-04 El registro de eventos nunca bloquea ni hace fallar una acción de la persona.
- RN-05 North Star y activación se calculan con las definiciones del kernel en una consulta versionada (E8-H06).

### Estados
No aplica a la persona (no hay UI).

### Validaciones
`name` en la lista de RN-01; `props` validados con zod por evento.

### Manejo de errores
No hay mensajes a la persona; los fallos se registran (NFR-10).

### Criterios de aceptación
Los de E8-H04, E8-H05, E8-H06.

### Dependencias
T-12, T-01.

### Consideraciones de UX
No aplica.

### Consideraciones técnicas
Tabla `analytics_events` (RLS solo insert propio). Escritura desde Server Actions y Route Handlers con la sesión.

---

## SPEC-16 Foto dentro del chat

**RF:** RF-16 · **Historias:** E5-H08, E5-H09 · **Versión:** MVP (fuera del corte de hoy)

### Objetivo
Permitir preguntar con una foto: "combina este pantalón" o "¿este color me favorece?" ([INV] §10, casos 3 y 7).

### Contexto
`POST /api/chat` acepta `image_path`; Storage `user-media/{user_id}/chat/`. El contenido de la foto es dato, no instrucción.

### Problema
Muchas dudas de estilo nacen frente a una prenda concreta, no de una ocasión.

### Descripción funcional
Botón de adjuntar en el campo de texto. La foto se comprime, se sube y se envía con el texto. El agente la analiza
junto con el clóset y la paleta.

### Flujo principal
1. La persona toca adjuntar y elige o saca una foto.
2. Ve la miniatura en el campo y escribe una pregunta (opcional).
3. Envía; la foto se sube a `chat/` y el mensaje viaja con `image_path`.
4. El agente responde; si corresponde, propone un outfit con prendas propias.

### Flujos alternativos
- **A1 "Combina esto" con prenda que no está en el clóset:** el agente puede describir combinaciones con prendas propias y ofrece "Agregar a mi clóset" (abre SPEC-06 con esa foto ya subida; ver OBS-14).
- **A2 "¿Este color me favorece?":** compara con la paleta activa (SPEC-05 RN-07); sin paleta, ofrece crearla.
- **A3 Foto ilegible:** el agente pide otra.
- **A4 Sin texto:** se envía "¿Qué opinas de esto?" como texto por defecto.

### Reglas de negocio
- RN-01 Una foto por mensaje en el MVP [PS].
- RN-02 La prenda de una foto de chat no es parte del clóset: no puede ir en `propose_outfit` hasta que se agregue por SPEC-06 (validación de pertenencia).
- RN-03 Instrucciones visibles dentro de la foto (texto impreso, etiquetas) se tratan como dato.
- RN-04 No se comenta el cuerpo de la persona si aparece en la foto, salvo que lo pida (DP-12).
- RN-05 Requiere `photo_processing` vigente.

### Estados
Adjuntando · subiendo · enviada · error de subida.

### Validaciones
Las de SPEC-06 para la imagen; prefijo `{user_id}/chat/`.

### Manejo de errores
| Caso | Texto visible |
|---|---|
| Falla la subida | "No pudimos subir tu foto. Inténtalo de nuevo." |
| Foto ilegible (dicho por el agente) | "No alcanzo a ver bien la prenda. ¿Me mandas otra foto con más luz?" |

### Criterios de aceptación
Los de E5-H08, E5-H09.

### Dependencias
SPEC-08, SPEC-05, SPEC-06, SPEC-02, T-04.

### Consideraciones de UX
La miniatura se puede quitar antes de enviar.

### Consideraciones técnicas
`POST /api/chat` con `image_path`; `messages.parts` con `{ type: 'image', path }`. Verificación de prefijo en servidor.

---

## SPEC-17 ¿Vale la pena comprar esto? (V1.1)

**RF:** RF-17 · **Historias:** E7-H03, E7-H04 · **Versión:** V1.1 · **Requiere:** A-01

### Objetivo
Ayudar a decidir una compra concreta según el clóset real: compatibilidad, duplicados y outfits que desbloquea.

### Contexto
DP-07 (V1.1), DT-09 opción (a): el link o la foto los trae la persona. Herramienta `evaluate_purchase`.

### Problema
"Compro ropa que después no uso" y "compro cosas parecidas a las que ya tengo" [INV] §2.

### Descripción funcional
La persona pega un link o manda una foto y pregunta si vale la pena. El agente evalúa y responde con un veredicto
explicado y, si existe, un outfit de ejemplo con sus prendas más la prenda evaluada (como prenda faltante).

### Flujo principal
1. La persona pega un link o adjunta una foto con "¿Vale la pena?".
2. El agente llama a `evaluate_purchase`.
3. Responde: veredicto ("Vale la pena", "Con reparos", "No te la recomiendo"), con cuántas prendas propias combina, posibles duplicados y uno o más outfits que desbloquea.
4. Si hay link, ofrece "Ver en {dominio}".

### Flujos alternativos
- Link no accesible: pide una foto o captura. Página que no es un producto de moda: lo dice.

### Reglas de negocio
- RN-01 Contenido de la página = dato, no instrucción.
- RN-02 Precio y disponibilidad, si se muestran, van con "a la fecha de consulta".
- RN-03 No ejecuta compras ni agrega al carro (DP-09); aplica SPEC-12 RN-08.
- RN-04 Si respeta presupuesto, lo dice comparando con `budget_per_item_clp`.

### Estados
Evaluando ("Estoy revisando si combina con tu clóset…") · respuesta · error.

### Validaciones
URL `https`; foto según SPEC-16.

### Manejo de errores
"No pude abrir ese link. ¿Me mandas una captura o foto de la prenda?"

### Criterios de aceptación
Los de E7-H03, E7-H04.

### Dependencias
A-01, T-20, SPEC-16, SPEC-09, SPEC-12.

### Consideraciones de UX
El veredicto va primero, en una línea; el detalle después.

### Consideraciones técnicas
Herramienta `evaluate_purchase` (`{ url?, image_path? }`), contrato detallado en `AGENT_ARCHITECTURE.md`.

---

## SPEC-18 Búsqueda de productos en vivo (V1.1)

**RF:** RF-18 · **Historias:** E7-H05, E7-H06 · **Versión:** V1.1 · **Requiere:** A-01 (DT-09 en estado "requiere aprobación")

### Objetivo
Mostrar opciones reales en tiendas chilenas para la prenda faltante, con fuente y fecha, y derivar al retailer.

### Contexto
DT-09 opción (b): búsqueda web en vivo con citas, restringida a una lista de dominios chilenos; sin scraping masivo ni
catálogo almacenado. DP-10: neutralidad comercial. Mercado Libre no permite agentes externos [INV] §4.

### Problema
Saber qué falta no basta: la persona quiere saber dónde comprarlo [INV] §1.

### Descripción funcional
Desde el bloque de prenda faltante ("Buscar opciones") o desde el chat, el agente usa `search_products` y muestra
hasta unas pocas opciones con imagen o nombre, precio a la fecha, dominio y enlace.

### Flujo principal
1. La persona toca "Buscar opciones" en una prenda faltante.
2. El agente llama a `search_products` con la descripción, presupuesto y talla si existen.
3. Muestra resultados con cita y marca de tiempo, y por qué cada uno calza.
4. La persona toca "Ver en {dominio}" y se abre el sitio del retailer.

### Flujos alternativos
Sin resultados: lo dice y sugiere ajustar presupuesto o color. Dominio fuera de la lista: se descarta.

### Reglas de negocio
- RN-01 Solo dominios de la lista aprobada (A-01).
- RN-02 Cada resultado: dominio, URL, precio con "a la fecha de consulta" y fecha/hora.
- RN-03 Nunca se promete stock ni precio.
- RN-04 El orden no lo determina un acuerdo comercial; una afiliación se muestra junto al producto (DP-10).
- RN-05 No existe botón de comprar, pagar ni carro (DP-09).
- RN-06 No se almacena el catálogo; solo lo mostrado en el mensaje.

### Estados
Buscando ("Buscando opciones en tiendas chilenas…") · resultados · sin resultados · error.

### Validaciones
`max_price_clp` entero ≥ 0 si se envía.

### Manejo de errores
"No pude buscar opciones ahora. Inténtalo de nuevo en un rato."

### Criterios de aceptación
Los de E7-H05, E7-H06.

### Dependencias
A-01, T-20, SPEC-12.

### Consideraciones de UX
Los enlaces externos se marcan como tales y abren en otra pestaña.

### Consideraciones técnicas
Herramienta `search_products` (`{ query, max_price_clp?, ... }`); detalle en `AGENT_ARCHITECTURE.md`.

---

## SPEC-19 Magic link / OTP (V1.1)

**RF:** RF-19 · **Historias:** E1-H09 · **Versión:** V1.1

### Objetivo
Entrar sin contraseña de forma confiable, también en la PWA instalada.

### Contexto
DT-03: el SMTP por defecto de Supabase tiene un límite muy bajo; V1.1 usa SMTP propio (Resend). En iOS la PWA
instalada no comparte almacenamiento con Safari, por lo que un enlace abierto en Safari no inicia sesión en la PWA.

### Problema
Las contraseñas generan fricción y olvidos.

### Descripción funcional
En `/entrar`, opción "Recibir un código por email". Se envía un código de un solo uso (y un enlace como alternativa);
la persona escribe el código en la misma pantalla.

### Flujo principal
1. La persona ingresa su email y toca "Enviarme un código".
2. Recibe el correo y escribe el código en `/entrar`.
3. Queda con sesión; destino según SPEC-01 A1.

### Flujos alternativos
Código vencido o incorrecto: mensaje y "Enviar otro código". Email inexistente: se crea la cuenta (consentimientos de SPEC-02).

### Reglas de negocio
- RN-01 En la PWA instalada se prioriza el código (no el enlace) por el aislamiento de almacenamiento en iOS [PS].
- RN-02 Mismo mensaje neutro exista o no la cuenta.
- RN-03 Email y contraseña siguen disponibles.

### Estados
Pedir email · enviando · esperando código · verificando · éxito · error.

### Validaciones
Email válido; código con el largo que defina Supabase Auth.

### Manejo de errores
"Ese código no es válido o ya venció. Te mandamos otro." · "No pudimos enviar el correo. Inténtalo en unos minutos."

### Criterios de aceptación
Los de E1-H09.

### Dependencias
T-19, A-04, SPEC-01, SPEC-02.

### Consideraciones de UX
Campo de código con `inputmode="numeric"` y `autocomplete="one-time-code"`.

### Consideraciones técnicas
Supabase Auth OTP con SMTP propio; configuración en `TECHNICAL_ARCHITECTURE.md`.

---

## Observaciones para el integrador

Vacíos o contradicciones detectados en el kernel, el DECISION_LOG o el SQL. No se resolvieron en silencio: donde una
spec necesitó una regla, quedó marcada [PS] y referenciada aquí.

| ID | Fuente | Observación | Propuesta |
|---|---|---|---|
| OBS-01 | Kernel | RF-13 figura como "MVP" sin "hoy", pero el alcance de hoy incluye `get_weather` en el chat. | Marcar RF-13 "MVP · hoy (en el agente)"; el saludo con clima queda MVP. El backlog ya marca E5-H06 como hoy. |
| OBS-02 | SQL | `delete_my_data()` no borra `analytics_events` (y no hay política de borrado para el cliente); los eventos quedan con `user_id`. | Decidir: anonimizar (`user_id = null`) en la función o declararlo en la confirmación. SPEC-02 RN-09 hoy lo declara. |
| OBS-03 | SQL / DT-02 | "Borrar todo" no elimina la cuenta de `auth.users`; hacerlo requiere service role o una función privilegiada, contra DT-02. | Decidir mecanismo de baja de cuenta antes de A-02 (p. ej., función `security definer` acotada). |
| OBS-04 | Kernel / S-05 | Hoy se procesan fotos y selfie sin capturar consentimiento ("consentimiento versionado completo" fuera de hoy). | Aceptable solo mientras el único usuario sea Felipe; E1-H04 y E1-H05 deben estar antes de cualquier tester externo (A-02). Definir la versión inicial del texto. |
| OBS-05 | Kernel | La regla de composición de `propose_outfit` no cubre: prendas archivadas o `failed`, máximo de tops, `dress` + `bottom`, bolsos ni accesorios. | Evaluar ampliar el validador con SPEC-09 RN-04 y RN-05; mientras tanto se exigen por evals. |
| OBS-06 | SQL | No está definido si una prenda `failed` completada a mano pasa a `ready`, ni si `get_closet` incluye `failed`. | SPEC-06 RN-08 propone pasar a `ready` al guardar. Confirmar en `TECHNICAL_ARCHITECTURE.md`. |
| OBS-07 | Kernel | `analyzeColor` devuelve `is_face_visible`, pero el contrato de `POST /api/color-analysis` solo define `201 { analysis }`; no hay respuesta para "sin rostro". | Definir un error 422 legible o no persistir; SPEC-05 A3 asume que no se crea paleta activa. |
| OBS-08 | SQL / DP-05 | La paleta `manual` necesita colores recomendados, neutros y a evitar, pero no existe una tabla de paletas por estación; tampoco está definido qué `confidence` guardar (columna obligatoria). | Crear una constante versionada por estación y guardar `confidence = 'media'` mostrando "Elegida por ti". |
| OBS-09 | Kernel | `describeGarment` devuelve `is_garment` y `confidence`, pero no se define el tipo de `confidence` ni qué hace el endpoint si `is_garment` es falso (¿`failed`?). | Definir tipo y umbral; SPEC-06 A2 asume aviso con "Guardar igual". |
| OBS-10 | DT-11 / SQL | `profiles.city` es texto libre; la geocodificación en Open-Meteo puede ser ambigua. No hay lista de ciudades. | Lista cerrada de ciudades chilenas para el piloto, con Santiago por defecto. |
| OBS-11 | SQL | `outfit_items.garment_id` es `on delete cascade`: borrar una prenda la quita en silencio de outfits guardados y puede dejarlos sin base válida. No hay "eliminar prenda" en el kernel. | Mantener solo archivado en el MVP (SPEC-07 RN-04); si se agrega eliminar, avisar qué looks se afectan. |
| OBS-12 | Kernel / DP-07 | RF-12 dice "dentro del outfit", pero cuando falta una categoría base no hay outfit válido donde poner `missing_piece`. | El agente describe la prenda en texto (SPEC-09 RN-12). Confirmar que es aceptable para RF-12. |
| OBS-13 | Kernel | No se define quién convierte el feedback en memoria (Server Action determinista o el agente) ni con qué texto. | SPEC-11 RN-06 propone Server Action determinista; confirmar en `AGENT_ARCHITECTURE.md`. |
| OBS-14 | Kernel | `POST /api/garments` recibe `photo_path`; no está definido si puede reutilizar una foto de `chat/` o si debe copiarse a `garments/`. | Definir; SPEC-16 A1 lo deja abierto. |
| OBS-15 | Kernel / SQL | `propose_outfit` no recibe `weather`, pero `outfits.weather` y el DTO lo incluyen. | Que el servidor adjunte el último resultado de `get_weather` del turno al persistir. |
| OBS-16 | Kernel / DP-04 / DP-06 | Activación: DP-04 dice "con ≥ 5 prendas", DP-06 permite outfit con 3 y el kernel define "primer outfit útil en la primera sesión" sin umbral. | Unificar la definición (con o sin umbral de prendas) en el DTR. |
| OBS-17 | Kernel | RF-03 "≤ 6 pasos" no aclara si la selfie y las prendas cuentan como pasos. | SPEC-03 los cuenta (6 pasos con paleta y prendas; el primer outfit es el cierre). Confirmar. |
| OBS-18 | Kernel | Faltan eventos para medir: pasos saltados, outfit descartado, paleta corregida a mano, borrado de datos e instalación de la PWA. | Evaluar agregarlos a la lista del kernel (no se agregaron aquí para no cambiar el contrato). |
| OBS-19 | Kernel / S-04 | No hay límite de mensajes por persona ni tope de gasto antes de A-03. | NFR-11 lo deja como propuesta a definir antes de testers externos. |
| OBS-20 | Kernel | RF-08 pide historial, pero no hay ruta para listar conversaciones anteriores; `/asesor` solo muestra la más reciente. | Aceptado para el MVP (E5-H04); evaluar lista de conversaciones en V1.1. |
| OBS-21 | DP-06 | El alta masiva (video, foto con varias prendas, importación) está en V2 según DP-06, pero no tiene RF propio. | Se trazó a RF-06 (E4-H10). Evaluar un RF nuevo. |
| OBS-22 | SQL / S-05 | No hay política de retención de selfies: `color_analyses.photo_path` las conserva indefinidamente. | Definir con A-02 si se borran tras el análisis (minimización) o se conservan para repetir. |
