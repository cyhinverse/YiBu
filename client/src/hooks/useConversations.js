import { useState, useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import MessageService from "../services/messageService";
import UserService from "../services/userService";
import useSocket from "./useSocket";
import {
  setLoading,
  setError,
  setConversations,
} from "../slices/MessageSlice";

const useConversations = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.auth?.user);
  const userId = currentUser?.user?._id;
  const { conversations, loading } = useSelector((state) => state.message);
  
  const [allUsers, setAllUsers] = useState([]);
  
  const { socket, isConnected } = useSocket(userId);

  const fetchConversations = useCallback(async () => {
    if (!userId) return;

    try {
      dispatch(setLoading({ type: "conversations", value: true }));
      const response = await MessageService.getConversations();

      if (response?.success && Array.isArray(response.data)) {
         const validConversations = response.data.filter(
            (conv) => conv && conv.otherUser && conv.otherUser._id
          );
        dispatch(setConversations(validConversations));
      } else {
        dispatch(setConversations([]));
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
      dispatch(setError(error.message));
    } finally {
      dispatch(setLoading({ type: "conversations", value: false }));
    }
  }, [userId, dispatch]);

  const fetchUsers = useCallback(async () => {
    if (!userId) return;
    try {
      const response = await UserService.getAllUsers();
      if (response?.success && response?.data) {
        setAllUsers(response.data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }, [userId]);

  // Listen for new messages to update conversation list (e.g. re-sort or update last message)
  // Note: useSocket and Redux might handle some of this, but fetching ensures consistency.
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      fetchConversations();
    };

    socket.on("new_message", handleUpdate);
    
    return () => {
      socket.off("new_message", handleUpdate);
    };
  }, [socket, fetchConversations]);

  useEffect(() => {
    fetchConversations();
    fetchUsers();
  }, [fetchConversations, fetchUsers]);

  return {
    conversations,
    loading: loading.conversations,
    fetchConversations,
    allUsers,
    fetchUsers,
  };
};

export default useConversations;
