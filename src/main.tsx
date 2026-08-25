import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { DonateButton } from "./components/DonateButton";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
    <DonateButton />
  </StrictMode>,
);
