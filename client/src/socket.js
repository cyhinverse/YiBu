import { io } from "socket.io-client";

export const socket = io("http://localhost:9785"); // URL của server

socket.on("connect", () => {
  console.log("Connected to server");
});

socket.on("disconnect", () => {
  console.log("Disconnected from server");
});
