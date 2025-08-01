import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

class ChatService {
  // Message Management
  async getRoomMessages(roomId, page = 1, limit = 50) {
    try {
      const response = await api.get('/chat/rooms/messages', {
        params: { roomId, page, limit }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getRoomLastMessage(roomId) {
    try {
      const response = await api.get('/chat/rooms/messages/last', {
        params: { roomId }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async editMessage(messageId, content) {
    try {
      const response = await api.put('/chat/messages', {
        messageId,
        content
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteMessage(messageId) {
    try {
      const response = await api.delete('/chat/messages', {
        data: { messageId }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async markAsRead(messageId) {
    try {
      const response = await api.post('/chat/messages/read', {
        messageId
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async markAsDelivered(messageId) {
    try {
      const response = await api.post('/chat/messages/delivered', {
        messageId
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getUnreadMessageCount(roomId) {
    try {
      const response = await api.get('/chat/rooms/unread-count', {
        params: { roomId }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // User Management
  async getUserProfile(userId = null) {
    try {
      const response = await api.get('/chat/users/profile', {
        params: userId ? { userId } : {}
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async checkUserStatus(userId) {
    try {
      const response = await api.get('/chat/users/status', {
        params: { userId }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Search and Filter
  async searchMessages(roomId, query, messageType = null) {
    try {
      const params = { roomId, query };
      if (messageType) params.messageType = messageType;
      
      const response = await api.get('/chat/messages/search', {
        params
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // File Upload (if needed for file messages)
  async uploadFile(file, roomId) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('roomId', roomId);

      const response = await api.post('/chat/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Utility Methods
  handleError(error) {
    if (error.response) {
      // Server responded with error status
      return {
        message: error.response.data.message || 'An error occurred',
        status: error.response.status,
        data: error.response.data
      };
    } else if (error.request) {
      // Request was made but no response received
      return {
        message: 'Network error - please check your connection',
        status: 0
      };
    } else {
      // Something else happened
      return {
        message: error.message || 'An unexpected error occurred',
        status: -1
      };
    }
  }

  // Format message data for display
  formatMessage(message) {
    return {
      ...message,
      timestamp: new Date(message.createdAt),
      isEdited: message.edited,
      editTimestamp: message.editedAt ? new Date(message.editedAt) : null,
      readByCount: message.readBy?.length || 0,
      deliveredToCount: message.deliveredTo?.length || 0
    };
  }

  // Format messages array
  formatMessages(messages) {
    return messages.map(message => this.formatMessage(message));
  }

  // Group messages by date
  groupMessagesByDate(messages) {
    const grouped = {};
    messages.forEach(message => {
      const date = new Date(message.createdAt).toDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(message);
    });
    return grouped;
  }

  // Check if message can be edited (within time limit)
  canEditMessage(message, timeLimit = 15 * 60 * 1000) { // 15 minutes
    if (message.deleted || message.messageType === 'system') {
      return false;
    }
    
    const messageTime = new Date(message.createdAt).getTime();
    const currentTime = new Date().getTime();
    
    return (currentTime - messageTime) < timeLimit;
  }

  // Check if message can be deleted
  canDeleteMessage(message, userId, userRole = 'user') {
    if (message.deleted) {
      return false;
    }
    
    // Message sender can delete their own message
    if (message.sender._id === userId) {
      return true;
    }
    
    // Admins can delete any message
    if (userRole === 'admin') {
      return true;
    }
    
    return false;
  }
}

// Create singleton instance
const chatService = new ChatService();
export default chatService;