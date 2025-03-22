import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import authReducer from "../slices/AuthSlice.js";
import userReducer from "../slices/UserSlice.js";
import postReducer from "../slices/PostSlice.js";
import likeReducer from "../slices/LikeSlice.js";
import messageReducer from "../slices/MessageSlice.js";
import savePostReducer from "../slices/SavePostSlice.js";
import notificationReducer from "../slices/NotificationSlice.js";

const persistConfig = {
  key: "root",
  storage,
  whitelist: [
    "auth",
    "user",
    "post",
    "like",
    "message",
    "savePost",
    "notification",
  ],
};

const rootReducer = combineReducers({
  auth: authReducer,
  user: userReducer,
  post: postReducer,
  like: likeReducer,
  message: messageReducer,
  savePost: savePostReducer,
  notification: notificationReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

const persistor = persistStore(store);

export { store, persistor };
