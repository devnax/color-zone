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
  rgb2cmyk,
  parseGradient,
  buildGradientString,
} from "../utils/colorUtils";
import { SVPicker } from "./SVPicker";
import { HueSlider, AlphaSlider } from "./Sliders";
import { GradientBar } from "./GradientBar";

const DEFAULT_PRESETS = [
  "#e74c3c",
  "#e67e22",
  "#f1c40f",
  "#2ecc71",
  "#1abc9c",
  "#3498db",
  "#9b59b6",
  "#e91e63",
  "#ff5722",
  "#607d8b",
  "#ffffff",
  "#000000",
];

type InputType = "HEX" | "RGB" | "HSL" | "HSV" | "CMYK";

// AngleSlider — plain range input with styled fill overlay
const AngleSlider: React.FC<{
  degrees: number;
  onChange: (d: number) => void;
}> = ({ degrees, onChange }) => {
  const pct = ((degrees / 360) * 100).toFixed(3) + "%";
  return (
    <div
      style={{
        flex: 1,
        position: "relative",
        height: 14,
        display: "flex",
        alignItems: "center",
      }}
    >
      {/* track */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          height: 6,
          borderRadius: 3,
          background: "#e0e0e0",
          pointerEvents: "none",
        }}
      />
      {/* fill */}
      <div
        style={{
          position: "absolute",
          left: 0,
          width: pct,
          height: 6,
          borderRadius: 3,
          background: "linear-gradient(90deg,#aaa,#333)",
          pointerEvents: "none",
        }}
      />
      <input
        type="range"
        min={0}
        max={360}
        value={degrees}
        onChange={(e) => onChange(+e.target.value)}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          width: "100%",
          WebkitAppearance: "none",
          appearance: "none",
          height: 14,
          background: "transparent",
          cursor: "pointer",
          margin: 0,
          outline: "none",
        }}
      />
    </div>
  );
};

export const ColorPicker: React.FC<ColorPickerProps> = ({
  value = "#3498db",
  onChange,
  hideControls,
  hideInputs,
  hideOpacity,
  hidePresets,
  hideHue,
  presets,
  hideEyeDrop,
  hideAdvancedSliders,
  hideColorGuide,
  hideInputType,
  hideColorTypeBtns,
  hideGradientType,
  hideGradientAngle,
  hideGradientStop,
  hideGradientControls,
  width = 280,
  height,
  style,
  className,
  locales = {},
  disableDarkMode,
  disableLightMode,
  hidePickerSquare,
  showHexAlpha,
  config,
}) => {
  const [inputType, setInputType] = useState<InputType>("HEX");
  const [hexInputVal, setHexInputVal] = useState("");
  const innerWidth = width - 28;

  const parsed = useMemo(() => parseGradient(value), [value]);
  const isGradient = parsed.isGradient;
  const gradientType = parsed.gradientType;
  // degrees is already a number — no parseInt/|| needed
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
  const [hue, sat, val2] = useMemo(() => {
    const [h, s, v] = rgb2hsv(currentRgba.r, currentRgba.g, currentRgba.b);
    return [isNaN(h) ? 0 : h, isNaN(s) ? 0 : s, isNaN(v) ? 0 : v];
  }, [currentRgba]);

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

  const handleSVChange = useCallback(
    (s: number, v: number) => {
      const [r, g, b] = hsv2rgb(hue, s, v);
      updateCurrentColor(r, g, b, currentRgba.a);
    },
    [hue, currentRgba.a, updateCurrentColor],
  );

  const handleHueChange = useCallback(
    (h: number) => {
      const [r, g, b] = hsv2rgb(h, sat, val2);
      updateCurrentColor(r, g, b, currentRgba.a);
    },
    [sat, val2, currentRgba.a, updateCurrentColor],
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

  const handlePreset = useCallback(
    (preset: string) => {
      if (!isGradient) {
        onChange(preset);
        return;
      }
      const stops = [...parsed.colors];
      stops[safeSelected] = { ...stops[safeSelected], color: preset };
      onChange(buildGradientString(gradientType ?? "linear", degrees, stops));
    },
    [isGradient, parsed.colors, safeSelected, gradientType, degrees, onChange],
  );

  const handleSetSolid = useCallback(() => {
    onChange(currentStop.color);
  }, [currentStop.color, onChange]);
  const handleSetLinear = useCallback(() => {
    if (isGradient && gradientType === "linear") return;
    const stops = isGradient
      ? parsed.colors
      : [
          { left: 0, color: value },
          { left: 100, color: "#ffffff" },
        ];
    onChange(buildGradientString("linear", degrees, stops));
  }, [isGradient, gradientType, parsed.colors, value, degrees, onChange]);

  const handleSetRadial = useCallback(() => {
    if (isGradient && gradientType === "radial") return;
    const stops = isGradient
      ? parsed.colors
      : [
          { left: 0, color: value },
          { left: 100, color: "#ffffff" },
        ];
    onChange(buildGradientString("radial", degrees, stops));
  }, [isGradient, gradientType, parsed.colors, value, degrees, onChange]);

  const hasEyeDropper = typeof window !== "undefined" && "EyeDropper" in window;
  const handleEyeDrop = useCallback(async () => {
    if (!hasEyeDropper) return;
    try {
      const eyeDropper = new (window as any).EyeDropper();
      const result = await eyeDropper.open();
      const rgba = parseColor(result.sRGBHex) ?? { r: 0, g: 0, b: 0, a: 1 };
      updateCurrentColor(rgba.r, rgba.g, rgba.b, rgba.a);
    } catch {}
  }, [hasEyeDropper, updateCurrentColor]);

  const inputTypes: InputType[] = ["HEX", "RGB", "HSL", "HSV", "CMYK"];
  const [hslH, hslS, hslL] = rgb2hsl(
    currentRgba.r,
    currentRgba.g,
    currentRgba.b,
  );
  const [hsvH, hsvS, hsvV] = rgb2hsv(
    currentRgba.r,
    currentRgba.g,
    currentRgba.b,
  );
  const [cmykC, cmykM, cmykY, cmykK] = rgb2cmyk(
    currentRgba.r,
    currentRgba.g,
    currentRgba.b,
  );
  const alphaPercent = Math.round(currentRgba.a * 100);
  const previewBg = isGradient
    ? value
    : `rgba(${currentRgba.r},${currentRgba.g},${currentRgba.b},${currentRgba.a})`;

  const tab = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: "5px 0",
    fontSize: 12,
    border: `0.5px solid ${active ? "#888" : "#ddd"}`,
    borderRadius: 6,
    background: active ? "#f0f0f0" : "transparent",
    color: active ? "#111" : "#666",
    cursor: "pointer",
    fontFamily: "inherit",
    fontWeight: active ? 500 : 400,
  });

  const inputStyle: React.CSSProperties = {
    flex: 1,
    padding: "5px 6px",
    fontSize: 12,
    border: "0.5px solid #ddd",
    borderRadius: 6,
    background: "transparent",
    color: "inherit",
    fontFamily: "monospace",
    minWidth: 0,
    outline: "none",
  };

  const numInput: React.CSSProperties = {
    flex: 1,
    padding: "4px 4px",
    fontSize: 11,
    border: "0.5px solid #ddd",
    borderRadius: 5,
    background: "transparent",
    color: "inherit",
    textAlign: "center",
    minWidth: 0,
    outline: "none",
    fontFamily: "monospace",
  };

  return (
    <div
      className={className}
      style={{
        width,
        fontFamily: "system-ui,-apple-system,sans-serif",
        fontSize: 13,
        userSelect: "none",
        ...(style?.container ?? {}),
      }}
    >
      {/* Mode tabs */}
      {!hideColorTypeBtns && (
        <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
          {(!config || config.allowSolid !== false) && (
            <button style={tab(!isGradient)} onClick={handleSetSolid}>
              {locales.SOLID ?? "Solid"}
            </button>
          )}
          {(!config || config.allowGradients !== false) &&
            !hideGradientType && (
              <>
                <button
                  style={tab(isGradient && gradientType === "linear")}
                  onClick={handleSetLinear}
                >
                  {locales.LINEAR ?? "Linear"}
                </button>
                <button
                  style={tab(isGradient && gradientType === "radial")}
                  onClick={handleSetRadial}
                >
                  {locales.RADIAL ?? "Radial"}
                </button>
              </>
            )}
        </div>
      )}

      {/* Gradient controls */}
      {isGradient && !hideGradientControls && (
        <div style={{ marginBottom: 10 }}>
          <GradientBar
            stops={parsed.colors}
            selectedPoint={safeSelected}
            onSelectPoint={setSelectedPoint}
            onMovePoint={handleMovePoint}
            onAddPoint={handleAddPoint}
            width={innerWidth}
          />

          {!hideGradientStop && parsed.colors.length > 2 && (
            <div
              style={{
                display: "flex",
                gap: 4,
                marginTop: 6,
                flexWrap: "wrap",
              }}
            >
              {parsed.colors.map((stop, idx) => {
                const rgba = parseColor(stop.color) ?? {
                  r: 0,
                  g: 0,
                  b: 0,
                  a: 1,
                };
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedPoint(idx)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "2px 7px",
                      borderRadius: 20,
                      border: `1px solid ${idx === safeSelected ? "#555" : "#ddd"}`,
                      background:
                        idx === safeSelected ? "#f0f0f0" : "transparent",
                      cursor: "pointer",
                      fontSize: 11,
                    }}
                  >
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: `rgba(${rgba.r},${rgba.g},${rgba.b},${rgba.a})`,
                        border: "0.5px solid rgba(0,0,0,.2)",
                        flexShrink: 0,
                      }}
                    />
                    {Math.round(stop.left)}%
                    {parsed.colors.length > 2 && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePoint(idx);
                        }}
                        style={{
                          opacity: 0.5,
                          cursor: "pointer",
                          lineHeight: 1,
                          fontSize: 14,
                        }}
                      >
                        ×
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {isGradient && gradientType === "linear" && !hideGradientAngle && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginTop: 8,
              }}
            >
              <span style={{ fontSize: 11, color: "#888", flexShrink: 0 }}>
                {locales.DEGREES ?? "Angle"}
              </span>
              <AngleSlider
                degrees={degrees}
                onChange={(d) =>
                  onChange(buildGradientString("linear", d, parsed.colors))
                }
              />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  minWidth: 34,
                  textAlign: "right",
                  fontFamily: "monospace",
                }}
              >
                {degrees}°
              </span>
            </div>
          )}
        </div>
      )}

      {/* SV Picker */}
      {!hidePickerSquare && (
        <div style={{ marginBottom: 10 }}>
          <SVPicker
            hue={hue}
            sat={sat}
            val={val2}
            width={innerWidth}
            height={height ?? 160}
            onChange={handleSVChange}
          />
        </div>
      )}

      {!hideHue && (
        <div style={{ marginBottom: 8 }}>
          <HueSlider hue={hue} width={innerWidth} onChange={handleHueChange} />
        </div>
      )}
      {!hideOpacity && (
        <div style={{ marginBottom: 10 }}>
          <AlphaSlider
            hue={hue}
            sat={sat}
            val={val2}
            alpha={currentRgba.a}
            width={innerWidth}
            onChange={handleAlphaChange}
          />
        </div>
      )}

      {/* Input type tabs */}
      {!hideInputType && (
        <div style={{ display: "flex", gap: 3, marginBottom: 6 }}>
          {inputTypes.map((t) => (
            <button
              key={t}
              onClick={() => setInputType(t)}
              style={{ ...tab(inputType === t), flex: 1, fontSize: 10 }}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {/* Color inputs */}
      {!hideInputs && (
        <div style={{ marginBottom: 10 }}>
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
            <div style={{ display: "flex", gap: 4 }}>
              {(["R", "G", "B"] as const).map((label, i) => {
                const vals = [currentRgba.r, currentRgba.g, currentRgba.b];
                return (
                  <div key={label} style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 10,
                        textAlign: "center",
                        color: "#888",
                        marginBottom: 2,
                      }}
                    >
                      {label}
                    </div>
                    <input
                      type="number"
                      min={0}
                      max={255}
                      style={numInput}
                      value={vals[i]}
                      onChange={(e) => {
                        const rgb: [number, number, number] = [
                          currentRgba.r,
                          currentRgba.g,
                          currentRgba.b,
                        ];
                        rgb[i] = Math.max(0, Math.min(255, +e.target.value));
                        updateCurrentColor(
                          rgb[0],
                          rgb[1],
                          rgb[2],
                          currentRgba.a,
                        );
                      }}
                    />
                  </div>
                );
              })}
              {!hideOpacity && (
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 10,
                      textAlign: "center",
                      color: "#888",
                      marginBottom: 2,
                    }}
                  >
                    A%
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    style={numInput}
                    value={alphaPercent}
                    onChange={(e) => handleAlphaChange(+e.target.value / 100)}
                  />
                </div>
              )}
            </div>
          )}
          {inputType === "HSL" && (
            <div style={{ display: "flex", gap: 4 }}>
              {(
                [
                  ["H", hslH, 0, 360],
                  ["S", hslS, 0, 100],
                  ["L", hslL, 0, 100],
                ] as [string, number, number, number][]
              ).map(([l, v, mn, mx]) => (
                <div key={l} style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 10,
                      textAlign: "center",
                      color: "#888",
                      marginBottom: 2,
                    }}
                  >
                    {l}
                  </div>
                  <input
                    type="number"
                    min={mn}
                    max={mx}
                    style={numInput}
                    value={v}
                    onChange={(e) => {
                      const nv = Math.max(mn, Math.min(mx, +e.target.value));
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
                </div>
              ))}
              {!hideOpacity && (
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 10,
                      textAlign: "center",
                      color: "#888",
                      marginBottom: 2,
                    }}
                  >
                    A%
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    style={numInput}
                    value={alphaPercent}
                    onChange={(e) => handleAlphaChange(+e.target.value / 100)}
                  />
                </div>
              )}
            </div>
          )}
          {inputType === "HSV" && (
            <div style={{ display: "flex", gap: 4 }}>
              {(
                [
                  ["H", Math.round(hsvH), 0, 360],
                  ["S", Math.round(hsvS * 100), 0, 100],
                  ["V", Math.round(hsvV * 100), 0, 100],
                ] as [string, number, number, number][]
              ).map(([l, v, mn, mx]) => (
                <div key={l} style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 10,
                      textAlign: "center",
                      color: "#888",
                      marginBottom: 2,
                    }}
                  >
                    {l}
                  </div>
                  <input
                    type="number"
                    min={mn}
                    max={mx}
                    style={numInput}
                    value={v}
                    onChange={(e) => {
                      const nv = Math.max(mn, Math.min(mx, +e.target.value));
                      const h2 = l === "H" ? nv : Math.round(hsvH),
                        s2 = (l === "S" ? nv : Math.round(hsvS * 100)) / 100,
                        v2 = (l === "V" ? nv : Math.round(hsvV * 100)) / 100;
                      const [r, g, b] = hsv2rgb(h2, s2, v2);
                      updateCurrentColor(r, g, b, currentRgba.a);
                    }}
                  />
                </div>
              ))}
            </div>
          )}
          {inputType === "CMYK" && (
            <div style={{ display: "flex", gap: 4 }}>
              {(
                [
                  ["C", cmykC],
                  ["M", cmykM],
                  ["Y", cmykY],
                  ["K", cmykK],
                ] as [string, number][]
              ).map(([l, v]) => (
                <div key={l} style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 10,
                      textAlign: "center",
                      color: "#888",
                      marginBottom: 2,
                    }}
                  >
                    {l}
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    style={numInput}
                    value={v}
                    onChange={(e) => {
                      const nv =
                        Math.max(0, Math.min(100, +e.target.value)) / 100;
                      const c2 = l === "C" ? nv : cmykC / 100,
                        m2 = l === "M" ? nv : cmykM / 100,
                        y2 = l === "Y" ? nv : cmykY / 100,
                        k2 = l === "K" ? nv : cmykK / 100;
                      updateCurrentColor(
                        Math.round(255 * (1 - c2) * (1 - k2)),
                        Math.round(255 * (1 - m2) * (1 - k2)),
                        Math.round(255 * (1 - y2) * (1 - k2)),
                        currentRgba.a,
                      );
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Preview */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
        }}
      >
        <div
          style={{
            position: "relative",
            width: 36,
            height: 36,
            borderRadius: 7,
            overflow: "hidden",
            border: "0.5px solid #ddd",
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
            style={{ position: "absolute", inset: 0, background: previewBg }}
          />
        </div>
        <div
          style={{
            flex: 1,
            fontSize: 11,
            color: "#888",
            fontFamily: "monospace",
            wordBreak: "break-all",
            lineHeight: 1.4,
          }}
        >
          {value}
        </div>
        {!hideEyeDrop && hasEyeDropper && (
          <button
            onClick={handleEyeDrop}
            title="Pick color from screen"
            style={{
              padding: "5px 8px",
              border: "0.5px solid #ddd",
              borderRadius: 6,
              background: "transparent",
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            🔬
          </button>
        )}
      </div>

      {/* Presets */}
      {!hidePresets && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {(presets ?? DEFAULT_PRESETS).map((preset) => (
            <div
              key={preset}
              onClick={() => handlePreset(preset)}
              title={preset}
              style={{
                width: 18,
                height: 18,
                borderRadius: 4,
                background: preset,
                border: "0.5px solid rgba(0,0,0,.15)",
                cursor: "pointer",
                flexShrink: 0,
                transition: "transform .1s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "scale(1.2)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "scale(1)")
              }
            />
          ))}
        </div>
      )}
    </div>
  );
};
