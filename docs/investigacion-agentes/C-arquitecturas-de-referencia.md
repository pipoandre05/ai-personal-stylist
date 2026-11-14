# C — Arquitecturas de referencia

> Parte de la base de conocimiento `docs/investigacion-agentes/`. Investigación, no especificación.
> Los diagramas son síntesis **[REC]** de esta investigación a partir de los patrones documentados en `A1`, `A2`, `A3` y `B`; las fuentes de cada patrón están en esos documentos. Las tres arquitecturas candidatas de la sección 5 son **hipótesis**, no decisiones.
> Convención visual: rectángulo = código determinista · rectángulo redondeado = llamada al modelo o agente · rombo = decisión · cilindro = estado persistido · hexágono = punto de aprobación humana.

## 1. Patrones principales

### 1.1 Prompt chaining

```mermaid
flowchart LR
    I[Entrada] --> P1("Paso 1: modelo")
    P1 --> G1{"Compuerta en código"}
    G1 -- pasa --> P2("Paso 2: modelo")
    G1 -- falla --> X[Salida temprana con motivo]
    P2 --> G2{"Compuerta en código"}
    G2 -- pasa --> O[Salida]
    G2 -- falla --> X
```

El orden lo fija el programa. Las compuertas son el mecanismo de control: validan antes de gastar el paso siguiente.

### 1.2 Router

```mermaid
flowchart TD
    I[Entrada] --> R("Clasificador: salida estructurada")
    R --> D{"Ruta"}
    D -- prenda propia --> A["Flujo: alta de prenda"]
    D -- selfie --> B["Flujo: paleta"]
    D -- algo por comprar --> C["Flujo: evaluar compra"]
    D -- ambigua o baja confianza --> Q("Preguntar a la persona")
```

Mecanismo de control: la ruta es un valor de un conjunto cerrado; la rama por defecto es preguntar, nunca adivinar.

### 1.3 Paralelización y map-reduce

```mermaid
flowchart LR
    I[Encargo] --> F["Dividir en N ítems (código)"]
    F --> W1("Worker 1")
    F --> W2("Worker 2")
    F --> W3("Worker N")
    W1 --> R["Reducir en código: validar, deduplicar, ordenar"]
    W2 --> R
    W3 --> R
    R --> O[Resultado único]
```

Mecanismo de control: cada worker tiene su propio tope y su propio fallo; la reducción tolera resultados faltantes y no comparte estado mutable entre ramas.

### 1.4 Orchestrator-workers y supervisor

```mermaid
flowchart TD
    P[Persona] <--> S("Agente principal: conserva la conversación")
    S -- "encargo: objetivo, formato, límites" --> W1("Subagente A: contexto limpio")
    S -- encargo --> W2("Subagente B: contexto limpio")
    W1 -- "resumen estrecho + referencia" --> S
    W2 -- "resumen estrecho + referencia" --> S
    W1 --> ST[("Artefactos")]
    W2 --> ST
    S --> ST
```

Solo el agente principal habla con la persona. El subagente recibe **solo** el encargo y devuelve **solo** un resumen; lo voluminoso queda en artefactos. En *orchestrator-workers* las subtareas se deciden dinámicamente; en *supervisor* los especialistas son fijos.

### 1.5 Handoff

```mermaid
sequenceDiagram
    participant P as Persona
    participant T as Agente de triage
    participant E as Agente especialista
    P->>T: mensaje
    T->>T: decide transferir
    T-->>E: transfer_to_especialista (historia filtrada)
    E->>P: responde directo
    P->>E: siguiente mensaje
    Note over T,E: el control del turno cambió de dueño
```

Diferencia clave con 1.4: aquí el especialista responde a la persona y se queda con el turno.

### 1.6 Planner / Executor con replanificación

```mermaid
flowchart TD
    I[Pedido] --> PL("Planificador: plan completo")
    PL --> V{"Validar plan en código"}
    V -- inválido --> PL
    V -- válido --> E["Ejecutar paso k"]
    E --> C{"¿Quedan pasos?"}
    C -- sí --> E
    C -- no --> R{"¿Objetivo cumplido?"}
    R -- sí --> O[Respuesta]
    R -- "no, quedan replanes" --> PL
    R -- "no, sin replanes" --> D[Entregar lo logrado y decir qué falta]
```

Mecanismos de control: validación del plan antes de ejecutar, y tope de replanificaciones.

### 1.7 Evaluator-optimizer

```mermaid
flowchart LR
    I[Pedido] --> G("Generador")
    G --> E{"Evaluador: criterio explícito"}
    E -- aprueba --> O[Salida]
    E -- "rechaza con motivo, quedan intentos" --> G
    E -- "rechaza, sin intentos" --> F[Mejor intento con advertencia, o escalar]
```

El evaluador puede ser código (preferido cuando hay regla), un modelo, o una persona. Sin una señal externa al generador, el loop no mejora (`B` §3.11).

### 1.8 Tool loop (ReAct)

```mermaid
flowchart TD
    I[Mensaje] --> M("Modelo: razona y decide")
    M --> S{"¿Pide herramienta?"}
    S -- no --> O[Respuesta]
    S -- sí --> T["Ejecutar herramienta"]
    T --> OB["Observación: resultado o error"]
    OB --> L{"¿Tope alcanzado?"}
    L -- no --> M
    L -- sí --> C("Cierre forzado sin herramientas")
    C --> O
```

Es el loop actual de `runStylistTurn()`. La sección 2 muestra lo que lo rodea.

## 2. Anatomía de un harness

```mermaid
flowchart TB
    subgraph ENT["Entrada"]
        IN[Mensaje y foto] --> GI{"Guardrails de entrada"}
    end
    subgraph CTX["Contexto"]
        SYS["Prompt estático"]
        EST["Estado de la persona"]
        HIS["Historial acotado"]
        SK["Skills a demanda"]
    end
    subgraph LOOP["Loop del agente"]
        MOD("Modelo")
        POL{"Política por herramienta: allow / ask / deny"}
        TOOLS["Herramientas"]
        VAL["Validadores de dominio"]
        BUD["Presupuestos: pasos, tokens, costo, tiempo"]
        REP["Detector de repetición"]
    end
    subgraph CTRL["Control"]
        APR{{"Compuerta de aprobación"}}
        ERR["Manejo de errores y degradación"]
    end
    subgraph PERS["Persistencia"]
        CK[("Estado del turno y checkpoints")]
        MEM[("Memoria")]
        NEG[("Datos de negocio")]
    end
    subgraph OBS["Observabilidad"]
        TR["Trazas por paso"]
        EV["Evals: código y juez"]
    end
    GI --> CTX --> MOD
    MOD --> POL
    POL -- allow --> TOOLS
    POL -- ask --> APR
    POL -- deny --> ERR
    APR -- aprobada --> TOOLS
    APR -- rechazada --> ERR
    TOOLS --> VAL --> MOD
    BUD -.-> MOD
    REP -.-> MOD
    ERR --> MOD
    TOOLS --> NEG
    TOOLS --> MEM
    LOOP --> CK
    APR --> CK
    LOOP --> TR --> EV
    MOD --> GO{"Guardrails de salida"} --> OUT[Respuesta y tarjetas]
```

Cada caja corresponde a un componente de la tabla de `A2` §11.

## 3. Ciclo de ejecución con salidas y reintentos

```mermaid
stateDiagram-v2
    [*] --> Preparando
    Preparando --> LlamandoModelo: contexto armado
    LlamandoModelo --> EjecutandoHerramientas: pide herramientas
    LlamandoModelo --> Verificando: respuesta final
    LlamandoModelo --> Degradando: rechazo, corte por tokens o error de API
    EjecutandoHerramientas --> LlamandoModelo: resultados o errores accionables
    EjecutandoHerramientas --> EsperandoAprobacion: herramienta con política ask
    EjecutandoHerramientas --> Degradando: tope de pasos, costo, tiempo o repetición
    EjecutandoHerramientas --> Degradando: errores consecutivos sobre el umbral
    EsperandoAprobacion --> EjecutandoHerramientas: aprobada
    EsperandoAprobacion --> LlamandoModelo: rechazada, con motivo
    EsperandoAprobacion --> Expirado: sin respuesta
    Verificando --> Completado: pasa
    Verificando --> LlamandoModelo: falla y queda un reintento
    Verificando --> Degradando: falla sin reintentos
    Degradando --> Completado: cierre honesto con lo logrado
    Expirado --> [*]
    Completado --> [*]
```

Lectura: todo camino termina en `Completado` o `Expirado`; no existe un estado sin salida. `Degradando` no es un error visible para la persona: es una respuesta honesta con lo que se logró y lo que faltó. Cada transición es un punto natural de checkpoint y de registro en la traza.

Motivos de término que conviene registrar: `normal`, `tope_pasos`, `tope_costo`, `tope_tiempo`, `repeticion`, `errores_consecutivos`, `rechazo_modelo`, `corte_tokens`, `aprobacion_rechazada`, `aprobacion_expirada`, `error_api`.

## 4. Human-in-the-loop con checkpoint

```mermaid
sequenceDiagram
    autonumber
    participant P as Persona
    participant U as Interfaz
    participant H as Harness
    participant M as Modelo
    participant D as Estado persistido
    participant X as Sistema externo

    P->>U: "quiero comprar el blazer"
    U->>H: turno
    H->>M: contexto + herramientas
    M-->>H: pide ir_a_tienda(producto)
    H->>H: política de la herramienta = ask
    H->>X: verificar producto, precio y enlace
    X-->>H: datos vigentes
    H->>D: guardar checkpoint: estado + acción pendiente + versión
    H-->>U: tarjeta de aprobación con datos del servidor
    Note over H,D: la función termina. No hay proceso esperando.
    P->>U: aprueba
    U->>H: decisión + identificador de la solicitud
    H->>H: autenticar sesión y consumir la solicitud una sola vez
    H->>D: cargar checkpoint
    H->>X: ejecutar con clave de idempotencia
    X-->>H: resultado
    H->>M: resultado de la herramienta
    M-->>H: respuesta final
    H->>D: persistir y cerrar
    H-->>U: respuesta
```

Puntos de control: (5) la política vive en código, no en el prompt; (6) la tarjeta muestra datos leídos por el servidor, no texto del modelo; (8) el estado incluye la versión del código; (12) se autentica a quien aprueba y la solicitud se consume de forma atómica; (14) la acción lleva clave de idempotencia. Si la persona rechaza, el modelo recibe el rechazo como resultado de la herramienta y sigue conversando. Si nadie responde, la solicitud expira.

## 5. Arquitecturas candidatas para el producto

Tres candidatas dibujadas con los mismos elementos para compararlas. Todas comparten los datos (Supabase con RLS), las funciones de visión y el validador de outfit.

### 5.1 Candidata A — Agente único con harness reforzado

```mermaid
flowchart TB
    P[Persona] <--> AS("Asesor: tool loop único")
    subgraph H["Harness"]
        AS --> POL{"Política por herramienta"}
        POL --> LEC["Lectura: clóset, clima"]
        POL --> ESC["Escritura: perfil, memoria, outfit"]
        POL --> VIS["Visión: prenda, paleta"]
        POL --> SHOP["Shopper: evaluar compra, buscar productos"]
        POL --> APR{{"Aprobación"}}
        ESC --> VAL["Validador de outfit"]
    end
    SHOP --> WEB[(Web de tiendas)]
    LEC --> DB[("Supabase")]
    ESC --> DB
    VIS --> DB
    H --> CK[("Estado del turno")]
    H --> TR["Trazas y evals"]
```

Todo sigue en un loop. Lo nuevo respecto de hoy es el harness: política, aprobación, estado del turno, presupuestos, detector de repetición, trazas y evals. El shopper son herramientas del mismo agente (como define DP-18).

### 5.2 Candidata B — Agente único + flujos deterministas + buscador aislado

```mermaid
flowchart TB
    P[Persona] <--> AS("Asesor: tool loop con skills")
    subgraph H["Harness"]
        AS --> POL{"Política por herramienta"}
        POL --> LEC["Lectura: clóset, clima"]
        POL --> ESC["Escritura: perfil, memoria, outfit"]
        ESC --> VAL["Validador de outfit"]
        POL --> APR{{"Aprobación"}}
        POL --> F1["Flujo fijo: alta de prenda"]
        POL --> F2["Flujo fijo: paleta con consentimiento"]
        POL --> F3["Flujo fijo: evaluar compra"]
        POL --> BUS("Buscador: subagente aislado")
    end
    F1 --> VIS("Visión: una llamada")
    F2 --> VIS
    F3 --> LEC2("Lector de página: sin herramientas ni datos de la persona")
    BUS --> LEC2
    LEC2 --> WEB[(Web de tiendas)]
    BUS -- "fichas estructuradas y verificadas" --> AS
    F3 -- "veredicto estructurado" --> AS
    LEC --> DB[("Supabase")]
    ESC --> DB
    F1 --> DB
    F2 --> DB
    H --> CK[("Estado del turno")]
    H --> TR["Trazas y evals"]
    DB -.-> CON["Consolidación de memoria: proceso fuera de línea"]
```

Un solo asesor que conversa y compone. Los procesos con pasos conocidos salen del loop y se vuelven flujos fijos que el asesor invoca como una herramienta. Lo que lee la web queda aislado: sin datos de la persona y sin herramientas de escritura. Es la candidata A más tres separaciones.

### 5.3 Candidata C — Supervisor con especialistas

```mermaid
flowchart TB
    P[Persona] <--> SUP("Supervisor: conversa y sintetiza")
    subgraph H["Harness"]
        SUP --> E1("Especialista: estilo y outfits")
        SUP --> E2("Especialista: color")
        SUP --> E3("Especialista: clóset")
        SUP --> E4("Especialista: shopper")
        SUP --> E5("Especialista: perfil y memoria")
        SUP --> APR{{"Aprobación"}}
        E1 --> VAL["Validador de outfit"]
    end
    E1 --> DB[("Supabase")]
    E2 --> DB
    E3 --> DB
    E5 --> DB
    E4 --> WEB[(Web de tiendas)]
    H --> ST[("Estado compartido del turno")]
    H --> TR["Trazas y evals"]
```

Un supervisor coordina cinco especialistas con su propio prompt y herramientas. Cada especialista necesita que el supervisor le pase el contexto de los otros (el de estilo necesita paleta, clóset y perfil).

### 5.4 Comparación

| Criterio | A — Agente único + harness | B — Agente + flujos + buscador aislado | C — Supervisor + especialistas |
|---|---|---|---|
| Patrón base (`B`) | Tool loop | Tool loop + chaining + orchestrator-workers acotado | Supervisor |
| Agentes (loops con modelo) | 1 | 1 + 1 subagente | 6 |
| Llamadas por turno típico de outfit | 2–3 | 2–3 | 4–8 (estimación) |
| Costo relativo | 1× | ~1× en asesoría; mayor solo al buscar | 3–10× según la evidencia de `A1` §2.2 |
| Coherencia del outfit | Alta: todo el contexto en una ventana | Alta | Riesgo: el contexto se reparte y se resume |
| Voz única (DP-17, DP-18) | Sí | Sí | Sí, si el supervisor reescribe todo |
| Aislamiento de contenido web | No: las páginas entran a la ventana con datos y permisos | **Sí** | Parcial: depende de las herramientas del shopper |
| Regla de dos (`A2` §9.1) | No la cumple con búsqueda web | La cumple por diseño | Depende |
| Predictibilidad de procesos fijos | Media: el modelo decide cada paso | Alta: pasos en código | Media |
| Complejidad de construir | Baja: agregar componentes al loop actual | Media: tres flujos y un subagente | Alta: contratos entre seis agentes |
| Facilidad de evaluar | Alta: un sistema | Alta: cada flujo se prueba solo | Baja: evals locales engañosas (`A1` §3.3) |
| Cambio respecto de la base actual | Incremental | Incremental en dos etapas | Reescritura |
| Riesgo principal | Prompt y herramientas crecen; inyección desde la web | Definir bien el contrato del buscador | Costo, latencia y pérdida de contexto |
| Cuándo tendría sentido | Mientras no haya búsqueda web | Al incorporar el personal shopper con web | Solo con evidencia de que el prompt único se degrada |

**[REC]** Lectura: A y B no son alternativas excluyentes sino etapas; B es A más las separaciones que la investigación justifica (procesos fijos fuera del loop, contenido no confiable aislado). C queda documentada como referencia y con su gatillo explícito. La hipótesis y sus preguntas abiertas están en `E`.

## 6. Mapa de capacidades y estado compartido

```mermaid
flowchart LR
    subgraph EST["Estado compartido en Supabase"]
        PERF[("Perfil de estilo")]
        PAL[("Paleta activa")]
        CLO[("Clóset")]
        MEMO[("Hechos de memoria")]
        OUT[("Outfits y feedback")]
    end
    ONB["Conocer a la persona"] --> PERF
    COL["Colorimetría"] --> PAL
    PRE["Análisis de prendas"] --> CLO
    PERF --> COMP["Componer outfit"]
    PAL --> COMP
    CLO --> COMP
    MEMO --> COMP
    CLIMA["Clima"] --> COMP
    COMP --> OUT
    OUT --> APR2["Aprender del feedback"] --> MEMO
    CLO --> GAP["Detectar prenda faltante"]
    COMP --> GAP
    GAP --> BUSQ["Buscar productos"]
    PERF --> BUSQ
    BUSQ --> EVA["Evaluar una compra"]
    CLO --> EVA
    PAL --> EVA
    EVA --> DEC{{"Decisión de la persona"}}
```

Lectura: **componer outfit** es el nodo que consume todo el estado; por eso no se parte. **Buscar productos** solo necesita un encargo derivado (categoría, color, presupuesto); por eso se puede aislar. **Colorimetría** y **análisis de prendas** escriben estado una vez y después son datos; por eso son funciones y no agentes. El criterio completo está en `E` §2.

## 7. Árbol de decisión: ¿agente, flujo, función o código?

```mermaid
flowchart TD
    Q0[Capacidad a diseñar] --> Q1{"¿Se resuelve con una regla o consulta?"}
    Q1 -- sí --> R1[Código determinista o herramienta]
    Q1 -- no --> Q2{"¿Basta una llamada con salida estructurada?"}
    Q2 -- sí --> R2[Función de una llamada]
    Q2 -- no --> Q3{"¿Los pasos son siempre los mismos?"}
    Q3 -- sí --> R3[Flujo fijo: chaining o planner-executor]
    Q3 -- no --> Q4{"¿Necesita el mismo contexto que el agente principal?"}
    Q4 -- sí --> R4[Parte del agente principal: herramienta o skill]
    Q4 -- no --> Q5{"¿Trae mucho contenido desechable, no confiable o paralelizable?"}
    Q5 -- sí --> R5[Subagente aislado con contrato]
    Q5 -- no --> R4
```

Este árbol es el criterio que `E` aplica a cada capacidad del producto.
