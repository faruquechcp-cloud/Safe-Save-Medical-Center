
import { ThemeColorPalette } from '../themes';

// Helper to clamp a number between min and max
const clamp = (num: number, min: number, _max: number): number => Math.min(Math.max(num, min), 0.999); // max 0.999 for HSL calculations where 1 is too high for some conversions

interface RGB { r: number; g: number; b: number; }
interface HSL { h: number; s: number; l: number; }

export function hexToRgb(hex: string): RGB | null {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, (_m, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

export function rgbToHex(r: number, g: number, b: number): string {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

export function rgbToHsl({ r, g, b }: RGB): HSL {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s: number, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h, s, l };
}

export function hslToRgb({ h, s, l }: HSL): RGB {
  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

const targetLightness: Record<keyof ThemeColorPalette, number> = {
  '50': 0.97,
  '100': 0.94,
  '200': 0.86,
  '300': 0.74,
  '400': 0.60,
  '500': 0.53, 
  '600': 0.47,
  '700': 0.39,
  '800': 0.33,
  '900': 0.27,
  '950': 0.18,
};

const THEME_COLOR_PALETTE_KEYS_ARRAY = 
    ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'] as const;

export function generateMonochromaticPalette(baseHexColor: string): ThemeColorPalette {
  const baseRgb = hexToRgb(baseHexColor);
  if (!baseRgb) {
    throw new Error('Invalid base hex color for palette generation.');
  }
  const baseHsl = rgbToHsl(baseRgb);

  const userHue = baseHsl.h;
  let userSaturation = baseHsl.s;

  if (baseHsl.l > 0.85) userSaturation *= 0.8;
  if (baseHsl.l < 0.15) userSaturation *= 0.8;
  userSaturation = clamp(userSaturation, 0, 1);

  const finalPalette = {} as ThemeColorPalette;

  for (const shadeKey of THEME_COLOR_PALETTE_KEYS_ARRAY) {
    const targetL = targetLightness[shadeKey as unknown as keyof ThemeColorPalette]; 
    const newHsl: HSL = { h: userHue, s: userSaturation, l: clamp(targetL, 0.01, 0.99) };
    const newRgb = hslToRgb(newHsl);
    finalPalette[shadeKey as unknown as keyof ThemeColorPalette] = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
  }
  return finalPalette;
}
