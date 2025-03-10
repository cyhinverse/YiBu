import { API_ENDPOINTS } from "./apiEndpoint";
import api from "./axiosConfig";

const Auth = {
  login: async (data) => {
    try {
      const res = await api.post(API_ENDPOINTS.LOGIN, data);
      return res.data;
    } catch (error) {
      console.log("Login failed!", error.response?.data || error.message);
      throw error;
    }
  },
  register: async (data) => {
    try {
      const res = await api.post(API_ENDPOINTS.REGISTER, data);
      return { data: res.data, status: res.status };
    } catch (error) {
      console.log(`Register failed !`, error.response?.data || error.message);
      throw error;
    }
  },
};

export default Auth;
