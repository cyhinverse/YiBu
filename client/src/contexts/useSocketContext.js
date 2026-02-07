import { useContext } from 'react';
import { SocketContext } from './socketContextBase';

export const useSocketContext = () => useContext(SocketContext);

