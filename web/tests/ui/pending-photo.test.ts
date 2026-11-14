import { describe, expect, it } from "vitest";
import { setPendingPhoto, takePendingPhoto } from "@/components/chat/pending-photo";

describe("relevo de la foto desde Tu espacio a una conversación nueva", () => {
  it("se entrega una sola vez", () => {
    const file = new File(["x"], "selfie.jpg", { type: "image/jpeg" });
    setPendingPhoto({ file, text: "Te mando una selfie." });
    expect(takePendingPhoto()).toEqual({ file, text: "Te mando una selfie." });
    expect(takePendingPhoto()).toBeNull();
  });

  it("una foto nueva reemplaza a la anterior que nadie tomó", () => {
    const a = new File(["a"], "a.jpg");
    const b = new File(["b"], "b.jpg");
    setPendingPhoto({ file: a, text: "uno" });
    setPendingPhoto({ file: b, text: "dos" });
    expect(takePendingPhoto()?.file).toBe(b);
  });

  it("sin foto pendiente no entrega nada", () => {
    expect(takePendingPhoto()).toBeNull();
  });
});
