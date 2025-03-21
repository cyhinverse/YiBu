import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import authReducer from "../slices/AuthSlice.js";
import userReducer from "../slices/UserSlice.js";
import postReducer from "../slices/PostSlice.js";
import likeReducer from "../slices/LikeSlice.js";
import messageReducer from "../slices/MessageSlice.js";

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth", "user", "post", "like", "message"],
};

const rootReducer = combineReducers({
  auth: authReducer,
  user: userReducer,
  post: postReducer,
  like: likeReducer,
  message: messageReducer,
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
