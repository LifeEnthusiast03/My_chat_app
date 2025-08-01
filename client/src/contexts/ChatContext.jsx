import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import chatService from '../services/chatService';

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

// Action types
const CHAT_ACTIONS = {
  SET_CURRENT_ROOM: 'SET_CURRENT_ROOM',
  SET_MESSAGES: 'SET_MESSAGES',
  ADD_MESSAGE: 'ADD_MESSAGE',
  UPDATE_MESSAGE: 'UPDATE_MESSAGE',
  DELETE_MESSAGE: 'DELETE_MESSAGE',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_TYPING_USERS: 'SET_TYPING_USERS',
  ADD_TYPING_USER: 'ADD_TYPING_USER',
  REMOVE_TYPING_USER: 'REMOVE_TYPING_USER',
  SET_UNREAD_COUNT: 'SET_UNREAD_COUNT',
  MARK_MESSAGES_AS_READ: 'MARK_MESSAGES_AS_READ',
  SET_MESSAGE_STATUS: 'SET_MESSAGE_STATUS',
  RESET_CHAT: 'RESET_CHAT'
};

// Initial state
const initialState = {
  currentRoom: null,
  messages: [],
  loading: false,
  error: null,
  typingUsers: [],
  unreadCount: 0,
  messageStatus: new Map(), // messageId -> status
  hasMoreMessages: true,
  page: 1
};

// Reducer
const chatReducer = (state, action) => {
  switch (action.type) {
    case CHAT_ACTIONS.SET_CURRENT_ROOM:
      return {
        ...state,
        currentRoom: action.payload,
        messages: [],
        page: 1,
        hasMoreMessages: true,
        unreadCount: 0
      };

    case CHAT_ACTIONS.SET_MESSAGES:
      return {
        ...state,
        messages: action.payload.append 
          ? [...state.messages, ...action.payload.messages]
          : action.payload.messages,
        hasMoreMessages: action.payload.hasMore || false,
        loading: false
      };

    case CHAT_ACTIONS.ADD_MESSAGE:
      return {
        ...state,
        messages: [...state.messages, action.payload],
        unreadCount: action.payload.sender._id !== action.currentUserId 
          ? state.unreadCount + 1 
          : state.unreadCount
      };

    case CHAT_ACTIONS.UPDATE_MESSAGE:
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg._id === action.payload._id ? { ...msg, ...action.payload } : msg
        )
      };

    case CHAT_ACTIONS.DELETE_MESSAGE:
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg._id === action.payload.messageId
            ? { ...msg, content: 'This message has been deleted', deleted: true }
            : msg
        )
      };

    case CHAT_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };

    case CHAT_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false
      };

    case CHAT_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    case CHAT_ACTIONS.SET_TYPING_USERS:
      return {
        ...state,
        typingUsers: action.payload
      };

    case CHAT_ACTIONS.ADD_TYPING_USER:
      return {
        ...state,
        typingUsers: [...state.typingUsers.filter(user => user.userId !== action.payload.userId), action.payload]
      };

    case CHAT_ACTIONS.REMOVE_TYPING_USER:
      return {
        ...state,
        typingUsers: state.typingUsers.filter(user => user.userId !== action.payload.userId)
      };

    case CHAT_ACTIONS.SET_UNREAD_COUNT:
      return {
        ...state,
        unreadCount: action.payload
      };

    case CHAT_ACTIONS.MARK_MESSAGES_AS_READ:
      return {
        ...state,
        unreadCount: 0,
        messages: state.messages.map(msg => ({
          ...msg,
          isRead: true
        }))
      };

    case CHAT_ACTIONS.SET_MESSAGE_STATUS:
      const newMessageStatus = new Map(state.messageStatus);
      newMessageStatus.set(action.payload.messageId, action.payload.status);
      return {
        ...state,
        messageStatus: newMessageStatus
      };

    case CHAT_ACTIONS.RESET_CHAT:
      return initialState;

    default:
      return state;
  }
};

export const ChatProvider = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { socket, addEventListener, removeEventListener } = useSocket();
  const { user } = useAuth();

  // Setup socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data) => {
      dispatch({
        type: CHAT_ACTIONS.ADD_MESSAGE,
        payload: data.message,
        currentUserId: user?._id
      });
    };

    const handleMessageEdited = (data) => {
      dispatch({
        type: CHAT_ACTIONS.UPDATE_MESSAGE,
        payload: data.editMessage
      });
    };

    const handleMessageDeleted = (data) => {
      dispatch({
        type: CHAT_ACTIONS.DELETE_MESSAGE,
        payload: data
      });
    };

    const handleUserTyping = (data) => {
      if (data.userId !== user?._id) {
        dispatch({
          type: CHAT_ACTIONS.ADD_TYPING_USER,
          payload: data
        });
      }
    };

    const handleUserStoppedTyping = (data) => {
      dispatch({
        type: CHAT_ACTIONS.REMOVE_TYPING_USER,
        payload: data
      });
    };

    const handleMessageSent = (data) => {
      dispatch({
        type: CHAT_ACTIONS.SET_MESSAGE_STATUS,
        payload: {
          messageId: data.message._id,
          status: 'sent'
        }
      });
    };

    // Add event listeners
    addEventListener('new-message', handleNewMessage);
    addEventListener('message-edited', handleMessageEdited);
    addEventListener('message-deleted', handleMessageDeleted);
    addEventListener('user-typing', handleUserTyping);
    addEventListener('user-stopped-typing', handleUserStoppedTyping);
    addEventListener('message-sent', handleMessageSent);

    return () => {
      removeEventListener('new-message', handleNewMessage);
      removeEventListener('message-edited', handleMessageEdited);
      removeEventListener('message-deleted', handleMessageDeleted);
      removeEventListener('user-typing', handleUserTyping);
      removeEventListener('user-stopped-typing', handleUserStoppedTyping);
      removeEventListener('message-sent', handleMessageSent);
    };
  }, [socket, addEventListener, removeEventListener, user]);

  // Chat methods
  const setCurrentRoom = useCallback((room) => {
    dispatch({
      type: CHAT_ACTIONS.SET_CURRENT_ROOM,
      payload: room
    });
  }, []);

  const loadMessages = useCallback(async (roomId, page = 1, limit = 50) => {
    try {
      dispatch({ type: CHAT_ACTIONS.SET_LOADING, payload: true });
      
      const response = await chatService.getRoomMessages(roomId, page, limit);
      
      if (response.success) {
        const formattedMessages = chatService.formatMessages(response.data);
        
        dispatch({
          type: CHAT_ACTIONS.SET_MESSAGES,
          payload: {
            messages: formattedMessages,
            hasMore: response.pagination.currentPage < response.pagination.totalPages,
            append: page > 1
          }
        });
      }
    } catch (error) {
      dispatch({
        type: CHAT_ACTIONS.SET_ERROR,
        payload: error.message || 'Failed to load messages'
      });
    }
  }, []);

  const loadMoreMessages = useCallback(async () => {
    if (!state.currentRoom || !state.hasMoreMessages || state.loading) return;
    
    const nextPage = Math.floor(state.messages.length / 50) + 1;
    await loadMessages(state.currentRoom._id, nextPage);
  }, [state.currentRoom, state.hasMoreMessages, state.loading, state.messages.length, loadMessages]);

  const sendMessage = useCallback(async (content, messageType = 'text', replyTo = null) => {
    if (!state.currentRoom || !content.trim()) return;

    try {
      // Optimistically add message to UI
      const tempMessage = {
        _id: `temp-${Date.now()}`,
        content: content.trim(),
        messageType,
        replyTo,
        sender: user,
        room: state.currentRoom._id,
        createdAt: new Date(),
        sending: true
      };

      dispatch({
        type: CHAT_ACTIONS.ADD_MESSAGE,
        payload: tempMessage,
        currentUserId: user._id
      });

      // Send via socket
      socket.emit('send-message', {
        roomId: state.currentRoom._id,
        content: content.trim(),
        messageType,
        replyTo
      });

    } catch (error) {
      dispatch({
        type: CHAT_ACTIONS.SET_ERROR,
        payload: error.message || 'Failed to send message'
      });
    }
  }, [state.currentRoom, user, socket]);

  const editMessage = useCallback(async (messageId, newContent) => {
    if (!newContent.trim()) return;

    try {
      const response = await chatService.editMessage(messageId, newContent);
      
      if (response.success) {
        // Update via socket for real-time sync
        socket.emit('edit-message', {
          messageId,
          editMessage: response.data
        });
      }
    } catch (error) {
      dispatch({
        type: CHAT_ACTIONS.SET_ERROR,
        payload: error.message || 'Failed to edit message'
      });
    }
  }, [socket]);

  const deleteMessage = useCallback(async (messageId) => {
    try {
      const response = await chatService.deleteMessage(messageId);
      
      if (response.success && state.currentRoom) {
        // Update via socket for real-time sync
        socket.emit('delete-message', {
          messageId,
          roomId: state.currentRoom._id
        });
      }
    } catch (error) {
      dispatch({
        type: CHAT_ACTIONS.SET_ERROR,
        payload: error.message || 'Failed to delete message'
      });
    }
  }, [socket, state.currentRoom]);

  const markAsRead = useCallback(async (messageId) => {
    try {
      await chatService.markAsRead(messageId);
      dispatch({ type: CHAT_ACTIONS.MARK_MESSAGES_AS_READ });
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  }, []);

  const startTyping = useCallback(() => {
    if (state.currentRoom && socket) {
      socket.emit('start-typing', { roomId: state.currentRoom._id });
    }
  }, [state.currentRoom, socket]);

  const stopTyping = useCallback(() => {
    if (state.currentRoom && socket) {
      socket.emit('stop-typing', { roomId: state.currentRoom._id });
    }
  }, [state.currentRoom, socket]);

  const getUnreadCount = useCallback(async (roomId) => {
    try {
      const response = await chatService.getUnreadMessageCount(roomId);
      if (response.success) {
        dispatch({
          type: CHAT_ACTIONS.SET_UNREAD_COUNT,
          payload: response.data.unreadCount
        });
      }
    } catch (error) {
      console.error('Failed to get unread count:', error);
    }
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: CHAT_ACTIONS.CLEAR_ERROR });
  }, []);

  const resetChat = useCallback(() => {
    dispatch({ type: CHAT_ACTIONS.RESET_CHAT });
  }, []);

  // Utility methods
  const canEditMessage = useCallback((message) => {
    return chatService.canEditMessage(message) && message.sender._id === user?._id;
  }, [user]);

  const canDeleteMessage = useCallback((message) => {
    return chatService.canDeleteMessage(message, user?._id, user?.role);
  }, [user]);

  const formatMessage = useCallback((message) => {
    return chatService.formatMessage(message);
  }, []);

  const groupMessagesByDate = useCallback((messages) => {
    return chatService.groupMessagesByDate(messages);
  }, []);

  const value = {
    // State
    currentRoom: state.currentRoom,
    messages: state.messages,
    loading: state.loading,
    error: state.error,
    typingUsers: state.typingUsers,
    unreadCount: state.unreadCount,
    hasMoreMessages: state.hasMoreMessages,

    // Methods
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

    // Utility methods
    canEditMessage,
    canDeleteMessage,
    formatMessage,
    groupMessagesByDate
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};