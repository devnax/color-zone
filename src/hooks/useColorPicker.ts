import { useState, useCallback, useMemo } from 'react';
import {
  parseColor, parseGradient, buildGradientString,
  rgb2hsv, rgb2hsl, rgb2cmyk, hsv2rgb, toHex, toHexA,
  ParsedGradient,
} from '../utils/colorUtils';

export interface UseColorPickerReturn {
  setR: (newR: number) => void;
  setG: (newG: number) => void;
  setB: (newB: number) => void;
  setA: (newA: number) => void;
  setHue: (newHue: number) => void;
  addPoint: (left: number) => void;
  setSolid: (startingColor: string) => void;
  setLinear: () => void;
  setRadial: () => void;
  valueToHSL: () => string;
  valueToHSV: () => string;
  valueToHex: () => string;
  valueToCmyk: () => string;
  setDegrees: (newDegrees: number) => void;
  setGradient: (startingGradient: string) => void;
  setLightness: (newLight: number) => void;
  setSaturation: (newSat: number) => void;
  setSelectedPoint: (index: number) => void;
  deletePoint: (index: number) => void;
  isGradient: boolean;
  gradientType: string | undefined;
  degrees: number;
  setPointLeft: (left: number) => void;
  currentLeft: number;
  rgbaArr: number[];
  hslArr: number[];
  handleChange: (newColor: string) => void;
  previousColors: never[];
  getGradientObject: (currentValue: string) => ParsedGradient | undefined;
  selectedPoint: number;
}

export function useColorPicker(
  value: string,
  onChange: (arg0: string) => void
): UseColorPickerReturn {
  const [selectedPoint, setSelectedPoint] = useState(0);

  const parsed = useMemo((): ParsedGradient => {
    return parseGradient(value || '#000000');
  }, [value]);

  const isGradient = parsed.isGradient;
  const gradientType: string | undefined = parsed.gradientType ?? undefined;
  // degrees is already a number from parseGradient — no parseInt/|| needed
  const degrees = parsed.degrees;

  const currentStop = parsed.colors[Math.min(selectedPoint, parsed.colors.length - 1)]
    ?? { color: '#000000', left: 0 };
  const currentLeft = currentStop.left;

  const currentRgba = useMemo(() => {
    return parseColor(currentStop.color) ?? { r: 0, g: 0, b: 0, a: 1 };
  }, [currentStop.color]);

  const rgbaArr = [currentRgba.r, currentRgba.g, currentRgba.b, Math.round(currentRgba.a * 100)];
  const hslArr = useMemo(() => {
    const [h, s, l] = rgb2hsl(currentRgba.r, currentRgba.g, currentRgba.b);
    return [h, s, l, Math.round(currentRgba.a * 100)];
  }, [currentRgba]);

  const updateStopColor = useCallback((newColor: string) => {
    if (!isGradient) { onChange(newColor); return; }
    const stops = [...parsed.colors];
    const idx = Math.min(selectedPoint, stops.length - 1);
    stops[idx] = { ...stops[idx], color: newColor };
    onChange(buildGradientString(gradientType ?? 'linear', degrees, stops));
  }, [isGradient, parsed.colors, selectedPoint, gradientType, degrees, onChange]);

  const safeUpd = useCallback((r: number, g: number, b: number, a: number) => {
    r = Math.round(Math.max(0, Math.min(255, isNaN(r) ? 0 : r)));
    g = Math.round(Math.max(0, Math.min(255, isNaN(g) ? 0 : g)));
    b = Math.round(Math.max(0, Math.min(255, isNaN(b) ? 0 : b)));
    a = Math.max(0, Math.min(1, isNaN(a) ? 1 : a));
    const color = a < 1
      ? `rgba(${r},${g},${b},${parseFloat(a.toFixed(2))})`
      : toHex(r, g, b);
    updateStopColor(color);
  }, [updateStopColor]);

  const handleChange = useCallback((newColor: string) => { onChange(newColor); }, [onChange]);

  const setR = useCallback((newR: number) => safeUpd(newR, currentRgba.g, currentRgba.b, currentRgba.a), [currentRgba, safeUpd]);
  const setG = useCallback((newG: number) => safeUpd(currentRgba.r, newG, currentRgba.b, currentRgba.a), [currentRgba, safeUpd]);
  const setB = useCallback((newB: number) => safeUpd(currentRgba.r, currentRgba.g, newB, currentRgba.a), [currentRgba, safeUpd]);
  const setA = useCallback((newA: number) => safeUpd(currentRgba.r, currentRgba.g, currentRgba.b, newA), [currentRgba, safeUpd]);

  const setHue = useCallback((newHue: number) => {
    const [, s, v] = rgb2hsv(currentRgba.r, currentRgba.g, currentRgba.b);
    const [r, g, b] = hsv2rgb(newHue, s, v);
    safeUpd(r, g, b, currentRgba.a);
  }, [currentRgba, safeUpd]);

  const setLightness = useCallback((newLight: number) => {
    const [h, s] = rgb2hsl(currentRgba.r, currentRgba.g, currentRgba.b);
    const ll = newLight / 100, ss = s / 100;
    const q = ll < 0.5 ? ll * (1 + ss) : ll + ss - ll * ss, p = 2 * ll - q;
    const hr = (p: number, q: number, t: number) => {
      if (t < 0) t += 1; if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    safeUpd(Math.round(hr(p, q, h/360 + 1/3) * 255), Math.round(hr(p, q, h/360) * 255), Math.round(hr(p, q, h/360 - 1/3) * 255), currentRgba.a);
  }, [currentRgba, safeUpd]);

  const setSaturation = useCallback((newSat: number) => {
    const [h, , v] = rgb2hsv(currentRgba.r, currentRgba.g, currentRgba.b);
    const [r, g, b] = hsv2rgb(h, newSat / 100, v);
    safeUpd(r, g, b, currentRgba.a);
  }, [currentRgba, safeUpd]);

  const setSolid = useCallback((startingColor: string) => { onChange(startingColor); }, [onChange]);

  const setLinear = useCallback(() => {
    if (isGradient && gradientType === 'linear') return;
    const stops = isGradient ? parsed.colors : [{ left: 0, color: value || '#000000' }, { left: 100, color: '#ffffff' }];
    onChange(buildGradientString('linear', degrees, stops));
  }, [isGradient, gradientType, parsed.colors, value, degrees, onChange]);

  const setRadial = useCallback(() => {
    if (isGradient && gradientType === 'radial') return;
    const stops = isGradient ? parsed.colors : [{ left: 0, color: value || '#000000' }, { left: 100, color: '#ffffff' }];
    onChange(buildGradientString('radial', degrees, stops));
  }, [isGradient, gradientType, parsed.colors, value, degrees, onChange]);

  const setDegrees = useCallback((newDegrees: number) => {
    if (!isGradient) return;
    onChange(buildGradientString(gradientType ?? 'linear', newDegrees, parsed.colors));
  }, [isGradient, gradientType, parsed.colors, onChange]);

  const setGradient = useCallback((startingGradient: string) => { onChange(startingGradient); }, [onChange]);

  const addPoint = useCallback((left: number) => {
    if (!isGradient) return;
    const newStop = { left, color: currentStop.color };
    const stops = [...parsed.colors, newStop].sort((a, b) => a.left - b.left);
    const newIdx = stops.findIndex(s => s.left === left && s.color === newStop.color);
    setSelectedPoint(newIdx >= 0 ? newIdx : stops.length - 1);
    onChange(buildGradientString(gradientType ?? 'linear', degrees, stops));
  }, [isGradient, parsed.colors, currentStop.color, gradientType, degrees, onChange]);

  const deletePoint = useCallback((index: number) => {
    if (!isGradient || parsed.colors.length <= 2) return;
    const stops = parsed.colors.filter((_, i) => i !== index);
    setSelectedPoint(Math.min(selectedPoint, stops.length - 1));
    onChange(buildGradientString(gradientType ?? 'linear', degrees, stops));
  }, [isGradient, parsed.colors, selectedPoint, gradientType, degrees, onChange]);

  const setPointLeft = useCallback((left: number) => {
    if (!isGradient) return;
    const stops = [...parsed.colors];
    stops[selectedPoint] = { ...stops[selectedPoint], left };
    onChange(buildGradientString(gradientType ?? 'linear', degrees, stops));
  }, [isGradient, parsed.colors, selectedPoint, gradientType, degrees, onChange]);

  const valueToHSL = useCallback((): string => {
    const [h, s, l] = rgb2hsl(currentRgba.r, currentRgba.g, currentRgba.b);
    return currentRgba.a < 1 ? `hsla(${h},${s}%,${l}%,${currentRgba.a.toFixed(2)})` : `hsl(${h},${s}%,${l}%)`;
  }, [currentRgba]);

  const valueToHSV = useCallback((): string => {
    const [h, s, v] = rgb2hsv(currentRgba.r, currentRgba.g, currentRgba.b);
    return `hsv(${Math.round(h)},${Math.round(s * 100)}%,${Math.round(v * 100)}%)`;
  }, [currentRgba]);

  const valueToHex = useCallback((): string => {
    return toHexA(currentRgba.r, currentRgba.g, currentRgba.b, currentRgba.a);
  }, [currentRgba]);

  const valueToCmyk = useCallback((): string => {
    const [c, m, y, k] = rgb2cmyk(currentRgba.r, currentRgba.g, currentRgba.b);
    return `cmyk(${c}%,${m}%,${y}%,${k}%)`;
  }, [currentRgba]);

  const getGradientObject = useCallback((currentValue: string): ParsedGradient | undefined => {
    return parseGradient(currentValue);
  }, []);

  return {
    setR, setG, setB, setA, setHue,
    addPoint, setSolid, setLinear, setRadial,
    valueToHSL, valueToHSV, valueToHex, valueToCmyk,
    setDegrees, setGradient, setLightness, setSaturation,
    setSelectedPoint,
    deletePoint,
    isGradient,
    gradientType,
    degrees,
    setPointLeft,
    currentLeft,
    rgbaArr,
    hslArr,
    handleChange,
    previousColors: [],
    getGradientObject,
    selectedPoint,
  };
}
