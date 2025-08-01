// hooks/useRooms.js
import { useState, useCallback, useEffect, useMemo } from 'react';
import roomService from '../services/roomService';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from './useSocket';

export const useRooms = () => {
  const { user } = useAuth();
  const { socket, addEventListener, removeEventListener } = useSocket();
  
  // State management
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    type: null,
    isActive: null,
    minParticipants: null,
    maxParticipants: null
  });
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    hasMore: false
  });

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    const handleRoomUpdated = (data) => {
      setRooms(prev => prev.map(room => 
        room._id === data.room._id ? { ...room, ...data.room } : room
      ));
    };

    const handleRoomDeleted = (data) => {
      setRooms(prev => prev.filter(room => room._id !== data.roomId));
      if (currentRoom?._id === data.roomId) {
        setCurrentRoom(null);
      }
    };

    const handleNewRoom = (data) => {
      setRooms(prev => [data.room, ...prev]);
    };

    const handleUserJoinedRoom = (data) => {
      setRooms(prev => prev.map(room => 
        room._id === data.roomId 
          ? { ...room, participants: [...room.participants, data.user] }
          : room
      ));
    };

    const handleUserLeftRoom = (data) => {
      setRooms(prev => prev.map(room => 
        room._id === data.roomId 
          ? { 
              ...room, 
              participants: room.participants.filter(p => p._id !== data.userId) 
            }
          : room
      ));
    };

    addEventListener('room-updated', handleRoomUpdated);
    addEventListener('room-deleted', handleRoomDeleted);
    addEventListener('new-room', handleNewRoom);
    addEventListener('user-joined-room', handleUserJoinedRoom);
    addEventListener('user-left-room', handleUserLeftRoom);

    return () => {
      removeEventListener('room-updated', handleRoomUpdated);
      removeEventListener('room-deleted', handleRoomDeleted);
      removeEventListener('new-room', handleNewRoom);
      removeEventListener('user-joined-room', handleUserJoinedRoom);
      removeEventListener('user-left-room', handleUserLeftRoom);
    };
  }, [socket, addEventListener, removeEventListener, currentRoom]);

  // Clear error helper
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load rooms with pagination and filters
  const loadRooms = useCallback(async (page = 1, append = false) => {
    try {
      setLoading(true);
      clearError();

      const response = await roomService.getRooms(page, pagination.limit, filters.type);
      
      if (response.success) {
        const formattedRooms = roomService.formatRooms(response.data);
        
        setRooms(prev => append ? [...prev, ...formattedRooms] : formattedRooms);
        setPagination(prev => ({
          ...prev,
          page,
          total: response.pagination?.total || formattedRooms.length,
          hasMore: response.pagination?.hasMore || false
        }));
      }
    } catch (err) {
      setError(err.message || 'Failed to load rooms');
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, filters.type, clearError]);

  // Load more rooms (pagination)
  const loadMoreRooms = useCallback(async () => {
    if (loading || !pagination.hasMore) return;
    await loadRooms(pagination.page + 1, true);
  }, [loading, pagination.hasMore, pagination.page, loadRooms]);

  // Create room
  const createRoom = useCallback(async (roomData) => {
    try {
      setLoading(true);
      clearError();

      const validation = roomService.validateRoomData(roomData);
      if (!validation.isValid) {
        throw new Error(Object.values(validation.errors)[0]);
      }

      const response = await roomService.createRoom(roomData);
      
      if (response.success) {
        const formattedRoom = roomService.formatRoom(response.data);
        setRooms(prev => [formattedRoom, ...prev]);
        return { success: true, room: formattedRoom };
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to create room';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [clearError]);

  // Update room
  const updateRoom = useCallback(async (roomId, updateData) => {
    try {
      setLoading(true);
      clearError();

      const validation = roomService.validateRoomData(updateData);
      if (!validation.isValid) {
        throw new Error(Object.values(validation.errors)[0]);
      }

      const response = await roomService.updateRoom(roomId, updateData);
      
      if (response.success) {
        const updatedRoom = roomService.formatRoom(response.data);
        setRooms(prev => prev.map(room => 
          room._id === roomId ? updatedRoom : room
        ));
        
        if (currentRoom?._id === roomId) {
          setCurrentRoom(updatedRoom);
        }
        
        return { success: true, room: updatedRoom };
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to update room';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [currentRoom, clearError]);

  // Delete room
  const deleteRoom = useCallback(async (roomId) => {
    try {
      setLoading(true);
      clearError();

      const response = await roomService.deleteRoom(roomId);
      
      if (response.success) {
        setRooms(prev => prev.filter(room => room._id !== roomId));
        
        if (currentRoom?._id === roomId) {
          setCurrentRoom(null);
        }
        
        return { success: true };
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to delete room';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [currentRoom, clearError]);

  // Join room
  const joinRoom = useCallback(async (roomId) => {
    try {
      setLoading(true);
      clearError();

      const response = await roomService.joinRoom(roomId);
      
      if (response.success) {
        // Update local room data
        setRooms(prev => prev.map(room => 
          room._id === roomId 
            ? { ...room, participants: [...room.participants, user] }
            : room
        ));
        
        return { success: true };
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to join room';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [user, clearError]);

  // Leave room
  const leaveRoom = useCallback(async (roomId) => {
    try {
      setLoading(true);
      clearError();

      const response = await roomService.leaveRoom(roomId);
      
      if (response.success) {
        // Update local room data
        setRooms(prev => prev.map(room => 
          room._id === roomId 
            ? { 
                ...room, 
                participants: room.participants.filter(p => p._id !== user._id) 
              }
            : room
        ));
        
        if (currentRoom?._id === roomId) {
          setCurrentRoom(null);
        }
        
        return { success: true };
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to leave room';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [user, currentRoom, clearError]);

  // Search rooms
  const searchRooms = useCallback(async (query, type = null) => {
    try {
      setLoading(true);
      clearError();

      const response = await roomService.searchRooms(query, type);
      
      if (response.success) {
        const formattedRooms = roomService.formatRooms(response.data);
        setRooms(formattedRooms);
        setPagination(prev => ({
          ...prev,
          page: 1,
          total: formattedRooms.length,
          hasMore: false
        }));
      }
    } catch (err) {
      setError(err.message || 'Failed to search rooms');
    } finally {
      setLoading(false);
    }
  }, [clearError]);

  // Get public rooms
  const loadPublicRooms = useCallback(async () => {
    try {
      setLoading(true);
      clearError();

      const response = await roomService.getPublicRooms();
      
      if (response.success) {
        const formattedRooms = roomService.formatRooms(response.data);
        return { success: true, rooms: formattedRooms };
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to load public rooms';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [clearError]);

  // Computed values
  const filteredAndSortedRooms = useMemo(() => {
    let result = [...rooms];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(room => 
        room.name.toLowerCase().includes(query) ||
        room.description?.toLowerCase().includes(query)
      );
    }

    // Apply filters
    result = roomService.filterRooms(result, filters);

    // Apply sorting
    result = roomService.sortRooms(result, sortBy, sortOrder);

    return result;
  }, [rooms, searchQuery, filters, sortBy, sortOrder]);

  const roomsByType = useMemo(() => {
    return roomService.groupRoomsByType(filteredAndSortedRooms);
  }, [filteredAndSortedRooms]);

  const myRooms = useMemo(() => {
    return rooms.filter(room => 
      room.participants?.some(p => p._id === user?._id) ||
      room.createdBy?._id === user?._id
    );
  }, [rooms, user]);

  // Utility functions
  const getRoomById = useCallback((roomId) => {
    return rooms.find(room => room._id === roomId);
  }, [rooms]);

  const isRoomMember = useCallback((roomId) => {
    const room = getRoomById(roomId);
    return room?.participants?.some(p => p._id === user?._id) || false;
  }, [getRoomById, user]);

  const isRoomAdmin = useCallback((roomId) => {
    const room = getRoomById(roomId);
    return room?.admins?.some(admin => admin._id === user?._id) || false;
  }, [getRoomById, user]);

  const isRoomCreator = useCallback((roomId) => {
    const room = getRoomById(roomId);
    return room?.createdBy?._id === user?._id || false;
  }, [getRoomById, user]);

  const canEditRoom = useCallback((roomId) => {
    return isRoomCreator(roomId) || isRoomAdmin(roomId);
  }, [isRoomCreator, isRoomAdmin]);

  const canDeleteRoom = useCallback((roomId) => {
    return isRoomCreator(roomId);
  }, [isRoomCreator]);

  // Reset rooms
  const resetRooms = useCallback(() => {
    setRooms([]);
    setCurrentRoom(null);
    setSearchQuery('');
    setFilters({
      type: null,
      isActive: null,
      minParticipants: null,
      maxParticipants: null
    });
    setPagination({
      page: 1,
      limit: 20,
      total: 0,
      hasMore: false
    });
    clearError();
  }, [clearError]);

  return {
    // State
    rooms: filteredAndSortedRooms,
    allRooms: rooms,
    roomsByType,
    myRooms,
    currentRoom,
    loading,
    error,
    searchQuery,
    filters,
    sortBy,
    sortOrder,
    pagination,

    // Actions
    loadRooms,
    loadMoreRooms,
    createRoom,
    updateRoom,
    deleteRoom,
    joinRoom,
    leaveRoom,
    searchRooms,
    loadPublicRooms,
    resetRooms,

    // State setters
    setCurrentRoom,
    setSearchQuery,
    setFilters,
    setSortBy,
    setSortOrder,
    clearError,

    // Utilities
    getRoomById,
    isRoomMember,
    isRoomAdmin,
    isRoomCreator,
    canEditRoom,
    canDeleteRoom
  };
};