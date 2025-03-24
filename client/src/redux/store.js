import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import savePostReducer from "../slices/SavePostSlice";
import hiddenPostsReducer from "../slices/HiddenPostsSlice";
import reportedPostsReducer from "../slices/ReportPostsSlice";

// Cấu hình persist cho savePost reducer
const savePostPersistConfig = {
  key: "savePost",
  storage,
  whitelist: ["savedPosts", "savedStatus"], // Chỉ persist các field này
};

// Cấu hình persist cho hiddenPosts reducer
const hiddenPostsPersistConfig = {
  key: "hiddenPosts",
  storage,
  whitelist: ["hiddenPosts"], // Chỉ persist danh sách bài viết đã ẩn
};

// Cấu hình persist cho reportedPosts reducer
const reportedPostsPersistConfig = {
  key: "reportedPosts", 
  storage,
  whitelist: ["reportedPosts"], // Chỉ persist danh sách bài viết đã báo cáo
};

const persistedSavePostReducer = persistReducer(
  savePostPersistConfig,
  savePostReducer
);

const persistedHiddenPostsReducer = persistReducer(
  hiddenPostsPersistConfig,
  hiddenPostsReducer
);

const persistedReportedPostsReducer = persistReducer(
  reportedPostsPersistConfig,
  reportedPostsReducer
);

export const store = configureStore({
  reducer: {
    savePost: persistedSavePostReducer,
    hiddenPosts: persistedHiddenPostsReducer,
    reportedPosts: persistedReportedPostsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }),
});

export const persistor = persistStore(store);
