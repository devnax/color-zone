import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { ColorPicker } from "./src";

const App = () => {
  const [color, setColor] = useState(
    "linear-gradient(90deg, #373a94 0%, #ffffff 100%)",
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
