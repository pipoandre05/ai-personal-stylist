import { buildPhotoPath, fitWithin } from "@/lib/domain/photo-path";
import { createClient } from "@/lib/supabase/client";

const MAX_SIDE = 1280;
const QUALITY = 0.85;

async function decode(file: File): Promise<{ source: CanvasImageSource; width: number; height: number; close: () => void }> {
  // `from-image` aplica la orientación EXIF antes de que se pierda al re-codificar.
  if (typeof createImageBitmap === "function") {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { source: bmp, width: bmp.width, height: bmp.height, close: () => bmp.close() };
    } catch {
      // cae al <img>
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, close: () => URL.revokeObjectURL(url) };
  } catch (err) {
    URL.revokeObjectURL(url);
    throw err;
  }
}

/** Comprime a JPEG de lado mayor ≤ 1280 px. Al re-codificar se pierden el EXIF y la ubicación. */
export async function compressImage(file: File): Promise<Blob> {
  const decoded = await decode(file);
  try {
    const { width, height } = fitWithin(decoded.width, decoded.height, MAX_SIDE);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const g = canvas.getContext("2d");
    if (!g) throw new Error("canvas");
    g.fillStyle = "#ffffff"; // PNG con transparencia -> fondo blanco en lugar de negro
    g.fillRect(0, 0, width, height);
    g.drawImage(decoded.source, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", QUALITY));
    if (!blob) throw new Error("toBlob");
    return blob;
  } finally {
    decoded.close();
  }
}

/** Comprime y sube a `user-media/{user_id}/{kind}/{uuid}.jpg`. Devuelve el `photo_path`. */
export async function uploadUserImage(file: File, kind: "garments" | "selfies" | "chat"): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Elige una foto (JPG, PNG o WebP).");

  let blob: Blob;
  try {
    blob = await compressImage(file);
  } catch {
    throw new Error("No pudimos leer esa foto. Prueba con otra.");
  }

  const supabase = createClient();
  const { data, error: userError } = await supabase.auth.getUser();
  if (userError || !data.user) throw new Error("Tu sesión expiró. Vuelve a entrar para continuar.");

  const path = buildPhotoPath(data.user.id, kind, crypto.randomUUID());
  const { error } = await supabase.storage.from("user-media").upload(path, blob, {
    contentType: "image/jpeg",
    upsert: false,
  });
  if (error) throw new Error("No pudimos subir la foto. Revisa tu conexión e intenta de nuevo.");
  return path;
}
