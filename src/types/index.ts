export interface Styles {
  [key: string]: React.CSSProperties;
}

export interface GradientStop {
  left: number;
  color: string;
}

export interface GradientObject {
  isGradient: boolean;
  gradientType: string | undefined | null;
  degrees: string | null;
  colors: GradientStop[];
}

export interface ColorPickerProps {
  value?: string;
  onChange: (value: string) => void;
  hideInputs?: boolean;
  hideOpacity?: boolean;
  hideHue?: boolean;
  hideEyeDrop?: boolean;
  hideInputType?: boolean;
  hideGradientControls?: boolean;
  width?: number;
  height?: number;
  style?: Styles;
  className?: string;
  hidePickerSquare?: boolean;
}
