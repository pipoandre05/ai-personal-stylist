/** Ruta de una sesión nueva. */
export const NEW_SESSION_PATH = "/asesor";

/** ¿Hay que partir de cero? Sí, cuando se llega a la ruta de sesión nueva viniendo de otra dirección. */
export function startsNewSession(previousPath: string | null, nextPath: string | null): boolean {
  return nextPath === NEW_SESSION_PATH && previousPath !== NEW_SESSION_PATH;
}
