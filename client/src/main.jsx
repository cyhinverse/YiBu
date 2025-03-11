import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import DataProvider from "./DataProvider.jsx";
import { Provider } from "react-redux";
import { store, persistor } from "./utils/configureStore.js";
import { PersistGate } from "redux-persist/integration/react";

createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <BrowserRouter>
        <DataProvider>
          <App />
        </DataProvider>
      </BrowserRouter>
    </PersistGate>
  </Provider>
);
