// Message API Service
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

class MessageService {
  static async getConversations() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/messages/conversations`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch conversations: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: data.code === 1,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('MessageService.getConversations error:', error);
      return {
        success: false,
        data: null,
        message: error.message
      };
    }
  }

  static async getMessages(userId, page = 1, limit = 20) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/messages/${userId}?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

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
            hasMore: data.data.length === limit
          }
        },
        message: data.message
      };
    } catch (error) {
      console.error('MessageService.getMessages error:', error);
      return {
        success: false,
        data: null,
        message: error.message
      };
    }
  }

  static async sendMessage(receiverId, content, media = null) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          receiverId,
          content,
          media
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: data.code === 1,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('MessageService.sendMessage error:', error);
      return {
        success: false,
        data: null,
        message: error.message
      };
    }
  }

  static async markAsRead(messageId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/messages/read/${messageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to mark message as read: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: data.code === 1,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('MessageService.markAsRead error:', error);
      return {
        success: false,
        data: null,
        message: error.message
      };
    }
  }

  static async deleteMessage(messageId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to delete message: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: data.code === 1,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('MessageService.deleteMessage error:', error);
      return {
        success: false,
        data: null,
        message: error.message
      };
    }
  }
}

export default MessageService;