import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import adminReducer from "./slices/AdminSlice.js";
import commentReducer from "./slices/CommentSlice.js";
import authReducer from "./slices/AuthSlice.js";
import userReducer from "./slices/UserSlice.js";
import postReducer from "./slices/PostSlice.js";
import likeReducer from "./slices/LikeSlice.js";
import messageReducer from "./slices/MessageSlice.js";
import savePostReducer from "./slices/SavePostSlice.js";
import notificationReducer from "./slices/NotificationSlice.js";
import hiddenPostsReducer from "./slices/HiddenPostsSlice.js";
import reportedPostsReducer from "./slices/ReportPostsSlice.js";

const persistConfig = {
  key: "root",
  storage,
  whitelist: [
    "auth",
    "admin",
    "user",
    "post",
    "comment",
    "like",
    "message",
    "savePost",
    "notification",
    "hiddenPosts",
    "reportedPosts",
  ],
};

const rootReducer = combineReducers({
  auth: authReducer,
  admin: adminReducer,
  user: userReducer,
  post: postReducer,
  comment: commentReducer,
  like: likeReducer,
  message: messageReducer,
  savePost: savePostReducer,
  notification: notificationReducer,
  hiddenPosts: hiddenPostsReducer,
  reportedPosts: reportedPostsReducer,
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
