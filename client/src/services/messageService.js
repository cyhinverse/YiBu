// Message API Service
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

class MessageService {
  static async getConversations() {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/messages/conversations`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch conversations: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: data.code === 1,
        data: data.data,
        message: data.message,
      };
    } catch (error) {
      console.error("MessageService.getConversations error:", error);
      return {
        success: false,
        data: null,
        message: error.message,
      };
    }
  }

  static async getMessages(userId, page = 1, limit = 20) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/messages/${userId}?page=${page}&limit=${limit}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: data.code === 1,
        data: {
          messages: data.data,
          pagination: {
            page,
            limit,
            hasMore: data.data.length === limit,
          },
        },
        message: data.message,
      };
    } catch (error) {
      console.error("MessageService.getMessages error:", error);
      return {
        success: false,
        data: null,
        message: error.message,
      };
    }
  }

  static async sendMessage(messageData) {
    try {
      // Đảm bảo messageData đúng định dạng
      const { receiverId, content, media = null } = messageData;

      if (!receiverId) {
        console.error("MessageService.sendMessage: receiverId is required");
        return {
          success: false,
          data: null,
          message: "receiverId is required",
        };
      }

      console.log("MessageService.sendMessage sending:", {
        receiverId,
        content,
        media,
      });

      const response = await fetch(`${API_BASE_URL}/api/messages/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({
          receiverId,
          content,
          media,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status}`);
      }

      const data = await response.json();

      // Log thành công để debug
      if (data.code === 1) {
        console.log("MessageService.sendMessage success:", data.data);
      }

      return {
        success: data.code === 1,
        data: data.data,
        message: data.message,
      };
    } catch (error) {
      console.error("MessageService.sendMessage error:", error);
      return {
        success: false,
        data: null,
        message: error.message,
      };
    }
  }

  static async markAsRead(messageIds) {
    try {
      // Ensure messageIds is an array
      const ids = Array.isArray(messageIds) ? messageIds : [messageIds];

      if (ids.length === 0) {
        return {
          success: false,
          data: null,
          message: "No message IDs provided",
        };
      }

      console.log(`MessageService: Marking ${ids.length} messages as read`);

      const response = await fetch(`${API_BASE_URL}/api/messages/read`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({ messageIds: ids }),
      });

      if (!response.ok) {
        throw new Error(`Failed to mark messages as read: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: data.code === 1,
        data: data.data,
        message: data.message,
      };
    } catch (error) {
      console.error("MessageService.markAsRead error:", error);
      return {
        success: false,
        data: null,
        message: error.message,
      };
    }
  }

  static async deleteMessage(messageId) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/messages/${messageId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete message: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: data.code === 1,
        data: data.data,
        message: data.message,
      };
    } catch (error) {
      console.error("MessageService.deleteMessage error:", error);
      return {
        success: false,
        data: null,
        message: error.message,
      };
    }
  }

  static async deleteConversation(partnerId) {
    try {
      if (!partnerId) {
        console.error(
          "MessageService.deleteConversation: partnerId is required"
        );
        return {
          success: false,
          data: null,
          message: "partnerId is required",
        };
      }

      console.log(
        `MessageService: Deleting conversation with partner ${partnerId}`
      );

      const response = await fetch(
        `${API_BASE_URL}/api/messages/conversation/${partnerId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `Delete conversation API error: ${response.status} - ${errorText}`
        );
        throw new Error(`Failed to delete conversation: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: data.code === 1,
        data: data.data,
        message: data.message,
      };
    } catch (error) {
      console.error("MessageService.deleteConversation error:", error);
      return {
        success: false,
        data: null,
        message: error.message,
      };
    }
  }
}

export default MessageService;
