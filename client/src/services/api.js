import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
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

// Handle responses and errors
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API endpoints
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  healthCheck: () => api.get('/auth/health'),
};

// Chat API endpoints
export const chatAPI = {
  // Room management
  createRoom: (roomData) => api.post('/chat/rooms', roomData),
  getRooms: () => api.get('/chat/rooms'),
  getRoomInfo: (roomId) => api.get(`/chat/rooms/info?roomId=${roomId}`),
  updateRoom: (roomId, roomData) => api.put(`/chat/rooms/${roomId}`, roomData),
  deleteRoom: (roomId) => api.delete(`/chat/rooms?roomId=${roomId}`),
  
  // Room participation
  joinRoom: (roomId) => api.post('/chat/rooms/join', { roomId }),
  leaveRoom: (roomId) => api.post('/chat/rooms/leave', { roomId }),
  getRoomParticipants: (roomId) => api.get(`/chat/rooms/participants?roomId=${roomId}`),
  
  // User management in rooms
  addUser: (roomId, userId) => api.post('/chat/rooms/users', { roomId, userId }),
  removeUser: (roomId, userId) => api.delete('/chat/rooms/users', { data: { roomId, userId } }),
  addAdmin: (roomId, userId) => api.post('/chat/rooms/admins', { roomId, userId }),
  removeAdmin: (roomId, userId) => api.delete('/chat/rooms/admins', { data: { roomId, userId } }),
  
  // Messages
  getRoomMessages: (roomId, page = 1, limit = 50) => 
    api.get(`/chat/rooms/messages?roomId=${roomId}&page=${page}&limit=${limit}`),
  getRoomLastMessage: (roomId) => api.get(`/chat/rooms/last-message?roomId=${roomId}`),
  editMessage: (messageId, content) => api.put('/chat/messages/edit', { messageId, content }),
  deleteMessage: (messageId) => api.delete('/chat/messages/delete', { data: { messageId } }),
  markAsRead: (messageId) => api.put('/chat/messages/read', { messageId }),
  markAsDelivered: (messageId) => api.put('/chat/messages/delivered', { messageId }),
  getUnreadCount: (roomId) => api.get(`/chat/messages/unread-count?roomId=${roomId}`),
  
  // User info
  getUserProfile: (userId) => api.get(`/chat/users/profile?userId=${userId}`),
  checkUserStatus: (userId) => api.get(`/chat/users/status?userId=${userId}`),
};

export default api;
