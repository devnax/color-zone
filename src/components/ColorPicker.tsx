import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
import { ColorPickerProps } from "../types";
import {
  parseColor,
  rgb2hsv,
  hsv2rgb,
  toHex,
  toHexA,
  rgb2hsl,
  parseGradient,
  buildGradientString,
} from "../utils/colorUtils";
import { SVPicker } from "./SVPicker";
import { HueSlider, AlphaSlider } from "./Sliders";
import { GradientBar } from "./GradientBar";
import NumberInput, { inputStyle } from "./NumberInput";

type InputType = "HEX" | "RGB" | "HSL";

export const ColorPicker: React.FC<ColorPickerProps> = ({
  value = "#3498db",
  onChange,
  hideInputs,
  hideOpacity,
  hideHue,
  hideEyeDrop,
  hideInputType,
  hideGradientControls,
  width = 230,
  height = 150,
  style,
  className,
  hidePickerSquare,
}) => {
  const [inputType, setInputType] = useState<InputType>("HEX");
  const [hexInputVal, setHexInputVal] = useState("");
  const innerWidth = width;
  const parsed = useMemo(() => parseGradient(value), [value]);
  const isGradient = parsed.isGradient;
  const gradientType = parsed.gradientType;
  const degrees = parsed.degrees;

  const [selectedPoint, setSelectedPoint] = useState(0);
  const safeSelected = Math.min(selectedPoint, parsed.colors.length - 1);
  const currentStop = parsed.colors[safeSelected] ?? {
    color: "#000000",
    left: 0,
  };
  const currentRgba = useMemo(
    () => parseColor(currentStop.color) ?? { r: 0, g: 0, b: 0, a: 1 },
    [currentStop.color],
  );

  const [hsvFromColor, satFromColor] = useMemo(
    () => rgb2hsv(currentRgba.r, currentRgba.g, currentRgba.b),
    [currentRgba],
  );

  const [hue, setHue] = useState(0);
  const [sat, setSat] = useState(1);
  const [val2, setVal] = useState(1);

  const updateCurrentColor = useCallback(
    (r: number, g: number, b: number, a: number) => {
      r = Math.round(Math.max(0, Math.min(255, isNaN(r) ? 0 : r)));
      g = Math.round(Math.max(0, Math.min(255, isNaN(g) ? 0 : g)));
      b = Math.round(Math.max(0, Math.min(255, isNaN(b) ? 0 : b)));
      a = Math.max(0, Math.min(1, isNaN(a) ? 1 : a));
      const color =
        a < 1
          ? `rgba(${r},${g},${b},${parseFloat(a.toFixed(2))})`
          : toHex(r, g, b);

      if (!isGradient) {
        onChange(color);
        return;
      }
      const stops = [...parsed.colors];
      stops[safeSelected] = { ...stops[safeSelected], color };
      onChange(buildGradientString(gradientType ?? "linear", degrees, stops));
    },
    [isGradient, parsed.colors, safeSelected, gradientType, degrees, onChange],
  );

  const isDraggingSV = useRef(false);
  const handleSVChange = useCallback(
    (s: number, v: number) => {
      isDraggingSV.current = true;
      setSat(s);
      setVal(v);
      const [r, g, b] = hsv2rgb(hue, s, v);
      updateCurrentColor(r, g, b, currentRgba.a);
    },
    [currentRgba.a, updateCurrentColor],
  );

  const handleAlphaChange = useCallback(
    (a: number) => {
      updateCurrentColor(currentRgba.r, currentRgba.g, currentRgba.b, a);
    },
    [currentRgba, updateCurrentColor],
  );

  const handleAddPoint = useCallback(
    (left: number) => {
      if (!isGradient) return;
      const newStop = { left, color: currentStop.color };
      const stops = [...parsed.colors, newStop].sort((a, b) => a.left - b.left);
      const newIdx = stops.findIndex(
        (s) => s.left === left && s.color === newStop.color,
      );
      setSelectedPoint(newIdx >= 0 ? newIdx : stops.length - 1);
      onChange(buildGradientString(gradientType ?? "linear", degrees, stops));
    },
    [
      isGradient,
      parsed.colors,
      currentStop.color,
      gradientType,
      degrees,
      onChange,
    ],
  );

  const handleMovePoint = useCallback(
    (idx: number, left: number) => {
      const stops = [...parsed.colors];
      stops[idx] = { ...stops[idx], left };
      onChange(buildGradientString(gradientType ?? "linear", degrees, stops));
    },
    [parsed.colors, gradientType, degrees, onChange],
  );

  const handleDeletePoint = useCallback(
    (idx: number) => {
      if (parsed.colors.length <= 2) return;
      const stops = parsed.colors.filter((_, i) => i !== idx);
      setSelectedPoint(Math.min(safeSelected, stops.length - 1));
      onChange(buildGradientString(gradientType ?? "linear", degrees, stops));
    },
    [parsed.colors, safeSelected, gradientType, degrees, onChange],
  );

  useEffect(() => {
    setHexInputVal(
      toHexA(currentRgba.r, currentRgba.g, currentRgba.b, currentRgba.a),
    );
  }, [currentRgba]);

  useEffect(() => {
    if (isDraggingSV.current) {
      isDraggingSV.current = false;
      return;
    }
    if (satFromColor > 0.01 && !isNaN(hsvFromColor)) {
      setHue(hsvFromColor);
    }
  }, [currentRgba]);

  const handleHexCommit = useCallback(
    (hex: string) => {
      const clean = hex.replace("#", "");
      if (clean.length === 6 || clean.length === 8) {
        const r = parseInt(clean.slice(0, 2), 16);
        const g = parseInt(clean.slice(2, 4), 16);
        const b = parseInt(clean.slice(4, 6), 16);
        const a =
          clean.length === 8 ? parseInt(clean.slice(6, 8), 16) / 255 : 1;
        updateCurrentColor(r, g, b, a);
      }
    },
    [updateCurrentColor],
  );

  const hasEyeDropper = typeof window !== "undefined" && "EyeDropper" in window;
  const handleEyeDrop = useCallback(async () => {
    if (!hasEyeDropper) return;
    try {
      const eyeDropper = new (window as any).EyeDropper();
      const result = await eyeDropper.open();
      const rgba = parseColor(result.sRGBHex) ?? { r: 0, g: 0, b: 0, a: 1 };

      const [h, s, v] = rgb2hsv(rgba.r, rgba.g, rgba.b);

      setHue(h);
      setSat(s);
      setVal(v);

      updateCurrentColor(rgba.r, rgba.g, rgba.b, rgba.a);
    } catch {}
  }, [hasEyeDropper, updateCurrentColor]);

  const inputTypes: InputType[] = ["HEX", "RGB", "HSL"];
  const [hslH, hslS, hslL] = rgb2hsl(
    currentRgba.r,
    currentRgba.g,
    currentRgba.b,
  );
  const alphaPercent = Math.round(currentRgba.a * 100);
  const previewBg = isGradient
    ? value
    : `rgba(${currentRgba.r},${currentRgba.g},${currentRgba.b},${currentRgba.a})`;

  return (
    <div
      className={className}
      style={{
        width,
        fontFamily: "system-ui,-apple-system,sans-serif",
        fontSize: 13,
        userSelect: "none",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        ...(style?.container ?? {}),
      }}
    >
      {!hidePickerSquare && (
        <SVPicker
          hue={hue}
          sat={sat}
          val={val2}
          width={innerWidth}
          height={height ?? 140}
          onChange={handleSVChange}
        />
      )}

      {!hideHue && (
        <HueSlider
          hue={hue}
          width={innerWidth}
          onChange={(h: number) => {
            setHue(h);
            const [r, g, b] = hsv2rgb(h, sat, val2);
            updateCurrentColor(r, g, b, currentRgba.a);
          }}
        />
      )}
      {!hideOpacity && (
        <AlphaSlider
          hue={hue}
          sat={sat}
          val={val2}
          alpha={currentRgba.a}
          width={innerWidth}
          onChange={handleAlphaChange}
        />
      )}
      {isGradient && !hideGradientControls && (
        <GradientBar
          stops={parsed.colors}
          selectedPoint={safeSelected}
          onSelectPoint={setSelectedPoint}
          onMovePoint={handleMovePoint}
          onAddPoint={handleAddPoint}
          onRemovePoint={handleDeletePoint}
          width={innerWidth}
        />
      )}
      <div style={{ display: "flex", flexDirection: "row", gap: 8 }}>
        {!hideInputs && (
          <>
            {inputType === "HEX" && (
              <input
                style={inputStyle}
                value={hexInputVal}
                onChange={(e) => setHexInputVal(e.target.value)}
                onBlur={(e) => handleHexCommit(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && handleHexCommit(hexInputVal)
                }
                placeholder="#RRGGBB"
                maxLength={9}
              />
            )}
            {inputType === "RGB" && (
              <>
                {(["R", "G", "B"] as const).map((label, i) => {
                  const vals = [currentRgba.r, currentRgba.g, currentRgba.b];
                  return (
                    <NumberInput
                      key={label}
                      min={0}
                      max={255}
                      value={vals[i]}
                      onChange={(n) => {
                        const rgb: [number, number, number] = [
                          currentRgba.r,
                          currentRgba.g,
                          currentRgba.b,
                        ];
                        rgb[i] = Math.max(0, Math.min(255, +n));
                        updateCurrentColor(
                          rgb[0],
                          rgb[1],
                          rgb[2],
                          currentRgba.a,
                        );
                      }}
                    />
                  );
                })}
                {!hideOpacity && (
                  <NumberInput
                    min={0}
                    max={100}
                    value={alphaPercent}
                    onChange={(n) => handleAlphaChange(+n / 100)}
                  />
                )}
              </>
            )}
            {inputType === "HSL" && (
              <>
                {(
                  [
                    ["H", hslH, 0, 360],
                    ["S", hslS, 0, 100],
                    ["L", hslL, 0, 100],
                  ] as [string, number, number, number][]
                ).map(([l, v, mn, mx]) => (
                  <NumberInput
                    key={l}
                    min={mn}
                    max={mx}
                    value={v}
                    onChange={(n) => {
                      const nv = Math.max(mn, Math.min(mx, +n));
                      const h2 = l === "H" ? nv : hslH,
                        s2 = (l === "S" ? nv : hslS) / 100,
                        ll = (l === "L" ? nv : hslL) / 100;
                      const q = ll < 0.5 ? ll * (1 + s2) : ll + s2 - ll * s2,
                        p = 2 * ll - q;
                      const hr = (p: number, q: number, t: number) => {
                        if (t < 0) t += 1;
                        if (t > 1) t -= 1;
                        if (t < 1 / 6) return p + (q - p) * 6 * t;
                        if (t < 1 / 2) return q;
                        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                        return p;
                      };
                      updateCurrentColor(
                        Math.round(hr(p, q, h2 / 360 + 1 / 3) * 255),
                        Math.round(hr(p, q, h2 / 360) * 255),
                        Math.round(hr(p, q, h2 / 360 - 1 / 3) * 255),
                        currentRgba.a,
                      );
                    }}
                  />
                ))}
                {!hideOpacity && (
                  <NumberInput
                    min={0}
                    max={100}
                    value={alphaPercent}
                    onChange={(n) => handleAlphaChange(+n / 100)}
                  />
                )}
              </>
            )}
          </>
        )}
        {isGradient && gradientType === "linear" && (
          <NumberInput
            value={degrees}
            onChange={(n) => {
              onChange(buildGradientString("linear", n, parsed.colors));
            }}
            suffix="°"
            min={0}
            max={360}
          />
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "row", gap: 8 }}>
        <div
          style={{
            position: "relative",
            width: 32,
            height: 27.5,
            borderRadius: 4,
            overflow: "hidden",
            boxShadow: "0 0 0 0.5px rgba(100, 100, 100, 0.5)",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8'%3E%3Crect width='4' height='4' fill='%23ccc'/%3E%3Crect x='4' y='4' width='4' height='4' fill='%23ccc'/%3E%3Crect x='4' width='4' height='4' fill='%23fff'/%3E%3Crect y='4' width='4' height='4' fill='%23fff'/%3E%3C/svg%3E")`,
              backgroundSize: "8px 8px",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: previewBg,
            }}
          />
        </div>
        {!hideInputType && (
          <div style={{ flex: 1 }}>
            <select
              style={inputStyle}
              value={inputType}
              onChange={(e: any) => {
                setInputType(e.target.value);
              }}
            >
              {inputTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        )}
        {!hideEyeDrop && hasEyeDropper && (
          <button
            onClick={handleEyeDrop}
            style={{
              flex: 1,
              fontSize: 18,
              background: "transparent",
              width: 30,
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              padding: 0,
              margin: 0,
              border: "0.5px solid #ddd",
              borderRadius: 6,
              height: 28,
              color: "inherit",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="1em"
              height="1em"
              viewBox="0 0 16 16"
            >
              <path d="M0 0h16v16H0z" fill="none" />
              <path
                fill="currentColor"
                d="M13.432 2.569c.18.18.324.394.42.63h.002c.098.236.147.489.147.744a1.98 1.98 0 0 1-.573 1.456l-.7.7l.25.26a1.137 1.137 0 0 1 0 1.6l-.583.583a1.137 1.137 0 0 1-1.6 0l-.255-.255l-.002-.002l-4.935 4.935a.5.5 0 0 1-.354.146h-.532l-1.286.552a1.025 1.025 0 0 1-1.35-1.348l.553-1.287v-.532a.5.5 0 0 1 .146-.353l4.935-4.945l-.254-.254a1.136 1.136 0 0 1 0-1.6l.59-.585a1.14 1.14 0 0 1 1.234-.245q.207.087.367.245l.256.254l.7-.7a1.95 1.95 0 0 1 1.375-.57a1.98 1.98 0 0 1 1.449.57M8.424 6.164l-4.785 4.788v.428a.5.5 0 0 1-.04.2l-.6 1.38l1.415-.557a.5.5 0 0 1 .2-.04h.428L9.83 7.574zm4.299-1.48a.9.9 0 0 0 .205-.307l-.001.002a1 1 0 0 0 .07-.362a1 1 0 0 0-.276-.741a.95.95 0 0 0-.667-.276a1 1 0 0 0-.731.277l-1.057 1.058a.5.5 0 0 1-.707 0l-.61-.608a.14.14 0 0 0-.046-.03a.1.1 0 0 0-.054-.01a.1.1 0 0 0-.054.01a.14.14 0 0 0-.046.03l-.583.583a.13.13 0 0 0-.04.095a.13.13 0 0 0 .04.095l3.333 3.332a.13.13 0 0 0 .096.04a.13.13 0 0 0 .095-.04l.583-.583a.13.13 0 0 0 .04-.096a.13.13 0 0 0-.04-.095l-.608-.61a.5.5 0 0 1 0-.707z"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};
