export function hsv2rgb(h: number, s: number, v: number): [number, number, number] {
  const i = Math.floor(h / 60) % 6;
  const f = h / 60 - Math.floor(h / 60);
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  const matrix: [number, number, number][] = [
    [v, t, p], [q, v, p], [p, v, t],
    [p, q, v], [t, p, v], [v, p, q],
  ];
  const [r, g, b] = matrix[i];
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

export function rgb2hsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  const s = max ? d / max : 0;
  const v = max;
  if (d) {
    if (max === r) h = ((g - b) / d + 6) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return [h, s, v];
}

export function rgb2hsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, Math.round(l * 100)];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

export function rgb2cmyk(r: number, g: number, b: number): [number, number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const k = 1 - Math.max(r, g, b);
  if (k === 1) return [0, 0, 0, 100];
  const c = (1 - r - k) / (1 - k);
  const m = (1 - g - k) / (1 - k);
  const y = (1 - b - k) / (1 - k);
  return [Math.round(c * 100), Math.round(m * 100), Math.round(y * 100), Math.round(k * 100)];
}

export function toHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

export function toHexA(r: number, g: number, b: number, a: number): string {
  const hex = toHex(r, g, b);
  if (a < 1) {
    const ah = Math.round(a * 255).toString(16).padStart(2, '0');
    return hex + ah;
  }
  return hex;
}

export function parseColor(color: string): { r: number; g: number; b: number; a: number } | null {
  color = color.trim();

  // rgba / rgb — allow spaces around commas
  let m = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/);
  if (m) return { r: +m[1], g: +m[2], b: +m[3], a: m[4] !== undefined ? +m[4] : 1 };

  // hex
  let hex = color.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  if (hex.length === 6 || hex.length === 8) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
    return { r, g, b, a };
  }

  // hsl
  m = color.match(/hsla?\((\d+),\s*([\d.]+)%,\s*([\d.]+)%(?:,\s*([\d.]+))?\)/);
  if (m) {
    const h = +m[1], s = +m[2] / 100, l = +m[3] / 100, a = m[4] !== undefined ? +m[4] : 1;
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1; if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    return {
      r: Math.round(hue2rgb(p, q, h/360 + 1/3) * 255),
      g: Math.round(hue2rgb(p, q, h/360) * 255),
      b: Math.round(hue2rgb(p, q, h/360 - 1/3) * 255),
      a,
    };
  }
  return null;
}

export interface ParsedGradient {
  isGradient: boolean;
  gradientType: string | undefined | null;
  degrees: number; // always a number, never string — avoids the 0 || 90 falsy bug
  colors: Array<{ left: number; color: string }>;
}

function splitTopLevel(str: string): string[] {
  const parts: string[] = [];
  let depth = 0, start = 0;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '(') depth++;
    else if (str[i] === ')') depth--;
    else if (str[i] === ',' && depth === 0) {
      parts.push(str.slice(start, i).trim());
      start = i + 1;
    }
  }
  parts.push(str.slice(start).trim());
  return parts;
}

function parseStopToken(token: string, idx: number, total: number): { color: string; left: number } {
  token = token.trim();
  const pctMatch = token.match(/^([\s\S]+?)\s+([\d.]+)%\s*$/);
  if (pctMatch) return { color: pctMatch[1].trim(), left: parseFloat(pctMatch[2]) };
  return { color: token, left: total <= 1 ? 0 : (idx / (total - 1)) * 100 };
}

export function parseGradient(value: string): ParsedGradient {
  if (!value) return { isGradient: false, gradientType: null, degrees: 90, colors: [{ left: 0, color: '#000000' }] };

  const linearMatch = value.match(/^linear-gradient\(([\s\S]+)\)$/);
  const radialMatch = value.match(/^radial-gradient\(([\s\S]+)\)$/);

  if (!linearMatch && !radialMatch) {
    return { isGradient: false, gradientType: null, degrees: 90, colors: [{ left: 0, color: value }] };
  }

  const isLinear = !!linearMatch;
  const inner = (linearMatch || radialMatch)![1].trim();
  const gradientType = isLinear ? 'linear' : 'radial';
  const rawParts = splitTopLevel(inner);

  // degrees stored as number — parseInt('0deg') = 0, no falsy || 90 needed
  let degrees = 90;
  let colorParts = rawParts;

  if (isLinear) {
    const first = rawParts[0].trim();
    if (/^\d+deg$/i.test(first)) {
      degrees = parseInt(first, 10);
      colorParts = rawParts.slice(1);
    } else if (/^to\s+/i.test(first)) {
      colorParts = rawParts.slice(1);
    }
  } else {
    const first = rawParts[0].trim();
    const looksLikeColor = first.startsWith('#') || first.startsWith('rgb') || first.startsWith('hsl');
    const looksLikeShape = /^(circle|ellipse)/i.test(first);
    if (looksLikeShape || (!looksLikeColor && parseColor(first) === null)) {
      colorParts = rawParts.slice(1);
    }
  }

  const colors = colorParts.map((part, i) => parseStopToken(part, i, colorParts.length));
  colors.forEach(c => { if (!parseColor(c.color)) c.color = '#000000'; });

  return { isGradient: true, gradientType, degrees, colors };
}

export function buildGradientString(
  gradientType: string,
  degrees: number,
  stops: Array<{ left: number; color: string }>
): string {
  const sorted = [...stops].sort((a, b) => a.left - b.left);
  const stopStr = sorted.map(s => `${s.color} ${Math.round(s.left)}%`).join(', ');
  if (gradientType === 'radial') return `radial-gradient(circle, ${stopStr})`;
  return `linear-gradient(${degrees}deg, ${stopStr})`;
}

export function colorToRgba(h: number, s: number, v: number, a: number): string {
  const [r, g, b] = hsv2rgb(h, s, v);
  return a < 1 ? `rgba(${r},${g},${b},${a.toFixed(2)})` : `rgb(${r},${g},${b})`;
}
