const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Utility function to create fetch requests with default configuration
const createFetchRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Get token from localStorage
  const token = localStorage.getItem('token');
  
  // Default headers
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };
  
  // Add authorization header if token exists
  if (token) {
    defaultHeaders.Authorization = `Bearer ${token}`;
  }
  
  // Merge headers
  const headers = {
    ...defaultHeaders,
    ...options.headers,
  };
  
  // Create fetch options
  const fetchOptions = {
    timeout: 10000,
    ...options,
    headers,
  };
  
  try {
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), fetchOptions.timeout);
    
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    // Handle 401 unauthorized
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth';
      throw new Error('Unauthorized');
    }
    
    // Parse response
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
};

class RoomService {
  // Room CRUD Operations
  async createRoom(roomData) {
    try {
      const response = await createFetchRequest('/chat/rooms', {
        method: 'POST',
        body: JSON.stringify(roomData),
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getRooms(page = 1, limit = 20, type = null) {
    try {
      const params = new URLSearchParams({ page, limit });
      if (type) params.append('type', type);
      
      const response = await createFetchRequest(`/chat/rooms?${params}`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getRoomInfo(roomId) {
    try {
      const params = new URLSearchParams({ roomId });
      const response = await createFetchRequest(`/chat/rooms/info?${params}`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateRoom(roomId, updateData) {
    try {
      const response = await createFetchRequest(`/chat/rooms/${roomId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteRoom(roomId) {
    try {
      const response = await createFetchRequest('/chat/rooms', {
        method: 'DELETE',
        body: JSON.stringify({ roomId }),
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Room Participation
  async joinRoom(roomId) {
    try {
      const response = await createFetchRequest('/chat/rooms/join', {
        method: 'POST',
        body: JSON.stringify({ roomId }),
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async leaveRoom(roomId) {
    try {
      const response = await createFetchRequest('/chat/rooms/leave', {
        method: 'POST',
        body: JSON.stringify({ roomId }),
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Participant Management
  async getRoomParticipants(roomId) {
    try {
      const params = new URLSearchParams({ roomId });
      const response = await createFetchRequest(`/chat/rooms/participants?${params}`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async addUser(roomId, userId) {
    try {
      const response = await createFetchRequest('/chat/rooms/users', {
        method: 'POST',
        body: JSON.stringify({ roomId, userId }),
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async removeUser(roomId, userId) {
    try {
      const response = await createFetchRequest('/chat/rooms/users', {
        method: 'DELETE',
        body: JSON.stringify({ roomId, userId }),
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Admin Management
  async addAdmin(roomId, userId) {
    try {
      const response = await createFetchRequest('/chat/rooms/admins', {
        method: 'POST',
        body: JSON.stringify({ roomId, userId }),
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async removeAdmin(roomId, userId) {
    try {
      const response = await createFetchRequest('/chat/rooms/admins', {
        method: 'DELETE',
        body: JSON.stringify({ roomId, userId }),
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Room Search and Filter
  async searchRooms(query, type = null, page = 1, limit = 20) {
    try {
      const params = new URLSearchParams({ query, page, limit });
      if (type) params.append('type', type);
      
      const response = await createFetchRequest(`/chat/rooms/search?${params}`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getPublicRooms(page = 1, limit = 20) {
    try {
      const params = new URLSearchParams({ page, limit });
      const response = await createFetchRequest(`/chat/rooms/public?${params}`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Room Statistics
  async getRoomStats(roomId) {
    try {
      const response = await createFetchRequest(`/chat/rooms/${roomId}/stats`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Utility Methods
  handleError(error) {
    if (error.message.includes('timeout')) {
      return {
        message: 'Request timeout - please try again',
        status: 408
      };
    } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      return {
        message: 'Network error - please check your connection',
        status: 0
      };
    } else if (error.message.includes('HTTP error')) {
      const statusMatch = error.message.match(/status: (\d+)/);
      const status = statusMatch ? parseInt(statusMatch[1]) : 500;
      return {
        message: error.message,
        status
      };
    } else {
      return {
        message: error.message || 'An unexpected error occurred',
        status: -1
      };
    }
  }

  // Format room data for display
  formatRoom(room) {
    return {
      ...room,
      createdAt: new Date(room.createdAt),
      updatedAt: new Date(room.updatedAt),
      participantCount: room.participants?.length || 0,
      adminCount: room.admins?.length || 0,
      isCreator: (userId) => room.createdBy._id === userId,
      isAdmin: (userId) => room.admins?.some(admin => admin._id === userId),
      isMember: (userId) => room.participants?.some(participant => participant._id === userId),
      isFull: room.participants?.length >= room.maxParticipants
    };
  }

  // Format rooms array
  formatRooms(rooms) {
    return rooms.map(room => this.formatRoom(room));
  }

  // Group rooms by type
  groupRoomsByType(rooms) {
    return rooms.reduce((grouped, room) => {
      const type = room.type || 'public';
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(room);
      return grouped;
    }, {});
  }

  // Sort rooms by different criteria
  sortRooms(rooms, sortBy = 'updatedAt', order = 'desc') {
    return [...rooms].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'participantCount':
          comparison = a.participants.length - b.participants.length;
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt) - new Date(b.createdAt);
          break;
        case 'updatedAt':
        default:
          comparison = new Date(a.updatedAt) - new Date(b.updatedAt);
          break;
      }
      
      return order === 'desc' ? -comparison : comparison;
    });
  }

  // Filter rooms by criteria
  filterRooms(rooms, filters = {}) {
    return rooms.filter(room => {
      // Filter by type
      if (filters.type && room.type !== filters.type) {
        return false;
      }
      
      // Filter by active status
      if (filters.isActive !== undefined && room.isActive !== filters.isActive) {
        return false;
      }
      
      // Filter by participant count
      if (filters.minParticipants && room.participants.length < filters.minParticipants) {
        return false;
      }
      
      if (filters.maxParticipants && room.participants.length > filters.maxParticipants) {
        return false;
      }
      
      // Filter by search query
      if (filters.query) {
        const query = filters.query.toLowerCase();
        return room.name.toLowerCase().includes(query) || 
               room.description?.toLowerCase().includes(query);
      }
      
      return true;
    });
  }

  // Check permissions
  checkPermission(room, userId, permission) {
    switch (permission) {
      case 'edit':
      case 'delete':
        return room.createdBy._id === userId;
      case 'addUser':
      case 'removeUser':
      case 'addAdmin':
      case 'removeAdmin':
        return room.admins?.some(admin => admin._id === userId);
      case 'sendMessage':
        return room.participants?.some(participant => participant._id === userId);
      default:
        return false;
    }
  }

  // Validate room data
  validateRoomData(roomData) {
    const errors = {};
    
    if (!roomData.name || roomData.name.trim().length === 0) {
      errors.name = 'Room name is required';
    } else if (roomData.name.length > 50) {
      errors.name = 'Room name must be less than 50 characters';
    }
    
    if (roomData.description && roomData.description.length > 200) {
      errors.description = 'Description must be less than 200 characters';
    }
    
    if (roomData.maxParticipants && (roomData.maxParticipants < 2 || roomData.maxParticipants > 1000)) {
      errors.maxParticipants = 'Max participants must be between 2 and 1000';
    }
    
    if (roomData.type && !['public', 'private'].includes(roomData.type)) {
      errors.type = 'Room type must be either public or private';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
}

// Create singleton instance
const roomService = new RoomService();
export default roomService;