// Relevo de una foto elegida fuera del hilo (Tu espacio) hacia una conversación nueva.
// La foto viaja en memoria, nunca por la dirección ni por almacenamiento del navegador: la ruta de una foto lleva el id
// de la persona. Si la página se recarga antes de entregarla, se pierde y la persona vuelve a elegirla.

export type PendingPhoto = { file: File; text: string };

let pending: PendingPhoto | null = null;

/** Deja una foto lista para que la tome la próxima conversación nueva que se abra. */
export function setPendingPhoto(photo: PendingPhoto): void {
  pending = photo;
}

/** Entrega la foto pendiente una sola vez (después queda vacío). */
export function takePendingPhoto(): PendingPhoto | null {
  const taken = pending;
  pending = null;
  return taken;
}
