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
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

class RoomService {
  // Room CRUD Operations
  async createRoom(roomData) {
    try {
      const response = await api.post('/chat/rooms', roomData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getRooms(page = 1, limit = 20, type = null) {
    try {
      const params = { page, limit };
      if (type) params.type = type;
      
      const response = await api.get('/chat/rooms', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getRoomInfo(roomId) {
    try {
      const response = await api.get('/chat/rooms/info', {
        params: { roomId }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateRoom(roomId, updateData) {
    try {
      const response = await api.put(`/chat/rooms/${roomId}`, updateData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteRoom(roomId) {
    try {
      const response = await api.delete('/chat/rooms', {
        data: { roomId }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Room Participation
  async joinRoom(roomId) {
    try {
      const response = await api.post('/chat/rooms/join', { roomId });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async leaveRoom(roomId) {
    try {
      const response = await api.post('/chat/rooms/leave', { roomId });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Participant Management
  async getRoomParticipants(roomId) {
    try {
      const response = await api.get('/chat/rooms/participants', {
        params: { roomId }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async addUser(roomId, userId) {
    try {
      const response = await api.post('/chat/rooms/users', {
        roomId,
        userId
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async removeUser(roomId, userId) {
    try {
      const response = await api.delete('/chat/rooms/users', {
        data: { roomId, userId }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Admin Management
  async addAdmin(roomId, userId) {
    try {
      const response = await api.post('/chat/rooms/admins', {
        roomId,
        userId
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async removeAdmin(roomId, userId) {
    try {
      const response = await api.delete('/chat/rooms/admins', {
        data: { roomId, userId }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Room Search and Filter
  async searchRooms(query, type = null, page = 1, limit = 20) {
    try {
      const params = { query, page, limit };
      if (type) params.type = type;
      
      const response = await api.get('/chat/rooms/search', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getPublicRooms(page = 1, limit = 20) {
    try {
      const response = await api.get('/chat/rooms/public', {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Room Statistics
  async getRoomStats(roomId) {
    try {
      const response = await api.get(`/chat/rooms/${roomId}/stats`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Utility Methods
  handleError(error) {
    if (error.response) {
      return {
        message: error.response.data.message || 'An error occurred',
        status: error.response.status,
        data: error.response.data
      };
    } else if (error.request) {
      return {
        message: 'Network error - please check your connection',
        status: 0
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