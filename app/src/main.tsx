import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { App } from "./App";
import { StoreProvider } from "./lib/store";
import { LibraryProvider } from "./lib/library";
import { AiProvider } from "./lib/ai";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <StoreProvider>
      <LibraryProvider>
        <AiProvider>
          <HashRouter>
            <App />
          </HashRouter>
        </AiProvider>
      </LibraryProvider>
    </StoreProvider>
  </StrictMode>,
);
