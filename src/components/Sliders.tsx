import React, { useRef, useEffect, useCallback } from "react";
import { hsv2rgb } from "../utils/colorUtils";

interface HueSliderProps {
  hue: number;
  width: number;
  onChange: (hue: number) => void;
}

export const HueSlider: React.FC<HueSliderProps> = ({
  hue,
  width,
  onChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragging = useRef(false);
  const HEIGHT = 14;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const w = canvas.width;
    const g = ctx.createLinearGradient(0, 0, w, 0);
    for (let i = 0; i <= 360; i += 30)
      g.addColorStop(i / 360, `hsl(${i},100%,50%)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, HEIGHT);
  }, [width]);

  const track = useCallback(
    (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const clientX =
        "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const h = Math.max(
        0,
        Math.min(360, ((clientX - rect.left) / rect.width) * 360),
      );
      onChange(h);
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

  const thumbStyle: React.CSSProperties = {
    position: "absolute",
    top: "50%",
    left: (hue / 360) * 100 + "%",
    width: 16,
    height: 16,
    borderRadius: "50%",
    border: "2px solid #fff",
    boxShadow: "0 0 0 1.5px rgba(0,0,0,0.35)",
    background: `hsl(${hue},100%,50%)`,
    transform: "translate(-50%,-50%)",
    pointerEvents: "none",
  };

  return (
    <div
      style={{
        position: "relative",
        height: HEIGHT,
        borderRadius: 7,
        overflow: "visible",
      }}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={HEIGHT}
        style={{
          display: "block",
          width: "100%",
          height: HEIGHT,
          borderRadius: 7,
          cursor: "pointer",
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

interface AlphaSliderProps {
  hue: number;
  sat: number;
  val: number;
  alpha: number;
  width: number;
  onChange: (alpha: number) => void;
}

function createCheckerPattern(): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = 8;
  c.height = 8;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#ccc";
  ctx.fillRect(0, 0, 4, 4);
  ctx.fillRect(4, 4, 4, 4);
  ctx.fillStyle = "#fff";
  ctx.fillRect(4, 0, 4, 4);
  ctx.fillRect(0, 4, 4, 4);
  return c;
}

export const AlphaSlider: React.FC<AlphaSliderProps> = ({
  hue,
  sat,
  val,
  alpha,
  width,
  onChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragging = useRef(false);
  const HEIGHT = 14;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const w = canvas.width;
    ctx.clearRect(0, 0, w, HEIGHT);
    const pat = ctx.createPattern(createCheckerPattern(), "repeat")!;
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, w, HEIGHT);
    const [r, g, b] = hsv2rgb(hue, sat, val);
    const g2 = ctx.createLinearGradient(0, 0, w, 0);
    g2.addColorStop(0, `rgba(${r},${g},${b},0)`);
    g2.addColorStop(1, `rgba(${r},${g},${b},1)`);
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, w, HEIGHT);
  }, [hue, sat, val, width]);

  const track = useCallback(
    (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const clientX =
        "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const a = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      onChange(a);
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
    top: "50%",
    left: alpha * 100 + "%",
    width: 16,
    height: 16,
    borderRadius: "50%",
    border: "2px solid #fff",
    boxShadow: "0 0 0 1.5px rgba(0,0,0,0.35)",
    background: `rgba(${r},${g},${b},${alpha})`,
    transform: "translate(-50%,-50%)",
    pointerEvents: "none",
  };

  return (
    <div
      style={{
        position: "relative",
        height: HEIGHT,
        borderRadius: 7,
        overflow: "visible",
      }}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={HEIGHT}
        style={{
          display: "block",
          width: "100%",
          height: HEIGHT,
          borderRadius: 7,
          cursor: "pointer",
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
