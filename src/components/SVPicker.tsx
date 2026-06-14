import React, { useRef, useEffect, useCallback } from "react";
import { hsv2rgb } from "../utils/colorUtils";

interface SVPickerProps {
  hue: number;
  sat: number;
  val: number;
  width: number;
  height: number;
  onChange: (sat: number, val: number) => void;
}

export const SVPicker: React.FC<SVPickerProps> = ({
  hue,
  sat,
  val,
  width,
  height,
  onChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragging = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    const gH = ctx.createLinearGradient(0, 0, w, 0);
    gH.addColorStop(0, "#fff");
    gH.addColorStop(1, `hsl(${hue}, 100%, 50%)`);
    ctx.fillStyle = gH;
    ctx.fillRect(0, 0, w, h);
    const gV = ctx.createLinearGradient(0, 0, 0, h);
    gV.addColorStop(0, "rgba(0,0,0,0)");
    gV.addColorStop(1, "#000");
    ctx.fillStyle = gV;
    ctx.fillRect(0, 0, w, h);
  }, [hue, width, height]);

  const track = useCallback(
    (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      // Use getBoundingClientRect for correct position — canvas CSS size may differ from attribute size
      const rect = canvas.getBoundingClientRect();
      const clientX =
        "touches" in e
          ? (e as TouchEvent).touches[0].clientX
          : (e as MouseEvent).clientX;
      const clientY =
        "touches" in e
          ? (e as TouchEvent).touches[0].clientY
          : (e as MouseEvent).clientY;
      const s = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const v = Math.max(
        0,
        Math.min(1, 1 - (clientY - rect.top) / rect.height),
      );
      onChange(s, v);
    },
    [onChange],
  );

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (dragging.current) track(e);
    };
    const onUp = () => {
      dragging.current = false;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [track]);

  const [r, g, b] = hsv2rgb(hue, sat, val);

  const thumbStyle: React.CSSProperties = {
    position: "absolute",
    left: sat * 100 + "%",
    top: (1 - val) * 100 + "%",
    width: 14,
    height: 14,
    borderRadius: "50%",
    border: "2px solid #fff",
    boxShadow: "0 0 0 1.5px rgba(0,0,0,0.35)",
    background: `rgb(${r},${g},${b})`,
    transform: "translate(-50%,-50%)",
    pointerEvents: "none",
  };

  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        borderRadius: 8,
        overflow: "hidden",
        flexShrink: 0,
        border: "0.5px solid rgba(0,0,0,0.1)",
      }}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          display: "block",
          cursor: "pointer",
          width: "100%",
          height: "100%",
        }}
        onMouseDown={(e) => {
          dragging.current = true;
          track(e);
        }}
        onTouchStart={(e) => {
          dragging.current = true;
          track(e);
        }}
      />
      <div style={thumbStyle} />
    </div>
  );
};
