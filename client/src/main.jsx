import React from "react";
import ReactDOM from "react-dom/client";
import "./globals.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { store, persistor } from "./utils/configureStore.js";
import { PersistGate } from "redux-persist/integration/react";

// Kiểm tra dark mode từ localStorage khi trang tải
const initializeDarkMode = () => {
  try {
    const persistedRoot = localStorage.getItem("persist:root");
    if (persistedRoot) {
      const parsedRoot = JSON.parse(persistedRoot);
      if (parsedRoot.user) {
        const userData = JSON.parse(parsedRoot.user);
        const themeAppearance = userData?.settings?.theme?.appearance;
        console.log(
          "Initial theme appearance from localStorage:",
          themeAppearance
        );

        if (themeAppearance === "dark") {
          document.documentElement.classList.add("dark");
          console.log("Applied dark mode from localStorage");
        } else if (themeAppearance === "system") {
          const prefersDark = window.matchMedia(
            "(prefers-color-scheme: dark)"
          ).matches;
          if (prefersDark) {
            document.documentElement.classList.add("dark");
            console.log("Applied dark mode from system preference");
          }
        }
      }
    }
  } catch (error) {
    console.error("Error initializing dark mode:", error);
  }
};

// Thực thi ngay khi tải trang
initializeDarkMode();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <BrowserRouter>
            <App />
        </BrowserRouter>
      </PersistGate>
    </Provider>
  </React.StrictMode>
);
