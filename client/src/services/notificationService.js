import api from "../axios/axiosConfig";

const NOTIFICATION = {
  CREATE_NOTIFICATION: (data) => {
    return api.post("/api/notifications", data);
  },

  GET_NOTIFICATIONS: (page = 1, limit = 20) => {
    return api.get(`/api/notifications?page=${page}&limit=${limit}`);
  },

  MARK_AS_READ: (notificationId) => {
    return api.put(`/api/notifications/${notificationId}/read`);
  },

  MARK_ALL_AS_READ: () => {
    return api.put("/api/notifications/read-all");
  },

  DELETE_NOTIFICATION: (notificationId) => {
    return api.delete(`/api/notifications/${notificationId}`);
  },

  GET_UNREAD_COUNT: () => {
    return api.get("/api/notifications/unread-count");
  },
};

export default NOTIFICATION;
