# 🎨 color-zone

A modern, customizable React color picker component with HSV, RGB, HEX support and a smooth user experience.

## Features

* ⚡ Lightweight and fast
* 🎨 HSV color selection
* 🌈 RGB / HEX color support
* 🖱️ EyeDropper API support
* 🎯 Accurate color picking
* 🔄 Controlled component support
* 🧩 Easy integration with React apps
* 🎛️ Customizable UI
* 📱 Responsive design

## Installation

Install using npm:

```bash
npm install color-zone
```

or yarn:

```bash
yarn add color-zone
```

## Usage

Import the component:

```tsx
import { ColorPicker } from "color-zone";
import { useState } from "react";

function App() {
  const [color, setColor] = useState("#0d12ac");

  return (
    <ColorPicker
      value={color}
      onChange={setColor}
    />
  );
}

export default App;
```

## Props

| Prop       | Type                      | Description               |
| ---------- | ------------------------- | ------------------------- |
| `value`    | `string`                  | Current color value (HEX) |
| `onChange` | `(color: string) => void` | Called when color changes |
| `width`    | `number`                  | Picker width              |
| `height`   | `number`                  | Picker height             |
| `disabled` | `boolean`                 | Disable picker            |

## Color Formats

`color-zone` supports:

* HEX

```ts
"#ff0000"
```

* RGB

```ts
rgb(255, 0, 0)
```

* HSV

```ts
{
  h: 0,
  s: 100,
  v: 100
}
```

## Example

```tsx
<ColorPicker
  value="#ff0055"
  onChange={(color) => {
    console.log(color);
  }}
/>
```

## EyeDropper

If the browser supports the EyeDropper API, users can pick colors directly from the screen.

```tsx
<ColorPicker
  enableEyeDropper
/>
```

## Browser Support

Works with modern browsers:

* Chrome
* Edge
* Firefox
* Safari

## License

MIT © color-zone
