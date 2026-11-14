import type { PhotoKind } from "./types";

const FILE = /^[A-Za-z0-9_-]{8,64}\.(jpg|jpeg|png|webp)$/;
const KINDS: readonly string[] = ["garments", "selfies", "chat"];

/** La ruta debe ser `{user_id}/{kind}/{archivo}` y pertenecer a la sesión. Pura. */
export function isOwnPhotoPath(path: unknown, userId: string): path is string {
  if (typeof path !== "string" || path.length > 200 || !userId) return false;
  const parts = path.split("/");
  if (parts.length !== 3) return false;
  const [owner, kind, file] = parts;
  return owner === userId && KINDS.includes(kind) && FILE.test(file);
}

export function buildPhotoPath(userId: string, kind: PhotoKind, uuid: string): string {
  return `${userId}/${kind}/${uuid}.jpg`;
}

/** Escala para que el lado mayor no pase de `max`, sin agrandar. */
export function fitWithin(width: number, height: number, max: number): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= max) return { width, height };
  const ratio = max / longest;
  return { width: Math.round(width * ratio), height: Math.round(height * ratio) };
}
