import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { ColorPicker } from "./src";

const App = () => {
  const [color, setColor] = useState(
    "linear-gradient(90deg, #373a94 0%, #ffffff 100%)",
    // "#333333",
    // "radial-gradient( #373a94 0%, #ffffff 100%)",
  );
  return (
    <div
      style={{
        height: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#EFEFEF",
      }}
    >
      <div
        style={{
          width: 230,
          padding: 16,
          borderRadius: 8,
          background: "#202020",
          color: "#fff",
        }}
      >
        <ColorPicker
          value={color}
          onChange={(c) => {
            setColor(c);
          }}
        />
      </div>
    </div>
  );
};

const rootEle = document.getElementById("root");
if (rootEle) {
  const root = createRoot(rootEle);
  root.render(<App />);
}
