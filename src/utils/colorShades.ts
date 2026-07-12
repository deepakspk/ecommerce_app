/**
 * Hex<->HSL conversion + `deriveBrandScale`, ported from the web app's
 * `client/src/utils/colorShades.js` (01-DOCUMENTATION.md §10): the
 * Super-Admin-picked hex is treated as the "600" shade, and 50/100/500/700/800
 * are derived by lightness interpolation only — hue and saturation stay
 * constant across the whole ramp (02-REACT-NATIVE-PROMPTS.md Prompt 11).
 */

interface Hsl {
  h: number;
  s: number;
  l: number;
}

function hexToHsl(hex: string): Hsl {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  const l = (max + min) / 2;

  if (diff === 0) return { h: 0, s: 0, l: l * 100 };

  const s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);
  let h: number;
  if (max === r) h = ((g - b) / diff) % 6;
  else if (max === g) h = (b - r) / diff + 2;
  else h = (r - g) / diff + 4;
  h *= 60;
  if (h < 0) h += 360;

  return { h, s: s * 100, l: l * 100 };
}

function hslToHex(h: number, s: number, l: number): string {
  const sat = s / 100;
  const light = l / 100;
  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = light - c / 2;

  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, '0');

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function clampLightness(l: number): number {
  return Math.min(100, Math.max(0, l));
}

export interface BrandScale {
  brand50: string;
  brand100: string;
  brand500: string;
  brand600: string;
  brand700: string;
  brand800: string;
}

/** Treats `hex` as the "600" shade; every other shade keeps the same hue/saturation, only lightness moves. */
export function deriveBrandScale(hex: string): BrandScale {
  const { h, s, l } = hexToHsl(hex);
  return {
    brand50: hslToHex(h, s, clampLightness(97)),
    brand100: hslToHex(h, s, clampLightness(93)),
    brand500: hslToHex(h, s, clampLightness(l + 10)),
    brand600: hex,
    brand700: hslToHex(h, s, clampLightness(l - 12)),
    brand800: hslToHex(h, s, clampLightness(l - 22)),
  };
}
