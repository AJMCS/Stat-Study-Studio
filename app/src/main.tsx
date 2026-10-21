import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { App } from "./App";
import { StoreProvider } from "./lib/store";
import { LibraryProvider } from "./lib/library";
import { AiProvider } from "./lib/ai";
import { ConnectionProvider } from "./lib/connection";
// Fonts ship inside the app so it looks the same offline.
import "@fontsource/geist-sans/latin-400.css";
import "@fontsource/geist-sans/latin-500.css";
import "@fontsource/geist-sans/latin-600.css";
import "@fontsource/geist-sans/latin-700.css";
import "@fontsource/geist-mono/latin-400.css";
import "@fontsource/geist-mono/latin-500.css";
import "@fontsource/geist-mono/latin-600.css";
import "@fontsource/geist-mono/latin-700.css";
import "@fontsource/caveat/latin-500.css";
import "@fontsource/caveat/latin-700.css";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <StoreProvider>
      <LibraryProvider>
        <AiProvider>
          <HashRouter>
            <ConnectionProvider>
              <App />
            </ConnectionProvider>
          </HashRouter>
        </AiProvider>
      </LibraryProvider>
    </StoreProvider>
  </StrictMode>,
);
