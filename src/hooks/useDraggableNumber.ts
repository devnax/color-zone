import { useRef, useEffect, useCallback, RefObject } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UseDraggableNumberOptions {
  /** Pixels of pointer movement per 1 unit change. Default: 1 */
  speed?: number;
  /** Minimum allowed value. Default: -Infinity */
  min?: number;
  /** Maximum allowed value. Default: +Infinity */
  max?: number;
  /** Decimal places to round to. Default: 0 */
  decimals?: number;
  /** Drag axis. Default: "x" */
  axis?: "x" | "y" | "both";
  // ...existing options
  suffix?: string; // e.g. "deg", "px", "%"
  /** Called when dragging starts */
  onChangeStart?: () => void;
  /** Called when dragging ends */
  onChangeEnd?: () => void;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

function useDraggableNumber(
  options: UseDraggableNumberOptions = {},
): RefObject<HTMLInputElement | null> {
  const {
    speed = 1,
    min = -Infinity,
    max = Infinity,
    decimals = 0,
    axis = "x",
    suffix = "",
    onChangeStart,
    onChangeEnd,
  } = options;

  const ref = useRef<HTMLInputElement>(null);

  const dragState = useRef({
    active: false,
    startX: 0,
    startY: 0,
    startValue: 0,
  });

  const clamp = useCallback(
    (v: number) => Math.min(max, Math.max(min, v)),
    [min, max],
  );

  const round = useCallback(
    (v: number) => parseFloat(v.toFixed(decimals)),
    [decimals],
  );

  const getValue = useCallback((): number => {
    const raw = parseFloat(ref.current?.value ?? "0");
    return isNaN(raw) ? 0 : raw;
  }, []);

  // setValue inside the hook
  const setValue = useCallback(
    (v: number): void => {
      const el = ref.current;
      if (!el) return;

      const next = String(round(clamp(v)));

      // Trick React into seeing the value change
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      )?.set;

      nativeInputValueSetter?.call(el, `${next}${suffix ?? ""}`);

      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    },
    [clamp, round],
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.style.cursor = axis === "y" ? "ns-resize" : "ew-resize";

    const onPointerDown = (e: PointerEvent): void => {
      if (e.button !== 0) return;
      if (document.activeElement === el) return;

      e.preventDefault();
      el.setPointerCapture(e.pointerId);

      dragState.current = {
        active: true,
        startX: e.clientX,
        startY: e.clientY,
        startValue: getValue(),
      };

      el.style.userSelect = "none";
      onChangeStart?.();
    };

    const onPointerMove = (e: PointerEvent): void => {
      if (!dragState.current.active) return;

      const dx = e.clientX - dragState.current.startX;
      const dy = e.clientY - dragState.current.startY;

      let delta: number;
      if (axis === "y") delta = -dy / speed;
      else if (axis === "both") delta = (dx - dy) / speed;
      else delta = dx / speed;

      setValue(dragState.current.startValue + delta);
    };

    const onPointerUp = (): void => {
      if (!dragState.current.active) return;
      dragState.current.active = false;
      el.style.userSelect = "";
      onChangeEnd?.();
    };

    const onDblClick = (): void => {
      el.focus();
      el.select();
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerUp);
    el.addEventListener("dblclick", onDblClick);

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerUp);
      el.removeEventListener("dblclick", onDblClick);
    };
  }, [
    speed,
    min,
    max,
    decimals,
    axis,
    getValue,
    setValue,
    onChangeStart,
    onChangeEnd,
  ]);

  return ref;
}

export default useDraggableNumber;
