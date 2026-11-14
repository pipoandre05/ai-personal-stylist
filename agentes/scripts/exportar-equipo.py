#!/usr/bin/env python3
"""exportar-equipo.py — arma los SOUL y el archivo de equipo de OpenMausBot desde agentes/bots/.

Uso:
  python3 -I agentes/scripts/exportar-equipo.py             sincroniza el bloque común en los 6 SOUL y escribe el JSON
  python3 -I agentes/scripts/exportar-equipo.py --verificar solo comprueba (no escribe); código 1 si algo no calza

Fuente única del bloque común: agentes/bots/_comun.md. Cada SOUL.md = parte propia del rol + bloque común.
El JSON sale en el formato vigente de la app (openmaus.team v2, server/team-manifest.js de OpenMausBot 0.1.158):
solo nombre, título, descripción, SOUL y color por miembro. Modelo, esfuerzo, carpeta, aprobación y sala NO
viajan en ese formato: van en agentes/configuracion-bots.json y se configuran a mano (plan §11).
"""
import json, os, re, sys

AQUI = os.path.dirname(os.path.abspath(__file__))
AGENTES = os.path.dirname(AQUI)
BOTS = os.path.join(AGENTES, "bots")
SALIDA = os.path.join(AGENTES, "ai-personal-stylist.mausteam.json")
MARCA = "## Bloque común del equipo Estilo"

# Límites copiados del esquema de la app (team-manifest.js, bot-profile.js, wire.js)
COLORES = {"green", "blue", "red", "orange", "purple", "cyan", "pink", "yellow", "teal", "coral", "silver", "chrome"}
MAX_SOUL = 24_000

EQUIPO = {
    "name": "Estilo — Equipo de interfaz",
    "description": ("Seis bots que construyen la interfaz conversacional de ai-personal-stylist (Estilo) contra el asesor "
                    "simulado: Productor, Diseño, Constructor, Revisor, QA y DevOps. Una línea, merge por condiciones "
                    "objetivas, freno y frontera de archivos. Plan: docs/superpowers/plans/2026-11-14-equipo-mausbot.md."),
}
MIEMBROS = [
    ("productor", "Productor Estilo", "Director de ejecución (Chief of Staff)", "purple",
     "Elige y abre cada historia de interfaz, arma las conversaciones entre bots, valida traspasos, zanja desacuerdos "
     "y solo escala a Felipe dudas funcionales que no estén en docs/producto/."),
    ("diseno", "Diseño Estilo", "Maquetas y revisión visual", "pink",
     "Maqueta HTML de cada historia como conversación con el asesor (validada por un subagente Opus) y revisión de lo "
     "construido contra la maqueta."),
    ("constructor", "Constructor Estilo", "Interfaz, línea 1", "blue",
     "Construye la interfaz dentro de la frontera y conversa con Revisor, QA y Diseño hasta que Revisor y QA aprueban."),
    ("revisor", "Revisor Estilo", "Revisión de código", "teal",
     "Revisa la rama completa (frontera, seguridad, reglas del repo, tokens, tests) y firma un veredicto sobre un sha."),
    ("qa", "QA Estilo", "Humo y pruebas", "orange",
     "Prueba cada historia con build de producción contra el asesor simulado a 390 px, itera con el Constructor "
     "(tope 4 vueltas) y firma un veredicto sobre un sha."),
    ("devops", "DevOps Estilo", "Torre de Control: ramas, PR y merge", "green",
     "Crea las ramas, las mantiene al día con main por merge, abre el PR, mergea con squash cuando se cumplen las "
     "condiciones objetivas y revierte si la CI de main se pone roja."),
]

def leer(p):
    with open(p, encoding="utf-8") as f:
        return f.read()

def main():
    verificar = "--verificar" in sys.argv
    comun = leer(os.path.join(BOTS, "_comun.md")).strip()
    if not comun.startswith(MARCA):
        sys.exit("ERROR: _comun.md debe empezar con '%s'" % MARCA)
    problemas, miembros = [], []
    for key, name, title, color, desc in MIEMBROS:
        ruta = os.path.join(BOTS, key, "SOUL.md")
        texto = leer(ruta)
        propio = texto.split(MARCA)[0].rstrip()
        soul = propio + "\n\n" + comun + "\n"
        if texto != soul:
            if verificar:
                problemas.append("%s: el bloque común no coincide con _comun.md (corre sin --verificar)" % key)
            else:
                with open(ruta, "w", encoding="utf-8") as f:
                    f.write(soul)
        n = len(soul.encode("utf-8"))
        if n > MAX_SOUL: problemas.append("%s: SOUL de %d bytes (máx. %d)" % (key, n, MAX_SOUL))
        if not re.match(r"^[a-z0-9][a-z0-9_-]*$", key) or len(key) > 64: problemas.append("%s: key inválida" % key)
        if not (1 <= len(name.strip()) <= 100): problemas.append("%s: nombre fuera de 1–100" % key)
        if len(title) > 200: problemas.append("%s: título > 200" % key)
        if len(desc) > 4000: problemas.append("%s: descripción > 4000" % key)
        if color not in COLORES: problemas.append("%s: color '%s' no soportado" % (key, color))
        miembros.append({"key": key, "name": name, "title": title, "description": desc, "soul": soul,
                         "appearance": {"color": color}})
    if len({m["key"] for m in miembros}) != len(miembros): problemas.append("keys repetidas")
    if len({m["name"].lower() for m in miembros}) != len(miembros): problemas.append("nombres repetidos")
    if len(EQUIPO["name"]) > 100 or len(EQUIPO["description"]) > 2000: problemas.append("nombre o descripción del equipo muy largos")
    manifiesto = {"format": "openmaus.team", "version": 2,
                  "team": {"name": EQUIPO["name"], "description": EQUIPO["description"], "members": miembros}}
    texto_json = json.dumps(manifiesto, ensure_ascii=False, indent=2) + "\n"
    if verificar:
        if not os.path.exists(SALIDA) or leer(SALIDA) != texto_json:
            problemas.append("el JSON no está al día con los SOUL (corre sin --verificar)")
    elif not problemas:
        with open(SALIDA, "w", encoding="utf-8") as f:
            f.write(texto_json)
    for m in miembros:
        print("%-12s %6d bytes de SOUL" % (m["key"], len(m["soul"].encode("utf-8"))))
    if problemas:
        print("PROBLEMAS:\n  - " + "\n  - ".join(problemas))
        sys.exit(1)
    print("OK: %d miembros, bloque común idéntico, límites del esquema respetados%s." %
          (len(miembros), "" if verificar else "; escrito " + os.path.relpath(SALIDA, os.path.dirname(AGENTES))))

if __name__ == "__main__":
    main()
