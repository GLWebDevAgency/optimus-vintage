/**
 * Préparation des photos côté client : redimensionnement ≤ 1600 px, JPEG, base64 pour l'IA.
 * Respecte l'orientation EXIF (`createImageBitmap` avec `imageOrientation: "from-image"`).
 */

export interface PreparedImage {
  readonly blob: Blob;
  readonly mimeType: "image/jpeg";
  readonly width: number;
  readonly height: number;
  /** URL d'objet pour l'aperçu ; à révoquer avec `releaseImage`. */
  readonly previewUrl: string;
  /** Contenu base64 (sans préfixe `data:`), pour `POST /appraisals`. */
  readonly base64: string;
}

export const MAX_SIDE = 1600;
const QUALITY = 0.86;

async function decode(file: Blob): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // certains navigateurs refusent l'option : on retombe sur <img>
    }
  }
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Image illisible"));
      img.src = url;
    });
  } finally {
    // L'image reste décodée en mémoire ; l'URL peut être libérée après le chargement.
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Encodage impossible"))),
      type,
      quality,
    );
  });
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("Lecture impossible"));
    reader.onload = () => {
      const result = String(reader.result);
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.readAsDataURL(blob);
  });
}

/** Redimensionne (plus grand côté ≤ `maxSide`), encode en JPEG et prépare l'aperçu + base64. */
export async function prepareImage(file: Blob, maxSide = MAX_SIDE): Promise<PreparedImage> {
  const source = await decode(file);
  const sw = "naturalWidth" in source ? source.naturalWidth : source.width;
  const sh = "naturalHeight" in source ? source.naturalHeight : source.height;
  if (!sw || !sh) throw new Error("Image vide");
  const scale = Math.min(1, maxSide / Math.max(sw, sh));
  const width = Math.max(1, Math.round(sw * scale));
  const height = Math.max(1, Math.round(sh * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponible");
  ctx.drawImage(source, 0, 0, width, height);
  if ("close" in source) source.close();
  const blob = await toBlob(canvas, "image/jpeg", QUALITY);
  const base64 = await blobToBase64(blob);
  return {
    blob,
    mimeType: "image/jpeg",
    width,
    height,
    previewUrl: URL.createObjectURL(blob),
    base64,
  };
}

/** Capture l'image courante d'une vidéo (flux caméra) puis la prépare. */
export async function captureFromVideo(video: HTMLVideoElement): Promise<PreparedImage> {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx || !canvas.width) throw new Error("Flux vidéo indisponible");
  ctx.drawImage(video, 0, 0);
  const raw = await toBlob(canvas, "image/jpeg", 0.95);
  return prepareImage(raw);
}

export function releaseImage(image: PreparedImage | null | undefined): void {
  if (image) URL.revokeObjectURL(image.previewUrl);
}
