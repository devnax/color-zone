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
  onRemovePoint: (index: number) => void;
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
  onRemovePoint,
  width,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const draggingIdx = useRef<number | null>(null);
  const HEIGHT = 10;

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

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Backspace") return;

      // optional: avoid deleting while typing in inputs
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        (target as any).isContentEditable;

      if (isInput) return;

      if (selectedPoint == null) return;
      if (stops.length <= 1) return; // prevent empty gradient

      // you need to add this prop
      onRemovePoint(selectedPoint);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedPoint, stops.length, onRemovePoint]);

  return (
    <div
      style={{
        height: HEIGHT + 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ position: "relative", height: HEIGHT, userSelect: "none" }}>
        <div
          style={{
            position: "relative",
            borderRadius: 7,
            overflow: "hidden",
            height: HEIGHT,
            boxShadow: "0 0 0 1px rgba(100, 100, 100, 0.5)",
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
              title={stops.length > 2 ? "Backspace to remove" : ""}
              key={idx}
              style={{
                position: "absolute",
                top: "50%",
                left: `${stop.left}%`,
                transform: "translate(-50%, -50%)",
                width: HEIGHT,
                height: HEIGHT,
                borderRadius: "50%",
                cursor: "pointer",
                zIndex: isSelected ? 10 : 5,

                background: `rgba(${rgba.r},${rgba.g},${rgba.b},${rgba.a})`,
                border: "2px solid #fff",
                boxShadow: isSelected
                  ? "0 0 0 2px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.25)"
                  : "0 0 0 1.5px rgba(0,0,0,0.35)",

                transition: "transform 120ms ease, box-shadow 120ms ease",
                transformOrigin: "center",
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
            />
          );
        })}
      </div>
    </div>
  );
};
