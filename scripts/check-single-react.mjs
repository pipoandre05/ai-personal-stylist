// Falla si `react` o `react-dom` tienen más de una copia física en node_modules
// (dos Reacts rompen hooks en runtime). Se corre en CI y en `npm run verify`.
import { execFileSync } from "node:child_process";

function copias(nombre) {
  let raw;
  try {
    raw = execFileSync("npm", ["query", `#${nombre}`], {
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch (err) {
    // `npm query` puede salir con código != 0 pero igual imprimir el JSON.
    raw = err.stdout;
    if (!raw) {
      console.error(`No se pudo ejecutar \`npm query #${nombre}\`:`, err.message);
      process.exit(1);
    }
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error(`La salida de \`npm query #${nombre}\` no es JSON válido:`, err.message);
    process.exit(1);
  }
}

let fallo = false;
const ok = [];
for (const nombre of ["react", "react-dom"]) {
  const nodos = copias(nombre);
  if (nodos.length === 0) {
    console.error(`${nombre} no aparece en el árbol de dependencias`);
    fallo = true;
  } else if (nodos.length > 1) {
    console.error(`${nombre} duplicado (${nodos.length} copias):`);
    for (const n of nodos) console.error(`  - ${n.location}@${n.version}`);
    fallo = true;
  } else {
    ok.push(`${nombre} ${nodos[0].version}`);
  }
}
if (fallo) process.exit(1);
console.log(`react OK: ${ok.join(", ")} (1 copia cada uno)`);
