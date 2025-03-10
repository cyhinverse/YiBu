import axios from "axios";

const backendUrl = "http://localhost:9785";
const api = axios.create({
  baseURL: backendUrl,
  timeout: 10000,
});

export default api;
