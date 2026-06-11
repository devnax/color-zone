export interface Styles {
  [key: string]: React.CSSProperties;
}

export interface LocalesProps {
  CONTROLS?: string;
  SOLID?: string;
  LINEAR?: string;
  RADIAL?: string;
  HEX?: string;
  RGB?: string;
  HSL?: string;
  HSV?: string;
  CMYK?: string;
  OPACITY?: string;
  HUE?: string;
  DEGREES?: string;
  ADD_POINT?: string;
  DELETE_POINT?: string;
}

export interface PassedConfig {
  allowGradients?: boolean;
  allowSolid?: boolean;
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
  hideControls?: boolean;
  hideInputs?: boolean;
  hideOpacity?: boolean;
  hidePresets?: boolean;
  hideHue?: boolean;
  presets?: string[];
  hideEyeDrop?: boolean;
  hideAdvancedSliders?: boolean;
  hideColorGuide?: boolean;
  hideInputType?: boolean;
  hideColorTypeBtns?: boolean;
  hideGradientType?: boolean;
  hideGradientAngle?: boolean;
  hideGradientStop?: boolean;
  hideGradientControls?: boolean;
  width?: number;
  height?: number;
  style?: Styles;
  className?: string;
  locales?: LocalesProps;
  disableDarkMode?: boolean;
  disableLightMode?: boolean;
  hidePickerSquare?: boolean;
  showHexAlpha?: boolean;
  config?: PassedConfig;
}
