#!/usr/bin/env bash
# freno.sh — hook PreToolUse de ai-personal-stylist (PROPUESTA: copiar a .claude/hooks/freno.sh).
#
# Revisa cada herramienta ANTES de que Claude la use, en TODAS las sesiones del
# repo: las de Felipe y las de los bots de OpenMausBot (que leen
# .claude/settings.json porque la app lanza Claude Code con --setting-sources
# project). Los bots corren con permisos "full" (bypassPermissions): el control
# no puede depender de pedir permiso, tiene que estar aquí.
#
# Contrato con Claude Code: lee el JSON del hook por stdin; exit 0 deja pasar,
# exit 2 bloquea y el texto de stderr le llega a Claude como explicación.
# FALLA CERRADO: si falta python3, si el programa revienta o si falta un script
# del que depende una decisión (frontera, condiciones de merge), bloquea. El
# settings.json propuesto además bloquea si este archivo no existe y convierte
# cualquier salida distinta de 0 en 2.
#
# Qué bloquea (para toda sesión salvo que diga "equipo"):
#   - git push --force / -f / --force-with-lease / +refspec / --mirror
#   - git rebase (cualquiera) · git filter-branch · git update-ref -d
#   - git reset --hard sobre main, HEAD suelto o una rama con upstream (compartida)
#   - borrar ramas que no son equipo/* (git branch -d, push --delete, push :rama);
#     git branch -D siempre
#   - git clean -x / -X (se llevaría .env.local y las skills copiadas)
#   - cualquier deploy: vercel salvo ls|inspect|logs|whoami|help|--version; MCP de deploy
#   - leer, imprimir, copiar o editar .env* (salvo .env.example y .env.local.example),
#     también con Read/Grep/Edit/Write y con grep recursivo sobre carpetas que los tengan
#   - Supabase: db push, link, migration up/repair, functions deploy, secrets,
#     --linked, --db-url, psql, pg_dump, pg_restore; MCP apply_migration y execute_sql
#   - instalar dependencias nuevas (npm i <pkg>, pnpm/yarn/bun add) si no están
#     declaradas en el hilo de la historia de la rama (docs/superpowers/hilos/<id>.md)
#   - rm recursivo / find -delete salvo carpetas regenerables (node_modules, .next,
#     coverage, …) o temporales
#   - gh pr merge (y mergear.sh de la Torre) si no se cumplen las condiciones de
#     agentes/scripts/condiciones-merge.sh; siempre --admin, --auto, --merge, --rebase;
#     gh api con DELETE o sobre /merge; gh secret, gh variable, gh repo delete
#   - equipo (carpeta con el marcador .equipo-mausbot): push a main, --no-verify,
#     tocar core.hooksPath, cualquier comando supabase, git worktree remove, y
#     Edit/Write fuera de la frontera (agentes/scripts/verificar-frontera.sh) o
#     fuera del repo (salvo temporales y ~/.openmausbot)
#
# Límites conocidos (frena errores y automatismos, no a quien lo esquiva a
# propósito): no abre scripts corridos por ruta (salvo reconocer mergear.sh);
# no ve curl/wget contra la API de GitHub; no ve código que un intérprete arma en
# tiempo de ejecución; el cuerpo de un heredoc es dato (salvo si va a bash/sh).
set -u
ENTRADA=$(cat)
if ! command -v python3 >/dev/null 2>&1; then
  echo "FRENO: falta python3 y no puedo revisar el comando; bloqueo por seguridad (falla cerrado)." >&2
  exit 2
fi
FRENO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export FRENO_ENTRADA="$ENTRADA" FRENO_DIR

read -r -d '' PROGRAMA <<'PY'
import json, os, re, shlex, subprocess, sys

ENTRADA = os.environ.get("FRENO_ENTRADA", "")
MAX_PROF = 4

class Bloqueo(Exception):
    pass

def bloquear(motivo, alternativa=""):
    raise Bloqueo(motivo + ((" Alternativa: " + alternativa) if alternativa else ""))

try:
    datos = json.loads(ENTRADA) if ENTRADA.strip() else {}
except Exception:
    print("FRENO: no entiendo la entrada del hook; bloqueo por seguridad.", file=sys.stderr)
    sys.exit(2)

TOOL = datos.get("tool_name") or ""
TI = datos.get("tool_input") or {}
CWD0 = datos.get("cwd") or os.getcwd()

def git(args, cwd):
    try:
        r = subprocess.run(["git", "-C", cwd] + args, capture_output=True, text=True, timeout=15)
        return r.returncode, r.stdout.strip()
    except Exception:
        return 1, ""

def raiz_de(cwd):
    c, out = git(["rev-parse", "--show-toplevel"], cwd)
    return out if c == 0 and out else None

RAIZ = os.environ.get("CLAUDE_PROJECT_DIR") or raiz_de(CWD0) or CWD0
RAIZ = os.path.realpath(RAIZ)
EQUIPO = os.environ.get("FRENO_MODO_EQUIPO") == "1" or os.path.exists(os.path.join(RAIZ, ".equipo-mausbot"))
SCRIPTS = os.path.join(RAIZ, "agentes", "scripts")

EJEMPLOS = {".env.example", ".env.local.example"}
def es_secreto(ruta):
    if not ruta:
        return False
    b = os.path.basename(ruta.rstrip("/"))
    if b in EJEMPLOS:
        return False
    return b == ".env" or b.startswith(".env.") or b.startswith(".env*") or b == ".env*"
TEXTO_SECRETO = re.compile(r"(^|[\s/'\"=(:,\[])\.env(\.[A-Za-z0-9_*-]+)*(?=$|[\s'\")\],;])")
def menciona_secreto(texto):
    for m in TEXTO_SECRETO.finditer(texto or ""):
        frag = m.group(0).strip(" /'\"=(:,[")
        if frag not in EJEMPLOS:
            return True
    return False

# FRENO_TEMPORALES (solo tests): lista separada por ":" que reemplaza a los temporales del sistema.
# Lo lee el hook desde el entorno de Claude Code, no desde el comando: un bot no lo puede fijar.
if os.environ.get("FRENO_TEMPORALES"):
    TEMPORALES = [os.path.realpath(p) for p in os.environ["FRENO_TEMPORALES"].split(":") if p]
    SCRATCH = False
else:
    TEMPORALES = [os.path.realpath(p) for p in ["/tmp", "/private/tmp", "/var/folders", "/private/var/folders",
                  os.environ.get("TMPDIR", "/tmp")] if p]
    SCRATCH = True
REGENERABLES = {"node_modules", ".next", "coverage", "test-results", "playwright-report", ".turbo",
                "out", "dist", "build", ".vercel-cache", "tsconfig.tsbuildinfo", ".eslintcache"}
def es_temporal(ruta):
    r = os.path.realpath(ruta)
    return any(r == t or r.startswith(t + "/") for t in TEMPORALES) or (SCRATCH and "/scratchpad/" in r)

def absoluta(ruta, cwd):
    return os.path.normpath(os.path.join(cwd, os.path.expanduser(ruta)))

# ---------------------------------------------------------------- herramientas no-Bash
def raiz_equipo(ruta):
    """La carpeta del equipo (con el marcador .equipo-mausbot) que contiene <ruta>, o None."""
    d = ruta if os.path.isdir(ruta) else os.path.dirname(ruta)
    while d and d != "/":
        if os.path.exists(os.path.join(d, ".equipo-mausbot")):
            return d
        d = os.path.dirname(d)
    return None

def revisar_archivo(ruta, escribe):
    if es_secreto(ruta):
        bloquear("'%s' es un archivo de secretos (.env*): no se lee, no se imprime, no se edita." % ruta,
                 "usa web/.env.local.example para ver qué variables existen; los valores los pone Felipe.")
    if not escribe or not EQUIPO:
        return
    a = absoluta(ruta, CWD0)
    raiz = RAIZ if (a == RAIZ or a.startswith(RAIZ + "/")) else raiz_equipo(a)
    if raiz:
        rel = os.path.relpath(a, raiz)
        c, _ = git(["check-ignore", "-q", "--", rel], raiz)
        if c == 0:
            return  # ignorado por git: no viaja en el PR (skills copiadas, .torre/, borradores)
        vf = os.path.join(SCRIPTS, "verificar-frontera.sh")
        if not os.path.isfile(vf):
            bloquear("no encuentro agentes/scripts/verificar-frontera.sh para revisar la frontera; bloqueo (falla cerrado).")
        r = subprocess.run(["bash", vf, "--ruta", rel], capture_output=True, text=True)
        if r.returncode != 0:
            bloquear("'%s' está fuera de la frontera del equipo: %s" % (rel, (r.stdout or r.stderr).strip()),
                     "si la historia lo necesita, el Productor lo pide a la sesión integradora (Felipe).")
        return
    if es_temporal(a) or a.startswith(os.path.realpath(os.path.expanduser("~/.openmausbot")) + "/"):
        return
    bloquear("un bot del equipo no escribe fuera de las carpetas del equipo (%s)." % a,
             "trabaja dentro de tu carpeta o en un temporal.")

def revisar_mcp(nombre):
    if re.search(r"__(apply_migration|execute_sql|deploy_edge_function|merge_branch|reset_branch|rebase_branch|"
                 r"delete_branch|pause_project|restore_project|create_project)$", nombre):
        bloquear("'%s' toca Supabase con SQL o migraciones: eso lo hace Felipe, nunca una sesión." % nombre)
    if re.search(r"__(create_deployment|request_promote|request_rollback|deploy_to_vercel|redeploy)$", nombre):
        bloquear("'%s' es un deploy: los deploys los hace Vercel solo tras el merge a main." % nombre)

# ---------------------------------------------------------------- Bash: partir el comando
def sustituciones(texto):
    """Extrae el contenido de $( … ) y ` … ` fuera de comillas simples."""
    hallados, i, n, simple = [], 0, len(texto), False
    while i < n:
        ch = texto[i]
        if ch == "\\" and not simple:
            i += 2; continue
        if ch == "'" :
            simple = not simple; i += 1; continue
        if simple:
            i += 1; continue
        if texto.startswith("$(", i) and not texto.startswith("$((", i):
            prof, j = 1, i + 2
            while j < n and prof:
                if texto[j] == "(": prof += 1
                elif texto[j] == ")": prof -= 1
                j += 1
            hallados.append(texto[i + 2:j - 1]); i = j; continue
        if ch == "`":
            j = texto.find("`", i + 1)
            if j == -1: j = n
            hallados.append(texto[i + 1:j]); i = j + 1; continue
        i += 1
    return hallados

HEREDOC = re.compile(r"<<-?\s*(['\"]?)([A-Za-z_][A-Za-z0-9_]*)\1")
def quitar_heredocs(cmd):
    """Los cuerpos de heredoc son dato. Si un heredoc alimenta a un shell, se bloquea."""
    lineas, salida, i = cmd.split("\n"), [], 0
    while i < len(lineas):
        l = lineas[i]
        m = HEREDOC.search(l)
        salida.append(l)
        if m and "<<<" not in l[max(0, m.start() - 1):m.start() + 3]:
            fin = m.group(2)
            if re.search(r"(^|[|;&\s])(bash|sh|zsh|dash)(\s|$)", l):
                bloquear("un heredoc que se ejecuta con un shell no se puede revisar.",
                         "escribe el script a un archivo y córrelo por ruta, o usa comandos directos.")
            i += 1
            while i < len(lineas) and lineas[i].strip() != fin:
                i += 1
        i += 1
    return "\n".join(salida)

def tokens(cmd):
    lex = shlex.shlex(cmd.replace("\n", " ; "), posix=True, punctuation_chars=";&|<>()")
    lex.whitespace_split = True
    lex.commenters = ""
    try:
        return list(lex)
    except ValueError:
        bloquear("no pude leer el comando (¿comillas sin cerrar?); no lo dejo pasar a ciegas.")

SEPARADORES = {";", "&&", "||", "|", "&", "(", ")", ";;", "|&", ";&"}
REDIRS = {"<", ">", ">>", "<<", "<<<", ">&", "<&", ">|", "&>", "&>>", "2>", "2>>"}
def segmentos(toks):
    seg, out = [], []
    for t in toks:
        if t in SEPARADORES:
            if seg: out.append(seg)
            seg = []
        else:
            seg.append(t)
    if seg: out.append(seg)
    return out

ENVOLTORIOS = {"sudo", "nohup", "time", "command", "exec", "nice", "builtin", "caffeinate", "stdbuf"}
def palabra_de_comando(seg):
    i = 0
    while i < len(seg):
        t = seg[i]
        if re.match(r"^[A-Za-z_][A-Za-z0-9_]*=", t):
            i += 1; continue
        if t == "env":
            i += 1
            while i < len(seg) and (seg[i].startswith("-") or "=" in seg[i]): i += 1
            continue
        if t == "timeout":
            i += 1
            while i < len(seg) and (seg[i].startswith("-") or re.match(r"^\d", seg[i])): i += 1
            continue
        if t in ENVOLTORIOS:
            i += 1
            while i < len(seg) and seg[i].startswith("-"): i += 1
            continue
        return seg[i:]
    return []

def args_y_redirs(seg):
    args, objetivos, i = [], [], 0
    while i < len(seg):
        t = seg[i]
        if t in REDIRS or re.match(r"^\d*[<>]+&?$", t):
            if i + 1 < len(seg): objetivos.append(seg[i + 1])
            i += 2; continue
        args.append(t); i += 1
    return args, objetivos

def banderas_cortas(args, letra):
    return any(re.match(r"^-[A-Za-z]+$", a) and letra in a[1:] for a in args)

# ---------------------------------------------------------------- reglas por comando
def rama_actual(cwd):
    c, out = git(["symbolic-ref", "--quiet", "--short", "HEAD"], cwd)
    return out if c == 0 else None

def tiene_upstream(cwd):
    c, _ = git(["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"], cwd)
    return c == 0

def regla_git(args, cwd, prof):
    globales, i = [], 0
    while i < len(args) and args[i].startswith("-"):
        a = args[i]
        if a in ("-C", "-c", "--git-dir", "--work-tree", "--namespace", "--exec-path") and i + 1 < len(args):
            if a == "-C":
                cwd = absoluta(args[i + 1], cwd)
            if a == "-c" and EQUIPO and "hookspath" in args[i + 1].lower():
                bloquear("un bot no desactiva los hooks de git (core.hooksPath).")
            globales += [a, args[i + 1]]; i += 2; continue
        if a.startswith("--git-dir=") or a.startswith("--work-tree="):
            i += 1; continue
        i += 1
    if i >= len(args):
        return
    sub, resto = args[i], args[i + 1:]
    if sub == "rebase":
        bloquear("git rebase reescribe historia; aquí las ramas se actualizan solo con merge.",
                 "git merge origin/main (o actualizar-rama.sh de la Torre).")
    if sub in ("filter-branch", "filter-repo"):
        bloquear("reescribir historia está prohibido.")
    if sub == "update-ref" and ("-d" in resto or "--delete" in resto):
        bloquear("borrar referencias a mano está prohibido.")
    if sub == "push":
        if any(a in ("--force", "--mirror", "--force-if-includes") or a.startswith("--force-with-lease") for a in resto) \
                or banderas_cortas(resto, "f"):
            bloquear("git push --force reescribe la rama remota.", "push normal; si te rechaza, merge de origin/main y vuelve a empujar.")
        pos = [a for a in resto if not a.startswith("-")]
        refspecs = pos[1:] if pos else []
        for r in refspecs:
            if r.startswith("+"):
                bloquear("un refspec con '+' es un push forzado.")
        borrar = "--delete" in resto or banderas_cortas(resto, "d")
        nombres = refspecs if borrar else [r[1:] for r in refspecs if r.startswith(":")]
        for nombre in nombres:
            n = nombre.replace("refs/heads/", "")
            if not n.startswith("equipo/"):
                bloquear("borrar la rama remota '%s' (no es del equipo) está prohibido." % n)
        if EQUIPO:
            if "--no-verify" in resto:
                bloquear("un bot no se salta el pre-push.")
            destinos = [r.split(":")[-1].replace("refs/heads/", "") for r in refspecs if not r.startswith(":")]
            actual = rama_actual(cwd)
            if "main" in destinos or (actual in ("main", "master") and (not refspecs or "HEAD" in destinos)):
                bloquear("el equipo nunca empuja a main: todo entra por PR y lo mergea DevOps con las condiciones.")
    if sub == "reset" and "--hard" in resto:
        rama = rama_actual(cwd)
        if rama is None or rama in ("main", "master") or tiene_upstream(cwd):
            bloquear("git reset --hard sobre %s borra trabajo compartido." % (rama or "un HEAD suelto"),
                     "git restore <archivo>, git stash, o un commit nuevo que deshaga el cambio.")
    if sub == "branch":
        borra = "--delete" in resto or banderas_cortas(resto, "d") or banderas_cortas(resto, "D")
        fuerza = "-D" in resto or banderas_cortas(resto, "D") or "--force" in resto or banderas_cortas(resto, "f")
        if borra and fuerza:
            bloquear("git branch -D (o -d --force) borra sin comprobar que la rama esté mergeada.")
        if borra:
            for n in [a for a in resto if not a.startswith("-")]:
                if not n.startswith("equipo/"):
                    bloquear("borrar la rama '%s' (no es del equipo) está prohibido." % n)
    if sub == "clean" and (banderas_cortas(resto, "x") or banderas_cortas(resto, "X")):
        bloquear("git clean -x borraría .env.local, node_modules y las skills copiadas.", "git clean -n para ver qué borraría, sin -x.")
    if sub == "worktree" and resto[:1] in (["remove"], ["prune"]) and EQUIPO:
        bloquear("un bot no elimina worktrees: las carpetas del equipo son fijas.")
    if sub == "config" and EQUIPO and any("hookspath" in a.lower() for a in resto):
        bloquear("un bot no cambia core.hooksPath.")

def numero_pr(resto):
    for a in resto:
        if re.match(r"^#?\d+$", a):
            return a.lstrip("#")
        m = re.search(r"/pull/(\d+)", a)
        if m: return m.group(1)
    return None

def exigir_condiciones(pr):
    cm = os.path.join(SCRIPTS, "condiciones-merge.sh")
    if not os.path.isfile(cm):
        bloquear("no encuentro agentes/scripts/condiciones-merge.sh; sin él no se mergea (falla cerrado).")
    try:
        r = subprocess.run(["bash", cm, pr, "--repo", RAIZ], capture_output=True, text=True, timeout=120)
    except Exception as e:
        bloquear("no pude comprobar las condiciones de merge (%s); no mergeo a ciegas." % e)
    if r.returncode != 0:
        bloquear("el PR #%s no cumple las condiciones de merge: %s" % (pr, (r.stdout + r.stderr).strip()[:1500]))

def regla_gh(args):
    if not args: return
    sub = args[0]; resto = args[1:]
    if sub == "pr" and resto[:1] == ["merge"]:
        r2 = resto[1:]
        if any(a in ("--admin", "--auto", "--merge", "-m", "--rebase", "-r", "--disable-auto") for a in r2):
            bloquear("gh pr merge solo con --squash y sin --admin ni --auto.")
        pr = numero_pr(r2)
        if not pr:
            bloquear("gh pr merge sin número de PR: indícalo para comprobar las condiciones.")
        exigir_condiciones(pr)
        return
    if sub == "api":
        texto = " ".join(resto)
        metodo = None
        for i, a in enumerate(resto):
            if a in ("-X", "--method") and i + 1 < len(resto): metodo = resto[i + 1].upper()
            elif a.startswith("-X") and len(a) > 2: metodo = a[2:].upper()
            elif a.startswith("--method="): metodo = a.split("=", 1)[1].upper()
        if metodo == "DELETE":
            bloquear("gh api con DELETE está prohibido.")
        if re.search(r"/merges?\b", texto):
            bloquear("mergear por la API salta las condiciones.", "agentes/torre/scripts/mergear.sh <N>.")
        if "git/refs" in texto and metodo not in (None, "GET"):
            bloquear("modificar refs por la API está prohibido.")
    if sub in ("secret", "variable"):
        bloquear("los secretos y variables del repo los maneja Felipe.")
    if sub == "repo" and resto[:1] and resto[0] in ("delete", "archive", "rename", "edit"):
        bloquear("cambiar o borrar el repo está prohibido.")
    if sub == "pr" and resto[:1] == ["close"] and EQUIPO:
        bloquear("un bot no cierra PRs; lo decide Felipe.")

VERCEL_OK = {"ls", "list", "inspect", "logs", "whoami", "help"}
def regla_vercel(args):
    pos = [a for a in args if not a.startswith("-")]
    if not pos:
        if any(a in ("--version", "-v", "--help", "-h") for a in args): return
        bloquear("'vercel' sin subcomando despliega.", "vercel ls / inspect / logs para mirar; los deploys los hace Vercel tras el merge.")
    if pos[0] not in VERCEL_OK:
        bloquear("'vercel %s' no está permitido: solo ls, inspect, logs, whoami." % pos[0])

SUPA_MALOS = {"push", "link", "unlink", "repair", "up", "execute", "remote", "--linked", "--db-url", "deploy",
              "secrets", "projects", "branches", "query", "squash", "dump"}
def regla_supabase(args):
    if EQUIPO and not all(a in ("--version", "-v", "--help", "-h", "status") for a in args):
        bloquear("el equipo no usa la CLI de Supabase: trabaja contra el asesor simulado, sin esquema ni migraciones.")
    for a in args:
        if a in SUPA_MALOS or a.startswith("--db-url="):
            bloquear("'supabase %s' toca la base o el proyecto remoto: las migraciones las aplica Felipe." % " ".join(args))
    if "config" in args and "push" in args:
        bloquear("supabase config push cambia el proyecto remoto.")

def declaradas(cwd):
    rama = rama_actual(cwd) or ""
    m = re.match(r"^equipo/([a-z][a-z0-9]*-\d+)", rama)
    if not m: return None, set()
    raiz = raiz_de(cwd) or RAIZ
    f = os.path.join(raiz, "docs", "superpowers", "hilos", m.group(1) + ".md")
    try:
        texto = open(f, encoding="utf-8").read()
    except Exception:
        return m.group(1), set()
    linea = re.search(r"Dependencias declaradas:\**\s*(.*)", texto)
    if not linea: return m.group(1), set()
    nombres = set()
    for p in re.split(r"[,\s]+", linea.group(1)):
        p = p.strip("`*. ")
        if not p or p.lower() == "ninguna": continue
        nombres.add(nombre_paquete(p))
    return m.group(1), nombres

def nombre_paquete(spec):
    if spec.startswith("@"):
        partes = spec.split("@")
        return "@" + partes[1]
    return spec.split("@")[0]

NPM_INSTALAR = {"install", "i", "in", "ins", "inst", "insta", "instal", "isnt", "isnta", "isntal", "isntall", "add"}
def regla_paquetes(cmd, args, cwd):
    if not args: return
    sub = args[0]
    if cmd == "npm" and sub not in NPM_INSTALAR: return
    if cmd in ("pnpm", "yarn") and sub not in ("add",) and not (cmd == "pnpm" and sub in ("install", "i")): return
    if cmd == "bun" and sub not in ("add", "install", "i"): return
    paquetes, i, conval = [], 1, {"--prefix", "-C", "--cwd", "--workspace", "-w", "--registry", "--tag"}
    while i < len(args):
        a = args[i]
        if a in conval: i += 2; continue
        if not a.startswith("-"): paquetes.append(nombre_paquete(a))
        i += 1
    if not paquetes: return  # npm install / npm ci: instala lo que ya está en el lockfile
    hid, ok = declaradas(cwd)
    faltan = [p for p in paquetes if p not in ok]
    if faltan:
        bloquear("instalar %s no está declarado en el hilo de la historia%s." % (", ".join(faltan), (" " + hid) if hid else ""),
                 "el Productor declara la dependencia en 'Dependencias declaradas' del hilo (o Felipe la instala en su sesión).")

def regla_rm(args, cwd, nombre="rm"):
    recursivo = any(a in ("-r", "-R", "--recursive") for a in args) or banderas_cortas(args, "r") or banderas_cortas(args, "R")
    objetivos = [a for a in args if not a.startswith("-")]
    for o in objetivos:
        if es_secreto(o):
            bloquear("'%s' es un archivo de secretos: no se borra desde una sesión." % o)
    if not recursivo: return
    if not objetivos:
        bloquear("%s recursivo sin objetivo visible (¿xargs?): no lo dejo pasar." % nombre)
    for o in objetivos:
        if any(c in o for c in "*?[") :
            bloquear("%s recursivo con comodines ('%s') no se permite." % (nombre, o))
        a = absoluta(o, cwd)
        if os.path.basename(a) in REGENERABLES or es_temporal(a):
            continue
        bloquear("%s recursivo sobre '%s' no está permitido (solo carpetas regenerables o temporales)." % (nombre, o),
                 "borra archivos puntuales, o pide a Felipe si de verdad hay que borrar una carpeta.")

def regla_find(args, cwd, prof):
    inicio = []
    for a in args:
        if a.startswith("-") or a in ("(", ")", "!"): break
        inicio.append(a)
    if "-delete" in args:
        regla_rm(["-r"] + (inicio or ["."]), cwd, "find -delete")
    for marca in ("-exec", "-execdir", "-ok", "-okdir"):
        if marca in args:
            k = args.index(marca) + 1
            interno = []
            while k < len(args) and args[k] not in (";", "+", "\\;"):
                interno.append(args[k]); k += 1
            revisar_segmento(interno, cwd, prof + 1)

LECTURA_INOCUA = {"ls", "test", "[", "[[", "stat"}
INTERPRETES = {"node", "python", "python3", "ruby", "perl", "deno", "bun", "php", "tsx", "ts-node", "osascript"}

def revisar_segmento(seg, cwd, prof):
    if prof > MAX_PROF:
        bloquear("demasiados niveles de bash -c / eval anidados para revisarlos.")
    seg = palabra_de_comando(seg)
    if not seg: return cwd
    args, redirs = args_y_redirs(seg)
    for r in redirs:
        if es_secreto(r):
            bloquear("redirigir hacia o desde '%s' (secretos) está prohibido." % r)
    if not args: return cwd
    cmd = os.path.basename(args[0]); resto = args[1:]

    # secretos
    if cmd not in LECTURA_INOCUA and any(es_secreto(a.split("=", 1)[-1]) for a in resto):
        bloquear("el comando nombra un archivo .env*: no se lee ni se imprime.",
                 "web/.env.local.example muestra qué variables existen.")
    if cmd in INTERPRETES or cmd in ("dotenv", "dotenvx"):
        if cmd in ("dotenv", "dotenvx") or any(menciona_secreto(a) for a in resto):
            bloquear("ese comando lee un archivo .env*: no se imprime ni se pasa a otro programa.")
    if cmd in ("grep", "egrep", "fgrep") and (any(a in ("-r", "-R", "--recursive") for a in resto) or banderas_cortas(resto, "r") or banderas_cortas(resto, "R")):
        if not any(a.startswith("--exclude") and ".env" in a for a in resto):
            pos = [a for a in resto if not a.startswith("-")]
            dirs = pos[1:] or ["."]
            for d in dirs:
                ad = absoluta(d, cwd)
                for cand in (ad, os.path.join(ad, "web")):
                    try:
                        if any(es_secreto(x) for x in os.listdir(cand)):
                            bloquear("grep recursivo sobre '%s' imprimiría .env.local." % d, "usa rg (respeta .gitignore) o agrega --exclude='.env*'.")
                    except OSError:
                        pass
    if cmd in ("source", ".") and resto and es_secreto(resto[0]):
        bloquear("cargar un .env* en la terminal expone secretos.")

    if cmd == "cd":
        if resto and os.path.isdir(absoluta(resto[0], cwd)):
            return absoluta(resto[0], cwd)
        return cwd
    if cmd in ("bash", "sh", "zsh", "dash"):
        if "-c" in resto:
            k = resto.index("-c")
            if k + 1 < len(resto):
                revisar_comando(resto[k + 1], cwd, prof + 1)
            return cwd
        guion = next((a for a in resto if not a.startswith("-")), None)
        if guion: regla_guion(guion, resto[resto.index(guion) + 1:])
        return cwd
    if cmd == "eval":
        revisar_comando(" ".join(resto), cwd, prof + 1); return cwd
    if cmd == "xargs":
        k = 0
        while k < len(resto) and resto[k].startswith("-"):
            k += 2 if resto[k] in ("-I", "-n", "-P", "-L", "-d", "-E", "-s") else 1
        revisar_segmento(resto[k:], cwd, prof + 1); return cwd
    if cmd in ("npx", "bunx", "pnpx"):
        k = 0
        while k < len(resto) and resto[k].startswith("-"): k += 1
        if k < len(resto): revisar_segmento(resto[k:], cwd, prof + 1)
        return cwd
    if cmd in ("pnpm", "yarn") and resto[:1] == ["dlx"]:
        revisar_segmento(resto[1:], cwd, prof + 1); return cwd
    if cmd == "npm" and resto[:1] == ["exec"]:
        k = 1
        while k < len(resto) and (resto[k].startswith("-") or resto[k] == "--"): k += 1
        revisar_segmento(resto[k:], cwd, prof + 1); return cwd

    if cmd == "git": regla_git(resto, cwd, prof)
    elif cmd == "gh": regla_gh(resto)
    elif cmd == "vercel": regla_vercel(resto)
    elif cmd == "supabase": regla_supabase(resto)
    elif cmd in ("psql", "pg_dump", "pg_restore", "pg_dumpall"):
        bloquear("'%s' toca una base Postgres directamente: prohibido desde una sesión." % cmd)
    elif cmd in ("npm", "pnpm", "yarn", "bun"): regla_paquetes(cmd, resto, cwd)
    elif cmd == "rm": regla_rm(resto, cwd)
    elif cmd == "find": regla_find(resto, cwd, prof)
    elif cmd.endswith(".sh"): regla_guion(args[0], resto)
    return cwd

def regla_guion(ruta, resto):
    b = os.path.basename(ruta)
    if b == "mergear.sh":
        if "--ensayo" in resto: return
        pr = numero_pr(resto)
        if not pr: bloquear("mergear.sh sin número de PR.")
        exigir_condiciones(pr)

def revisar_comando(cmd, cwd, prof=0):
    if prof > MAX_PROF:
        bloquear("demasiados niveles anidados para revisar el comando.")
    cmd = quitar_heredocs(cmd)
    for interno in sustituciones(cmd):
        revisar_comando(interno, cwd, prof + 1)
    for seg in segmentos(tokens(cmd)):
        cwd = revisar_segmento(seg, cwd, prof) or cwd

try:
    if TOOL == "Bash":
        revisar_comando(TI.get("command") or "", CWD0)
    elif TOOL in ("Read", "NotebookRead"):
        revisar_archivo(TI.get("file_path") or TI.get("notebook_path") or "", False)
    elif TOOL == "Grep":
        for clave in ("path", "glob"):
            v = TI.get(clave) or ""
            if es_secreto(v) or menciona_secreto(v):
                bloquear("buscar dentro de archivos .env* expone secretos.")
    elif TOOL in ("Edit", "Write", "MultiEdit", "NotebookEdit"):
        revisar_archivo(TI.get("file_path") or TI.get("notebook_path") or "", True)
    elif TOOL.startswith("mcp__"):
        revisar_mcp(TOOL)
except Bloqueo as b:
    print("FRENO: " + str(b), file=sys.stderr)
    sys.exit(2)
sys.exit(0)
PY

python3 -I -c "$PROGRAMA"
r=$?
[ "$r" -eq 0 ] && exit 0
[ "$r" -ne 2 ] && echo "FRENO: el revisor terminó con error ($r); bloqueo por seguridad (falla cerrado)." >&2
exit 2
