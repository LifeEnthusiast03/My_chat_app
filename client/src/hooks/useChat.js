// hooks/useChat.js
import { useContext, useCallback, useEffect, useRef } from 'react';
import { ChatContext } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';

export const useChat = () => {
  const context = useContext(ChatContext);
  const { user } = useAuth();
  const messageEndRef = useRef(null);
  
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }

  const {
    currentRoom,
    messages,
    loading,
    error,
    typingUsers,
    unreadCount,
    hasMoreMessages,
    setCurrentRoom,
    loadMessages,
    loadMoreMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    markAsRead,
    startTyping,
    stopTyping,
    getUnreadCount,
    clearError,
    resetChat,
    canEditMessage,
    canDeleteMessage,
    formatMessage,
    groupMessagesByDate
  } = context;

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback((behavior = 'smooth') => {
    messageEndRef.current?.scrollIntoView({ behavior });
  }, []);

  // Enhanced message sending with validation
  const sendMessageWithValidation = useCallback(async (content, messageType = 'text', replyTo = null) => {
    if (!content || !content.trim()) {
      return { success: false, error: 'Message content cannot be empty' };
    }

    if (!currentRoom) {
      return { success: false, error: 'No room selected' };
    }

    try {
      await sendMessage(content.trim(), messageType, replyTo);
      scrollToBottom();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [sendMessage, currentRoom, scrollToBottom]);

  // Enhanced message editing with validation
  const editMessageWithValidation = useCallback(async (messageId, newContent) => {
    if (!newContent || !newContent.trim()) {
      return { success: false, error: 'Message content cannot be empty' };
    }

    const message = messages.find(msg => msg._id === messageId);
    if (!message) {
      return { success: false, error: 'Message not found' };
    }

    if (!canEditMessage(message)) {
      return { success: false, error: 'Cannot edit this message' };
    }

    try {
      await editMessage(messageId, newContent.trim());
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [editMessage, messages, canEditMessage]);

  // Enhanced message deletion with validation
  const deleteMessageWithValidation = useCallback(async (messageId) => {
    const message = messages.find(msg => msg._id === messageId);
    if (!message) {
      return { success: false, error: 'Message not found' };
    }

    if (!canDeleteMessage(message)) {
      return { success: false, error: 'Cannot delete this message' };
    }

    try {
      await deleteMessage(messageId);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [deleteMessage, messages, canDeleteMessage]);

  // Room switching with cleanup
  const switchRoom = useCallback(async (room) => {
    try {
      if (currentRoom?.id) {
        stopTyping();
      }
      
      setCurrentRoom(room);
      
      if (room?.id) {
        await loadMessages(room.id);
        await getUnreadCount(room.id);
        scrollToBottom('auto');
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [currentRoom, setCurrentRoom, loadMessages, getUnreadCount, stopTyping, scrollToBottom]);

  // Typing management with debouncing
  const typingTimeoutRef = useRef(null);
  
  const handleTypingStart = useCallback(() => {
    if (!currentRoom) return;
    
    startTyping();
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set timeout to stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  }, [currentRoom, startTyping, stopTyping]);

  const handleTypingStop = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    stopTyping();
  }, [stopTyping]);

  // Clean up typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Message utilities
  const getMessageById = useCallback((messageId) => {
    return messages.find(msg => msg._id === messageId);
  }, [messages]);

  const getMessagesFromUser = useCallback((userId) => {
    return messages.filter(msg => msg.sender._id === userId);
  }, [messages]);

  const getUnreadMessages = useCallback(() => {
    return messages.filter(msg => !msg.isRead && msg.sender._id !== user?._id);
  }, [messages, user]);

  const getMessageCount = useCallback(() => {
    return {
      total: messages.length,
      unread: unreadCount,
      own: messages.filter(msg => msg.sender._id === user?._id).length,
      others: messages.filter(msg => msg.sender._id !== user?._id).length
    };
  }, [messages, unreadCount, user]);

  // Search messages
  const searchMessages = useCallback((query) => {
    if (!query.trim()) return [];
    
    const lowercaseQuery = query.toLowerCase();
    return messages.filter(msg => 
      msg.content.toLowerCase().includes(lowercaseQuery) ||
      msg.sender.username.toLowerCase().includes(lowercaseQuery)
    );
  }, [messages]);

  // Filter messages by type
  const filterMessagesByType = useCallback((messageType) => {
    return messages.filter(msg => msg.messageType === messageType);
  }, [messages]);

  // Get room statistics
  const getRoomStats = useCallback(() => {
    if (!currentRoom || !messages.length) return null;

    const messagesByUser = messages.reduce((acc, msg) => {
      const userId = msg.sender._id;
      acc[userId] = (acc[userId] || 0) + 1;
      return acc;
    }, {});

    const mostActiveUser = Object.entries(messagesByUser)
      .sort(([,a], [,b]) => b - a)[0];

    return {
      totalMessages: messages.length,
      participants: new Set(messages.map(msg => msg.sender._id)).size,
      mostActiveUser: mostActiveUser ? {
        userId: mostActiveUser[0],
        messageCount: mostActiveUser[1]
      } : null,
      messagesByType: messages.reduce((acc, msg) => {
        acc[msg.messageType] = (acc[msg.messageType] || 0) + 1;
        return acc;
      }, {}),
      firstMessage: messages[0],
      lastMessage: messages[messages.length - 1]
    };
  }, [currentRoom, messages]);

  return {
    // Core state
    currentRoom,
    messages,
    loading,
    error,
    typingUsers,
    unreadCount,
    hasMoreMessages,

    // Enhanced actions
    sendMessage: sendMessageWithValidation,
    editMessage: editMessageWithValidation,
    deleteMessage: deleteMessageWithValidation,
    switchRoom,

    // Message loading
    loadMessages,
    loadMoreMessages,
    markAsRead,

    // Typing management
    startTyping: handleTypingStart,
    stopTyping: handleTypingStop,

    // Room management
    setCurrentRoom,
    resetChat,

    // Error handling
    error,
    clearError,

    // Utilities
    canEditMessage,
    canDeleteMessage,
    formatMessage,
    groupMessagesByDate,
    scrollToBottom,
    messageEndRef,

    // Message queries
    getMessageById,
    getMessagesFromUser,
    getUnreadMessages,
    getMessageCount,
    searchMessages,
    filterMessagesByType,
    getRoomStats
  };
};