import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
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
  const { token, user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (isAuthenticated && token) {
      const newSocket = io('http://localhost:5000', {
        auth: {
          token: token
        }
      });

      newSocket.on('connect', () => {
        console.log('Connected to server');
        setConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
        setConnected(false);
      });

      newSocket.on('user-online', (userData) => {
        setOnlineUsers(prev => {
          if (!prev.find(u => u._id === userData._id)) {
            return [...prev, userData];
          }
          return prev;
        });
      });

      newSocket.on('user-offline', (userData) => {
        setOnlineUsers(prev => prev.filter(u => u._id !== userData._id));
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
        setSocket(null);
        setConnected(false);
      };
    }
  }, [isAuthenticated, token]);

  // Socket event handlers
  const joinRoom = (roomId, userData) => {
    if (socket) {
      socket.emit('join-room', { roomId, userData });
    }
  };

  const leaveRoom = (roomId) => {
    if (socket) {
      socket.emit('leave-room', { roomId });
    }
  };

  const sendMessage = (messageData) => {
    if (socket) {
      socket.emit('send-message', messageData);
    }
  };

  const editMessage = (messageData) => {
    if (socket) {
      socket.emit('edit-message', messageData);
    }
  };

  const deleteMessage = (messageData) => {
    if (socket) {
      socket.emit('delete-message', messageData);
    }
  };

  const startTyping = (roomId) => {
    if (socket) {
      socket.emit('start-typing', { roomId, user });
    }
  };

  const stopTyping = (roomId) => {
    if (socket) {
      socket.emit('stop-typing', { roomId, user });
    }
  };

  const updateRoom = (roomId, updatedRoom) => {
    if (socket) {
      socket.emit('update-room', { roomId, updatedRoom });
    }
  };

  const deleteRoom = (roomId) => {
    if (socket) {
      socket.emit('delete-room', { roomId });
    }
  };

  const addAdmin = (roomId, userId) => {
    if (socket) {
      socket.emit('add-admin', { roomId, userId });
    }
  };

  const removeAdmin = (roomId, userId) => {
    if (socket) {
      socket.emit('remove-admin', { roomId, userId });
    }
  };

  const addUser = (roomId, userId) => {
    if (socket) {
      socket.emit('add-user', { roomId, userId });
    }
  };

  const removeUser = (roomId, userId) => {
    if (socket) {
      socket.emit('user-removed', { roomId, userId });
    }
  };

  const value = {
    socket,
    connected,
    onlineUsers,
    joinRoom,
    leaveRoom,
    sendMessage,
    editMessage,
    deleteMessage,
    startTyping,
    stopTyping,
    updateRoom,
    deleteRoom,
    addAdmin,
    removeAdmin,
    addUser,
    removeUser
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
