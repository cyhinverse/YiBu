export const messageSlice = createSlice({
  name: "message",
  initialState,
  reducers: {
    setConversations: (state, action) => {
      console.log(
        "[DEBUG-REDUX] Setting conversations:",
        action.payload?.length
      );
      state.conversations = action.payload;
    },
    setCurrentMessages: (state, action) => {
      console.log(
        "[DEBUG-REDUX] Setting current messages:",
        action.payload?.length
      );
      state.currentMessages = action.payload;
    },
    updatePagination: (state, action) => {
      console.log("[DEBUG-REDUX] Updating pagination:", action.payload);
      state.pagination = { ...state.pagination, ...action.payload };
    },
    setSelectedUser: (state, action) => {
      console.log("[DEBUG-REDUX] Setting selected user:", action.payload);
      console.log(
        "[DEBUG-REDUX] Selected user structure:",
        JSON.stringify(action.payload, null, 2)
      );
      state.selectedUser = action.payload;
    },
    // ... existing code ...
  },
});
