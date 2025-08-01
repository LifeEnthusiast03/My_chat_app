// hooks/useTyping.js
import { useState, useCallback, useRef, useEffect } from 'react';
import { useSocket } from './useSocket';
import { useAuth } from '../contexts/AuthContext';

export const useTyping = (roomId) => {
  const { user } = useAuth();
  const { 
    startTyping, 
    stopTyping, 
    getTypingUsers, 
    isUserTyping 
  } = useSocket();
  
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const typingTimeoutRef = useRef(null);
  const lastTypingTimeRef = useRef(0);

  // Configuration
  const TYPING_TIMEOUT = 3000; // 3 seconds
  const TYPING_THROTTLE = 1000; // 1 second throttle between typing events

  // Update typing users when they change
  useEffect(() => {
    if (roomId) {
      const currentTypingUsers = getTypingUsers(roomId);
      // Filter out current user from typing users list
      const otherTypingUsers = currentTypingUsers.filter(userId => userId !== user?._id);
      setTypingUsers(otherTypingUsers);
    }
  }, [roomId, getTypingUsers, user]);

  // Update current user typing status
  useEffect(() => {
    if (roomId && user) {
      const userIsTyping = isUserTyping(roomId, user._id);
      setIsTyping(userIsTyping);
    }
  }, [roomId, user, isUserTyping]);

  // Clear typing timeout on unmount or room change
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [roomId]);

  // Start typing with throttling
  const handleStartTyping = useCallback(() => {
    if (!roomId || !user) return;

    const now = Date.now();
    const timeSinceLastTyping = now - lastTypingTimeRef.current;

    // Throttle typing events
    if (timeSinceLastTyping < TYPING_THROTTLE) {
      return;
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Only emit if not already typing
    if (!isTyping) {
      startTyping(roomId);
      setIsTyping(true);
      lastTypingTimeRef.current = now;
    }

    // Set timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping();
    }, TYPING_TIMEOUT);
  }, [roomId, user, startTyping, isTyping]);

  // Stop typing
  const handleStopTyping = useCallback(() => {
    if (!roomId || !user) return;

    // Clear timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    // Only emit if currently typing
    if (isTyping) {
      stopTyping(roomId);
      setIsTyping(false);
    }
  }, [roomId, user, stopTyping, isTyping]);

  // Handle input change with typing detection
  const handleInputChange = useCallback((value, previousValue = '') => {
    if (!roomId) return;

    // If user is typing (input has content and is different from previous)
    if (value.trim() && value !== previousValue) {
      handleStartTyping();
    } else if (!value.trim() && isTyping) {
      // If input is empty and user was typing, stop typing
      handleStopTyping();
    }
  }, [roomId, handleStartTyping, handleStopTyping, isTyping]);

  // Handle input focus (start typing)
  const handleInputFocus = useCallback(() => {
    if (!roomId) return;
    // Don't automatically start typing on focus, wait for actual input
  }, [roomId]);

  // Handle input blur (stop typing)
  const handleInputBlur = useCallback(() => {
    handleStopTyping();
  }, [handleStopTyping]);

  // Handle key events
  const handleKeyDown = useCallback((event) => {
    if (!roomId) return;

    const { key } = event;
    
    // Handle specific keys
    if (key === 'Enter' && !event.shiftKey) {
      // Message is being sent, stop typing
      handleStopTyping();
    } else if (key === 'Escape') {
      // User pressed escape, stop typing
      handleStopTyping();
    } else if (key.length === 1 || key === 'Backspace' || key === 'Delete') {
      // User is actively typing
      handleStartTyping();
    }
  }, [roomId, handleStartTyping, handleStopTyping]);

  // Format typing users for display
  const getTypingUsersDisplay = useCallback((users = null, maxDisplay = 3) => {
    const usersToShow = users || typingUsers;
    
    if (!usersToShow.length) {
      return { text: '', count: 0 };
    }

    const count = usersToShow.length;
    
    if (count === 1) {
      return {
        text: `${usersToShow[0]} is typing...`,
        count
      };
    } else if (count === 2) {
      return {
        text: `${usersToShow[0]} and ${usersToShow[1]} are typing...`,
        count
      };
    } else if (count <= maxDisplay) {
      const lastUser = usersToShow[count - 1];
      const otherUsers = usersToShow.slice(0, count - 1).join(', ');
      return {
        text: `${otherUsers}, and ${lastUser} are typing...`,
        count
      };
    } else {
      return {
        text: `${usersToShow.slice(0, maxDisplay - 1).join(', ')} and ${count - maxDisplay + 1} others are typing...`,
        count
      };
    }
  }, [typingUsers]);

  // Check if specific user is typing
  const isUserCurrentlyTyping = useCallback((userId) => {
    return typingUsers.includes(userId);
  }, [typingUsers]);

  // Get typing status summary
  const getTypingStatus = useCallback(() => {
    return {
      isCurrentUserTyping: isTyping,
      typingUsersCount: typingUsers.length,
      hasTypingUsers: typingUsers.length > 0,
      typingUsers: [...typingUsers]
    };
  }, [isTyping, typingUsers]);

  // Force stop typing (useful for cleanup)
  const forceStopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    
    if (isTyping && roomId) {
      stopTyping(roomId);
      setIsTyping(false);
    }
  }, [isTyping, roomId, stopTyping]);

  // Typing event handlers for input components
  const createTypingHandlers = useCallback(() => {
    let inputValue = '';
    
    return {
      onChange: (e) => {
        const newValue = e.target.value;
        handleInputChange(newValue, inputValue);
        inputValue = newValue;
      },
      onFocus: handleInputFocus,
      onBlur: handleInputBlur,
      onKeyDown: handleKeyDown
    };
  }, [handleInputChange, handleInputFocus, handleInputBlur, handleKeyDown]);

  // Custom hook for text input with typing detection
  const useTypingInput = useCallback((initialValue = '') => {
    const [value, setValue] = useState(initialValue);
    const previousValueRef = useRef(initialValue);

    const handleChange = useCallback((e) => {
      const newValue = e.target.value;
      setValue(newValue);
      handleInputChange(newValue, previousValueRef.current);
      previousValueRef.current = newValue;
    }, []);

    const reset = useCallback(() => {
      setValue('');
      previousValueRef.current = '';
      handleStopTyping();
    }, []);

    return {
      value,
      setValue,
      onChange: handleChange,
      onFocus: handleInputFocus,
      onBlur: handleInputBlur,
      onKeyDown: handleKeyDown,
      reset
    };
  }, [handleInputChange, handleInputFocus, handleInputBlur, handleKeyDown, handleStopTyping]);

  return {
    // State
    isTyping,
    typingUsers,
    
    // Actions
    startTyping: handleStartTyping,
    stopTyping: handleStopTyping,
    forceStopTyping,
    
    // Event handlers
    handleInputChange,
    handleInputFocus,
    handleInputBlur,
    handleKeyDown,
    
    // Utilities
    getTypingUsersDisplay,
    isUserCurrentlyTyping,
    getTypingStatus,
    createTypingHandlers,
    useTypingInput,
    
    // Configuration
    config: {
      timeout: TYPING_TIMEOUT,
      throttle: TYPING_THROTTLE
    }
  };
};