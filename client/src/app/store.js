import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../slices/AuthSlice.JS";

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});
