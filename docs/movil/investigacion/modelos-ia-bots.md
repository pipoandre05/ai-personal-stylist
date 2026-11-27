# Investigación: costos y ruteo de modelos para el equipo de bots (OpenMausBot)

Fecha: 2026-11-26 · Alcance: investigación web, sin cambios de código, sin uso de API keys.
Convención: **[oficial]** = leído en la página del proveedor hoy · **[3ros]** = solo fuentes de terceros, no verificado · **[inferencia]** = conclusión propia.

---

## 0. Resumen ejecutivo

1. **El precio que manda en Claude Code es el de *cache read*, no el de input.** Un agente de código reenvía su historial en cada turno; típicamente 85–95 % del input son lecturas de caché. Con eso, Sonnet 5.5 ($0.10/M cache read) queda **más barato o igual** que Kimi K3.1 Pro, GLM-5.3, Grok 4.7 o Gemini 4 Hydrogen en un perfil agéntico. Los ahorros grandes de verdad están solo en: **Haiku 5.5, DeepSeek V4.1 Flash, MiniMax M3 y GPT-6.1 Terra**.
2. **Haiku 5.5 casi empata a DeepSeek Flash en precio y calidad, sin ninguno de sus riesgos.** Terminal-Bench 4.1 en el harness Claude Code: Haiku 5.5 = 40.0 %, DeepSeek V4.1 Flash = 38.5 %. Precio: Haiku $0.10/$0.50 (≤100K de prompt) vs Flash $0.30/$1.20 en hora punta ($0.15/$0.60 fuera de punta). Haiku es nativo: sin traductor de API, con caché controlable, visión y las mismas condiciones de datos que hoy.
3. **DeepSeek V4 Pro dentro de Claude Code es una señal roja.** En Terminal-Bench 4.1 con harness Claude Code sacó **6.7 %** (2026-08-13), aunque DeepSeek informa 67.9 % en Terminal-Bench 2.0 con su propio harness. Además, **no procesa imágenes** por el endpoint Anthropic. Si se prueba DeepSeek, que sea Flash, y solo en tareas mecánicas.
4. **Anthropic no da soporte a Claude Code con modelos que no son Claude** (lo dice la doc oficial de gateways). Funciona porque los proveedores emulan la Messages API, pero `cache_control`, `anthropic-beta`, MCP del servidor, `budget_tokens`, citations y otros campos se ignoran o degradan.
5. **Privacidad:** DeepSeek guarda los datos en la RPC, se rige por la ley de la RPC y su política lista el entrenamiento como uno de los fines. En EE.UU. está excluido de las agencias federales desde 2026 (DHS, DoD). Los agentes de desarrollo ven el código, `.env`, seeds, migraciones con RLS y CLAUDE.md: **todo eso sale del país.** Si se usa DeepSeek, que sea con pesos abiertos alojados en EE.UU./UE vía un gateway, o con un repo saneado.
6. **Recomendación:** quedarse primero dentro de Anthropic con ruteo por rol (Haiku 5.5 para QA, devops rutinario y PM rutinario; Sonnet 5.5 con *effort* ajustado para coder y diseño; Sonnet/Opus para el revisor en PRs de riesgo). En el ejemplo paramétrico eso ahorra ≈35–47 %. DeepSeek y Kimi entran solo como candidatos en un A/B controlado. Aportan muy poco ahorro adicional sobre Haiku.
7. **La inferencia en runtime del producto (asesor y visión sobre fotos personales) es otra decisión:** se queda en Anthropic. El ahorro viene de caché, Batch para el etiquetado de prendas no interactivo, Haiku 5.5 para la visión simple y ajuste de *effort*. No de cambiar de proveedor.

---

## 1. Precios y contexto (USD por 1M tokens)

### 1.1 Anthropic — [oficial] https://platform.claude.com/docs/en/about-claude/pricing

| Modelo | Input | Cache write 5m / 1h | Cache read | Output | Contexto | Notas |
|---|---|---|---|---|---|---|
| Claude Fable 5.2 | $8 | $10 / $16 | $0.20 | $40 | 1M | Batch $4/$20; fast mode $16/$80 |
| Claude Opus 5.5 | $4 | $5 / $8 | $0.20 | $20 | 1M | Batch $2/$10; fast $8/$40 |
| Claude Sonnet 5.5 | $2 | $2.50 / $4 | $0.10 | $10 | 1M | Batch $1/$5 |
| Claude Haiku 5.5 (prompt ≤100K) | $0.10 | $0.125 / $0.20 | $0.01 | $0.50 | 1M | Batch $0.05/$0.25 |
| Claude Haiku 5.5 (prompt >100K) | $0.50 | $0.625 / $1 | $0.05 | $2.50 | 1M | Se cobra por request, toda la request al precio alto |

- Contexto 1M a precio plano (salvo Haiku 5.5). `inference_geo: "us"` = ×1.1. Batch −50 %.
- Tokenizador 4.7+: ≈30 % más tokens por el mismo texto que los modelos antiguos. **Compara costo por tarea, no por token.**

### 1.2 DeepSeek — [oficial] https://api-docs.deepseek.com/quick_start/pricing

| Modelo (API) | Versión | Cache hit (off/peak) | Cache miss (off/peak) | Output (off/peak) | Contexto / max out | Visión |
|---|---|---|---|---|---|---|
| `deepseek-flash` | V4.1-Flash-1017 | $0.003 / $0.006 | $0.15 / $0.30 | $0.60 / $1.20 | 1M / 384K | Sí |
| `deepseek-v4-pro` | V4-Pro-0813 | $0.022 / $0.044 | $0.66 / $1.32 | $1.98 / $3.96 | 1M / 384K | **No** |

- **Hora punta** (precio ×2): 01:00–04:00 y 06:00–10:00 UTC, de lunes a viernes. En Chile (UTC−3) es 22:00–01:00 y 03:00–07:00. **Casi toda la jornada laboral chilena cae en tarifa off-peak.** [inferencia]
- Concurrencia: Flash 2500, Pro 500.
- Los nombres antiguos `deepseek-v4-flash` se sirven con V4.1 Flash.

### 1.3 OpenAI — [oficial] https://developers.openai.com/api/docs/pricing (Standard, ≤272K)

| Modelo | Input | Cached | Output |
|---|---|---|---|
| gpt-6.2-astra (tope) | $8.00 | $0.40 | $40.00 |
| gpt-6.2-sol | $2.00 | $0.10 | $10.00 |
| gpt-6.1-terra | $1.00 | $0.05 | $5.00 |
| gpt-6-luna | $0.10 | $0.01 | $0.50 |
| gpt-5.4-mini | $0.75 | $0.075 | $4.50 |
| gpt-5.3-codex (último "codex" listado) | $1.75 | $0.175 | $14.00 |

La página no muestra la ventana de contexto. Hay un tramo distinto sobre 272K.

### 1.4 Google Gemini — [oficial] https://aistudio.google.com/docs/pricing (paid tier)

| Modelo | Input | Caché | Output | Nota |
|---|---|---|---|---|
| gemini-4-carbon (tope) | $2 → **$4 desde 2026-12-01** | $0.10 → $0.20 | $10 → $20 | |
| gemini-4-argon | $2 → $4 desde 2026-12-01 | $0.10 → $0.20 | $10 → $20 | El resumidor de la página dio el mismo precio que Carbon: **verificar** |
| gemini-4-neon | $3 | $0.15 | $15 | |
| gemini-4-hydrogen (clase "flash") | $1.50 | $0.075 | $7.50 | |
| gemini-3.8-flash | $0.75 → $1.50 desde 2027-01-01 | $0.075 | $3.75 → $7.50 | |

- La caché tiene además un costo de almacenamiento por hora.
- Paid tier: "Used to improve our products: **No**".

### 1.5 Otros proveedores

| Proveedor / modelo | Input | Cache read | Output | Contexto | Fuente |
|---|---|---|---|---|---|
| Moonshot **Kimi K3.1 Pro** | $2 | $0.20 | $10 | 1M | [3ros]: la tabla oficial no cargó. Batch al 60 % [oficial] |
| Moonshot Kimi K3 | $3 | $0.30 | $15 | 1M | [3ros]; siempre razona (no se puede apagar) |
| Zhipu **GLM-5.3** | $1.40 | $0.26 | $4.40 | n/d | [oficial] https://docs.z.ai/guides/overview/pricing |
| GLM-5.3-Flash / FlashX | $0.15 / $0.37 | $0.03 / $0.075 | $0.50 / $1.25 | n/d | [oficial] |
| GLM-5.4 | sin precio por token (solo Coding Plan) | | | | [3ros] |
| **MiniMax M3** (≤512K) | $0.30 | $0.06 | $1.20 | 1M | [oficial] https://platform.minimax.io/docs/guides/pricing-paygo ("Permanent 50% off") |
| MiniMax M3.1 Flash | $0.15 | $0.015 | $0.60 | | [oficial] |
| Alibaba **Qwen3.8-Max** (Intl) | $2 | "descuento", sin cifra | $6 | 1M | [oficial] https://www.alibabacloud.com/help/en/model-studio/model-pricing |
| qwen3-coder-flash (≤32K) | $0.30 (sube con el largo hasta $1.60) | n/d | $1.50 (hasta $9.60) | 1M | [oficial] Penaliza contexto largo |
| xAI **grok-4.7** (<200K) | $2 | $0.50 | $6 | 500K | [oficial] https://docs.x.ai/docs/models (≥200K: ×2) |
| xAI grok-build-0.1 (código) | $1 | $0.20 | $2 | 256K | [3ros]: no aparece en docs.x.ai |

---

## 2. Señales de calidad en código

### 2.1 Terminal-Bench 4.1 — [oficial] https://www.tbench.ai/leaderboard (consultado 2026-11-26)

Es la señal más útil para este caso porque **varias entradas corren en el mismo harness Claude Code**.

| Rank | Modelo (effort) | Harness | Score ±IC95 | Fecha |
|---|---|---|---|---|
| 1 | Copilot Fusion (max) | GitHub Copilot | 71.2 ±2.9 | 2026-11-17 |
| 2 | Opus 5.5 (max) | Claude Code | 65.8 ±3.1 | 2026-09-22 |
| 2 | Fable 5.2 (max) | Claude Code | 65.8 ±2.8 | 2026-11-09 |
| 4 | Gemini 4 Carbon (high) | Antigravity CLI | 64.5 ±3.2 | 2026-10-28 |
| 5 | **Sonnet 5.5 (max)** | Claude Code | **63.9** ±3.0 | 2026-09-28 |
| 6 | GPT-6.2 Astra (max) | Codex | 62.1 ±2.3 | 2026-11-17 |
| 7 | GPT-6.2 Sol (max) | Codex | 61.5 ±2.8 | 2026-11-17 |
| 8 | Gemini 4 Neon (xhigh) | Antigravity | 61.2 ±2.8 | 2026-11-18 |
| 11 | **Kimi K3.1 Pro (max)** | Claude Code | 59.7 ±4.2 | 2026-10-24 |
| 13 | Gemini 4 Hydrogen (high) | Antigravity | 56.4 ±3.0 | 2026-11-12 |
| 15 | GPT-6.1 Terra (max) | Codex | 53.3 ±3.1 | 2026-10-26 |
| 20 | GLM-5.3 (max) | Claude Code | 41.2 ±3.3 | 2026-08-14 |
| 21 | **Haiku 5.5 (max)** | Claude Code | **40.0** ±3.6 | 2026-10-07 |
| 22 | Grok 4.7 (xhigh) | Grok Build | 38.8 ±3.6 | 2026-09-21 |
| 23 | **DeepSeek V4.1 Flash (max)** | Claude Code | **38.5** ±3.8 | 2026-10-17 |
| 29 | Qwen3.8-Max (max) | Claude Code | 27.0 ±3.9 | 2026-09-02 |
| 32 | Kimi K3 (max) | Claude Code | 23.0 ±3.7 | 2026-07-16 |
| 40 | GPT-6 Luna (max) | Codex | 15.2 ±2.7 | 2026-09-22 |
| 47 | MiniMax M3 | mini-swe-agent | 7.6 ±2.8 | 2026-06-01 |
| 48 | **DeepSeek V4 Pro 0813 (max)** | Claude Code | **6.7** ±2.5 | 2026-08-13 |

Lectura [inferencia]:
- Sonnet 5.5 está a ~2 pp de Opus 5.5 y Fable 5.2, dentro del ruido. Es el punto dulce en calidad.
- Kimi K3.1 Pro es el único no-Claude cerca de Sonnet **dentro de Claude Code**.
- Haiku 5.5 ≈ DeepSeek Flash ≈ GLM-5.3: la clase barata.
- DeepSeek V4 Pro en Claude Code sacó un resultado anómalo (6.7 %), probablemente por incompatibilidad con el harness. **No usarlo sin un piloto propio.**

### 2.2 Otras señales (con cautela)

- **Sonnet 5.5** (lanzado 2026-09-28): 70.6 % en Terminal-Bench 4.0 a max effort, pero **28.8 % a medium**. El *effort* mueve la calidad muchísimo. Sin SWE-bench Verified publicado; SWE-Bench Pro 81.3 (Opus 5.5: 89.9; Fable 5.2: 93) según Anthropic. [3ros que citan a Anthropic: https://apidog.com/blog/claude-sonnet-5-5-benchmarks/, https://hokai.io/hub/models/claude-sonnet-5.5]
- **DeepSeek V4 Pro**: según su propio informe, 80.6 % en SWE-bench Verified y 67.9 % en Terminal-Bench 2.0. Scale SEAL no tiene entrada independiente. [https://arxiv.org/html/2606.19348v1, https://www.morphllm.com/deepseek-v4]
- **SWE-bench Verified ya no discrimina en la frontera.** OpenAI lo dijo en febrero de 2026 y los tableros "Pro V2" están cerca del techo (99 %). Los números de proveedor y de agregadores no coinciden entre sí. [https://www.morphllm.com/swe-bench-pro, https://benchlm.ai/benchmarks/swe-bench-pro]

### 2.3 Debilidades conocidas en uso agéntico con herramientas

- **Por el endpoint Anthropic de DeepSeek** [oficial: https://api-docs.deepseek.com/guides/anthropic_api]:
  - `cache_control` se ignora (la caché es automática por prefijo).
  - `tool_choice any/tool` tiene limitaciones en modo thinking; `disable_parallel_tool_use` se ignora.
  - `budget_tokens` se ignora; `adaptive` se trata como `enabled`.
  - `mcp_servers`, `container` y citations no se soportan.
  - **V4 Pro reemplaza las imágenes por `[Unsupported Image]`.**
  - Mapeo de nombres: `claude-opus*` → V4 Pro; `claude-sonnet*`/`claude-haiku*` → Flash.
- **Kimi K3/K3.1** siempre razona, con default `max`: genera muchos tokens de output facturables.
- **Qwen3.8-Max** usa *effort* xhigh por defecto: muchos tokens de razonamiento.
- **GLM**: la guía oficial de Claude Code se validó solo con Claude Code 2.0.14 y es inconsistente en el mapeo de modelos. [oficial: https://docs.z.ai/devpack/tool/claude]

---

## 3. Compatibilidad con Claude Code CLI

| Proveedor | Endpoint Anthropic Messages | Estado de la doc | Caveats clave |
|---|---|---|---|
| DeepSeek | `https://api.deepseek.com/anthropic` | [oficial], con guía para Claude Code | Variables recomendadas: `ANTHROPIC_MODEL=deepseek-flash[1m]`, `ANTHROPIC_DEFAULT_OPUS_MODEL`, `CLAUDE_CODE_SUBAGENT_MODEL`, `CLAUDE_CODE_EFFORT_LEVEL=max`, `CLAUDE_CODE_AUTO_COMPACT_WINDOW=786432`. Pro sin visión. |
| Moonshot Kimi | `https://api.moonshot.ai/anthropic` ([3ros]); la doc oficial confirma que la Messages API existe y que hay una guía `claude-code-kimi` | parcial | La plataforma se movió a platform.kimi.ai. Según [3ros], hay una lista blanca de user-agent. |
| Zhipu GLM | `https://api.z.ai/api/anthropic` | [oficial] (guía del Coding Plan) | No aclara si sirve con keys pay-as-you-go. |
| MiniMax | Anthropic-compatible ([3ros]) | no verificado | "Diferencias documentadas" entre las rutas. |
| Alibaba Qwen | `https://dashscope-intl.aliyuncs.com/apps/anthropic` ([3ros], publicado por Alibaba) | no verificado | El Coding Plan rechaza llamadas desde scripts o backends: **no sirve para bots**. Usar pay-as-you-go. |
| OpenAI / Gemini / xAI | sin endpoint Anthropic nativo | — | Requieren un gateway que traduzca (OpenRouter "Anthropic skin", Vercel AI Gateway, LiteLLM). |

**Gateways:**
- **OpenRouter**: `ANTHROPIC_BASE_URL=https://openrouter.ai/api` (no `/api/v1`), `ANTHROPIC_AUTH_TOKEN=sk-or-…`, `ANTHROPIC_API_KEY=""`. La integración "solo está garantizada con el proveedor Anthropic 1P". [oficial: https://openrouter.ai/docs/cookbook/coding-agents/claude-code-integration]
- **Vercel AI Gateway**: `ANTHROPIC_BASE_URL=https://ai-gateway.vercel.sh` (la Academy recomienda `/claude-code`). Budgets por equipo, proyecto, **API key** o miembro, y rechaza requests al excederlo. Sin markup sobre el precio del proveedor. Los budgets podrían no contar el uso BYOK [3ros]. Encaja con el stack: el proyecto ya está en Vercel. [https://vercel.com/docs/ai-gateway/sdks-and-apis, https://vercel.com/changelog/ai-gateway-support-for-claude-code]
- **LiteLLM** (self-hosted): traduce formatos, virtual keys por bot y budgets. Es infraestructura que hay que operar.
- **Doc oficial de Claude Code** [https://code.claude.com/docs/en/llm-gateway]: "Anthropic doesn't endorse, maintain, or audit third-party gateway products, and **doesn't support routing Claude Code to non-Claude models** through any gateway." Y un gateway que no reenvía las capacidades nuevas de Claude Code rompe esas funciones.
- **Fallback más seguro para disponibilidad** [inferencia]: el mismo modelo Claude en otra nube (Bedrock / Vertex / Claude Platform on AWS) detrás del gateway. Conserva la compatibilidad total.
- **Fallback ante rechazos (refusals)**: `fallbacks: "default"` del lado servidor en Sonnet 5.5 y Opus 5.5.

**Por bot:** cada bot puede llevar su propio bloque `env` (`ANTHROPIC_BASE_URL`, `ANTHROPIC_AUTH_TOKEN`, `ANTHROPIC_MODEL`, `CLAUDE_CODE_SUBAGENT_MODEL`, `CLAUDE_CODE_EFFORT_LEVEL`) y su propia key del gateway con su presupuesto. No verifiqué cómo OpenMausBot inyecta el entorno a cada bot. **Verificar antes de cualquier cambio si los bots facturan por API key o por suscripción claude.ai**: con suscripción, el costo marginal por token no es el que se usa en este cálculo.

---

## 4. Privacidad, retención, residencia y ToS

| Proveedor | ¿Entrena con datos de API? | Retención | Residencia / ley | Fuente |
|---|---|---|---|---|
| Anthropic | No por defecto: "Anthropic may not train models on Customer Content" | API: borrado ≤30 días [3ros que citan el privacy center]. ZDR por acuerdo; **Fable 5.x obliga a 30 días** ("Covered Models"). | Global por defecto; `inference_geo: us` ×1.1 | https://www.anthropic.com/legal/commercial-terms (vigente desde 2025-06-17); https://privacy.claude.com/en/articles/7996868 |
| OpenAI | No por defecto | Logs de abuso ≤30 días; ZDR con aprobación | Residencia regional disponible | https://developers.openai.com/api/docs/guides/your-data |
| Google (paid) | No ("Used to improve our products: No") | — | — | https://aistudio.google.com/docs/pricing |
| **DeepSeek** | La política de privacidad lista el entrenamiento como fin, con derecho a opt-out. Los ToS del Open Platform **no prometen no entrenar** y no fijan retención. | Sin plazo general | **"collect, process and store your Personal Data in People's Republic of China"**; ToS bajo ley de la RPC continental, foro en el domicilio de DeepSeek | https://cdn.deepseek.com/policies/en-US/deepseek-privacy-policy.html (2026-02-10); https://cdn.deepseek.com/policies/en-US/deepseek-open-platform-terms-of-service.html (vigente desde 2026-04-29) |
| Moonshot Kimi | Contradictorio: los términos permiten usar el contenido salvo acuerdo escrito; el help center dice que no | Vida de la cuenta en self-serve [3ros] | Singapur (Moonshot AI Pte.) | https://platform.kimi.ai/docs/agreement/userprivacy |
| Z.ai (GLM) | No sin consentimiento explícito (DPA, cliente = controlador) | "not saved on our servers" (DPA) [3ros] | Singapur; el endpoint chino open.bigmodel.cn está en la RPC | [3ros] https://www.developersdigest.tech/models/data-retention/zai |
| MiniMax | Los términos permiten usarlo para "develop and improve"; opt-out por email | — | Operador en Singapur; almacenamiento en EE.UU. | https://platform.minimax.io/protocol/privacy-policy |

**Contexto regulatorio:**
- Orden DHS 2026-01 (firmada 2026-07-24, publicada el 2026-10-20 en el Federal Register): excluye DeepSeek de las agencias civiles de EE.UU., incluidas las herramientas construidas sobre él. Hay también una orden del DoD del 2026-09-08. [3ros: https://www.cio.com/article/4238132/…]
- No aplica a privados, pero es una señal de riesgo de proveedor.

**Relevancia para este proyecto** [inferencia]:
- Los bots de desarrollo **no ven fotos de personas**, pero sí ven:
  - el código y la lógica de RLS;
  - `web/supabase/seed/`, que existe sin versionar y hay que revisar si trae datos reales;
  - `.env*` si un permiso lo deja leer;
  - los docs de producto y la estrategia (DTR, backlog).
- Medidas mínimas si se usa un proveedor chino:
  1. `permissions.deny` para `Read(.env*)` y `Read(**/seed/**)`.
  2. Cero secretos en el entorno del bot.
  3. Trabajar sobre un worktree sin datos.
  4. Preferir **pesos abiertos** (DeepSeek V4/V4.1 bajo licencia MIT; GLM, Kimi y MiniMax con pesos abiertos) servidos por un host en EE.UU./UE vía OpenRouter o Vercel con filtro de proveedor y ZDR. Así los datos no van a la RPC. Precios y calidad de esos hosts: **no verificados**.
- **Devops nunca debería ir a un proveedor de la RPC**: maneja secretos de Vercel y Supabase.
- Chile: la Ley 21.719 de protección de datos personales entra en vigor alrededor de diciembre de 2026, con reglas de transferencia internacional. Es relevante sobre todo para el runtime. **Verificar la fecha y el alcance con fuente legal.**

---

## 5. Límites de tasa y estabilidad

- **Anthropic** [oficial: https://platform.claude.com/docs/en/api/rate-limits]:
  - Start: Sonnet, Haiku y Opus 5.5 con 4.000 RPM / 2M ITPM / 400K OTPM; Build: 10.000 / 5M / 1M.
  - **La caché no cuenta para ITPM.**
  - Spend cap mensual por tier: Start $500, Build $1.000, Scale $200.000.
  - Se pueden fijar límites de gasto y de tasa **por workspace**: un workspace por bot es una forma nativa de tener presupuestos por bot sin gateway.
  - Existen "ramp limits" ante saltos bruscos de uso.
- **Incidentes Anthropic, noviembre 2026** [3ros: https://www.datastudios.org/post/claude-outages-november-13-logins-claude-code-connectors, https://presenc.ai/research/claude-outage-history-2026]:
  - 13-nov: errores elevados en API y Claude Code durante 13:09–15:38 UTC.
  - Errores breves en Sonnet 5.5 y otros modelos el 16, 23, 24 y 25 de noviembre.
  - Uptime de la API a 90 días: ≈99.77 %.
- **DeepSeek**: concurrencia 2500 (Flash) y 500 (Pro).
  - Incidentes [3ros: https://www.kucoin.com/news/flash/deepseek-suffers-19th-major-outage-of-the-year-on-november-3, https://www.knowflowhub.com/en/content/article/2026-10-15/deepseek-service-outage-october-2026]:
    - **19ª caída mayor del año el 2026-11-03**, con degradación prolongada de las APIs V4 Pro y V4.1 Flash;
    - 2026-10-15: 5 horas (con reembolso);
    - 2026-07-22: 3h42.
  - Status oficial: status.deepseek.com.
- **Otros**: no investigué en detalle los incidentes de Kimi, GLM ni MiniMax.

---

## 6. Matriz comparativa y ruteo por rol

### 6.1 Matriz

Costo calculado con el perfil P de §6.3.

| Modelo | Calidad agéntica (TB 4.1) | Claude Code nativo | Visión | Privacidad (dev) | $/bot/mes (perfil P) |
|---|---|---|---|---|---|
| Opus 5.5 | 65.8 | Sí | Sí | Buena | **$60.00** |
| **Sonnet 5.5** (baseline) | 63.9 | Sí | Sí | Buena | **$30.00** |
| GPT-6.2 Sol | 61.5 (Codex) | No (gateway) | Sí | Buena | $29.50 |
| Kimi K3.1 Pro | 59.7 | Emulado | Sí [3ros] | Media | $34.00* |
| Gemini 4 Hydrogen | 56.4 (Antigravity) | No (gateway) | Sí | Buena | $22.13 (+almacenamiento de caché) |
| GPT-6.1 Terra | 53.3 (Codex) | No (gateway) | Sí | Buena | $14.75 |
| GLM-5.3 | 41.2 | Emulado | n/d | Media-buena | $25.30 |
| **Haiku 5.5** | 40.0 | Sí | Sí | Buena | **$1.73** (≤100K) / **$8.63** (>100K) |
| Grok 4.7 | 38.8 | No | n/d | n/d | $41.50 |
| **DeepSeek V4.1 Flash** | 38.5 | Emulado | Sí | **Baja (RPC)** | **$1.79** off / **$3.57** peak |
| DeepSeek V4 Pro | 6.7 en CC (anómalo) | Emulado | **No** | Baja (RPC) | $7.26 off / $14.52 peak |
| MiniMax M3 | 7.6 (otro harness) | Emulado | n/d | Media | $6.00 |
| Qwen3.8-Max | 27.0 | Emulado | n/d | Media (Singapur) | ≤$109 (sin precio de caché publicado) |

*Precio no oficial.

### 6.2 Ruteo propuesto (primario → fallback), sujeto al A/B

| Bot | Naturaleza | Primario | Fallback | Candidato a A/B | Nunca |
|---|---|---|---|---|---|
| **productor/PM** | Specs, backlog, texto en español | Haiku 5.5 (rutinario) | Sonnet 5.5 (specs nuevas) | DeepSeek Flash off-peak | — |
| **diseño/UX** | Maquetas HTML, tokens DESIGN.MD, lee capturas | Sonnet 5.5 (effort medium→high) | Opus 5.5 | Gemini 4 Hydrogen vía gateway | DeepSeek V4 Pro (sin visión) |
| **constructor/coder** | Next 16, RLS, contrato del agente | Sonnet 5.5 (effort medium, sube a high en tareas grandes) | Sonnet 5.5 en Bedrock/Vertex (caída) · Opus 5.5 (bloqueo) | Kimi K3.1 Pro; Haiku 5.5 para subtareas mecánicas | DeepSeek V4 Pro |
| **revisor** | Debe detectar bugs; mirada independiente | Sonnet 5.5 high; **Opus 5.5 en PRs con migración, RLS, auth o IA** | Opus 5.5 | GPT-6.2 Sol (diversidad de familia) | modelos clase "flash" |
| **QA** | Escribir y correr Vitest/Playwright, triage | Haiku 5.5 | Sonnet 5.5 | DeepSeek Flash | — |
| **devops** | CI, Vercel, git, secretos | Haiku 5.5 (rutina) | Sonnet 5.5 (incidentes) | — | **cualquier proveedor de la RPC** |

Reglas transversales:
- Ajustar `CLAUDE_CODE_EFFORT_LEVEL` por rol: es el primer lever, gratis y sin cambiar de proveedor.
- Mantener el prefijo de prompt estable (CLAUDE.md, herramientas) para maximizar la caché.
- Haiku 5.5 sube a ×5 si el prompt pasa de 100K: compactar antes (`CLAUDE_CODE_AUTO_COMPACT_WINDOW`) en los bots Haiku.

### 6.3 Método de ahorro

```
costo_bot = Σ_tipo tokens_tipo × precio_tipo
  tipos = {cache_read, uncached_input, cache_write, output}
ahorro = Σ_bots (costo_bot[Sonnet 5.5] − costo_bot[modelo_nuevo])
       × factor_eficiencia (tokens/tarea del modelo nuevo ÷ tokens/tarea de Sonnet; medido en el A/B)
```

**Perfil P** (supuesto, por bot y por mes):
- Input = 50M: 45M cache read (90 %), 4M sin caché y 1M de escritura de caché.
- Output = 1.5M (incluye thinking).
- Para proveedores sin cobro de escritura de caché, los 5M sin caché van al precio de *cache miss*.

Desglose de Sonnet 5.5: 45×0.10 + 4×2 + 1×2.50 + 1.5×10 = 4.50 + 8.00 + 2.50 + 15.00 = **$30.00**.

Escenarios con 6 bots (baseline todo en Sonnet = **$180/mes**):

| Escenario | Composición | Costo/mes | Ahorro |
|---|---|---|---|
| A: solo Anthropic | Sonnet ×3 (diseño, coder, revisor) + Haiku ×3 (PM, QA, devops) | $95.2 – $115.9 | **36–47 %** |
| B: A + DeepSeek Flash en PM y QA | Sonnet ×3 + Flash ×2 + Haiku ×1 | $95.3 – $105.8 | 41–47 % |
| C: B + Kimi en coder | Sonnet ×2 + Kimi ×1 + Flash ×2 + Haiku ×1 | $99.3 – $109.8 | 39–45 % |
| D: revisor en Opus en ~30 % de los PRs | +$9 sobre A | — | — |

Conclusión del ejemplo [inferencia]:
- Casi todo el ahorro viene de **bajar los roles de alto volumen a un modelo barato**, sea Haiku o DeepSeek.
- DeepSeek suma ≤$10/mes sobre Haiku en este perfil.
- Kimi en el coder **sube** el costo, porque su cache read es más caro.
- Lo que cambia el número de verdad es el reparto real de tokens: normalmente el coder y el revisor consumen la mayor parte. **Hay que medirlo antes**, con el Console Usage por workspace o la telemetría OTEL de Claude Code.

---

## 7. Inferencia del producto en runtime (decisión aparte)

- **Datos**: fotos de cuerpo y clóset de personas en Chile, colorimetría y preferencias. Son datos sensibles, con exigencias de transferencia internacional y de consentimiento.
- **Recomendación**: mantener Claude (DT-02 y la arquitectura actual).
- **Levers de costo**:
  1. Prompt caching del system prompt y las herramientas del asesor (cache read al 5 % en Sonnet y Opus 5.5).
  2. **Batch API (−50 %)** para el etiquetado de prendas que no necesita respuesta inmediata.
  3. **Haiku 5.5 para la visión simple** (tipo de prenda, color base) y Sonnet 5.5 para el razonamiento de outfits. Validarlo con un eval propio.
  4. *Effort* bajo o medio en las rutas de chat.
  5. `AI_MODE=mock` en los tests (ya existe).
- **Descartar DeepSeek y Kimi para runtime**: residencia en la RPC o Singapur con términos ambiguos sobre entrenamiento, más inestabilidad (19 caídas de DeepSeek en 2026).

---

## 8. Diseño del A/B (ejecutable solo tras aprobar credenciales y presupuesto)

**Preparación (requiere aprobación de Felipe):**
1. Credenciales por proveedor y una key de gateway por bot y modelo, con budget duro (p. ej. $50 en total para el piloto).
2. Decidir qué contenido del repo puede salir a cada jurisdicción.
3. Clon saneado: sin `.env`, sin `seed/` con datos reales, `AI_MODE=mock`, secretos dummy.
4. Fijar la versión de Claude Code y el mismo CLAUDE.md, skills y permisos para todos los modelos.

**Tareas (5–10 por rol, sacadas del historial real):**
- **Coder**: reproducir los PRs ya mergeados (#5–#9). Se hace checkout del commit padre, se entrega el enunciado de la historia y la spec, y se evalúa con los tests del PR original (ocultos) más typecheck, lint y build.
- **Revisor**: tomar diffs reales con 1–3 bugs sembrados (RLS sin `user_id`, `middleware.ts` en lugar de `proxy.ts`, `void (async…)`, uso de service role, fecha sin `fmtDateOnly`). Se mide recall y precisión de los hallazgos.
- **QA**: escribir tests para un módulo existente. Se mide si pasan, el *mutation score* (p. ej. Stryker) y la flakiness en 3 corridas.
- **PM**: escribir una spec o historia a partir de un brief real del backlog. Rúbrica ciega.
- **Diseño**: maqueta HTML desde una historia de UI. Se evalúa la adherencia a los tokens de DESIGN.MD (automatizable con grep de tokens) más la revisión visual de Felipe.
- **Devops**: dejar verde un workflow de CI roto (sembrado), o un script de rollback. Solo con proveedores aprobados para secretos.

**Protocolo:**
- Cada tarea × modelo × **3 corridas** (el resultado no es determinista), cada una en un worktree limpio y en orden aleatorio.
- Mismo prompt y mismo límite de turnos y tiempo.
- Corrección **ciega**: se quita la identidad del modelo de los diffs y los logs.
- Juez LLM (Opus 5.5) con rúbrica, más Felipe en una muestra del 20 % y en todo lo visual.

**Rúbrica (0–4 por eje):**
- corrección funcional;
- invariantes del CLAUDE.md (cualquier violación crítica = 0 en la tarea);
- disciplina de alcance (no toca archivos ajenos);
- calidad del código y los tests;
- voz y vocabulario (PM y diseño).

**Captura por corrida:**
- Tokens por tipo (cache read, sin caché, escritura, output). Fuentes: `claude -p --output-format json`, telemetría OTEL de Claude Code o los logs del gateway.
- Costo calculado con la tabla de §1.
- Tiempo de reloj, número de turnos, errores de tool-call e intervenciones humanas.
- pass@1 y pass^3 (consistencia).

**Regla de decisión por rol:** se adopta el modelo barato si cumple las tres condiciones:
1. es no inferior (pass@1 ≥ baseline − 5 pp y rúbrica ≥ baseline − 0.3);
2. tiene **cero** violaciones críticas de invariantes;
3. su **costo por tarea completada** es ≥30 % menor.

Si no, se mantiene Sonnet. Se repite el A/B al salir un modelo nuevo o al cambiar los precios: Gemini 4 Carbon y Argon duplican su precio el 2026-12-01 y Gemini 3.8 Flash el 2027-01-01.

**Costo estimado del piloto** [inferencia]: 6 roles × 7 tareas × 3 corridas × ~4 modelos ≈ 500 corridas. A ~$0.05–$1 por corrida, son unos **$25–$250**. Conviene limitarlo con el gateway y empezar por 2 roles (QA y coder).

---

## 9. Pendientes por verificar

- Precios oficiales de Kimi K3.1 Pro (la tabla de platform.kimi.ai no cargó) y su guía oficial de Claude Code.
- Precio de Gemini 4 Argon (el resumidor lo igualó a Carbon) y el precio de caché de Qwen3.8-Max.
- Endpoint Anthropic oficial de MiniMax y de Qwen, y si GLM pay-as-you-go funciona en Claude Code fuera del Coding Plan.
- Los precios de grok-build-0.1 vienen solo de terceros.
- Si los bots de OpenMausBot facturan por API key o por suscripción.
- El reparto real de tokens por bot.
- Ley 21.719: fecha de vigencia y reglas de transferencia internacional.
- Calidad y precio de DeepSeek y Kimi con pesos abiertos en hosts de EE.UU./UE.
