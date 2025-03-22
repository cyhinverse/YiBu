import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import savePostReducer from "../slices/SavePostSlice";

// Cấu hình persist cho savePost reducer
const savePostPersistConfig = {
  key: "savePost",
  storage,
  whitelist: ["savedPosts", "savedStatus"], // Chỉ persist các field này
};

const persistedSavePostReducer = persistReducer(
  savePostPersistConfig,
  savePostReducer
);

export const store = configureStore({
  reducer: {
    savePost: persistedSavePostReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }),
});

export const persistor = persistStore(store);
