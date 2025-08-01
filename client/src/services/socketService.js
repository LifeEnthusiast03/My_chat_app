import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect(token) {
    if (this.socket?.connected) {
      return this.socket;
    }

    const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';
    
    this.socket = io(serverUrl, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: this.maxReconnectAttempts
    });

    this.setupEventListeners();
    return this.socket;
  }

  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.isConnected = false;
      this.reconnectAttempts++;
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('reconnect_failed', () => {
      console.error('Socket reconnection failed after maximum attempts');
      this.isConnected = false;
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Room Management
  joinRoom(roomId, userData) {
    if (this.socket) {
      this.socket.emit('join-room', { roomId, userData });
    }
  }

  leaveRoom(roomId) {
    if (this.socket) {
      this.socket.emit('leave-room', { roomId });
    }
  }

  updateRoom(roomId, updatedRoom) {
    if (this.socket) {
      this.socket.emit('update-room', { roomId, updatedRoom });
    }
  }

  deleteRoom(roomId) {
    if (this.socket) {
      this.socket.emit('delete-room', { roomId });
    }
  }

  // Message Management
  sendMessage(roomId, content, messageType = 'text', replyTo = null) {
    if (this.socket) {
      this.socket.emit('send-message', {
        roomId,
        content,
        messageType,
        replyTo
      });
    }
  }

  editMessage(messageId, editMessage) {
    if (this.socket) {
      this.socket.emit('edit-message', { messageId, editMessage });
    }
  }

  deleteMessage(messageId, roomId) {
    if (this.socket) {
      this.socket.emit('delete-message', { messageId, roomId });
    }
  }

  // Typing Indicators
  startTyping(roomId) {
    if (this.socket) {
      this.socket.emit('start-typing', { roomId });
    }
  }

  stopTyping(roomId) {
    if (this.socket) {
      this.socket.emit('stop-typing', { roomId });
    }
  }

  // User Management
  addUser(roomId, newUserId, newUsername) {
    if (this.socket) {
      this.socket.emit('add-user', { roomId, newUserId, newUsername });
    }
  }

  removeUser(roomId, removedUserId, removedUsername) {
    if (this.socket) {
      this.socket.emit('user-removed', { roomId, removedUserId, removedUsername });
    }
  }

  // Admin Management
  addAdmin(roomId, newAdminId, newAdminUsername) {
    if (this.socket) {
      this.socket.emit('add-admin', { roomId, newAdminId, newAdminUsername });
    }
  }

  removeAdmin(roomId, removedAdminId, removedAdminUsername) {
    if (this.socket) {
      this.socket.emit('remove-admin', { roomId, removedAdminId, removedAdminUsername });
    }
  }

  // Event Listeners
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Utility Methods
  isSocketConnected() {
    return this.socket?.connected || false;
  }

  getSocketId() {
    return this.socket?.id || null;
  }
}

// Create singleton instance
const socketService = new SocketService();
export default socketService;