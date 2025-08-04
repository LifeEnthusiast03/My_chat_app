const API_BASE_URL =  'http://localhost:5000/api';

class ChatService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.timeout = 10000;
  }

  // Helper method to create fetch options with authentication
  getFetchOptions(options = {}) {
    const token = localStorage.getItem('token');
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      defaultHeaders.Authorization = `Bearer ${token}`;
    }

    return {
      ...options,
      headers: defaultHeaders,
    };
  }

  // Helper method to handle fetch with timeout and error handling
  async fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const fetchOptions = this.getFetchOptions({
        ...options,
        signal: controller.signal,
      });

      const response = await fetch(`${this.baseURL}${url}`, fetchOptions);
      clearTimeout(timeoutId);

      // Handle 401 responses (token expired/invalid)
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/auth';
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          response: {
            status: response.status,
            data: errorData,
          },
        };
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw {
          request: true,
          message: 'Request timeout',
        };
      }
      
      throw error;
    }
  }

  // Helper method to build URL with query parameters
  buildUrlWithParams(path, params = {}) {
    const url = new URL(`${this.baseURL}${path}`);
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined) {
        url.searchParams.append(key, params[key]);
      }
    });
    return url.toString().replace(this.baseURL, '');
  }

  // Message Management
  async getRoomMessages(roomId, page = 1, limit = 50) {
    try {
      const url = this.buildUrlWithParams('/chat/rooms/messages', { roomId, page, limit });
      return await this.fetchWithTimeout(url);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getRoomLastMessage(roomId) {
    try {
      const url = this.buildUrlWithParams('/chat/rooms/messages/last', { roomId });
      return await this.fetchWithTimeout(url);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async editMessage(messageId, content) {
    try {
      return await this.fetchWithTimeout('/chat/messages', {
        method: 'PUT',
        body: JSON.stringify({ messageId, content }),
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteMessage(messageId) {
    try {
      return await this.fetchWithTimeout('/chat/messages', {
        method: 'DELETE',
        body: JSON.stringify({ messageId }),
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async markAsRead(messageId) {
    try {
      return await this.fetchWithTimeout('/chat/messages/read', {
        method: 'POST',
        body: JSON.stringify({ messageId }),
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async markAsDelivered(messageId) {
    try {
      return await this.fetchWithTimeout('/chat/messages/delivered', {
        method: 'POST',
        body: JSON.stringify({ messageId }),
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getUnreadMessageCount(roomId) {
    try {
      const url = this.buildUrlWithParams('/chat/rooms/unread-count', { roomId });
      return await this.fetchWithTimeout(url);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // User Management
  async getUserProfile(userId = null) {
    try {
      const params = userId ? { userId } : {};
      const url = this.buildUrlWithParams('/chat/users/profile', params);
      return await this.fetchWithTimeout(url);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async checkUserStatus(userId) {
    try {
      const url = this.buildUrlWithParams('/chat/users/status', { userId });
      return await this.fetchWithTimeout(url);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Search and Filter
  async searchMessages(roomId, query, messageType = null) {
    try {
      const params = { roomId, query };
      if (messageType) params.messageType = messageType;
      
      const url = this.buildUrlWithParams('/chat/messages/search', params);
      return await this.fetchWithTimeout(url);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // // File Upload
  // async uploadFile(file, roomId) {
  //   try {
  //     const formData = new FormData();
  //     formData.append('file', file);
  //     formData.append('roomId', roomId);

  //     // For file uploads, we don't set Content-Type header (let browser set it)
  //     const token = localStorage.getItem('token');
  //     const headers = {};
  //     if (token) {
  //       headers.Authorization = `Bearer ${token}`;
  //     }

  //     const controller = new AbortController();
  //     const timeoutId = setTimeout(() => controller.abort(), this.timeout);

  //     try {
  //       const response = await fetch(`${this.baseURL}/chat/upload`, {
  //         method: 'POST',
  //         headers,
  //         body: formData,
  //         signal: controller.signal,
  //       });

  //       clearTimeout(timeoutId);

  //       if (response.status === 401) {
  //         localStorage.removeItem('token');
  //         localStorage.removeItem('user');
  //         window.location.href = '/auth';
  //       }

  //       if (!response.ok) {
  //         const errorData = await response.json().catch(() => ({}));
  //         throw {
  //           response: {
  //             status: response.status,
  //             data: errorData,
  //           },
  //         };
  //       }

  //       return await response.json();
  //     } catch (error) {
  //       clearTimeout(timeoutId);
        
  //       if (error.name === 'AbortError') {
  //         throw {
  //           request: true,
  //           message: 'Request timeout',
  //         };
  //       }
        
  //       throw error;
  //     }
  //   } catch (error) {
  //     throw this.handleError(error);
  //   }
  // }

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