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
  width = 240,
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
  const [hue, setHue] = useState(0);
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

  const [hsvFromColor, satFromColor, valFromColor] = useMemo(
    () => rgb2hsv(currentRgba.r, currentRgba.g, currentRgba.b),
    [currentRgba],
  );
  const sat = isNaN(satFromColor) ? 0 : satFromColor;
  const val2 = isNaN(valFromColor) ? 0 : valFromColor;

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

  const inputStyle: React.CSSProperties = {
    flex: 1,
    fontSize: 12,
    height: 28,
    width: "100%",
    boxSizing: "border-box", // IMPORTANT

    border: "0.5px solid #ddd",
    borderRadius: 6,
    background: "transparent",
    color: "inherit",
    fontFamily: "monospace",

    minWidth: 0,
    outline: "none",

    padding: 0,
    margin: 0,
    textAlign: "center",

    lineHeight: "28px",
  };

  return (
    <div
      className={className}
      style={{
        width,
        fontFamily: "system-ui,-apple-system,sans-serif",
        fontSize: 13,
        userSelect: "none",
        background: "#FFFFFF",
        padding: 12,
        borderRadius: 8,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        ...(style?.container ?? {}),
      }}
    >
      {!hidePickerSquare && (
        <SVPicker
          hue={hue}
          sat={sat}
          val={val2}
          width={innerWidth}
          height={height ?? 160}
          onChange={handleSVChange}
        />
      )}
      <div
        style={{
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          background: "#fff",
          borderRadius: 8,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <button
            onClick={handleSetSolid}
            style={{
              border: 0,
              fontSize: 18,
              background: isGradient
                ? "transparent"
                : "rgba(18, 18, 18, 0.114)",
              borderRadius: 4,
              width: 30,
              height: 24,
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              padding: 0,
              margin: 0,
              opacity: isGradient ? 0.6 : 1,
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="1em"
              height="1em"
              viewBox="0 0 24 24"
            >
              <path d="M0 0h24v24H0z" fill="none" />
              <g fill="none" stroke="currentColor" stroke-width="1.5">
                <path
                  stroke-linecap="round"
                  d="M7 3.341A9.93 9.93 0 0 1 12 2c5.523 0 10 4.489 10 10.026c0 8.152-8.161 2.393-9.738 4.9c-.395.628.032 1.41.555 1.935a1.68 1.68 0 0 1 0 2.372c-.523.525-1.235.838-1.97.753C5.867 21.413 2 17.172 2 12.026A10 10 0 0 1 3.345 7"
                />
                <circle cx="17.5" cy="11.5" r="1.5" />
                <circle cx="6.5" cy="11.5" r="1.5" />
                <path d="M11.085 7a1.5 1.5 0 1 1-3 0a1.5 1.5 0 0 1 3 0ZM16 7a1.5 1.5 0 1 1-3 0a1.5 1.5 0 0 1 3 0Z" />
              </g>
            </svg>
          </button>
          <button
            onClick={handleSetSolid}
            style={{
              border: 0,
              fontSize: 18,
              background: isGradient
                ? "transparent"
                : "rgba(18, 18, 18, 0.114)",
              borderRadius: 4,
              width: 30,
              height: 24,
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              padding: 0,
              margin: 0,
              opacity: isGradient ? 0.6 : 1,
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="1em"
              height="1em"
              viewBox="0 0 24 24"
            >
              <path d="M0 0h24v24H0z" fill="none" />
              <path
                fill="currentColor"
                d="M12 22q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22m0-2q3.35 0 5.675-2.325T20 12t-2.325-5.675T12 4T6.325 6.325T4 12t2.325 5.675T12 20m0-8"
              />
            </svg>
          </button>
          <button
            onClick={handleSetLinear}
            style={{
              border: 0,
              fontSize: 18,
              borderRadius: 4,
              background:
                isGradient && gradientType === "linear"
                  ? "rgba(18, 18, 18, 0.114)"
                  : "transparent",
              width: 30,
              height: 24,
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              padding: 0,
              margin: 0,
              opacity: isGradient && gradientType === "linear" ? 1 : 0.5,
              color: isGradient && gradientType === "linear" ? "#000000" : "",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="1em"
              height="1em"
              viewBox="0 0 24 24"
            >
              <path d="M0 0h24v24H0z" fill="none" />
              <path
                fill="currentColor"
                d="M11 13v-2h2v2zm-2 2v-2h2v2zm4 0v-2h2v2zm2-2v-2h2v2zm-8 0v-2h2v2zm-2 8q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h14q.825 0 1.413.588T21 5v14q0 .825-.587 1.413T19 21zm2-2h2v-2H7zm4 0h2v-2h-2zm8 0v-2zM5 17h2v-2h2v2h2v-2h2v2h2v-2h2v2h2v-2h-2v-2h2V5H5v8h2v2H5zm0 2V5zm14-6v2zm-4 4v2h2v-2z"
              />
            </svg>
          </button>
          <button
            onClick={handleSetRadial}
            style={{
              border: 0,
              fontSize: 18,
              borderRadius: 4,
              background:
                isGradient && gradientType === "radial"
                  ? "rgba(18, 18, 18, 0.114)"
                  : "transparent",
              width: 30,
              height: 26,
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              padding: 0,
              margin: 0,
              opacity: isGradient && gradientType === "radial" ? 1 : 0.6,
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="1em"
              height="1em"
              viewBox="0 0 24 24"
            >
              <path d="M0 0h24v24H0z" fill="none" />
              <path
                fill="currentColor"
                d="M2.05 13h2.012a8.001 8.001 0 0 0 15.876 0h2.013c-.502 5.053-4.766 9-9.951 9s-9.449-3.947-9.95-9m0-2c.5-5.053 4.764-9 9.95-9s9.449 3.947 9.95 9h-2.012a8.001 8.001 0 0 0-15.876 0zM12 14a2 2 0 1 1 0-4a2 2 0 0 1 0 4"
              />
            </svg>
          </button>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: 4,
          }}
        >
          {!hideEyeDrop && hasEyeDropper && (
            <button
              onClick={handleEyeDrop}
              title="Pick color from screen"
              style={{
                border: 0,
                fontSize: 18,
                background: "transparent",
                width: 30,
                height: 24,
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                padding: 0,
                margin: 0,
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="1em"
                height="1em"
                viewBox="0 0 48 48"
              >
                <path d="M0 0h48v48H0z" fill="none" />
                <g
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="3"
                >
                  <path d="M18.998 14.132L7.459 25.671c-1.637 1.637-2.86 3.72-2.829 6.035c.032 2.364.489 4.182.489 4.182l-2.11 5.33C2.3 43.004 4.995 45.7 6.781 44.992l5.24-2.2s1.756.44 4.088.513c2.425.075 4.628-1.174 6.344-2.89L33.86 29.008M19.5 21.63l-5.274 5.275" />
                  <path d="M41.076 6.927c-4.45-4.456-11.663-4.456-16.112 0l-1.842 1.845l-.55-.51c-1.214-1.117-2.87-1.31-4.064-.173a22 22 0 0 0-.784.785c-1.135 1.197-.943 2.855.172 4.07c1.475 1.61 4.053 4.331 8.34 8.625c4.287 4.295 7.004 6.877 8.61 8.354c1.213 1.117 2.87 1.31 4.064.173a23 23 0 0 0 .784-.785c1.135-1.197.942-2.855-.173-4.07q-.14-.155-.294-.32l1.849-1.852c4.45-4.458 4.45-11.685 0-16.142" />
                </g>
              </svg>
            </button>
          )}
          {!hideInputType && (
            <div>
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
        </div>
      </div>
      {isGradient && gradientType === "linear" && !hideGradientAngle && (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
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
      {isGradient && !hideGradientControls && (
        <div>
          <GradientBar
            stops={parsed.colors}
            selectedPoint={safeSelected}
            onSelectPoint={setSelectedPoint}
            onMovePoint={handleMovePoint}
            onAddPoint={handleAddPoint}
            onRemovePoint={handleDeletePoint}
            width={innerWidth}
          />
          {/* {!hideGradientStop && parsed.colors.length > 2 && (
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
            )} */}
        </div>
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
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: 8,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 8,
          }}
        >
          <div
            style={{
              position: "relative",
              width: 32,
              height: 28,
              borderRadius: 4,
              overflow: "hidden",
              border: "0.5px solid #292929",
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

          {/* {!hidePresets && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
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
                    (e.currentTarget.style.transform = "scale(1.09)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.transform = "scale(1)")
                  }
                />
              ))}
            </div>
          )} */}
        </div>
        {!hideInputs && (
          <div style={{ flex: 1 }}>
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
                      <input
                        type="number"
                        min={0}
                        max={255}
                        style={inputStyle}
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
                      <div
                        style={{
                          fontSize: 10,
                          textAlign: "center",
                          color: "#888",
                        }}
                      >
                        {label}
                      </div>
                    </div>
                  );
                })}
                {!hideOpacity && (
                  <div style={{ flex: 1 }}>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      style={inputStyle}
                      value={alphaPercent}
                      onChange={(e) => handleAlphaChange(+e.target.value / 100)}
                    />
                    <div
                      style={{
                        fontSize: 10,
                        textAlign: "center",
                        color: "#888",
                      }}
                    >
                      A%
                    </div>
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
                    <input
                      type="number"
                      min={mn}
                      max={mx}
                      style={inputStyle}
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
                    <div
                      style={{
                        fontSize: 10,
                        textAlign: "center",
                        color: "#888",
                      }}
                    >
                      {l}
                    </div>
                  </div>
                ))}
                {!hideOpacity && (
                  <div style={{ flex: 1 }}>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      style={inputStyle}
                      value={alphaPercent}
                      onChange={(e) => handleAlphaChange(+e.target.value / 100)}
                    />
                    <div
                      style={{
                        fontSize: 10,
                        textAlign: "center",
                        color: "#888",
                      }}
                    >
                      A%
                    </div>
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
                    <input
                      type="number"
                      min={mn}
                      max={mx}
                      style={inputStyle}
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
                    <div
                      style={{
                        fontSize: 10,
                        textAlign: "center",
                        color: "#888",
                      }}
                    >
                      {l}
                    </div>
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
                    <input
                      type="number"
                      min={0}
                      max={100}
                      style={inputStyle}
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
                    <div
                      style={{
                        fontSize: 10,
                        textAlign: "center",
                        color: "#888",
                      }}
                    >
                      {l}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
