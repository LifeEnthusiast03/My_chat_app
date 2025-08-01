// hooks/useSocket.js
import { useContext, useCallback } from 'react';
import { SocketContext } from '../contexts/SocketContext';

export const useSocket = () => {
  const context = useContext(SocketContext);
  
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }

  const {
    socket,
    isConnected,
    onlineUsers,
    typingUsers,
    joinRoom,
    leaveRoom,
    updateRoom,
    deleteRoom,
    sendMessage,
    editMessage,
    deleteMessage,
    startTyping,
    stopTyping,
    addUser,
    removeUser,
    addAdmin,
    removeAdmin,
    addEventListener,
    removeEventListener,
    isUserOnline,
    getTypingUsers,
    isUserTyping
  } = context;

  // Enhanced utility methods
  const withConnectionCheck = useCallback((callback) => {
    return (...args) => {
      if (!isConnected) {
        console.warn('Socket is not connected');
        return false;
      }
      return callback(...args);
    };
  }, [isConnected]);

  // Enhanced room methods with connection checks
  const safeJoinRoom = useCallback(
    withConnectionCheck(joinRoom),
    [joinRoom, withConnectionCheck]
  );

  const safeLeaveRoom = useCallback(
    withConnectionCheck(leaveRoom),
    [leaveRoom, withConnectionCheck]
  );

  const safeSendMessage = useCallback(
    withConnectionCheck(sendMessage),
    [sendMessage, withConnectionCheck]
  );

  const safeStartTyping = useCallback(
    withConnectionCheck(startTyping),
    [startTyping, withConnectionCheck]
  );

  const safeStopTyping = useCallback(
    withConnectionCheck(stopTyping),
    [stopTyping, withConnectionCheck]
  );

  // Event subscription helpers
  const subscribeToEvent = useCallback((event, callback) => {
    addEventListener(event, callback);
    return () => removeEventListener(event, callback);
  }, [addEventListener, removeEventListener]);

  // Check if current user is typing in a room
  const isCurrentUserTyping = useCallback((roomId, currentUserId) => {
    return isUserTyping(roomId, currentUserId);
  }, [isUserTyping]);

  // Get typing users excluding current user
  const getOtherTypingUsers = useCallback((roomId, currentUserId) => {
    const typingUserIds = getTypingUsers(roomId);
    return typingUserIds.filter(userId => userId !== currentUserId);
  }, [getTypingUsers]);

  // Connection status helpers
  const getConnectionStatus = useCallback(() => {
    return {
      isConnected,
      socketId: socket?.id || null,
      hasSocket: !!socket
    };
  }, [isConnected, socket]);

  return {
    // Core socket properties
    socket,
    isConnected,
    onlineUsers,
    typingUsers,

    // Room management
    joinRoom: safeJoinRoom,
    leaveRoom: safeLeaveRoom,
    updateRoom,
    deleteRoom,

    // Message management
    sendMessage: safeSendMessage,
    editMessage,
    deleteMessage,

    // Typing indicators
    startTyping: safeStartTyping,
    stopTyping: safeStopTyping,

    // User management
    addUser,
    removeUser,
    addAdmin,
    removeAdmin,

    // Event management
    addEventListener,
    removeEventListener,
    subscribeToEvent,

    // Utility methods
    isUserOnline,
    getTypingUsers,
    isUserTyping,
    isCurrentUserTyping,
    getOtherTypingUsers,
    getConnectionStatus,
    withConnectionCheck
  };
};