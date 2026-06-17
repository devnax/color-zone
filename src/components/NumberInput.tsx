import React from "react";
import useDraggableNumber from "../hooks/useDraggableNumber";

type NumberInputProps = {
  value: string | number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
};

export const inputStyle: React.CSSProperties = {
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

const NumberInput = ({
  value,
  onChange,
  min,
  max,
  suffix,
}: NumberInputProps) => {
  suffix ??= "";
  const ref = useDraggableNumber({ min, max, suffix });

  return (
    <input
      ref={ref}
      style={inputStyle}
      value={`${value}${suffix}`}
      onChange={(e) => {
        const num = parseFloat(e.target.value);
        onChange(num);
      }}
    />
  );
};

export default NumberInput;
