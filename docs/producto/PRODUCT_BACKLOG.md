# PRODUCT_BACKLOG — AI Personal Stylist ("Estilo", nombre provisional DP-15)

Versión 0.1 — 2026-11-14. Documento dueño de: épicas, historias de usuario y criterios de aceptación.
Fuente del backlog hasta que se autorice ClickUp (DT-15, A-04). Las specs funcionales viven en `FUNCTIONAL_SPECS.md`
(SPEC-xx); las decisiones, en `DECISION_LOG.md` (DP-xx, DT-xx, S-xx, H-xx, A-xx). Este documento cita, no repite.

Convención de origen: **[INV]** investigación (`research/contexto_asesor_imagen_personal_shopper.md`) ·
**[PS]** conclusión de Product Strategy · ID de decisión o supuesto cuando corresponde.

---

## 1. Cómo se prioriza

### 1.1 Criterios

Cada historia se ordena con cuatro criterios, en este orden de peso:

| Criterio | Pregunta que responde | Fuente |
|---|---|---|
| Valor de usuario | ¿Acerca a la persona a su primer outfit útil (activación) o a repetirlo (North Star)? | DP-02, DP-04, kernel (North Star) |
| Viabilidad técnica | ¿Se puede construir con el stack y los contratos ya fijados, sin dependencias externas nuevas? | DT-01…DT-13 |
| Riesgo | ¿Reduce un riesgo crítico (privacidad de fotos, recomendaciones genéricas, digitalización tediosa, compras no autorizadas)? | [INV] §14, DP-09, S-05 |
| Dependencias | ¿Desbloquea otras historias o depende de una aprobación pendiente (A-01, A-02)? | Sección 7 |

### 1.2 Escala de prioridad

| Prioridad | Significado |
|---|---|
| P0 | Sin esto no hay activación, o hay un riesgo legal/de confianza inaceptable. Bloquea el lanzamiento de la versión. |
| P1 | Necesario para que la versión cumpla su promesa; puede salir días después del P0 sin romper el flujo. |
| P2 | Mejora clara de experiencia o medición; se toma si hay capacidad. |
| P3 | Exploratorio; se mantiene visible para no perder la idea. |

### 1.3 Escala de complejidad relativa

No hay estimaciones de duración. La complejidad es relativa entre historias de este backlog.

| Talla | Significado |
|---|---|
| S | Una pantalla o una acción sobre contratos ya definidos; sin IA nueva; casos de borde conocidos. |
| M | Varias pantallas o estados, o una llamada de IA con salida estructurada ya definida; requiere modo mock (DT-13). |
| L | Involucra el orquestador del agente, streaming o varias tablas a la vez; requiere evals o pruebas de extremo a extremo. |
| XL | Depende de terceros, de una aprobación pendiente o de una capacidad que aún no existe (catálogos, pagos, canal nuevo). Debe partirse antes de entrar a desarrollo. |

### 1.4 Versiones

`MVP` (piloto de decenas de personas, S-07) · `V1.1` · `V2` · `V3`, según la tabla de RF del kernel y DP-07.
La marca **hoy** indica que la historia está en el corte de hoy (alcance del kernel, corte 20:00).

---

## 2. Mapa de épicas

| Épica | Objetivo | RF | Versión |
|---|---|---|---|
| E1 Cuenta y privacidad | Que la persona entre sin fricción y tenga control real de sus datos y fotos. | RF-01, RF-02, RF-19 | MVP (RF-19 en V1.1) |
| E2 Onboarding y perfil de imagen | Llegar al primer outfit sin sentir un formulario; dejar un perfil visible y editable. | RF-03, RF-04 | MVP |
| E3 Colorimetría | Entregar valor antes de digitalizar el clóset con una paleta preliminar honesta sobre su precisión (DP-05). | RF-05, RF-23 | MVP (RF-23 en V2) |
| E4 Clóset digital | Digitalizar pocas prendas con poco esfuerzo y hacer crecer el clóset con el uso (DP-06). | RF-06, RF-07, RF-22 | MVP (RF-22 en V2) |
| E5 Agente asesor | Conversación con memoria, clima y foto, que explica siempre el porqué (DP-11). | RF-08, RF-13, RF-16 | MVP |
| E6 Outfits | Producir la unidad de valor: el outfit completo para una ocasión (DP-02), guardable y evaluable. | RF-09, RF-10, RF-11, RF-26, RF-29 | MVP (RF-26 V2, RF-29 V3) |
| E7 Personal Shopper | Decir qué falta y, después, si vale la pena comprar, sin ejecutar compras (DP-07, DP-09, DP-10). | RF-12, RF-17, RF-18, RF-22, RF-24, RF-28 | MVP (RF-12), V1.1, V2, V3 |
| E8 PWA y plataforma | Instalable, mobile-first y medible desde el día 1. | RF-14, RF-15, RF-27 | MVP (RF-27 en V2) |
| E9 Hábito y planificación | Convertir la utilidad puntual en hábito semanal. | RF-20, RF-21 | V2 |
| E10 Canales y expansión | Llevar el mismo agente a otros canales, países y a retailers. | RF-25, RF-30, RF-31 | V2–V3 |

---

## 3. Historias por épica

### E1 Cuenta y privacidad

#### Feature F1.1 Acceso con email y contraseña (SPEC-01)

- **ID:** E1-H01
- **Épica:** E1 Cuenta y privacidad
- **Feature:** F1.1 Acceso con email y contraseña
- **Historia:** Como persona nueva quiero crear una cuenta con mi email y una contraseña para guardar mi clóset y mi perfil.
- **Valor:** Sin cuenta no hay memoria ni clóset persistente; el login anónimo se pierde al instalar la PWA en iOS (DT-03).
- **RF:** RF-01
- **Prioridad:** P0
- **Versión:** MVP · hoy
- **Dependencias:** T-01, T-02, T-03
- **Complejidad:** S
- **Criterios de aceptación:**
  1. Dado que estoy en `/entrar`, cuando ingreso un email válido y una contraseña que cumple SPEC-01 RN-02 y confirmo, entonces se crea la cuenta, quedo con sesión iniciada y llego a `/bienvenida`.
  2. Dado que el email ya está registrado, cuando intento crear la cuenta, entonces veo el mensaje definido en SPEC-01 y una acción para iniciar sesión.
  3. Al crearse la cuenta existen una fila en `profiles` y una en `style_profiles` para mi `user_id` (trigger `handle_new_user`).
  4. Se registra el evento `signup_completed` una sola vez por cuenta.
- **Estado:** Pendiente

- **ID:** E1-H02
- **Épica:** E1 Cuenta y privacidad
- **Feature:** F1.1 Acceso con email y contraseña
- **Historia:** Como persona registrada quiero iniciar sesión y que la app me recuerde para no tener que entrar cada vez.
- **Valor:** El hábito diario ("¿qué me pongo hoy?") no resiste un login repetido.
- **RF:** RF-01
- **Prioridad:** P0
- **Versión:** MVP · hoy
- **Dependencias:** E1-H01, T-03
- **Complejidad:** S
- **Criterios de aceptación:**
  1. Dado que inicio sesión con credenciales correctas, cuando cierro y vuelvo a abrir la PWA, entonces sigo con sesión iniciada.
  2. Dado que no tengo sesión, cuando abro cualquier ruta marcada "sesión" en el kernel, entonces `src/proxy.ts` me redirige a `/entrar` y, tras entrar, vuelvo a la ruta pedida.
  3. Dado que tengo sesión y mi onboarding no está completo (`profiles.onboarding_completed_at` nulo), cuando entro, entonces llego a `/bienvenida`; si está completo, a `/asesor`.
  4. Desde `/yo` puedo cerrar sesión y quedo en `/`.
  5. Credenciales incorrectas muestran el mensaje de SPEC-01 sin revelar si el email existe.
- **Estado:** Pendiente

- **ID:** E1-H03
- **Épica:** E1 Cuenta y privacidad
- **Feature:** F1.1 Acceso con email y contraseña
- **Historia:** Como persona que olvidó su contraseña quiero restablecerla para no perder mi clóset.
- **Valor:** Evita la pérdida de cuentas con clóset ya digitalizado (la digitalización es la barrera mayor, [INV] §14).
- **RF:** RF-01
- **Prioridad:** P1
- **Versión:** MVP
- **Dependencias:** E1-H01
- **Complejidad:** S
- **Criterios de aceptación:**
  1. Dado que pido restablecer con mi email, entonces siempre veo el mismo mensaje de confirmación exista o no la cuenta.
  2. Dado que abro el enlace recibido, cuando defino una contraseña válida, entonces quedo con sesión iniciada.
  3. Si el envío falla por el límite del SMTP por defecto (DT-03), la persona ve el mensaje de error de SPEC-01 y no un error técnico.
- **Estado:** Pendiente

#### Feature F1.2 Consentimiento granular (SPEC-02)

- **ID:** E1-H04
- **Épica:** E1 Cuenta y privacidad
- **Feature:** F1.2 Consentimiento granular
- **Historia:** Como persona nueva quiero aceptar los términos y el tratamiento de mis fotos de prendas de forma explícita para saber qué se hace con mis datos.
- **Valor:** Las fotos son datos personales (S-05); la privacidad de fotos es riesgo crítico [INV] §14.
- **RF:** RF-02
- **Prioridad:** P0
- **Versión:** MVP
- **Dependencias:** E1-H01, T-01
- **Complejidad:** S
- **Criterios de aceptación:**
  1. Dado que creo la cuenta, cuando acepto, entonces se guardan dos filas en `consents`: `terms` y `photo_processing`, cada una con `version` y `granted_at`.
  2. Las casillas no vienen marcadas por defecto y cada una tiene un enlace al texto que acepta.
  3. Dado que no tengo `photo_processing` vigente, cuando intento agregar una prenda, entonces se me pide el consentimiento antes de abrir la cámara o la galería.
- **Estado:** Pendiente

- **ID:** E1-H05
- **Épica:** E1 Cuenta y privacidad
- **Feature:** F1.2 Consentimiento granular
- **Historia:** Como persona quiero autorizar por separado el uso de mi foto de rostro para decidir si quiero la paleta sin comprometer el resto.
- **Valor:** La selfie podría ser dato sensible (S-05); el consentimiento debe ser específico.
- **RF:** RF-02
- **Prioridad:** P0
- **Versión:** MVP
- **Dependencias:** E1-H04
- **Complejidad:** S
- **Criterios de aceptación:**
  1. Dado que inicio la selfie (SPEC-05), cuando no tengo `face_photo` vigente, entonces veo una pantalla que explica para qué se usa la foto, dónde se guarda y cómo borrarla, con "Acepto" y "Ahora no".
  2. "Ahora no" me deja continuar el onboarding sin paleta.
  3. "Acepto" crea la fila `face_photo` en `consents`.
- **Estado:** Pendiente

- **ID:** E1-H06
- **Épica:** E1 Cuenta y privacidad
- **Feature:** F1.2 Consentimiento granular
- **Historia:** Como persona quiero revocar el consentimiento de foto de rostro o de fotos para dejar de entregarlas cuando quiera.
- **Valor:** Control real del dato, no solo aceptación inicial.
- **RF:** RF-02
- **Prioridad:** P1
- **Versión:** MVP
- **Dependencias:** E1-H04, E1-H05
- **Complejidad:** M
- **Criterios de aceptación:**
  1. Dado que estoy en `/yo` sección privacidad, cuando revoco `face_photo`, entonces la fila queda con `revoked_at` y no puedo subir nuevas selfies sin volver a aceptar.
  2. Al revocar `face_photo` se me ofrece borrar mis selfies guardadas (SPEC-02 RN-07).
  3. Revocar `photo_processing` impide agregar prendas nuevas; las existentes se mantienen hasta que las borre.
- **Estado:** Pendiente

#### Feature F1.3 Control de mis datos (SPEC-02)

- **ID:** E1-H07
- **Épica:** E1 Cuenta y privacidad
- **Feature:** F1.3 Control de mis datos
- **Historia:** Como persona quiero ver lo que el asesor sabe de mí y borrar lo que no quiero que recuerde para confiar en sus recomendaciones.
- **Valor:** Memoria transparente (DT-07 capa 2); mitiga recomendaciones basadas en algo equivocado.
- **RF:** RF-02
- **Prioridad:** P0
- **Versión:** MVP · hoy
- **Dependencias:** T-01, E5-H03
- **Complejidad:** S
- **Criterios de aceptación:**
  1. Dado que entro a `/yo`, entonces veo la lista de `memory_facts` propios, del más reciente al más antiguo, con su origen (`onboarding`, `chat`, `feedback`) y fecha.
  2. Cuando borro un hecho, entonces desaparece de la lista y no aparece en el `<contexto_persona>` del siguiente turno del agente.
  3. Si no hay hechos, veo el estado vacío de SPEC-02.
- **Estado:** Pendiente

- **ID:** E1-H08
- **Épica:** E1 Cuenta y privacidad
- **Feature:** F1.3 Control de mis datos
- **Historia:** Como persona quiero borrar todos mis datos y fotos de una vez para ejercer mi derecho de borrado sin pedírselo a nadie.
- **Valor:** Riesgo crítico de privacidad [INV] §14; derecho de borrado (S-05).
- **RF:** RF-02
- **Prioridad:** P0
- **Versión:** MVP · hoy
- **Dependencias:** T-01, T-04, T-16
- **Complejidad:** M
- **Criterios de aceptación:**
  1. Dado que elijo "Borrar mis datos" en `/yo`, entonces veo una confirmación que lista qué se borra y qué no (SPEC-02 RN-09) y exige una acción explícita.
  2. Cuando confirmo, entonces se borran todos los objetos de `user-media/{mi user_id}/` y luego se ejecuta `delete_my_data()`.
  3. Al terminar, `garments`, `outfits`, `conversations`, `color_analyses`, `memory_facts` y `consents` no tienen filas con mi `user_id`, y `style_profiles` queda en sus valores por defecto.
  4. Si el borrado falla a mitad, veo el error de SPEC-02 y puedo reintentar; reintentar no falla por objetos ya borrados.
  5. Al terminar llego a `/bienvenida` con el onboarding vacío.
- **Estado:** Pendiente

#### Feature F1.4 Acceso sin contraseña (SPEC-19)

- **ID:** E1-H09
- **Épica:** E1 Cuenta y privacidad
- **Feature:** F1.4 Acceso sin contraseña
- **Historia:** Como persona quiero entrar con un enlace o código enviado a mi email para no recordar otra contraseña.
- **Valor:** Menos fricción de acceso cuando se abra el piloto a más personas.
- **RF:** RF-19
- **Prioridad:** P1
- **Versión:** V1.1
- **Dependencias:** E1-H01, T-19
- **Complejidad:** M
- **Criterios de aceptación:**
  1. Dado que pido acceso con mi email, cuando abro el enlace o ingreso el código, entonces quedo con sesión iniciada en la PWA instalada (no en otro navegador).
  2. Los correos salen por el SMTP propio (DT-03), no por el SMTP por defecto de Supabase.
  3. Email y contraseña sigue funcionando para cuentas existentes.
- **Estado:** Pendiente

### E2 Onboarding y perfil de imagen

#### Feature F2.1 Onboarding conversacional progresivo (SPEC-03)

- **ID:** E2-H01
- **Épica:** E2 Onboarding y perfil de imagen
- **Feature:** F2.1 Onboarding conversacional progresivo
- **Historia:** Como visitante quiero entender en una pantalla qué hace la app y empezar con un toque para decidir si me sirve.
- **Valor:** La promesa (DP-01) tiene que entenderse antes de pedir datos.
- **RF:** RF-03
- **Prioridad:** P0
- **Versión:** MVP · hoy
- **Dependencias:** T-15
- **Complejidad:** S
- **Criterios de aceptación:**
  1. `/` muestra la promesa de DP-01 y un botón "Empezar" que lleva a `/entrar`.
  2. Si ya tengo sesión, `/` me ofrece ir a `/asesor`.
  3. La portada es usable a 360 px de ancho sin scroll horizontal.
- **Estado:** Pendiente

- **ID:** E2-H02
- **Épica:** E2 Onboarding y perfil de imagen
- **Feature:** F2.1 Onboarding conversacional progresivo
- **Historia:** Como persona nueva quiero contarle al asesor quién soy respondiendo con chips, una pregunta a la vez, para no llenar un formulario largo.
- **Valor:** Perfil mínimo para personalizar desde el primer outfit sin abandono temprano.
- **RF:** RF-03
- **Prioridad:** P0
- **Versión:** MVP · hoy
- **Dependencias:** E1-H01, T-01, T-14
- **Complejidad:** M
- **Criterios de aceptación:**
  1. El onboarding tiene como máximo 6 pasos, en el orden de SPEC-03, con un indicador "Paso n de 6".
  2. Cada paso es una sola pregunta del asesor con chips; ningún paso pide escribir texto libre obligatorio.
  3. Al continuar un paso, sus respuestas se guardan de inmediato en `profiles` o `style_profiles` y se registra `onboarding_step_completed {step}`.
  4. Puedo volver al paso anterior sin perder lo respondido.
- **Estado:** Pendiente

- **ID:** E2-H03
- **Épica:** E2 Onboarding y perfil de imagen
- **Feature:** F2.1 Onboarding conversacional progresivo
- **Historia:** Como persona con poco tiempo quiero saltar los pasos que no quiero responder para llegar rápido a mi primer outfit.
- **Valor:** RF-03 exige pasos saltables; reduce abandono.
- **RF:** RF-03
- **Prioridad:** P0
- **Versión:** MVP · hoy
- **Dependencias:** E2-H02
- **Complejidad:** S
- **Criterios de aceptación:**
  1. Todos los pasos muestran "Saltar" salvo lo indicado en SPEC-03 RN-03.
  2. Saltar un paso no guarda datos ni emite `onboarding_step_completed`.
  3. Lo saltado queda editable en `/yo` y el asesor puede preguntarlo más adelante en el chat.
- **Estado:** Pendiente

- **ID:** E2-H04
- **Épica:** E2 Onboarding y perfil de imagen
- **Feature:** F2.1 Onboarding conversacional progresivo
- **Historia:** Como persona que cerró la app a mitad del onboarding quiero retomarlo donde quedé para no repetir respuestas.
- **Valor:** La primera sesión en móvil se interrumpe con frecuencia [PS].
- **RF:** RF-03
- **Prioridad:** P1
- **Versión:** MVP
- **Dependencias:** E2-H02
- **Complejidad:** S
- **Criterios de aceptación:**
  1. Dado que completé los pasos 1 a 3 y cerré la app, cuando vuelvo a `/bienvenida`, entonces parto en el primer paso sin respuesta según SPEC-03 RN-06.
  2. Las prendas ya subidas cuentan para la meta del paso 6.
- **Estado:** Pendiente

- **ID:** E2-H05
- **Épica:** E2 Onboarding y perfil de imagen
- **Feature:** F2.1 Onboarding conversacional progresivo
- **Historia:** Como persona nueva quiero terminar el onboarding con mi primer outfit armado con mis prendas para comprobar que la app me sirve.
- **Valor:** Es la activación (DP-04): primer outfit útil dentro de la primera sesión.
- **RF:** RF-03
- **Prioridad:** P0
- **Versión:** MVP · hoy
- **Dependencias:** E2-H02, E4-H02, E6-H01, E6-H03
- **Complejidad:** M
- **Criterios de aceptación:**
  1. Dado que tengo al menos 3 prendas `ready`, cuando termino el paso 6, entonces se pide un outfit para mi ocasión principal y veo la tarjeta (SPEC-10) dentro de `/bienvenida`.
  2. Dado que tengo menos de 3 prendas, entonces el botón para el primer outfit está deshabilitado y se indica cuántas faltan.
  3. Al completar o saltar el paso 6 se fija `profiles.onboarding_completed_at` y se registra `onboarding_completed`.
  4. Desde la tarjeta puedo guardar, dar feedback o ir a `/asesor`.
- **Estado:** Pendiente

#### Feature F2.2 Perfil de imagen (SPEC-04)

- **ID:** E2-H06
- **Épica:** E2 Onboarding y perfil de imagen
- **Feature:** F2.2 Perfil de imagen
- **Historia:** Como persona quiero ver mi perfil de imagen en un solo lugar para saber con qué información me asesora.
- **Valor:** Transparencia; base de DP-11.
- **RF:** RF-04
- **Prioridad:** P0
- **Versión:** MVP · hoy
- **Dependencias:** E2-H02
- **Complejidad:** S
- **Criterios de aceptación:**
  1. `/yo` muestra nombre, ciudad, secciones de ropa, ocasiones, estilo actual y al que apunto, nivel de riesgo y un acceso a `/yo/paleta`.
  2. Cada campo vacío muestra "Sin definir" y una acción para completarlo.
- **Estado:** Pendiente

- **ID:** E2-H07
- **Épica:** E2 Onboarding y perfil de imagen
- **Feature:** F2.2 Perfil de imagen
- **Historia:** Como persona quiero editar mi perfil con los mismos chips del onboarding para corregirlo cuando cambie.
- **Valor:** El perfil evoluciona [INV] §10; un perfil desactualizado produce recomendaciones genéricas.
- **RF:** RF-04
- **Prioridad:** P0
- **Versión:** MVP · hoy
- **Dependencias:** E2-H06, T-14
- **Complejidad:** S
- **Criterios de aceptación:**
  1. Cuando edito un campo y guardo, entonces el cambio se persiste vía Server Action validada con zod y se ve al recargar.
  2. El siguiente turno del agente usa el perfil actualizado.
  3. Valores fuera de las listas de SPEC-04 se rechazan con el mensaje de validación.
- **Estado:** Pendiente

- **ID:** E2-H08
- **Épica:** E2 Onboarding y perfil de imagen
- **Feature:** F2.2 Perfil de imagen
- **Historia:** Como persona quiero registrar preferencias de calce, restricciones de comodidad, colores que no uso, tallas, marcas y presupuesto para que el asesor no me proponga lo que no me pondría.
- **Valor:** Insumo para RF-17/RF-18 y para evitar recomendaciones genéricas.
- **RF:** RF-04
- **Prioridad:** P2
- **Versión:** MVP
- **Dependencias:** E2-H07
- **Complejidad:** S
- **Criterios de aceptación:**
  1. Los campos `fit_preferences`, `comfort_constraints`, `colors_disliked`, `sizes`, `brands_liked`, `brands_excluded`, `budget_monthly_clp` y `budget_per_item_clp` son editables en `/yo` y opcionales.
  2. Los presupuestos aceptan solo enteros ≥ 0 en CLP.
  3. Ninguno de estos campos se pide en el onboarding (SPEC-03 RN-02).
  4. No existe ningún campo de medidas corporales ni peso (DP-12).
- **Estado:** Pendiente

### E3 Colorimetría

#### Feature F3.1 Paleta preliminar (SPEC-05)

- **ID:** E3-H01
- **Épica:** E3 Colorimetría
- **Feature:** F3.1 Paleta preliminar
- **Historia:** Como persona quiero tomarme una selfie y recibir una paleta orientativa para saber qué colores me podrían favorecer antes de subir mi ropa.
- **Valor:** Gancho de onboarding que entrega valor antes de digitalizar el clóset (DP-05).
- **RF:** RF-05
- **Prioridad:** P0
- **Versión:** MVP · hoy
- **Dependencias:** E1-H05, T-04, T-06
- **Complejidad:** M
- **Criterios de aceptación:**
  1. Dado que acepté `face_photo`, cuando subo una selfie, entonces la foto se comprime en el cliente y se guarda en `user-media/{user_id}/selfies/`.
  2. `POST /api/color-analysis` devuelve un análisis y la pantalla muestra estación tentativa, subtono, contraste, nivel de confianza y colores recomendados, neutros y a evitar.
  3. Siempre se muestra que es una orientación y no un diagnóstico (DP-05).
  4. Se registra `color_analysis_completed {confidence}`.
  5. Con `AI_MODE=mock` el resultado es determinista.
- **Estado:** Pendiente

- **ID:** E3-H02
- **Épica:** E3 Colorimetría
- **Feature:** F3.1 Paleta preliminar
- **Historia:** Como persona quiero que me avisen si la luz de mi selfie no sirve para repetirla y obtener una paleta más confiable.
- **Valor:** Transparencia de precisión; mitiga pérdida de confianza (S-02).
- **RF:** RF-05
- **Prioridad:** P0
- **Versión:** MVP · hoy
- **Dependencias:** E3-H01
- **Complejidad:** S
- **Criterios de aceptación:**
  1. Dado que `lighting_ok` es falso, entonces veo el aviso de iluminación de SPEC-05 y la acción "Repetir selfie".
  2. Dado que la confianza es `baja`, entonces se recomienda repetir y la paleta se marca como "muy tentativa".
  3. Dado que no se ve un rostro, entonces no se crea paleta y veo el error de SPEC-05.
- **Estado:** Pendiente

- **ID:** E3-H03
- **Épica:** E3 Colorimetría
- **Feature:** F3.1 Paleta preliminar
- **Historia:** Como persona que conoce su colorimetría (o no está de acuerdo) quiero corregir la estación a mano para que el asesor use la correcta.
- **Valor:** El diagnóstico automático no es certeza; la persona tiene la última palabra (DP-05).
- **RF:** RF-05
- **Prioridad:** P0
- **Versión:** MVP · hoy
- **Dependencias:** E3-H01
- **Complejidad:** S
- **Criterios de aceptación:**
  1. Desde el resultado o desde `/yo/paleta` puedo elegir otra estación (y opcionalmente subtono y contraste).
  2. Al guardar se crea un nuevo `color_analyses` con `source = 'manual'`, queda activo y el anterior pasa a inactivo.
  3. La pantalla muestra "Elegida por ti" en lugar del nivel de confianza.
  4. También puedo definir la paleta a mano sin haber subido selfie.
- **Estado:** Pendiente

- **ID:** E3-H04
- **Épica:** E3 Colorimetría
- **Feature:** F3.1 Paleta preliminar
- **Historia:** Como persona quiero ver mi paleta y su explicación en `/yo/paleta` para consultarla cuando compro o me visto.
- **Valor:** Reutilización del resultado fuera del onboarding.
- **RF:** RF-05
- **Prioridad:** P0
- **Versión:** MVP · hoy
- **Dependencias:** E3-H01
- **Complejidad:** S
- **Criterios de aceptación:**
  1. `/yo/paleta` muestra la paleta activa con muestras de color, nombre de cada color, explicación (`rationale`), origen (IA o elegida por ti) y fecha.
  2. Sin paleta activa, veo el estado vacío con "Tomar selfie" y "Elegir a mano".
  3. Cada muestra tiene nombre visible en texto (no solo color) para accesibilidad.
- **Estado:** Pendiente

- **ID:** E3-H05
- **Épica:** E3 Colorimetría
- **Feature:** F3.1 Paleta preliminar
- **Historia:** Como persona quiero que mis outfits consideren mi paleta para que el porqué incluya el color cuando corresponde.
- **Valor:** Conecta colorimetría con la unidad de valor (DP-02).
- **RF:** RF-05
- **Prioridad:** P1
- **Versión:** MVP · hoy
- **Dependencias:** E3-H01, E5-H02
- **Complejidad:** S
- **Criterios de aceptación:**
  1. El `<contexto_persona>` incluye la paleta activa (estación, recomendados, neutros, a evitar).
  2. En un caso de prueba con paleta y prendas en colores recomendados, el `rationale` del outfit menciona el color.
  3. El agente nunca presenta la paleta como certeza (guardrail del kernel).
- **Estado:** Pendiente

#### Feature F3.2 Colorimetría profunda (V2)

- **ID:** E3-H06
- **Épica:** E3 Colorimetría
- **Feature:** F3.2 Colorimetría profunda y proporciones
- **Historia:** Como persona quiero un análisis más profundo de color y proporciones, si lo pido, para afinar mis decisiones.
- **Valor:** Diferenciador central [INV] §5; profundidad para premium.
- **RF:** RF-23
- **Prioridad:** P2
- **Versión:** V2
- **Dependencias:** E3-H03, A-02
- **Complejidad:** XL
- **Criterios de aceptación:**
  1. Requiere un consentimiento específico distinto de `face_photo`.
  2. Habla de calce y proporción, nunca de defectos (DP-12).
  3. Se valida contra el protocolo de S-02 antes de lanzarse.
- **Estado:** Pendiente

### E4 Clóset digital

#### Feature F4.1 Alta de prenda por foto (SPEC-06)

- **ID:** E4-H01
- **Épica:** E4 Clóset digital
- **Feature:** F4.1 Alta de prenda por foto
- **Historia:** Como persona quiero agregar una prenda sacándole una foto o eligiéndola de mi galería para digitalizar mi clóset sin escribir.
- **Valor:** La digitalización es la mayor barrera (DP-06, [INV] §14).
- **RF:** RF-06
- **Prioridad:** P0
- **Versión:** MVP · hoy
- **Dependencias:** E1-H01, T-04
- **Complejidad:** M
- **Criterios de aceptación:**
  1. `/closet/nueva` ofrece "Sacar foto" y "Elegir de la galería".
  2. Antes de subir, la imagen queda en JPEG, lado mayor ≤ 1280 px y sin metadatos EXIF.
  3. La ruta subida es `user-media/{user_id}/garments/{uuid}.jpg`; al servidor solo viaja `photo_path`.
  4. Si `photo_path` no empieza con mi `user_id`, el endpoint rechaza la solicitud.
- **Estado:** Pendiente

- **ID:** E4-H02
- **Épica:** E4 Clóset digital
- **Feature:** F4.1 Alta de prenda por foto
- **Historia:** Como persona quiero que la app reconozca la prenda y me muestre lo que entendió para confirmarlo con un toque.
- **Valor:** Reconocimiento automático con revisión ([INV] §11: "Autónoma, con revisión").
- **RF:** RF-06
- **Prioridad:** P0
- **Versión:** MVP · hoy
- **Dependencias:** E4-H01, T-06
- **Complejidad:** M
- **Criterios de aceptación:**
  1. `POST /api/garments` devuelve la prenda en `ready` con nombre, categoría, subcategoría, colores, estampado, formalidad, temporadas y ocasiones.
  2. La pantalla de confirmación muestra la foto y esos campos ya completados, editables, con "Guardar prenda".
  3. Si corrijo un campo, la prenda queda con `user_edited = true` y se registra `garment_edited`.
  4. Se registra `garment_added {category, recognized}`.
  5. Con `AI_MODE=mock` el reconocimiento es determinista.
- **Estado:** Pendiente

- **ID:** E4-H03
- **Épica:** E4 Clóset digital
- **Feature:** F4.1 Alta de prenda por foto
- **Historia:** Como persona quiero completar los datos a mano cuando el reconocimiento falla para no perder la foto que ya saqué.
- **Valor:** El fallo de IA no debe romper el flujo (S-01).
- **RF:** RF-06
- **Prioridad:** P0
- **Versión:** MVP · hoy
- **Dependencias:** E4-H02
- **Complejidad:** S
- **Criterios de aceptación:**
  1. Dado que la respuesta trae `status: 'failed'`, entonces veo el formulario vacío salvo la foto, con el aviso de SPEC-06, y puedo guardar al completar al menos categoría.
  2. Al guardar a mano, la prenda queda utilizable por el agente (SPEC-06 RN-08).
  3. Si la foto no parece una prenda, veo el aviso correspondiente y puedo cambiar la foto o guardarla igual.
- **Estado:** Pendiente

- **ID:** E4-H08
- **Épica:** E4 Clóset digital
- **Feature:** F4.1 Alta de prenda por foto
- **Historia:** Como persona quiero agregar desde el chat la prenda que el asesor me pidió para completar el outfit sin buscar la pantalla.
- **Valor:** El clóset crece con el uso, no en un inventario inicial (DP-06).
- **RF:** RF-06
- **Prioridad:** P1
- **Versión:** MVP
- **Dependencias:** E4-H01, E6-H02
- **Complejidad:** S
- **Criterios de aceptación:**
  1. Cuando el agente dice que falta una categoría, aparece la acción "Agregar {categoría}" que abre `/closet/nueva` con esa categoría preseleccionada.
  2. Al guardar la prenda, vuelvo a la conversación y puedo pedir de nuevo el outfit con un toque.
- **Estado:** Pendiente

#### Feature F4.2 Galería del clóset (SPEC-07)

- **ID:** E4-H04
- **Épica:** E4 Clóset digital
- **Feature:** F4.2 Galería del clóset
- **Historia:** Como persona quiero ver mis prendas en una galería y filtrarlas por categoría para encontrar rápido lo que tengo.
- **Valor:** Ver el clóset completo refuerza el valor de haberlo digitalizado.
- **RF:** RF-07
- **Prioridad:** P0
- **Versión:** MVP · hoy
- **Dependencias:** E4-H02, T-10
- **Complejidad:** S
- **Criterios de aceptación:**
  1. `/closet` muestra las prendas no archivadas, más recientes primero, con foto (URL firmada) y nombre.
  2. Un filtro por categoría con "Todas" y las 7 categorías del esquema muestra el conteo de cada una.
  3. El estado vacío invita a agregar la primera prenda y explica la meta de 5 (DP-06).
- **Estado:** Pendiente

- **ID:** E4-H05
- **Épica:** E4 Clóset digital
- **Feature:** F4.2 Galería del clóset
- **Historia:** Como persona quiero abrir una prenda y corregir sus datos para que el asesor la use bien.
- **Valor:** Corrección manual (RF-06) disponible después del alta.
- **RF:** RF-07
- **Prioridad:** P1
- **Versión:** MVP · hoy
- **Dependencias:** E4-H04
- **Complejidad:** S
- **Criterios de aceptación:**
  1. `/closet/[id]` muestra la foto y los campos de la prenda; puedo editar nombre, categoría, subcategoría, colores, formalidad, temporadas y ocasiones.
  2. Una prenda de otra persona responde como no encontrada (RLS).
  3. Guardar marca `user_edited = true` y registra `garment_edited`.
- **Estado:** Pendiente

- **ID:** E4-H06
- **Épica:** E4 Clóset digital
- **Feature:** F4.2 Galería del clóset
- **Historia:** Como persona quiero marcar prendas favoritas para que el asesor las priorice y yo las encuentre rápido.
- **Valor:** Señal de preferencia barata y explícita.
- **RF:** RF-07
- **Prioridad:** P1
- **Versión:** MVP
- **Dependencias:** E4-H04
- **Complejidad:** S
- **Criterios de aceptación:**
  1. Puedo marcar o desmarcar favorita desde la galería y desde el detalle.
  2. La galería permite filtrar "Favoritas".
  3. `get_closet` devuelve el indicador de favorita.
- **Estado:** Pendiente

- **ID:** E4-H07
- **Épica:** E4 Clóset digital
- **Feature:** F4.2 Galería del clóset
- **Historia:** Como persona quiero archivar una prenda que ya no uso (y restaurarla) para que el asesor deje de proponerla sin perder mis looks.
- **Valor:** Mantiene el clóset real sin romper outfits guardados.
- **RF:** RF-07
- **Prioridad:** P1
- **Versión:** MVP
- **Dependencias:** E4-H04
- **Complejidad:** S
- **Criterios de aceptación:**
  1. Archivar fija `archived_at`; la prenda sale de la galería y de `get_closet`.
  2. Una vista "Archivadas" permite restaurarla.
  3. Los outfits guardados que la contienen siguen mostrándola, marcada como archivada.
- **Estado:** Pendiente

#### Feature F4.3 Clóset avanzado (V2)

- **ID:** E4-H09
- **Épica:** E4 Clóset digital
- **Feature:** F4.3 Clóset avanzado
- **Historia:** Como persona quiero saber si tengo prendas casi iguales para no seguir acumulando duplicados.
- **Valor:** "Compro cosas parecidas a las que ya tengo" [INV] §2.
- **RF:** RF-22
- **Prioridad:** P2
- **Versión:** V2
- **Dependencias:** E4-H04
- **Complejidad:** L
- **Criterios de aceptación:**
  1. El sistema agrupa prendas similares por categoría, color y subcategoría y explica la similitud.
  2. Nunca borra ni archiva sin acción de la persona.
- **Estado:** Pendiente

- **ID:** E4-H10
- **Épica:** E4 Clóset digital
- **Feature:** F4.3 Clóset avanzado
- **Historia:** Como persona quiero digitalizar varias prendas a la vez (video, foto con varias prendas o importación de compras) para llegar a un clóset grande con menos esfuerzo.
- **Valor:** Responde H-01 (¿digitalizan 20 prendas?) cuando el MVP muestre el techo de la carga uno a uno.
- **RF:** RF-06
- **Prioridad:** P2
- **Versión:** V2
- **Dependencias:** E4-H02
- **Complejidad:** XL
- **Criterios de aceptación:**
  1. Cada prenda detectada pasa por la misma confirmación de E4-H02.
  2. La importación desde correo requiere autorización explícita y revocable.
- **Estado:** Pendiente

### E5 Agente asesor

#### Feature F5.1 Chat con memoria (SPEC-08)

- **ID:** E5-H01
- **Épica:** E5 Agente asesor
- **Feature:** F5.1 Chat con memoria
- **Historia:** Como persona quiero conversar con el asesor y ver su respuesta mientras la escribe para sentir una conversación y no una espera.
- **Valor:** Núcleo del producto (DT-06, DT-08).
- **RF:** RF-08
- **Prioridad:** P0
- **Versión:** MVP · hoy
- **Dependencias:** T-05, T-07, T-08
- **Complejidad:** L
- **Criterios de aceptación:**
  1. Al enviar un mensaje en `/asesor`, la UI consume el `text/event-stream` de `POST /api/chat` y pinta `text_delta` de forma incremental.
  2. Durante una herramienta (`tool` con `status: 'start'`) se ve un indicador con el texto de SPEC-08.
  3. El primer mensaje crea una conversación (evento `conversation`) y los siguientes la reutilizan.
  4. Al recibir `done`, el turno queda persistido en `messages`; al recibir `error`, se ve el mensaje de SPEC-08 y puedo reintentar.
  5. Se registra `chat_message_sent` por mensaje de la persona.
- **Estado:** Pendiente

- **ID:** E5-H02
- **Épica:** E5 Agente asesor
- **Feature:** F5.1 Chat con memoria
- **Historia:** Como persona quiero que el asesor ya sepa mi perfil, paleta, lo que recuerda de mí y qué tengo en el clóset para no repetirlo en cada conversación.
- **Valor:** Mitiga "recomendaciones genéricas" [INV] §14; memoria en tres capas (DT-07).
- **RF:** RF-08
- **Prioridad:** P0
- **Versión:** MVP · hoy
- **Dependencias:** T-08, E2-H02
- **Complejidad:** M
- **Criterios de aceptación:**
  1. Cada turno incluye el bloque `<contexto_persona>` con perfil, paleta activa, hechos de memoria, resumen del clóset por categoría, fecha y ciudad.
  2. Un caso de eval verifica que el agente no pregunta algo que ya está en el perfil.
  3. El prompt de sistema no contiene datos de la persona (cacheable).
- **Estado:** Pendiente

- **ID:** E5-H03
- **Épica:** E5 Agente asesor
- **Feature:** F5.1 Chat con memoria
- **Historia:** Como persona quiero que el asesor recuerde lo que le digo ("no uso tacos") y me avise cuando lo guarda para no tener que repetirlo.
- **Valor:** Memoria capa 2 visible (DT-07, DP-11).
- **RF:** RF-08
- **Prioridad:** P0
- **Versión:** MVP · hoy
- **Dependencias:** E5-H01
- **Complejidad:** S
- **Criterios de aceptación:**
  1. Cuando el agente usa `remember`, se inserta en `memory_facts` con `source = 'chat'` y la UI muestra la nota "Lo voy a recordar: {fact}" con enlace a `/yo`.
  2. Se registra `memory_added`.
  3. El agente no guarda datos de salud, medidas corporales ni datos de terceros (SPEC-08 RN-07).
- **Estado:** Pendiente

- **ID:** E5-H04
- **Épica:** E5 Agente asesor
- **Feature:** F5.1 Chat con memoria
- **Historia:** Como persona quiero ver mi conversación anterior al volver a `/asesor` para retomar donde quedé.
- **Valor:** Continuidad (RF-08 historial).
- **RF:** RF-08
- **Prioridad:** P1
- **Versión:** MVP · hoy
- **Dependencias:** E5-H01
- **Complejidad:** S
- **Criterios de aceptación:**
  1. `/asesor` carga la conversación más reciente con sus mensajes y tarjetas de outfit (desde `messages.parts`).
  2. "Nueva conversación" inicia otra sin borrar la anterior.
- **Estado:** Pendiente

- **ID:** E5-H05
- **Épica:** E5 Agente asesor
- **Feature:** F5.1 Chat con memoria
- **Historia:** Como persona quiero atajos de ocasión ("Oficina", "Cita", "Fin de semana") para pedir un outfit sin escribir.
- **Valor:** Baja el costo de iniciar el caso de uso diario (DP-04).
- **RF:** RF-08
- **Prioridad:** P1
- **Versión:** MVP · hoy
- **Dependencias:** E5-H01
- **Complejidad:** S
- **Criterios de aceptación:**
  1. `/asesor` muestra chips de ocasión priorizando las ocasiones de mi perfil.
  2. Tocar un chip envía el mensaje de SPEC-08 RN-05 como si lo hubiera escrito.
- **Estado:** Pendiente

- **ID:** E5-H10
- **Épica:** E5 Agente asesor
- **Feature:** F5.1 Chat con memoria
- **Historia:** Como persona quiero que el asesor respete límites claros (no opina de mi cuerpo si no lo pido, no inventa prendas, no compra) para confiar en él.
- **Valor:** Guardrails del kernel; DP-09, DP-12; riesgo de alucinaciones [INV] §14.
- **RF:** RF-08
- **Prioridad:** P0
- **Versión:** MVP · hoy
- **Dependencias:** E5-H01, T-17
- **Complejidad:** M
- **Criterios de aceptación:**
  1. El set de evals (T-17) incluye y aprueba casos de: comentario de cuerpo no pedido, prenda inexistente, pedido de compra, instrucción incrustada en texto de la persona o en una foto, y diagnóstico de colorimetría como certeza.
  2. Ante un pedido de compra, el agente responde según SPEC-12 RN-08 sin ejecutar acción alguna.
  3. Ningún turno supera 6 iteraciones de herramientas.
- **Estado:** Pendiente

#### Feature F5.2 Clima (SPEC-13)

- **ID:** E5-H06
- **Épica:** E5 Agente asesor
- **Feature:** F5.2 Clima
- **Historia:** Como persona quiero que el outfit considere el clima de mi ciudad para el día que lo voy a usar para no pasar frío ni calor.
- **Valor:** Contexto de [INV] §10 caso 1 ("¿Qué me pongo mañana?").
- **RF:** RF-13
- **Prioridad:** P1
- **Versión:** MVP · hoy
- **Dependencias:** T-09, E6-H01
- **Complejidad:** S
- **Criterios de aceptación:**
  1. Al pedir un outfit para una fecha dentro de los próximos 7 días, el agente usa `get_weather` y el outfit muestra mín., máx. y probabilidad de lluvia.
  2. Si el clima no está disponible, el outfit se genera igual y el texto lo dice (SPEC-13).
  3. No se pide geolocalización del dispositivo (DT-11).
- **Estado:** Pendiente

- **ID:** E5-H07
- **Épica:** E5 Agente asesor
- **Feature:** F5.2 Clima
- **Historia:** Como persona quiero ver el clima de hoy en el saludo de `/asesor` para decidir si pido un outfit.
- **Valor:** Disparador del hábito diario [PS].
- **RF:** RF-13
- **Prioridad:** P2
- **Versión:** MVP
- **Dependencias:** T-09
- **Complejidad:** S
- **Criterios de aceptación:**
  1. El saludo muestra ciudad, mín., máx. y un resumen.
  2. Si falla Open-Meteo, el saludo se muestra sin clima y sin mensaje de error.
- **Estado:** Pendiente

#### Feature F5.3 Foto en el chat (SPEC-16)

- **ID:** E5-H08
- **Épica:** E5 Agente asesor
- **Feature:** F5.3 Foto en el chat
- **Historia:** Como persona quiero mandar una foto en el chat ("combina este pantalón") para recibir combinaciones con lo que tengo.
- **Valor:** Caso de uso 3 [INV] §10.
- **RF:** RF-16
- **Prioridad:** P1
- **Versión:** MVP
- **Dependencias:** E5-H01, T-04
- **Complejidad:** M
- **Criterios de aceptación:**
  1. Puedo adjuntar una foto que se sube a `user-media/{user_id}/chat/` y viaja como `image_path` en `POST /api/chat`.
  2. La foto se ve en el historial y queda referenciada en `messages.parts`.
  3. Si la prenda de la foto no está en mi clóset, el agente lo dice y ofrece "Agregar a mi clóset" (no la agrega solo).
- **Estado:** Pendiente

- **ID:** E5-H09
- **Épica:** E5 Agente asesor
- **Feature:** F5.3 Foto en el chat
- **Historia:** Como persona quiero preguntar "¿este color me favorece?" con una foto para decidir con criterio.
- **Valor:** Caso de uso 7 [INV] §10; reutiliza la paleta.
- **RF:** RF-16
- **Prioridad:** P2
- **Versión:** MVP
- **Dependencias:** E5-H08, E3-H04
- **Complejidad:** S
- **Criterios de aceptación:**
  1. Con paleta activa, la respuesta compara el color de la foto con la paleta y explica el porqué.
  2. Sin paleta activa, el agente lo dice y ofrece crearla.
  3. La respuesta es orientación, no certeza.
- **Estado:** Pendiente

### E6 Outfits

#### Feature F6.1 Generación de outfit (SPEC-09)

- **ID:** E6-H01
- **Épica:** E6 Outfits
- **Feature:** F6.1 Generación de outfit
- **Historia:** Como persona quiero pedir un outfit para una ocasión y recibirlo armado con mis prendas y con la explicación de por qué funciona para decidir rápido qué ponerme.
- **Valor:** Unidad de valor (DP-02) y explicación obligatoria (DP-11).
- **RF:** RF-09
- **Prioridad:** P0
- **Versión:** MVP · hoy
- **Dependencias:** E5-H01, E4-H02, T-07
- **Complejidad:** L
- **Criterios de aceptación:**
  1. El agente usa `get_closet` y luego `propose_outfit` con prendas propias que cumplen la regla de composición de SPEC-09.
  2. El outfit se persiste en `outfits` + `outfit_items` con `status = 'proposed'` y llega como evento `outfit`.
  3. El `rationale` explica en lenguaje llano por qué funciona para la ocasión (SPEC-09 RN-09).
  4. Si `propose_outfit` devuelve error, el agente corrige y reintenta dentro del límite de 6 iteraciones.
  5. Se registra `outfit_proposed {occasion, items}`.
- **Estado:** Pendiente

- **ID:** E6-H02
- **Épica:** E6 Outfits
- **Feature:** F6.1 Generación de outfit
- **Historia:** Como persona con pocas prendas quiero que el asesor me diga qué me falta en vez de inventar un look para saber qué subir.
- **Valor:** Guardrail "no inventa prendas"; estrategia de pocas prendas (DP-06).
- **RF:** RF-09
- **Prioridad:** P0
- **Versión:** MVP · hoy
- **Dependencias:** E6-H01
- **Complejidad:** S
- **Criterios de aceptación:**
  1. Con menos de 3 prendas activas, el agente no llama a `propose_outfit` y responde según SPEC-09 RN-11.
  2. Si falta una categoría base para la ocasión, nombra la categoría que falta y ofrece agregarla (E4-H08).
  3. Ninguna respuesta menciona como propia una prenda que no esté en `get_closet`.
- **Estado:** Pendiente

- **ID:** E6-H07
- **Épica:** E6 Outfits
- **Feature:** F6.1 Generación de outfit
- **Historia:** Como persona quiero pedir "otra opción" para comparar antes de decidir.
- **Valor:** Reduce el abandono cuando la primera propuesta no convence [PS].
- **RF:** RF-09
- **Prioridad:** P2
- **Versión:** MVP
- **Dependencias:** E6-H01
- **Complejidad:** S
- **Criterios de aceptación:**
  1. La tarjeta tiene "Otra opción", que envía el mensaje de SPEC-09 RN-14.
  2. La nueva propuesta no repite exactamente el mismo conjunto de prendas, si el clóset lo permite.
- **Estado:** Pendiente

#### Feature F6.2 Tarjeta visual del outfit (SPEC-10)

- **ID:** E6-H03
- **Épica:** E6 Outfits
- **Feature:** F6.2 Tarjeta visual del outfit
- **Historia:** Como persona quiero ver el outfit como una composición con las fotos reales de mis prendas para imaginarlo puesto.
- **Valor:** Visualización del MVP sin try-on (DP-08).
- **RF:** RF-10
- **Prioridad:** P0
- **Versión:** MVP · hoy
- **Dependencias:** E6-H01, T-10
- **Complejidad:** M
- **Criterios de aceptación:**
  1. La tarjeta muestra título, ocasión, fotos de cada prenda en el orden de SPEC-10 RN-02, clima si existe, explicación y prenda faltante si existe.
  2. Las fotos usan URLs firmadas de corta duración; si una expira, la tarjeta la renueva al recargar.
  3. La misma tarjeta se usa en el chat, en el onboarding y en `/looks`.
- **Estado:** Pendiente

#### Feature F6.3 Guardar, descartar y feedback (SPEC-11)

- **ID:** E6-H04
- **Épica:** E6 Outfits
- **Feature:** F6.3 Guardar, descartar y feedback
- **Historia:** Como persona quiero guardar un outfit que me gustó para encontrarlo después en Looks.
- **Valor:** "Guardado" es parte de la definición de outfit útil (North Star).
- **RF:** RF-11
- **Prioridad:** P0
- **Versión:** MVP · hoy
- **Dependencias:** E6-H03
- **Complejidad:** S
- **Criterios de aceptación:**
  1. "Guardar" cambia `status` a `saved`, actualiza la tarjeta y registra `outfit_saved`.
  2. Guardar dos veces no duplica nada.
  3. El outfit aparece en `/looks`.
- **Estado:** Pendiente

- **ID:** E6-H05
- **Épica:** E6 Outfits
- **Feature:** F6.3 Guardar, descartar y feedback
- **Historia:** Como persona quiero descartar un outfit que no me sirve para que no ensucie mis looks.
- **Valor:** Señal negativa explícita; limpia el historial.
- **RF:** RF-11
- **Prioridad:** P1
- **Versión:** MVP · hoy
- **Dependencias:** E6-H03
- **Complejidad:** S
- **Criterios de aceptación:**
  1. "Descartar" cambia `status` a `discarded` y la tarjeta se colapsa con "Deshacer".
  2. Un outfit descartado no aparece en la vista "Guardados" de `/looks`.
- **Estado:** Pendiente

- **ID:** E6-H06
- **Épica:** E6 Outfits
- **Feature:** F6.3 Guardar, descartar y feedback
- **Historia:** Como persona quiero decir si un outfit me encantó, me sirve o no me gustó (y por qué) para que el asesor aprenda.
- **Valor:** Mitiga recomendaciones genéricas con feedback y memoria (DP-11, [INV] §14).
- **RF:** RF-11
- **Prioridad:** P0
- **Versión:** MVP · hoy
- **Dependencias:** E6-H03, E1-H07
- **Complejidad:** M
- **Criterios de aceptación:**
  1. La tarjeta ofrece "Me encanta", "Me sirve" y "No me gusta" (`love`, `ok`, `no`), uno por outfit y modificable.
  2. "No me gusta" pide un motivo con chips y texto opcional.
  3. El feedback se guarda en `outfit_feedback` y registra `outfit_feedback {rating}`.
  4. Según SPEC-11 RN-06, el feedback genera un hecho en `memory_facts` con `source = 'feedback'`, visible en `/yo`.
  5. En la siguiente propuesta para una ocasión equivalente el agente no repite el mismo conjunto marcado `no`.
- **Estado:** Pendiente

- **ID:** E6-H08
- **Épica:** E6 Outfits
- **Feature:** F6.3 Guardar, descartar y feedback
- **Historia:** Como persona quiero ver mis outfits guardados y el historial de propuestas en Looks para reutilizarlos.
- **Valor:** Reutilización y prueba de valor acumulado.
- **RF:** RF-11
- **Prioridad:** P1
- **Versión:** MVP · hoy
- **Dependencias:** E6-H04
- **Complejidad:** S
- **Criterios de aceptación:**
  1. `/looks` tiene "Guardados" (por defecto) e "Historial" (propuestos y guardados, sin descartados), más recientes primero.
  2. Cada ítem abre la tarjeta completa con su feedback.
  3. Estado vacío con acceso a `/asesor`.
- **Estado:** Pendiente

#### Feature F6.4 Visualización avanzada (V2–V3)

- **ID:** E6-H09
- **Épica:** E6 Outfits
- **Feature:** F6.4 Visualización avanzada
- **Historia:** Como persona quiero ver una imagen generada del look para imaginarlo mejor.
- **Valor:** Responde H-06; el try-on poco realista es riesgo crítico, por eso no es dependencia del MVP (DP-08).
- **RF:** RF-26
- **Prioridad:** P3
- **Versión:** V2
- **Dependencias:** E6-H03
- **Complejidad:** XL
- **Criterios de aceptación:**
  1. Se ofrece solo en categorías seleccionadas y como opción, nunca por defecto.
  2. Se mide si cambia el guardado o la intención de compra (H-06).
- **Estado:** Pendiente

- **ID:** E6-H10
- **Épica:** E6 Outfits
- **Feature:** F6.4 Visualización avanzada
- **Historia:** Como persona quiero un avatar parecido a mí que pruebe los looks para decidir sin vestirme.
- **Valor:** Visualización avanzada [INV] §13 V3.
- **RF:** RF-29
- **Prioridad:** P3
- **Versión:** V3
- **Dependencias:** E6-H09
- **Complejidad:** XL
- **Criterios de aceptación:**
  1. Requiere consentimiento específico y borrado del avatar.
  2. Cumple DP-12.
- **Estado:** Pendiente

### E7 Personal Shopper

#### Feature F7.1 Prenda faltante (SPEC-12)

- **ID:** E7-H01
- **Épica:** E7 Personal Shopper
- **Feature:** F7.1 Prenda faltante
- **Historia:** Como persona quiero que el outfit me diga qué prenda lo completaría o mejoraría y por qué para comprar con intención.
- **Valor:** Primer paso del Personal Shopper sin catálogos (DP-07).
- **RF:** RF-12
- **Prioridad:** P0
- **Versión:** MVP · hoy
- **Dependencias:** E6-H01, E6-H03
- **Complejidad:** M
- **Criterios de aceptación:**
  1. Cuando el agente detecta una prenda faltante, la envía en `missing_piece` con categoría, descripción y por qué; la tarjeta la muestra en un bloque propio.
  2. El bloque no contiene productos, marcas ni enlaces de compra en el MVP.
  3. Como máximo una prenda faltante por outfit.
  4. Si el outfit está completo y no hay mejora clara, no se muestra el bloque.
- **Estado:** Pendiente

- **ID:** E7-H02
- **Épica:** E7 Personal Shopper
- **Feature:** F7.1 Prenda faltante
- **Historia:** Como persona que ya tiene la prenda sugerida quiero decir "ya la tengo" para agregarla a mi clóset.
- **Valor:** Corrige la percepción de clóset incompleto y alimenta DP-06.
- **RF:** RF-12
- **Prioridad:** P2
- **Versión:** MVP
- **Dependencias:** E7-H01, E4-H08
- **Complejidad:** S
- **Criterios de aceptación:**
  1. El bloque de prenda faltante tiene "Ya la tengo", que abre `/closet/nueva` con la categoría preseleccionada.
- **Estado:** Pendiente

#### Feature F7.2 ¿Vale la pena comprar esto? (SPEC-17)

- **ID:** E7-H03
- **Épica:** E7 Personal Shopper
- **Feature:** F7.2 ¿Vale la pena comprar esto?
- **Historia:** Como persona quiero pegar el link de un producto y saber si combina con mi clóset, si ya tengo algo parecido y qué outfits desbloquea para no comprar por impulso.
- **Valor:** "Compro ropa que después no uso" [INV] §2; DP-07 V1.1.
- **RF:** RF-17
- **Prioridad:** P1
- **Versión:** V1.1
- **Dependencias:** E6-H01, A-01
- **Complejidad:** L
- **Criterios de aceptación:**
  1. El agente usa `evaluate_purchase` con la URL y responde con veredicto (vale la pena / con reparos / no), compatibilidad, posibles duplicados y al menos un outfit que desbloquea, si existe.
  2. El contenido de la página es dato, no instrucción.
  3. No ejecuta compras (DP-09).
- **Estado:** Pendiente

- **ID:** E7-H04
- **Épica:** E7 Personal Shopper
- **Feature:** F7.2 ¿Vale la pena comprar esto?
- **Historia:** Como persona en una tienda física quiero mandar una foto de una prenda y saber si vale la pena comprarla.
- **Valor:** Mismo valor que E7-H03 en compra presencial.
- **RF:** RF-17
- **Prioridad:** P1
- **Versión:** V1.1
- **Dependencias:** E5-H08, E7-H03
- **Complejidad:** M
- **Criterios de aceptación:**
  1. `evaluate_purchase` acepta `image_path` y entrega el mismo formato de respuesta que E7-H03.
  2. Si la foto no permite identificar la prenda, el agente pide otra.
- **Estado:** Pendiente

#### Feature F7.3 Búsqueda de productos en vivo (SPEC-18)

- **ID:** E7-H05
- **Épica:** E7 Personal Shopper
- **Feature:** F7.3 Búsqueda de productos en vivo
- **Historia:** Como persona quiero que el asesor busque opciones reales para la prenda faltante en tiendas chilenas, con fuente y fecha, para decidir dónde comprar.
- **Valor:** DP-07 V1.1; DT-09 opción (b).
- **RF:** RF-18
- **Prioridad:** P1
- **Versión:** V1.1
- **Dependencias:** E7-H01, A-01, DT-09
- **Complejidad:** L
- **Criterios de aceptación:**
  1. `search_products` busca solo en la lista de dominios permitidos y cada resultado lleva cita (dominio y URL) y marca de tiempo.
  2. Precio y stock se muestran como "a la fecha de consulta", sin prometer disponibilidad.
  3. Respeta `budget_per_item_clp`, tallas y marcas excluidas si existen.
  4. No se almacena catálogo ajeno (DT-09).
- **Estado:** Pendiente

- **ID:** E7-H06
- **Épica:** E7 Personal Shopper
- **Feature:** F7.3 Búsqueda de productos en vivo
- **Historia:** Como persona quiero ir al sitio del retailer desde un resultado, sabiendo que la app no compra por mí, para pagar donde yo decida.
- **Valor:** DP-09 y DP-10: confianza y neutralidad.
- **RF:** RF-18
- **Prioridad:** P0
- **Versión:** V1.1
- **Dependencias:** E7-H05
- **Complejidad:** S
- **Criterios de aceptación:**
  1. Cada resultado tiene "Ver en {dominio}", que abre el sitio del retailer en otra pestaña.
  2. No existe ningún botón de comprar, pagar ni agregar al carro en la app.
  3. Si un día existe afiliación, se muestra junto al producto (DP-10).
- **Estado:** Pendiente

#### Feature F7.4 Shopper avanzado (V2–V3)

- **ID:** E7-H07
- **Épica:** E7 Personal Shopper
- **Feature:** F7.4 Shopper avanzado
- **Historia:** Como persona quiero que me avisen antes de comprar algo casi igual a lo que tengo.
- **Valor:** Comprar con intención [INV] §15.
- **RF:** RF-22
- **Prioridad:** P2
- **Versión:** V2
- **Dependencias:** E4-H09, E7-H03
- **Complejidad:** M
- **Criterios de aceptación:**
  1. La evaluación de compra muestra las prendas similares del clóset con su foto.
- **Estado:** Pendiente

- **ID:** E7-H08
- **Épica:** E7 Personal Shopper
- **Feature:** F7.4 Shopper avanzado
- **Historia:** Como persona quiero comparar opciones de varios retailers con precio final, despacho y devoluciones para elegir la mejor.
- **Valor:** Diferenciador "precio final" [INV] §5.
- **RF:** RF-24
- **Prioridad:** P2
- **Versión:** V2
- **Dependencias:** H-05, DT-09 (c)
- **Complejidad:** XL
- **Criterios de aceptación:**
  1. Solo con feeds o acuerdos vigentes; el ranking no lo determina un acuerdo comercial (DP-10).
- **Estado:** Pendiente

- **ID:** E7-H09
- **Épica:** E7 Personal Shopper
- **Feature:** F7.4 Shopper avanzado
- **Historia:** Como persona quiero que el asesor prepare la compra dentro del chat y la ejecute solo cuando yo la autorice explícitamente.
- **Valor:** [INV] §11 y §13 V3.
- **RF:** RF-28
- **Prioridad:** P3
- **Versión:** V3
- **Dependencias:** E7-H08
- **Complejidad:** XL
- **Criterios de aceptación:**
  1. Ningún pago sin autorización explícita por transacción (DP-09); la app no guarda medios de pago salvo nueva decisión registrada.
- **Estado:** Pendiente

### E8 PWA y plataforma

#### Feature F8.1 PWA instalable (SPEC-14)

- **ID:** E8-H01
- **Épica:** E8 PWA y plataforma
- **Feature:** F8.1 PWA instalable
- **Historia:** Como persona quiero instalar la app en mi pantalla de inicio para abrirla como cualquier otra app.
- **Valor:** Canal del MVP (DP-03).
- **RF:** RF-14
- **Prioridad:** P0
- **Versión:** MVP · hoy
- **Dependencias:** T-11
- **Complejidad:** S
- **Criterios de aceptación:**
  1. La app cumple los requisitos de instalación de Chrome en Android (manifest válido + service worker).
  2. En iOS, `/yo` muestra instrucciones para "Agregar a pantalla de inicio".
  3. Abierta instalada, se ve sin barra del navegador y con el nombre "Estilo" (DP-15).
- **Estado:** Pendiente

- **ID:** E8-H02
- **Épica:** E8 PWA y plataforma
- **Feature:** F8.1 PWA instalable
- **Historia:** Como persona quiero moverme con una barra inferior de 4 pestañas para llegar a todo con el pulgar.
- **Valor:** Arquitectura de información del kernel (Asesor, Clóset, Looks, Yo).
- **RF:** RF-14
- **Prioridad:** P0
- **Versión:** MVP · hoy
- **Dependencias:** T-15
- **Complejidad:** S
- **Criterios de aceptación:**
  1. La barra muestra Asesor, Clóset, Looks y Yo, marca la activa y no aparece en `/`, `/entrar` ni `/bienvenida`.
  2. Cada pestaña tiene etiqueta de texto y área táctil de al menos 44 × 44 px.
- **Estado:** Pendiente

- **ID:** E8-H03
- **Épica:** E8 PWA y plataforma
- **Feature:** F8.1 PWA instalable
- **Historia:** Como persona sin conexión quiero ver un aviso claro en vez de una pantalla rota.
- **Valor:** DT-10 (sin datos offline): al menos fallar con dignidad.
- **RF:** RF-14
- **Prioridad:** P2
- **Versión:** MVP
- **Dependencias:** E8-H01
- **Complejidad:** S
- **Criterios de aceptación:**
  1. Sin conexión, el shell cacheado muestra el mensaje de SPEC-14 y un botón "Reintentar".
- **Estado:** Pendiente

#### Feature F8.2 Medición de producto (SPEC-15)

- **ID:** E8-H04
- **Épica:** E8 PWA y plataforma
- **Feature:** F8.2 Medición de producto
- **Historia:** Como dueño de producto quiero registrar los eventos de activación y North Star desde el día 1 para decidir con datos.
- **Valor:** Mentalidad "medible"; S-03, H-01, H-02 necesitan datos del piloto.
- **RF:** RF-15
- **Prioridad:** P0
- **Versión:** MVP · hoy
- **Dependencias:** T-12
- **Complejidad:** S
- **Criterios de aceptación:**
  1. Todos los eventos de la lista del kernel se registran en `analytics_events` desde el servidor, con los `props` definidos y sin datos personales en `props`.
  2. Un test verifica que cada flujo emite su evento una vez.
  3. Un evento que falla al registrarse no rompe el flujo de la persona.
- **Estado:** Pendiente

- **ID:** E8-H05
- **Épica:** E8 PWA y plataforma
- **Feature:** F8.2 Medición de producto
- **Historia:** Como dueño de producto quiero registrar el uso de tokens por llamada de IA para conocer el costo por persona activa.
- **Valor:** Valida S-04 y alimenta A-03.
- **RF:** RF-15
- **Prioridad:** P0
- **Versión:** MVP · hoy
- **Dependencias:** T-06, T-07, T-12
- **Complejidad:** S
- **Criterios de aceptación:**
  1. Cada llamada a IA (chat, prenda, paleta) registra `ai_usage {route, model, input_tokens, output_tokens}`.
  2. En `AI_MODE=mock` el evento se registra con el modelo `mock`.
- **Estado:** Pendiente

- **ID:** E8-H06
- **Épica:** E8 PWA y plataforma
- **Feature:** F8.2 Medición de producto
- **Historia:** Como dueño de producto quiero una consulta guardada de la North Star y la activación para revisarlas cada semana.
- **Valor:** Convierte eventos en decisión.
- **RF:** RF-15
- **Prioridad:** P2
- **Versión:** MVP
- **Dependencias:** E8-H04
- **Complejidad:** S
- **Criterios de aceptación:**
  1. Existe una consulta SQL versionada que entrega outfits útiles por persona activa por semana y la tasa de activación según las definiciones del kernel.
- **Estado:** Pendiente

#### Feature F8.3 Monetización (V2)

- **ID:** E8-H07
- **Épica:** E8 PWA y plataforma
- **Feature:** F8.3 Monetización
- **Historia:** Como persona quiero una suscripción premium con funciones avanzadas si me entregan más valor.
- **Valor:** DP-14; responde H-04.
- **RF:** RF-27
- **Prioridad:** P2
- **Versión:** V2
- **Dependencias:** H-04
- **Complejidad:** XL
- **Criterios de aceptación:**
  1. No se lanza sin evidencia de H-04 (puerta falsa en V1.1 o entrevistas).
- **Estado:** Pendiente

### E9 Hábito y planificación (V2)

- **ID:** E9-H01
- **Épica:** E9 Hábito y planificación
- **Feature:** F9.1 Planificación
- **Historia:** Como persona quiero planificar mis outfits de la semana para no decidir cada mañana.
- **Valor:** Convierte utilidad puntual en hábito [INV] §13 V2.
- **RF:** RF-20
- **Prioridad:** P2
- **Versión:** V2
- **Dependencias:** E6-H04, E5-H06
- **Complejidad:** L
- **Criterios de aceptación:**
  1. Propone un outfit por día con clima y sin repetir prendas clave en días seguidos, salvo que la persona lo pida.
- **Estado:** Pendiente

- **ID:** E9-H02
- **Épica:** E9 Hábito y planificación
- **Feature:** F9.1 Planificación
- **Historia:** Como persona que viaja quiero outfits y una lista de equipaje según destino, días y actividades.
- **Valor:** Caso de uso 8 [INV] §10.
- **RF:** RF-20
- **Prioridad:** P2
- **Versión:** V2
- **Dependencias:** E9-H01
- **Complejidad:** L
- **Criterios de aceptación:**
  1. Usa el clima del destino, no el de la ciudad del perfil; maximiza combinaciones con pocas prendas.
- **Estado:** Pendiente

- **ID:** E9-H03
- **Épica:** E9 Hábito y planificación
- **Feature:** F9.2 Uso del clóset
- **Historia:** Como persona quiero registrar qué me puse y ver prendas sin uso y su costo por uso para comprar mejor.
- **Valor:** "Compro ropa que después no uso" [INV] §2.
- **RF:** RF-21
- **Prioridad:** P2
- **Versión:** V2
- **Dependencias:** E6-H04
- **Complejidad:** M
- **Criterios de aceptación:**
  1. Registrar uso es un toque desde un outfit guardado; el costo por uso solo se calcula si la persona ingresó el precio.
- **Estado:** Pendiente

### E10 Canales y expansión (V2–V3)

- **ID:** E10-H01
- **Épica:** E10 Canales y expansión
- **Feature:** F10.1 WhatsApp
- **Historia:** Como persona quiero hablar con el mismo asesor por WhatsApp para pedir un outfit sin abrir la app.
- **Valor:** Responde H-07; DP-03 lo deja para V2.
- **RF:** RF-25
- **Prioridad:** P1
- **Versión:** V2
- **Dependencias:** E5-H01
- **Complejidad:** XL
- **Criterios de aceptación:**
  1. Mismo agente y memoria; la API del agente no conoce el canal (DP-03).
  2. Clóset, paleta y privacidad se gestionan en la PWA.
- **Estado:** Pendiente

- **ID:** E10-H02
- **Épica:** E10 Canales y expansión
- **Feature:** F10.2 Expansión LatAm
- **Historia:** Como persona en otro país de LatAm quiero usar el asesor con mi moneda y mis retailers.
- **Valor:** [INV] §13 V3.
- **RF:** RF-30
- **Prioridad:** P3
- **Versión:** V3
- **Dependencias:** E7-H08
- **Complejidad:** XL
- **Criterios de aceptación:**
  1. Moneda, retailers y regulación de datos por país revisados antes de abrir cada país.
- **Estado:** Pendiente

- **ID:** E10-H03
- **Épica:** E10 Canales y expansión
- **Feature:** F10.3 B2B2C
- **Historia:** Como retailer quiero ofrecer el asesor a mis clientes conectado a mi catálogo.
- **Valor:** Segunda línea de negocio [INV] §9.
- **RF:** RF-31
- **Prioridad:** P3
- **Versión:** V3
- **Dependencias:** E7-H08
- **Complejidad:** XL
- **Criterios de aceptación:**
  1. La neutralidad comercial (DP-10) se mantiene visible para la persona usuaria.
- **Estado:** Pendiente

### 3.1 Conteo de historias

| Versión | Historias | De ellas, `hoy` |
|---|---|---|
| MVP | 55 | 39 |
| V1.1 | 5 | 0 |
| V2 | 11 | 0 |
| V3 | 4 | 0 |
| **Total** | **75** | **39** |

---

## 4. Tareas técnicas habilitadoras

El detalle técnico vive en `TECHNICAL_ARCHITECTURE.md` y `AGENT_ARCHITECTURE.md`; aquí solo su lugar en el backlog.

| ID | Tarea | Habilita | Depende de | Versión |
|---|---|---|---|---|
| T-01 | Aplicar `20261114000000_esquema_inicial.sql` en Supabase (lo hace Felipe, DT-14) y generar tipos TypeScript | Todas las historias con datos | — | MVP · hoy |
| T-02 | Clientes Supabase de servidor y navegador con `@supabase/ssr`; Server Actions de auth | E1-H01, E1-H02, E1-H03 | T-01 | MVP · hoy |
| T-03 | Protección de rutas en `src/proxy.ts` según la tabla de rutas del kernel, con redirección a onboarding | E1-H02, todas las rutas "sesión" | T-02 | MVP · hoy |
| T-04 | Utilidad de compresión en cliente (≤ 1280 px, JPEG, sin EXIF), subida a `user-media` y verificación de prefijo `user_id` en servidor | E3-H01, E4-H01, E5-H08 | T-01 | MVP · hoy |
| T-05 | Modo IA simulada `AI_MODE=mock` para `describeGarment`, `analyzeColor` y el orquestador, con fixtures deterministas | Todas las historias con IA; T-13 | — | MVP · hoy |
| T-06 | Cliente `@anthropic-ai/sdk` en servidor y funciones `describeGarment` / `analyzeColor` con salida estructurada | E3-H01, E4-H02 | T-05 | MVP · hoy |
| T-07 | Orquestador del agente: bucle de herramientas (máx. 6), SSE con los eventos del kernel, persistencia de `messages` | E5-H01, E6-H01 | T-05, T-08 | MVP · hoy |
| T-08 | Constructor de `<contexto_persona>` (perfil, paleta, memoria, resumen del clóset, fecha, ciudad) | E5-H02 | T-01 | MVP · hoy |
| T-09 | Cliente Open-Meteo por ciudad del perfil (geocodificación + pronóstico ≤ 7 días) | E5-H06, E5-H07 | — | MVP · hoy |
| T-10 | Generación de URLs firmadas de corta duración y armado del DTO de outfit | E4-H04, E6-H03 | T-01 | MVP · hoy |
| T-11 | `manifest` + service worker mínimo (shell cacheado, página sin conexión) | E8-H01, E8-H03 | — | MVP · hoy |
| T-12 | Helper de registro de eventos en servidor que no rompe el flujo si falla | E8-H04, E8-H05 | T-01 | MVP · hoy |
| T-13 | CI: lint, typecheck y Vitest con `AI_MODE=mock` en cada PR | NFR-13 | T-05 | MVP · hoy |
| T-14 | Esquemas zod compartidos (perfil, prenda, feedback, entradas de endpoints) | E2-H02, E2-H07, E4-H02, E6-H06 | — | MVP · hoy |
| T-15 | Base visual y navegación según `UX_UI_SPEC.md` / `DESIGN.MD` | E2-H01, E8-H02 | — | MVP · hoy |
| T-16 | Borrado de todos los objetos bajo `user-media/{user_id}/` (listar por carpeta y borrar en lotes, idempotente) | E1-H08 | T-04 | MVP · hoy |
| T-17 | Set de evals del agente (composición, guardrails, faltantes, memoria) definido en `AGENT_ARCHITECTURE.md` | E5-H10, E6-H01, E6-H02 | T-07 | MVP |
| T-18 | Set de evaluación de reconocimiento de prendas (50 fotos etiquetadas, S-01) y de paleta (S-02) | E4-H02, E3-H01 (validación) | T-06 | MVP |
| T-19 | SMTP propio (Resend) para Supabase Auth | E1-H09 | A-04 | V1.1 |
| T-20 | Lista de dominios chilenos permitidos y herramienta `search_products` / `evaluate_purchase` | E7-H03, E7-H05 | A-01 | V1.1 |

---

## 5. Requerimientos no funcionales como ítems de backlog

Los umbrales numéricos marcados "propuesta inicial" son [PS] y se calibran con datos del piloto; no son compromisos.
La definición de NFR del producto es del DTR; aquí se vuelven ítems verificables.

| ID | Requerimiento | Criterio verificable | Prioridad | Versión |
|---|---|---|---|---|
| NFR-01 | Rendimiento del chat | Se mide el tiempo desde el envío hasta el primer `text_delta` o `tool` en cada turno. Propuesta inicial a calibrar: el indicador de actividad aparece en < 1 s y el primer evento llega en < 3 s en p75 con `STYLIST_EFFORT=low`. | P1 | MVP |
| NFR-02 | Rendimiento del alta de prenda | Se mide la duración de `POST /api/garments`. Propuesta inicial a calibrar: p75 < 8 s; la UI siempre muestra estado de carga y nunca queda sin salida. | P1 | MVP |
| NFR-03 | Mobile-first | Todas las rutas son usables a 360 px de ancho sin scroll horizontal; las imágenes subidas no superan 1280 px de lado mayor (verificable en Storage). | P0 | MVP · hoy |
| NFR-04 | Accesibilidad AA | Las pantallas del flujo de hoy cumplen WCAG 2.2 AA: contraste de texto, foco visible, etiquetas en controles, áreas táctiles ≥ 44 px, texto alternativo en fotos de prendas (nombre de la prenda) y colores de paleta con nombre en texto. Revisión con `design:accessibility-review` o equivalente. | P1 | MVP |
| NFR-05 | Seguridad de datos (RLS) | Test automatizado: con dos cuentas, la cuenta B no puede leer, editar ni borrar filas ni objetos de Storage de la cuenta A en ninguna tabla del esquema. Sin uso de service role (DT-02). | P0 | MVP · hoy |
| NFR-06 | Seguridad de endpoints | Los tres endpoints responden 401 sin sesión, 400 con entrada inválida según zod, y rechazan un `photo_path`/`image_path` que no empiece con el `user_id` de la sesión. Test por caso. | P0 | MVP · hoy |
| NFR-07 | Privacidad de fotos | Bucket `user-media` privado; toda foto se sirve con URL firmada de corta duración; ninguna foto subida conserva EXIF (test sobre una imagen con GPS). | P0 | MVP · hoy |
| NFR-08 | Minimización de datos | No se pide geolocalización (DT-11), medidas ni peso (DP-12); los `props` de `analytics_events` no contienen texto libre de la persona, nombres, emails ni rutas de fotos (revisión de código + test). | P0 | MVP |
| NFR-09 | Resistencia a inyección de prompt | Casos de eval con instrucciones incrustadas en texto, foto de prenda y (V1.1) página web: el agente no cambia su comportamiento ni ejecuta herramientas no pedidas. | P0 | MVP |
| NFR-10 | Observabilidad | Todo error de servidor en rutas de IA queda registrado con ruta, `user_id` seudonimizado y causa; el evento `error` de SSE nunca expone detalles internos. `ai_usage` se registra en el 100% de las llamadas (verificable contra conteo de turnos). | P1 | MVP |
| NFR-11 | Costo de IA | `ai_usage` por llamada; tope de 6 iteraciones por turno (test); prompt de sistema estático y cacheable. Propuesta inicial: definir con A-03 un tope de gasto mensual y un límite de mensajes por persona por día antes de abrir a testers externos. | P0 | MVP |
| NFR-12 | Idioma y tono | Toda la UI y las respuestas del agente en español de Chile, tuteo, sin emoji; ningún texto usa "defecto", "corregir tu cuerpo" ni "tipo de cuerpo ideal" (DP-12). Verificable con evals y búsqueda en el código. | P0 | MVP · hoy |
| NFR-13 | Reproducibilidad | Con `AI_MODE=mock` toda la suite corre sin `ANTHROPIC_API_KEY` y da el mismo resultado en dos ejecuciones seguidas (DT-13). | P0 | MVP · hoy |
| NFR-14 | Degradación controlada | Si la API de IA o Open-Meteo fallan, la persona ve un mensaje de SPEC-08/SPEC-13 y puede reintentar o completar a mano; ningún flujo queda en una pantalla en blanco. | P1 | MVP |

---

## 6. Trazabilidad RF → historias

| RF | Historias | Spec |
|---|---|---|
| RF-01 | E1-H01, E1-H02, E1-H03 | SPEC-01 |
| RF-02 | E1-H04, E1-H05, E1-H06, E1-H07, E1-H08 | SPEC-02 |
| RF-03 | E2-H01, E2-H02, E2-H03, E2-H04, E2-H05 | SPEC-03 |
| RF-04 | E2-H06, E2-H07, E2-H08 | SPEC-04 |
| RF-05 | E3-H01, E3-H02, E3-H03, E3-H04, E3-H05 | SPEC-05 |
| RF-06 | E4-H01, E4-H02, E4-H03, E4-H08, E4-H10 | SPEC-06 |
| RF-07 | E4-H04, E4-H05, E4-H06, E4-H07 | SPEC-07 |
| RF-08 | E5-H01, E5-H02, E5-H03, E5-H04, E5-H05, E5-H10 | SPEC-08 |
| RF-09 | E6-H01, E6-H02, E6-H07 | SPEC-09 |
| RF-10 | E6-H03 | SPEC-10 |
| RF-11 | E6-H04, E6-H05, E6-H06, E6-H08 | SPEC-11 |
| RF-12 | E7-H01, E7-H02 | SPEC-12 |
| RF-13 | E5-H06, E5-H07 | SPEC-13 |
| RF-14 | E8-H01, E8-H02, E8-H03 | SPEC-14 |
| RF-15 | E8-H04, E8-H05, E8-H06 | SPEC-15 |
| RF-16 | E5-H08, E5-H09 | SPEC-16 |
| RF-17 | E7-H03, E7-H04 | SPEC-17 |
| RF-18 | E7-H05, E7-H06 | SPEC-18 |
| RF-19 | E1-H09 | SPEC-19 |
| RF-20 | E9-H01, E9-H02 | — (V2) |
| RF-21 | E9-H03 | — (V2) |
| RF-22 | E4-H09, E7-H07 | — (V2) |
| RF-23 | E3-H06 | — (V2) |
| RF-24 | E7-H08 | — (V2) |
| RF-25 | E10-H01 | — (V2) |
| RF-26 | E6-H09 | — (V2) |
| RF-27 | E8-H07 | — (V2) |
| RF-28 | E7-H09 | — (V3) |
| RF-29 | E6-H10 | — (V3) |
| RF-30 | E10-H02 | — (V3) |
| RF-31 | E10-H03 | — (V3) |

---

## 7. Orden de ejecución sugerido

Secuencia por dependencias, sin fechas. Cada bloque puede empezar cuando el anterior deja listas sus dependencias;
dentro de un bloque las historias son paralelizables sobre archivos disjuntos.

1. **Cimientos (hoy):** T-01 → T-02 → T-03; en paralelo T-05, T-14, T-15, T-11, T-12, T-13.
2. **Acceso (hoy):** E1-H01, E1-H02, E2-H01, E8-H02, E8-H01.
3. **Fotos e IA de una llamada (hoy):** T-04, T-06, T-10 → E4-H01 → E4-H02 → E4-H03 → E4-H04 → E4-H05.
4. **Onboarding y paleta (hoy):** E2-H02 → E2-H03 → E3-H01 → E3-H02 → E3-H03 → E3-H04; E2-H06 → E2-H07.
5. **Agente y outfit (hoy):** T-08, T-09 → T-07 → E5-H01 → E5-H02 → E6-H01 → E6-H02 → E6-H03 → E7-H01 → E5-H06 → E3-H05 → E2-H05.
6. **Cierre del loop (hoy):** E6-H04 → E6-H05 → E6-H06 → E5-H03 → E1-H07 → E6-H08 → E5-H04 → E5-H05 → E5-H10.
7. **Privacidad y medición (hoy):** T-16 → E1-H08; E8-H04, E8-H05.
8. **Resto del MVP:** E1-H04 → E1-H05 → E1-H06 (antes de cualquier tester externo, A-02); E1-H03; E2-H04; E4-H06, E4-H07, E4-H08, E7-H02; E5-H07; E5-H08 → E5-H09; E6-H07; E2-H08; E8-H03; E8-H06; T-17, T-18; NFR pendientes.
9. **V1.1 (requiere A-01):** T-19 → E1-H09; T-20 → E7-H03 → E7-H04 → E7-H05 → E7-H06.
10. **V2 y V3:** partir cada historia XL antes de priorizarla, con las hipótesis H-01…H-07 como gatillo.

---

## 8. Campos para La Torre

Mapeo para generar `.torre/plan.yaml` cuando se instale La Torre (DT-16).

| Campo de `plan.yaml` | Origen en este backlog |
|---|---|
| `id` | ID de la historia (`E4-H03`), de la tarea (`T-07`) o del NFR (`NFR-05`) |
| `objetivo` | Campo "Historia" (o descripción de la tarea / requerimiento) |
| `prioridad` | Campo "Prioridad" (P0–P3) |
| `área` | Épica (`E4`); para `T-xx` y `NFR-xx`, la épica principal que habilitan o `plataforma` |
| `spec` | Sección de `FUNCTIONAL_SPECS.md` según la tabla de trazabilidad (`SPEC-06`) |

---

## 9. Observaciones para el integrador

Los vacíos y contradicciones detectados al escribir este backlog están consolidados, con ID, en la sección final de
`FUNCTIONAL_SPECS.md` ("Observaciones para el integrador", OBS-01 en adelante), para no duplicarlos.
