import { describe, expect, it } from "vitest";
import { buildPhotoPath, fitWithin, isOwnPhotoPath } from "@/lib/domain/photo-path";

const UID = "6f1c2c1e-3b4a-4f7e-9a10-1234567890ab";
const FILE = "0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d";

describe("isOwnPhotoPath", () => {
  it("acepta rutas propias bien formadas", () => {
    expect(isOwnPhotoPath(`${UID}/garments/${FILE}.jpg`, UID)).toBe(true);
    expect(isOwnPhotoPath(`${UID}/selfies/${FILE}.jpg`, UID)).toBe(true);
  });

  it("rechaza rutas de otra persona", () => {
    expect(isOwnPhotoPath(`otro-id/garments/${FILE}.jpg`, UID)).toBe(false);
    expect(isOwnPhotoPath(`${UID}x/garments/${FILE}.jpg`, UID)).toBe(false);
  });

  it("rechaza recorridos de directorio y rutas mal formadas", () => {
    expect(isOwnPhotoPath(`${UID}/../otro/${FILE}.jpg`, UID)).toBe(false);
    expect(isOwnPhotoPath(`${UID}/garments/../${FILE}.jpg`, UID)).toBe(false);
    expect(isOwnPhotoPath(`${UID}/otra-cosa/${FILE}.jpg`, UID)).toBe(false);
    expect(isOwnPhotoPath(`${UID}/garments/${FILE}.exe`, UID)).toBe(false);
    expect(isOwnPhotoPath(`${UID}/garments/sub/${FILE}.jpg`, UID)).toBe(false);
    expect(isOwnPhotoPath(`${UID}/`, UID)).toBe(false);
  });

  it("rechaza valores que no son texto o sin sesión", () => {
    expect(isOwnPhotoPath(undefined, UID)).toBe(false);
    expect(isOwnPhotoPath(42, UID)).toBe(false);
    expect(isOwnPhotoPath(`${UID}/garments/${FILE}.jpg`, "")).toBe(false);
  });

  it("buildPhotoPath produce rutas que pasan la validación", () => {
    expect(isOwnPhotoPath(buildPhotoPath(UID, "garments", FILE), UID)).toBe(true);
  });
});

describe("fitWithin", () => {
  it("no agranda imágenes pequeñas", () => {
    expect(fitWithin(800, 600, 1280)).toEqual({ width: 800, height: 600 });
  });
  it("reduce manteniendo proporción", () => {
    expect(fitWithin(4000, 3000, 1280)).toEqual({ width: 1280, height: 960 });
    expect(fitWithin(3000, 4000, 1280)).toEqual({ width: 960, height: 1280 });
  });
});
