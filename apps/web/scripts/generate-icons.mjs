// Génère les icônes PWA (PNG) à partir du logo « Selvedge » : étiquette, œillet, fil rouge, lettre italique.
// Usage : node scripts/generate-icons.mjs   (depuis apps/web)
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(here, "../public/icons");

// Glyphe « O » d'Instrument Serif italique en tracé (identique à src/components/brand/glyph.ts) :
// aucune police n'est requise au rendu, le résultat est identique sur toute machine.
const GLYPH_O =
  "M30.78 46.23L30.78 46.23Q28.75 46.23 27.57 44.57Q26.38 42.91 26.38 39.68L26.38 39.68Q26.38 37.76 26.83 35.91Q27.27 34.07 28.05 32.47Q28.83 30.87 29.86 29.63Q30.88 28.40 32.06 27.71Q33.25 27.02 34.50 27.02L34.50 27.02Q36.52 27.02 37.71 28.67Q38.89 30.32 38.89 33.57L38.89 33.57Q38.89 35.50 38.45 37.34Q38.01 39.19 37.23 40.79Q36.45 42.39 35.42 43.62Q34.39 44.86 33.21 45.55Q32.03 46.23 30.78 46.23ZM30.73 45.56L30.73 45.56Q31.69 45.56 32.61 44.79Q33.53 44.02 34.35 42.69Q35.17 41.35 35.80 39.59Q36.42 37.84 36.77 35.86Q37.12 33.88 37.12 31.86L37.12 31.86Q37.12 27.70 34.55 27.70L34.55 27.70Q33.59 27.70 32.66 28.46Q31.74 29.23 30.92 30.57Q30.10 31.91 29.48 33.66Q28.85 35.42 28.50 37.39Q28.15 39.37 28.15 41.40L28.15 41.40Q28.15 45.56 30.73 45.56Z";

const CALICO = { bg: "#F2EDE2", surface: "#FBF8F1", ink: "#171B27", thread: "#C4283C" };
const INDIGO = { bg: "#0E1326", surface: "#171E36", ink: "#EEF1F7", thread: "#E44553" };

/**
 * @param {{bg:string,surface:string,ink:string,thread:string}} c
 * @param {{scale?:number, rounded?:boolean}} opts  scale < 1 réduit la marque (zone sûre maskable = 80 %)
 */
function iconSvg(c, { scale = 0.78, rounded = false } = {}) {
  const s = 64 * scale;
  const off = (64 - s) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <rect width="64" height="64" rx="${rounded ? 14 : 0}" fill="${c.bg}"/>
  <g transform="translate(${off} ${off}) scale(${scale})">
    <path d="M14 6 h36 a6 6 0 0 1 6 6 v40 l-6 6 H14 l-6 -6 V12 a6 6 0 0 1 6 -6z" fill="${c.surface}" stroke="${c.ink}" stroke-width="2.5"/>
    <circle cx="32" cy="15" r="3.5" fill="${c.bg}" stroke="${c.ink}" stroke-width="2"/>
    <path d="M32 11 C 32 2, 44 2, 44 8" stroke="${c.thread}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <path d="${GLYPH_O}" fill="${c.ink}"/>
    <path d="M16 52 h32" stroke="${c.thread}" stroke-width="2" stroke-dasharray="4 3"/>
  </g>
</svg>`;
}

/** Image Open Graph 1200×630 : marque + nom, sur calico. */
function ogSvg() {
  const c = CALICO;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${c.bg}"/>
  <g transform="translate(120 155) scale(5)">
    <path d="M14 6 h36 a6 6 0 0 1 6 6 v40 l-6 6 H14 l-6 -6 V12 a6 6 0 0 1 6 -6z" fill="${c.surface}" stroke="${c.ink}" stroke-width="2.5"/>
    <circle cx="32" cy="15" r="3.5" fill="${c.bg}" stroke="${c.ink}" stroke-width="2"/>
    <path d="M32 11 C 32 2, 44 2, 44 8" stroke="${c.thread}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <path d="${GLYPH_O}" fill="${c.ink}"/>
    <path d="M16 52 h32" stroke="${c.thread}" stroke-width="2" stroke-dasharray="4 3"/>
  </g>
  <text x="520" y="330" font-family="Helvetica, Arial, sans-serif" font-weight="800" font-size="150" letter-spacing="-8" fill="${c.ink}">CHINÉ</text>
  <text x="526" y="400" font-family="Georgia, serif" font-style="italic" font-size="52" fill="${c.ink}">la chine avant le tableur.</text>
  <path d="M526 440 C 700 428, 900 452, 1080 436" stroke="${c.thread}" stroke-width="5" fill="none" stroke-linecap="round" stroke-dasharray="18 12"/>
</svg>`;
}

const targets = [
  { file: "icon-192.png", size: 192, svg: iconSvg(CALICO, { scale: 0.82, rounded: true }) },
  { file: "icon-512.png", size: 512, svg: iconSvg(CALICO, { scale: 0.82, rounded: true }) },
  { file: "maskable-192.png", size: 192, svg: iconSvg(CALICO, { scale: 0.66 }) },
  { file: "maskable-512.png", size: 512, svg: iconSvg(CALICO, { scale: 0.66 }) },
  { file: "apple-touch-icon.png", size: 180, svg: iconSvg(CALICO, { scale: 0.78 }) },
  { file: "icon-indigo-512.png", size: 512, svg: iconSvg(INDIGO, { scale: 0.82, rounded: true }) },
  { file: "favicon-32.png", size: 32, svg: iconSvg(CALICO, { scale: 0.92, rounded: true }) },
];

await mkdir(out, { recursive: true });
for (const t of targets) {
  const png = await sharp(Buffer.from(t.svg), { density: 384 })
    .resize(t.size, t.size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
  await writeFile(path.join(out, t.file), png);
  console.log(`✓ ${t.file} (${t.size}px, ${(png.length / 1024).toFixed(1)} Ko)`);
}
const og = await sharp(Buffer.from(ogSvg()), { density: 144 })
  .png({ compressionLevel: 9 })
  .toBuffer();
await writeFile(path.join(out, "og.png"), og);
console.log(`✓ og.png (1200×630, ${(og.length / 1024).toFixed(1)} Ko)`);
