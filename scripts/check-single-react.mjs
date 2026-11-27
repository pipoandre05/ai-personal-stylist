// Falla si el árbol de dependencias resuelve más de una versión de `react`
// (dos Reacts rompen hooks en runtime). Se corre en CI y en `npm run verify`.
import { execFileSync } from "node:child_process";

let raw;
try {
  raw = execFileSync("npm", ["ls", "react", "--all", "--json"], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
} catch (err) {
  // `npm ls` sale con código 1 si hay problemas de árbol, pero igual imprime el JSON.
  raw = err.stdout;
  if (!raw) {
    console.error("No se pudo ejecutar `npm ls react`:", err.message);
    process.exit(1);
  }
}

const versions = new Set();
function walk(deps) {
  for (const [name, node] of Object.entries(deps ?? {})) {
    if (name === "react" && node.version) versions.add(node.version);
    walk(node.dependencies);
  }
}
walk(JSON.parse(raw).dependencies);

if (versions.size === 0) {
  console.error("react no aparece en el árbol de dependencias");
  process.exit(1);
}
if (versions.size > 1) {
  console.error(`React duplicado: ${[...versions].join(", ")}`);
  process.exit(1);
}
console.log(`react OK ${[...versions][0]}`);
