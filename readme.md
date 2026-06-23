# color-zone

[![npm version](https://img.shields.io/npm/v/color-zone)](https://www.npmjs.com/package/color-zone)
[![license](https://img.shields.io/npm/l/color-zone)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-ready-blue)](https://www.typescriptlang.org/)

A flexible, zero-dependency React color picker with full gradient support, multiple color format inputs, and a headless hook for building custom UIs.

---

## Features

- **HSV picker square** — intuitive saturation/value canvas
- **Hue & alpha sliders** — separate controls with smooth drag
- **Gradient support** — linear and radial, with multi-stop editing
- **Input modes** — HEX, RGB, HSL switchable inline
- **EyeDropper API** — screen color sampling (Chromium browsers)
- **`useColorPicker` hook** — full programmatic control without the UI
- **Color utilities** — conversion helpers exported for direct use
- **TypeScript** — full type definitions included
- **Controlled component** — works with any state manager
- **Zero runtime dependencies**

---

## Installation

```bash
npm install color-zone
# or
yarn add color-zone
```

**Peer dependencies:** `react >= 17`

---

## Quick Start

```tsx
import { ColorPicker } from "color-zone";
import { useState } from "react";

export default function App() {
  const [color, setColor] = useState("#3498db");

  return <ColorPicker value={color} onChange={setColor} />;
}
```

The `value` prop accepts any supported color string — HEX, RGB, RGBA, HSL, or a CSS gradient. The `onChange` callback receives the updated value in the same format.

---

## ColorPicker Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `value` | `string` | `"#3498db"` | Current color value (HEX, RGB, RGBA, HSL, or gradient string) |
| `onChange` | `(value: string) => void` | — | Called on every color change |
| `width` | `number` | `230` | Picker width in px |
| `height` | `number` | `150` | HSV square height in px |
| `className` | `string` | — | CSS class on the root element |
| `style` | `Styles` | — | Per-element style overrides (see [Style Customization](#style-customization)) |
| `hidePickerSquare` | `boolean` | `false` | Hide the HSV canvas |
| `hideHue` | `boolean` | `false` | Hide the hue slider |
| `hideOpacity` | `boolean` | `false` | Hide the alpha/opacity slider |
| `hideInputs` | `boolean` | `false` | Hide the HEX/RGB/HSL text inputs |
| `hideInputType` | `boolean` | `false` | Hide the input-format selector |
| `hideEyeDrop` | `boolean` | `false` | Hide the EyeDropper button |
| `hideGradientControls` | `boolean` | `false` | Hide the gradient stop bar |

---

## Color Formats

`value` and `onChange` work with any of these string formats:

**HEX / HEXA**
```ts
"#ff0000"     // 6-digit hex
"#ff000080"   // 8-digit hex with alpha
```

**RGB / RGBA**
```ts
"rgb(255, 0, 0)"
"rgba(255, 0, 0, 0.5)"
```

**HSL / HSLA**
```ts
"hsl(0, 100%, 50%)"
"hsla(0, 100%, 50%, 0.5)"
```

**Linear gradient**
```ts
"linear-gradient(90deg, #ff0000 0%, #0000ff 100%)"
```

**Radial gradient**
```ts
"radial-gradient(circle, #ff0000 0%, #0000ff 100%)"
```

---

## Gradient Support

Pass a CSS gradient string as `value` and the picker switches into gradient mode automatically — the gradient stop bar appears and lets users add, move, and remove color stops interactively.

```tsx
const [bg, setBg] = useState("linear-gradient(90deg, #e52d27 0%, #b31217 100%)");

<ColorPicker value={bg} onChange={setBg} />
```

The `onChange` callback returns a valid CSS gradient string that can be applied directly to a `background` or `background-image` style.

---

## EyeDropper

When the browser supports the [EyeDropper API](https://developer.mozilla.org/en-US/docs/Web/API/EyeDropper_API) (Chrome/Edge 95+), the picker shows a dropper button automatically. Clicking it lets the user sample any color on screen.

To opt out:

```tsx
<ColorPicker value={color} onChange={setColor} hideEyeDrop />
```

---

## `useColorPicker` Hook

For headless use or building a fully custom UI, import the hook instead of the component.

```tsx
import { useColorPicker } from "color-zone";

function CustomPicker() {
  const [color, setColor] = useState("#e74c3c");
  const picker = useColorPicker(color, setColor);

  return (
    <div>
      <p>Hex: {picker.valueToHex()}</p>
      <p>HSL: {picker.valueToHSL()}</p>
      <button onClick={() => picker.setLinear()}>Make Gradient</button>
    </div>
  );
}
```

### Hook Return Values

| Property | Type | Description |
|---|---|---|
| `rgbaArr` | `number[]` | `[r, g, b, alphaPercent]` for the active stop |
| `hslArr` | `number[]` | `[h, s, l, alphaPercent]` for the active stop |
| `isGradient` | `boolean` | Whether `value` is a gradient |
| `gradientType` | `string \| undefined` | `"linear"` or `"radial"` |
| `degrees` | `number` | Gradient angle (linear only) |
| `selectedPoint` | `number` | Index of the active gradient stop |
| `currentLeft` | `number` | Position (0–100) of the active stop |
| `previousColors` | `never[]` | Reserved for future use |

### Hook Setters

| Method | Signature | Description |
|---|---|---|
| `setR` | `(r: number) => void` | Set red channel (0–255) |
| `setG` | `(g: number) => void` | Set green channel (0–255) |
| `setB` | `(b: number) => void` | Set blue channel (0–255) |
| `setA` | `(a: number) => void` | Set alpha (0–1) |
| `setHue` | `(hue: number) => void` | Set hue (0–360), preserves S/V |
| `setSaturation` | `(s: number) => void` | Set HSV saturation (0–100) |
| `setLightness` | `(l: number) => void` | Set HSL lightness (0–100) |
| `setSolid` | `(color: string) => void` | Switch to a solid color |
| `setLinear` | `() => void` | Convert current value to a linear gradient |
| `setRadial` | `() => void` | Convert current value to a radial gradient |
| `setDegrees` | `(deg: number) => void` | Set linear gradient angle |
| `setGradient` | `(gradient: string) => void` | Replace the entire gradient string |
| `addPoint` | `(left: number) => void` | Add a gradient stop at position 0–100 |
| `deletePoint` | `(index: number) => void` | Remove a gradient stop by index |
| `setSelectedPoint` | `(index: number) => void` | Change the active gradient stop |
| `setPointLeft` | `(left: number) => void` | Move the active stop's position |
| `handleChange` | `(color: string) => void` | Directly call `onChange` |

### Hook Converters

| Method | Returns | Description |
|---|---|---|
| `valueToHex()` | `string` | Current stop as `#RRGGBB` or `#RRGGBBAA` |
| `valueToHSL()` | `string` | Current stop as `hsl(...)` or `hsla(...)` |
| `valueToHSV()` | `string` | Current stop as `hsv(...)` |
| `valueToCmyk()` | `string` | Current stop as `cmyk(...)` |
| `getGradientObject(value)` | `ParsedGradient` | Parse any gradient string into a structured object |

---

## Color Utility Functions

All conversion helpers are exported for direct use:

```ts
import {
  hsv2rgb, rgb2hsv, rgb2hsl, rgb2cmyk,
  toHex, toHexA, parseColor,
  parseGradient, buildGradientString,
  colorToRgba,
} from "color-zone";
```

| Function | Signature | Description |
|---|---|---|
| `hsv2rgb` | `(h, s, v) => [r, g, b]` | HSV → RGB (0–255) |
| `rgb2hsv` | `(r, g, b) => [h, s, v]` | RGB → HSV |
| `rgb2hsl` | `(r, g, b) => [h, s, l]` | RGB → HSL |
| `rgb2cmyk` | `(r, g, b) => [c, m, y, k]` | RGB → CMYK (0–100) |
| `toHex` | `(r, g, b) => string` | RGB → `#rrggbb` |
| `toHexA` | `(r, g, b, a) => string` | RGBA → `#rrggbb` or `#rrggbbaa` |
| `parseColor` | `(color) => {r,g,b,a} \| null` | Parse HEX, RGB(A), HSL(A) into RGBA object |
| `parseGradient` | `(value) => ParsedGradient` | Parse a CSS gradient string into a structured object |
| `buildGradientString` | `(type, degrees, stops) => string` | Build a CSS gradient string from stops |
| `colorToRgba` | `(h, s, v, a) => string` | HSV + alpha → `rgb(...)` or `rgba(...)` string |

---

## Style Customization

Pass a `style` prop with per-element overrides using React `CSSProperties`:

```tsx
<ColorPicker
  value={color}
  onChange={setColor}
  style={{
    container: { borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.15)" },
  }}
/>
```

The `Styles` type accepts any key mapped to `React.CSSProperties`.

---

## TypeScript

All types are exported:

```ts
import type {
  ColorPickerProps,
  Styles,
  GradientObject,
  GradientStop,
  UseColorPickerReturn,
  ParsedGradient,
} from "color-zone";
```

| Type | Description |
|---|---|
| `ColorPickerProps` | Full props interface for `<ColorPicker />` |
| `Styles` | `{ [key: string]: React.CSSProperties }` |
| `GradientStop` | `{ left: number; color: string }` |
| `GradientObject` | Parsed gradient metadata (isGradient, type, degrees, colors) |
| `ParsedGradient` | Return type of `parseGradient()` and `getGradientObject()` |
| `UseColorPickerReturn` | Full return type of `useColorPicker()` |

---

## Browser Support

| Browser | Picker | EyeDropper |
|---|---|---|
| Chrome 95+ | ✅ | ✅ |
| Edge 95+ | ✅ | ✅ |
| Firefox | ✅ | ❌ |
| Safari | ✅ | ❌ |

EyeDropper is silently hidden in unsupported browsers — no configuration needed.

---

## License

MIT © [Devnax](https://github.com/devnax)
