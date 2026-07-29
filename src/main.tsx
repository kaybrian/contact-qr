import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
// @ts-ignore: CSS module is handled by the bundler.
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
