import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { ColorPicker } from "./src";

const App = () => {
  const [color, setColor] = useState("#ffffff");
  return (
    <div
      style={{
        height: "100vh",
        background: "#333",
      }}
    >
      <ColorPicker
        value={color}
        onChange={(c) => {
          setColor(c);
        }}
      />
    </div>
  );
};

const rootEle = document.getElementById("root");
if (rootEle) {
  const root = createRoot(rootEle);
  root.render(<App />);
}
