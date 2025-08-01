// hooks/useOnlineStatus.js
import { useState, useCallback, useEffect, useMemo } from 'react';
import { useSocket } from './useSocket';
import { useAuth } from '../contexts/AuthContext';

export const useOnlineStatus = () => {
  const { user } = useAuth();
  const { 
    socket, 
    isConnected, 
    onlineUsers, 
    addEventListener, 
    removeEventListener,
    isUserOnline 
  } = useSocket();

  const [userStatuses, setUserStatuses] = useState(new Map());
  const [lastSeen, setLastSeen] = useState(new Map());

  // Status types
  const STATUS_TYPES = {
    ONLINE: 'online',
    AWAY: 'away',
    BUSY: 'busy',
    OFFLINE: 'offline'
  };

  // Setup socket event listeners for user presence
  useEffect(() => {
    if (!socket) return;

    const handleUserOnline = (data) => {
      setUserStatuses(prev => new Map(prev).set(data.userId, {
        status: STATUS_TYPES.ONLINE,
        lastUpdated: new Date()
      }));
    };

    const handleUserOffline = (data) => {
      setUserStatuses(prev => new Map(prev).set(data.userId, {
        status: STATUS_TYPES.OFFLINE,
        lastUpdated: new Date()
      }));
      
      if (data.lastSeen) {
        setLastSeen(prev => new Map(prev).set(data.userId, new Date(data.lastSeen)));
      }
    };

    const handleUserStatusChanged = (data) => {
      setUserStatuses(prev => new Map(prev).set(data.userId, {
        status: data.status,
        lastUpdated: new Date()
      }));
    };

    const handleUsersListUpdate = (data) => {
      if (data.users) {
        const newStatuses = new Map();
        data.users.forEach(userId => {
          newStatuses.set(userId, {
            status: STATUS_TYPES.ONLINE,
            lastUpdated: new Date()
          });
        });
        setUserStatuses(newStatuses);
      }
    };

    addEventListener('user-online', handleUserOnline);
    addEventListener('user-offline', handleUserOffline);
    addEventListener('user-status-changed', handleUserStatusChanged);
    addEventListener('users-list', handleUsersListUpdate);

    return () => {
      removeEventListener('user-online', handleUserOnline);
      removeEventListener('user-offline', handleUserOffline);
      removeEventListener('user-status-changed', handleUserStatusChanged);
      removeEventListener('users-list', handleUsersListUpdate);
    };
  }, [socket, addEventListener, removeEventListener]);

  // Initialize online users from socket context
  useEffect(() => {
    if (onlineUsers.length > 0) {
      const newStatuses = new Map();
      onlineUsers.forEach(userId => {
        newStatuses.set(userId, {
          status: STATUS_TYPES.ONLINE,
          lastUpdated: new Date()
        });
      });
      setUserStatuses(prev => {
        const combined = new Map(prev);
        newStatuses.forEach((value, key) => {
          combined.set(key, value);
        });
        return combined;
      });
    }
  }, [onlineUsers]);

  // Get user's online status
  const getUserStatus = useCallback((userId) => {
    if (!userId) return STATUS_TYPES.OFFLINE;
    
    // Check if user is in online users list
    if (isUserOnline(userId)) {
      const userStatus = userStatuses.get(userId);
      return userStatus?.status || STATUS_TYPES.ONLINE;
    }
    
    return STATUS_TYPES.OFFLINE;
  }, [isUserOnline, userStatuses]);

  // Check if user is online
  const checkUserOnline = useCallback((userId) => {
    return getUserStatus(userId) === STATUS_TYPES.ONLINE;
  }, [getUserStatus]);

  // Check if user is away
  const checkUserAway = useCallback((userId) => {
    return getUserStatus(userId) === STATUS_TYPES.AWAY;
  }, [getUserStatus]);

  // Check if user is busy
  const checkUserBusy = useCallback((userId) => {
    return getUserStatus(userId) === STATUS_TYPES.BUSY;
  }, [getUserStatus]);

  // Check if user is offline
  const checkUserOffline = useCallback((userId) => {
    return getUserStatus(userId) === STATUS_TYPES.OFFLINE;
  }, [getUserStatus]);

  // Get user's last seen time
  const getUserLastSeen = useCallback((userId) => {
    return lastSeen.get(userId) || null;
  }, [lastSeen]);

  // Format last seen time
  const formatLastSeen = useCallback((userId) => {
    const lastSeenTime = getUserLastSeen(userId);
    if (!lastSeenTime) return 'Never';

    const now = new Date();
    const diffMs = now - lastSeenTime;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) {
      return 'Just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
      return lastSeenTime.toLocaleDateString();
    }
  }, [getUserLastSeen]);

  // Get status color for UI
  const getStatusColor = useCallback((userId) => {
    const status = getUserStatus(userId);
    switch (status) {
      case STATUS_TYPES.ONLINE:
        return '#10b981'; // green
      case STATUS_TYPES.AWAY:
        return '#f59e0b'; // yellow
      case STATUS_TYPES.BUSY:
        return '#ef4444'; // red
      case STATUS_TYPES.OFFLINE:
      default:
        return '#94a3b8'; // gray
    }
  }, [getUserStatus]);

  // Get status icon
  const getStatusIcon = useCallback((userId) => {
    const status = getUserStatus(userId);
    switch (status) {
      case STATUS_TYPES.ONLINE:
        return '🟢';
      case STATUS_TYPES.AWAY:
        return '🟡';
      case STATUS_TYPES.BUSY:
        return '🔴';
      case STATUS_TYPES.OFFLINE:
      default:
        return '⚫';
    }
  }, [getUserStatus]);

  // Get status display text
  const getStatusText = useCallback((userId) => {
    const status = getUserStatus(userId);
    switch (status) {
      case STATUS_TYPES.ONLINE:
        return 'Online';
      case STATUS_TYPES.AWAY:
        return 'Away';
      case STATUS_TYPES.BUSY:
        return 'Busy';
      case STATUS_TYPES.OFFLINE:
      default:
        return 'Offline';
    }
  }, [getUserStatus]);

  // Get comprehensive user status info
  const getUserStatusInfo = useCallback((userId) => {
    const status = getUserStatus(userId);
    const lastSeenTime = getUserLastSeen(userId);
    const isOnline = checkUserOnline(userId);
    
    return {
      userId,
      status,
      isOnline,
      isAway: status === STATUS_TYPES.AWAY,
      isBusy: status === STATUS_TYPES.BUSY,
      isOffline: status === STATUS_TYPES.OFFLINE,
      lastSeen: lastSeenTime,
      lastSeenFormatted: formatLastSeen(userId),
      statusColor: getStatusColor(userId),
      statusIcon: getStatusIcon(userId),
      statusText: getStatusText(userId),
      lastUpdated: userStatuses.get(userId)?.lastUpdated || null
    };
  }, [
    getUserStatus, 
    getUserLastSeen, 
    checkUserOnline, 
    formatLastSeen, 
    getStatusColor, 
    getStatusIcon, 
    getStatusText, 
    userStatuses
  ]);

  // Filter users by status
  const getUsersByStatus = useCallback((status) => {
    const users = [];
    userStatuses.forEach((statusInfo, userId) => {
      if (statusInfo.status === status) {
        users.push(userId);
      }
    });
    return users;
  }, [userStatuses]);

  // Get statistics
  const getStatusStats = useMemo(() => {
    const stats = {
      [STATUS_TYPES.ONLINE]: 0,
      [STATUS_TYPES.AWAY]: 0,
      [STATUS_TYPES.BUSY]: 0,
      [STATUS_TYPES.OFFLINE]: 0,
      total: userStatuses.size
    };

    userStatuses.forEach((statusInfo) => {
      stats[statusInfo.status] = (stats[statusInfo.status] || 0) + 1;
    });

    return stats;
  }, [userStatuses]);

  // Update user status (for current user)
  const updateMyStatus = useCallback((status) => {
    if (!user || !socket || !Object.values(STATUS_TYPES).includes(status)) {
      return;
    }

    socket.emit('update-status', { status });
    
    // Update local state optimistically
    setUserStatuses(prev => new Map(prev).set(user._id, {
      status,
      lastUpdated: new Date()
    }));
  }, [user, socket]);

  // Bulk get status for multiple users
  const getBulkUserStatus = useCallback((userIds) => {
    return userIds.map(userId => ({
      userId,
      ...getUserStatusInfo(userId)
    }));
  }, [getUserStatusInfo]);

  // Check if current user is online
  const isCurrentUserOnline = useMemo(() => {
    return user ? checkUserOnline(user._id) : false;
  }, [user, checkUserOnline]);

  // Get current user's status
  const currentUserStatus = useMemo(() => {
    return user ? getUserStatus(user._id) : STATUS_TYPES.OFFLINE;
  }, [user, getUserStatus]);

  // Sort users by online status (online first)
  const sortUsersByStatus = useCallback((userIds) => {
    return [...userIds].sort((a, b) => {
      const statusA = getUserStatus(a);
      const statusB = getUserStatus(b);
      
      const statusOrder = {
        [STATUS_TYPES.ONLINE]: 0,
        [STATUS_TYPES.AWAY]: 1,
        [STATUS_TYPES.BUSY]: 2,
        [STATUS_TYPES.OFFLINE]: 3
      };
      
      return statusOrder[statusA] - statusOrder[statusB];
    });
  }, [getUserStatus]);

  return {
    // Core status checking
    getUserStatus,
    checkUserOnline,
    checkUserAway,
    checkUserBusy,
    checkUserOffline,
    
    // Last seen functionality
    getUserLastSeen,
    formatLastSeen,
    
    // UI helpers
    getStatusColor,
    getStatusIcon,
    getStatusText,
    getUserStatusInfo,
    
    // Bulk operations
    getUsersByStatus,
    getBulkUserStatus,
    sortUsersByStatus,
    
    // Current user
    updateMyStatus,
    isCurrentUserOnline,
    currentUserStatus,
    
    // Statistics
    getStatusStats,
    onlineUsersCount: onlineUsers.length,
    totalUsersCount: userStatuses.size,
    
    // Connection status
    isConnected,
    
    // Constants
    STATUS_TYPES,
    
    // Raw data (for advanced usage)
    onlineUsers,
    userStatuses: userStatuses,
    lastSeenData: lastSeen
  };
};