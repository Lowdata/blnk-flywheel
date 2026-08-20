import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@rainbow-me/rainbowkit/styles.css";
import { BlnkProvider } from "./contracts/provider";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BlnkProvider>
      <App />
    </BlnkProvider>
  </StrictMode>
);
