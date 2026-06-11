import React, { useRef, useEffect, useCallback } from "react";
import { hsv2rgb, parseColor } from "../utils/colorUtils";

interface GradientStop {
  left: number;
  color: string;
}

interface GradientBarProps {
  stops: GradientStop[];
  selectedPoint: number;
  onSelectPoint: (index: number) => void;
  onMovePoint: (index: number, left: number) => void;
  onAddPoint: (left: number) => void;
  width: number;
}

function createChecker(): HTMLCanvasElement {
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

export const GradientBar: React.FC<GradientBarProps> = ({
  stops,
  selectedPoint,
  onSelectPoint,
  onMovePoint,
  onAddPoint,
  width,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const draggingIdx = useRef<number | null>(null);
  const HEIGHT = 28;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const w = canvas.width;
    ctx.clearRect(0, 0, w, HEIGHT);
    const pat = ctx.createPattern(createChecker(), "repeat")!;
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, w, HEIGHT);
    const sorted = [...stops].sort((a, b) => a.left - b.left);
    const g = ctx.createLinearGradient(0, 0, w, 0);
    sorted.forEach((s) => {
      const rgba = parseColor(s.color) ?? { r: 0, g: 0, b: 0, a: 1 };
      g.addColorStop(
        s.left / 100,
        `rgba(${rgba.r},${rgba.g},${rgba.b},${rgba.a})`,
      );
    });
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, HEIGHT);
  }, [stops, width]);

  const getLeft = (
    e: React.MouseEvent | MouseEvent | React.TouchEvent | TouchEvent,
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return 0;
    const rect = canvas.getBoundingClientRect();
    const clientX =
      "touches" in e
        ? (e as TouchEvent).touches[0].clientX
        : (e as MouseEvent).clientX;
    return Math.max(
      0,
      Math.min(100, ((clientX - rect.left) / rect.width) * 100),
    );
  };

  const handleCanvasDown = useCallback(
    (e: React.MouseEvent) => {
      const left = getLeft(e);
      onAddPoint(left);
    },
    [onAddPoint],
  );

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (draggingIdx.current === null) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const clientX =
        "touches" in e
          ? (e as TouchEvent).touches[0].clientX
          : (e as MouseEvent).clientX;
      const left = Math.max(
        0,
        Math.min(100, ((clientX - rect.left) / rect.width) * 100),
      );
      onMovePoint(draggingIdx.current, left);
    };
    const onUp = () => {
      draggingIdx.current = null;
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
  }, [onMovePoint]);

  return (
    <div
      style={{ position: "relative", height: HEIGHT + 20, userSelect: "none" }}
    >
      <div
        style={{
          position: "relative",
          borderRadius: 6,
          overflow: "hidden",
          height: HEIGHT,
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
            cursor: "copy",
          }}
          onMouseDown={handleCanvasDown}
        />
      </div>
      {stops.map((stop, idx) => {
        const rgba = parseColor(stop.color) ?? { r: 0, g: 0, b: 0, a: 1 };
        const isSelected = idx === selectedPoint;
        return (
          <div
            key={idx}
            style={{
              position: "absolute",
              top: HEIGHT,
              left: `${stop.left}%`,
              transform: "translateX(-50%)",
              cursor: "grab",
              zIndex: isSelected ? 10 : 5,
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              draggingIdx.current = idx;
              onSelectPoint(idx);
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              draggingIdx.current = idx;
              onSelectPoint(idx);
            }}
          >
            <svg width="16" height="18" viewBox="0 0 16 18">
              <polygon
                points="0,4 16,4 16,12 8,18 0,12"
                fill={`rgba(${rgba.r},${rgba.g},${rgba.b},${rgba.a})`}
                stroke={isSelected ? "#333" : "#aaa"}
                strokeWidth={isSelected ? 2 : 1}
              />
              <rect
                x="2"
                y="0"
                width="12"
                height="5"
                rx="2"
                fill={isSelected ? "#333" : "#aaa"}
              />
            </svg>
          </div>
        );
      })}
    </div>
  );
};
