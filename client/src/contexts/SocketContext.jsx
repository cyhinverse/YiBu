import { createContext, useContext } from "react";
import { useSelector } from "react-redux";
import useSocket from "../hooks/useSocket";

const SocketContext = createContext(null);

export const useSocketContext = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  const userId = user?._id || user?.user?._id;


  const socketData = useSocket(userId);

  return (
    <SocketContext.Provider value={socketData}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider;
