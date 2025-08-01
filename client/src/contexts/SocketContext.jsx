import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import socketService from '../services/socketService';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { user, token, logout } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState(new Map());

  // Connect socket when user is authenticated
  useEffect(() => {
    if (user && token) {
      const socketInstance = socketService.connect(token);
      setSocket(socketInstance);

      // Setup connection event listeners
      socketInstance.on('connect', () => {
        console.log('Connected to server');
        setIsConnected(true);
      });

      socketInstance.on('disconnect', (reason) => {
        console.log('Disconnected from server:', reason);
        setIsConnected(false);
      });

      socketInstance.on('connect_error', (error) => {
        console.error('Connection error:', error);
        setIsConnected(false);
        
        // If authentication fails, logout user
        if (error.message === 'Authentication error') {
          logout();
        }
      });

      // Setup user presence listeners
      setupPresenceListeners(socketInstance);
      
      // Setup typing listeners
      setupTypingListeners(socketInstance);

      return () => {
        socketService.disconnect();
        setSocket(null);
        setIsConnected(false);
        setOnlineUsers(new Set());
        setTypingUsers(new Map());
      };
    }
  }, [user, token, logout]);

  // Setup presence event listeners
  const setupPresenceListeners = useCallback((socketInstance) => {
    socketInstance.on('user-online', (data) => {
      setOnlineUsers(prev => new Set([...prev, data.userId]));
    });

    socketInstance.on('user-offline', (data) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.userId);
        return newSet;
      });
    });

    socketInstance.on('users-list', (data) => {
      setOnlineUsers(new Set(data.users));
    });
  }, []);

  // Setup typing event listeners
  const setupTypingListeners = useCallback((socketInstance) => {
    socketInstance.on('user-typing', (data) => {
      setTypingUsers(prev => {
        const newMap = new Map(prev);
        const roomTyping = newMap.get(data.roomId) || new Set();
        roomTyping.add(data.userId);
        newMap.set(data.roomId, roomTyping);
        return newMap;
      });
    });

    socketInstance.on('user-stopped-typing', (data) => {
      setTypingUsers(prev => {
        const newMap = new Map(prev);
        const roomTyping = newMap.get(data.roomId);
        if (roomTyping) {
          roomTyping.delete(data.userId);
          if (roomTyping.size === 0) {
            newMap.delete(data.roomId);
          } else {
            newMap.set(data.roomId, roomTyping);
          }
        }
        return newMap;
      });
    });
  }, []);

  // Socket event methods
  const joinRoom = useCallback((roomId, userData) => {
    if (socket) {
      socketService.joinRoom(roomId, userData);
    }
  }, [socket]);

  const leaveRoom = useCallback((roomId) => {
    if (socket) {
      socketService.leaveRoom(roomId);
    }
  }, [socket]);

  const sendMessage = useCallback((roomId, content, messageType = 'text', replyTo = null) => {
    if (socket) {
      socketService.sendMessage(roomId, content, messageType, replyTo);
    }
  }, [socket]);

  const editMessage = useCallback((messageId, editMessage) => {
    if (socket) {
      socketService.editMessage(messageId, editMessage);
    }
  }, [socket]);

  const deleteMessage = useCallback((messageId, roomId) => {
    if (socket) {
      socketService.deleteMessage(messageId, roomId);
    }
  }, [socket]);

  const startTyping = useCallback((roomId) => {
    if (socket) {
      socketService.startTyping(roomId);
    }
  }, [socket]);

  const stopTyping = useCallback((roomId) => {
    if (socket) {
      socketService.stopTyping(roomId);
    }
  }, [socket]);

  const updateRoom = useCallback((roomId, updatedRoom) => {
    if (socket) {
      socketService.updateRoom(roomId, updatedRoom);
    }
  }, [socket]);

  const deleteRoom = useCallback((roomId) => {
    if (socket) {
      socketService.deleteRoom(roomId);
    }
  }, [socket]);

  const addUser = useCallback((roomId, newUserId, newUsername) => {
    if (socket) {
      socketService.addUser(roomId, newUserId, newUsername);
    }
  }, [socket]);

  const removeUser = useCallback((roomId, removedUserId, removedUsername) => {
    if (socket) {
      socketService.removeUser(roomId, removedUserId, removedUsername);
    }
  }, [socket]);

  const addAdmin = useCallback((roomId, newAdminId, newAdminUsername) => {
    if (socket) {
      socketService.addAdmin(roomId, newAdminId, newAdminUsername);
    }
  }, [socket]);

  const removeAdmin = useCallback((roomId, removedAdminId, removedAdminUsername) => {
    if (socket) {
      socketService.removeAdmin(roomId, removedAdminId, removedAdminUsername);
    }
  }, [socket]);

  // Utility methods
  const addEventListener = useCallback((event, callback) => {
    if (socket) {
      socket.on(event, callback);
    }
  }, [socket]);

  const removeEventListener = useCallback((event, callback) => {
    if (socket) {
      socket.off(event, callback);
    }
  }, [socket]);

  const isUserOnline = useCallback((userId) => {
    return onlineUsers.has(userId);
  }, [onlineUsers]);

  const getTypingUsers = useCallback((roomId) => {
    return Array.from(typingUsers.get(roomId) || []);
  }, [typingUsers]);

  const isUserTyping = useCallback((roomId, userId) => {
    const roomTyping = typingUsers.get(roomId);
    return roomTyping ? roomTyping.has(userId) : false;
  }, [typingUsers]);

  const value = {
    socket,
    isConnected,
    onlineUsers: Array.from(onlineUsers),
    typingUsers,
    
    // Room methods
    joinRoom,
    leaveRoom,
    updateRoom,
    deleteRoom,
    
    // Message methods
    sendMessage,
    editMessage,
    deleteMessage,
    
    // Typing methods
    startTyping,
    stopTyping,
    
    // User management methods
    addUser,
    removeUser,
    addAdmin,
    removeAdmin,
    
    // Event methods
    addEventListener,
    removeEventListener,
    
    // Utility methods
    isUserOnline,
    getTypingUsers,
    isUserTyping
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};