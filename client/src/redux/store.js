import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import authReducer from './slices/AuthSlice.js';
import userReducer from './slices/UserSlice.js';
import postReducer from './slices/PostSlice.js';
import commentReducer from './slices/CommentSlice.js';
import likeReducer from './slices/LikeSlice.js';
import messageReducer from './slices/MessageSlice.js';

import savePostReducer from './slices/SavePostSlice.js';
import adminReducer from './slices/AdminSlice.js';
import reportReducer from './slices/ReportSlice.js';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: [
    'auth',
    'user',
    'post',
    'comment',
    'like',
    'message',

    'savePost',
    'admin',
    'report',
  ],
};

const rootReducer = combineReducers({
  auth: authReducer,
  user: userReducer,
  post: postReducer,
  comment: commentReducer,
  like: likeReducer,
  message: messageReducer,
  savePost: savePostReducer,
  admin: adminReducer,
  report: reportReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

const persistor = persistStore(store);

export { store, persistor };
