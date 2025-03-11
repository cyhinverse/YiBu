import { AUTH_API_ENDPOINTS } from "../axios/apiEndpoint";
import api from "../axios/axiosConfig";

const Auth = {
  login: async (data) => {
    try {
      const res = await api.post(AUTH_API_ENDPOINTS.LOGIN, data);
      return res.data;
    } catch (error) {
      console.log("Login failed!", error.response?.data || error.message);
      throw error;
    }
  },
  register: async (data) => {
    try {
      const res = await api.post(AUTH_API_ENDPOINTS.REGISTER, data);
      return { data: res.data, status: res.status };
    } catch (error) {
      console.log(`Register failed !`, error.response?.data || error.message);
      throw error;
    }
  },
  refreshToken: async () => {
    try {
      const res = await api.post(AUTH_API_ENDPOINTS.REFRESH_TOKEN);
      return res.data;
    } catch (error) {
      console.log(
        `Reset accessToken failed !`,
        error.response?.data || error.message
      );
      throw error;
    }
  },
  logout: async () => {
    try {
      const res = await api.post(AUTH_API_ENDPOINTS.LOGOUT);
      return res.data;
    } catch (error) {
      console.log("Logout out failed !", error.response?.data || error.message);
      throw error;
    }
  },
};

export default Auth;
