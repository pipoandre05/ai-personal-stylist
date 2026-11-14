"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { IconCamera, IconClose, cn } from "@/components/ui";
import { setPendingPhoto } from "@/components/chat/pending-photo";
import { compressImage } from "@/lib/client/upload";

export type PhotoFlowKind = "selfie" | "garment";

export type PhotoFlowButtonProps = {
  kind: PhotoFlowKind;
  label?: string;
  className?: string;
  variant?: "accion" | "contorno";
  id?: string;
  children?: ReactNode;
};

const SELFIE_PROMPT =
  "Te mando una selfie. ¿Qué colores me favorecen? Dame una orientación.";
const GARMENT_PROMPT = "Te mando esta prenda. ¿Con qué la combino?";

function subscribeOnline(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

/**
 * Flujo de foto al asesor desde Tu espacio sin pasos muertos (UI-23).
 *
 * Abre directamente el selector nativo del sistema (sin atributo `capture`),
 * muestra la vista previa modal a pantalla completa (<dialog> accesible),
 * comprime la imagen en el cliente y abre de inmediato una conversación nueva
 * (/asesor) entregándole la foto en memoria: la subida y el turno del asesor se
 * ven en el hilo, con el rastro de lo que va haciendo.
 */
export function SpacePhotoButton({
  kind,
  label = "Mandar una foto al asesor",
  className,
  variant = "contorno",
  id,
  children,
}: PhotoFlowButtonProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const triggerBtnRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const primaryBtnRef = useRef<HTMLButtonElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "error" | "offline">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isOnline = useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true
  );

  // Limpieza de Object URLs para evitar memory leaks
  const cleanPreview = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }, [previewUrl]);

  const closeDialog = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    const dialog = dialogRef.current;
    if (dialog?.open) {
      dialog.close();
    }
    setDialogOpen(false);
    cleanPreview();
    setSelectedFile(null);
    setStatus("idle");
    setErrorMessage(null);
    // Devolver el foco al botón disparador
    triggerBtnRef.current?.focus();
  }, [cleanPreview]);

  // Manejo de apertura / cierre del diálogo modal con showModal()
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (dialogOpen && !dialog.open) {
      dialog.showModal();
      // Enfoque inicial en la acción principal ("Usar esta foto")
      primaryBtnRef.current?.focus();
    } else if (!dialogOpen && dialog.open) {
      dialog.close();
    }
  }, [dialogOpen]);

  const openSystemPicker = () => {
    const input = fileInputRef.current;
    if (!input) return;
    input.value = "";
    input.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      // Cancelar el selector del sistema no deja nada a medias
      return;
    }

    const file = files[0];
    try {
      // Comprime la imagen en cliente (lado mayor <= 1280 px, sin EXIF)
      const compressedBlob = await compressImage(file);
      const compressedFile = new File([compressedBlob], file.name, {
        type: "image/jpeg",
      });

      // Si había una preview anterior (al elegir otra foto 2 veces seguidas), liberarla
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      const nextUrl = URL.createObjectURL(compressedBlob);
      setSelectedFile(compressedFile);
      setPreviewUrl(nextUrl);
      setStatus("idle");
      setErrorMessage(null);
      setDialogOpen(true);
    } catch {
      setStatus("error");
      setErrorMessage("No pudimos leer esa foto. Prueba con otra.");
      setDialogOpen(true);
    } finally {
      // Permite elegir la misma foto si se desea
      e.target.value = "";
    }
  };

  /**
   * "Usar esta foto": abre de inmediato una conversación nueva y le entrega la foto. La subida, el asesor pensando y su
   * respuesta se ven en el hilo; aquí no se espera a que el asesor termine.
   */
  const handleUploadAndSend = () => {
    if (!selectedFile) return;

    if (!navigator.onLine) {
      setStatus("offline");
      return;
    }

    setPendingPhoto({ file: selectedFile, text: kind === "selfie" ? SELFIE_PROMPT : GARMENT_PROMPT });
    const dialog = dialogRef.current;
    if (dialog?.open) dialog.close();
    setDialogOpen(false);
    cleanPreview();
    setSelectedFile(null);
    router.push("/asesor");
  };

  const promptText = kind === "selfie" ? SELFIE_PROMPT : GARMENT_PROMPT;

  return (
    <>
      {/* Selector nativo del sistema sin atributo capture para ofrecer cámara o fototeca */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
        onChange={handleFileChange}
      />

      {/* Botón de activación en Tu espacio */}
      <button
        ref={triggerBtnRef}
        type="button"
        id={id}
        onClick={openSystemPicker}
        className={cn(
          variant === "accion"
            ? "inline-flex h-[52px] items-center justify-center gap-2 rounded-full bg-accion px-6 font-body text-base font-extrabold text-tinta transition-transform duration-140 active:scale-[0.96] focus-visible:ring-3 focus-visible:ring-foco"
            : "inline-flex h-11 items-center justify-center gap-2 rounded-full border-[1.5px] border-linea-fuerte bg-transparent px-5 font-body text-control text-tinta transition-transform duration-140 active:scale-[0.96] focus-visible:ring-3 focus-visible:ring-foco",
          className
        )}
      >
        {children ? (
          children
        ) : (
          <>
            <IconCamera className="size-5 shrink-0" aria-hidden="true" />
            <span>{label}</span>
          </>
        )}
      </button>

      {/* Vista previa modal a pantalla completa (<dialog> nativo accesible) */}
      <dialog
        ref={dialogRef}
        aria-labelledby="photo-preview-title"
        onCancel={(e) => {
          e.preventDefault();
          closeDialog();
        }}
        onClick={(e) => {
          if (e.target === dialogRef.current) {
            closeDialog();
          }
        }}
        className="m-0 fixed inset-0 z-50 open:flex size-full max-w-none max-h-none flex-col border-0 bg-fondo p-0 text-tinta backdrop:bg-tinta/40 overflow-hidden"
      >
        {/* Barra superior de la vista previa */}
        <header className="flex h-14 landscape:h-12 shrink-0 items-center justify-between px-6 landscape:px-6">
          <h2
            id="photo-preview-title"
            className="font-display text-titulo-s font-extrabold tracking-[-0.01em] text-tinta"
          >
            Tu foto
          </h2>
          <button
            type="button"
            onClick={closeDialog}
            aria-label="Cancelar y volver"
            className="-mr-2 flex size-11 items-center justify-center rounded-full text-tinta transition-colors hover:bg-hundido active:scale-[0.96] focus-visible:ring-3 focus-visible:ring-foco"
          >
            <IconClose className="size-5" />
          </button>
        </header>

        {/* Cuerpo: foto + mensaje que se enviará + estados de red */}
        <div className="flex-1 min-h-0 px-6 pt-2 pb-0 flex flex-col gap-4 overflow-hidden landscape:flex-row landscape:gap-6 landscape:items-stretch landscape:pt-0 landscape:pb-4">
          {/* Vista previa de la foto */}
          <div
            role="img"
            aria-label="Vista previa de tu foto"
            className="relative flex-1 min-h-0 rounded-foto overflow-hidden bg-hundido flex items-center justify-center landscape:flex-none landscape:h-full landscape:aspect-[4/5] landscape:w-auto"
          >
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Vista previa de tu foto"
                className="size-full object-cover rounded-foto"
              />
            ) : (
              <span className="font-body text-meta text-tinta-suave">Sin foto seleccionada</span>
            )}
          </div>

          {/* Panel lateral en apaisado o inferior en portrait */}
          <div className="flex flex-col gap-3 shrink-0 landscape:flex-1 landscape:justify-center">
            {/* Mensaje que se envía con la foto */}
            <div className="rounded-campo bg-hundido p-3 font-body text-cuerpo text-tinta">
              <small className="block font-body text-meta text-tinta-suave mb-0.5">
                Se envía con tu foto
              </small>
              {promptText}
            </div>

            {/* Estado: subiendo */}
            {status === "uploading" ? (
              <div
                className="rounded-campo bg-superficie p-3 font-body text-cuerpo flex flex-col gap-2"
                role="status"
                aria-live="polite"
              >
                <div className="flex items-center gap-3 font-body font-bold text-control text-tinta">
                  <span
                    className="size-4 shrink-0 rounded-full border-2 border-tinta border-r-transparent animate-spin motion-reduce:animate-none"
                    aria-hidden="true"
                  />
                  <span>Subiendo tu foto…</span>
                </div>
                <div className="h-1.5 rounded-full bg-hundido overflow-hidden" aria-hidden="true">
                  <div className="h-full w-2/3 rounded-full bg-inverso animate-pulse motion-reduce:animate-none" />
                </div>
              </div>
            ) : null}

            {/* Estado: error */}
            {status === "error" ? (
              <div
                className="rounded-campo bg-superficie p-3 font-body text-cuerpo flex flex-col gap-0.5 ring-1.5 ring-error"
                role="alert"
              >
                <span className="font-bold text-tinta">No pude subir tu foto.</span>
                <small className="font-body text-meta text-tinta-suave">
                  {errorMessage || "Tu foto sigue aquí: puedes intentarlo de nuevo o elegir otra."}
                </small>
              </div>
            ) : null}

            {/* Estado: sin conexión */}
            {status === "offline" || (!isOnline && status !== "uploading") ? (
              <div
                className="rounded-campo bg-superficie p-3 font-body text-cuerpo flex flex-col gap-0.5 ring-1.5 ring-linea-fuerte"
                role="alert"
              >
                <span className="font-bold text-tinta">Sin conexión.</span>
                <small className="font-body text-meta text-tinta-suave">
                  Tu foto sigue aquí. Cuando vuelvas a tener señal, toca Intentar de nuevo.
                </small>
              </div>
            ) : null}

            {/* Botones de acción integrados en landscape o portrait */}
            <div className="flex flex-col gap-3 pt-2 landscape:pt-0">
              {status === "uploading" ? (
                <>
                  <button
                    type="button"
                    disabled
                    aria-disabled="true"
                    className="h-[52px] landscape:h-12 w-full inline-flex items-center justify-center gap-2 rounded-full bg-inverso font-body font-extrabold text-sm text-sobre-inverso opacity-60 cursor-not-allowed"
                  >
                    <span
                      className="size-4 shrink-0 rounded-full border-2 border-sobre-inverso border-r-transparent animate-spin motion-reduce:animate-none"
                      aria-hidden="true"
                    />
                    <span>Subiendo…</span>
                  </button>
                  <button
                    type="button"
                    disabled
                    aria-disabled="true"
                    className="h-[52px] landscape:h-12 w-full inline-flex items-center justify-center rounded-full border-[1.5px] border-linea-fuerte bg-transparent font-body font-extrabold text-sm text-tinta opacity-45 cursor-not-allowed"
                  >
                    Elegir otra
                  </button>
                </>
              ) : status === "error" || status === "offline" || !isOnline ? (
                <>
                  <button
                    type="button"
                    ref={primaryBtnRef}
                    onClick={handleUploadAndSend}
                    disabled={!isOnline}
                    className="h-[52px] landscape:h-12 w-full inline-flex items-center justify-center rounded-full bg-inverso font-body font-extrabold text-sm text-sobre-inverso transition-transform duration-140 active:scale-[0.96] focus-visible:ring-3 focus-visible:ring-foco disabled:opacity-45 disabled:cursor-not-allowed"
                  >
                    Intentar de nuevo
                  </button>
                  <button
                    type="button"
                    onClick={openSystemPicker}
                    className="h-[52px] landscape:h-12 w-full inline-flex items-center justify-center rounded-full border-[1.5px] border-linea-fuerte bg-transparent font-body font-extrabold text-sm text-tinta transition-transform duration-140 active:scale-[0.96] focus-visible:ring-3 focus-visible:ring-foco"
                  >
                    Elegir otra
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    ref={primaryBtnRef}
                    id="usar"
                    onClick={handleUploadAndSend}
                    className="h-[52px] landscape:h-12 w-full inline-flex items-center justify-center rounded-full bg-inverso font-body font-extrabold text-sm text-sobre-inverso transition-transform duration-140 active:scale-[0.96] focus-visible:ring-3 focus-visible:ring-foco"
                  >
                    Usar esta foto
                  </button>
                  <button
                    type="button"
                    id="otra"
                    onClick={openSystemPicker}
                    className="h-[52px] landscape:h-12 w-full inline-flex items-center justify-center rounded-full border-[1.5px] border-linea-fuerte bg-transparent font-body font-extrabold text-sm text-tinta transition-transform duration-140 active:scale-[0.96] focus-visible:ring-3 focus-visible:ring-foco"
                  >
                    Elegir otra
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Espaciador inferior para safe area */}
        <div className="h-6 landscape:h-2 shrink-0" aria-hidden="true" />
      </dialog>
    </>
  );
}
