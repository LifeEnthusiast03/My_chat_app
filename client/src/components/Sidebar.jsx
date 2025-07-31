import React, { useState, useEffect } from 'react';
import { chatAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = ({ selectedRoom, onRoomSelect, onCreateRoom }) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await chatAPI.getRooms();
      setRooms(response.data || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    try {
      const roomData = {
        name: newRoomName.trim(),
        description: newRoomDescription.trim(),
        type: 'group'
      };
      
      const response = await chatAPI.createRoom(roomData);
      if (response.success) {
        setRooms(prev => [...prev, response.data]);
        setNewRoomName('');
        setNewRoomDescription('');
        setShowCreateModal(false);
        onCreateRoom && onCreateRoom(response.data);
      }
    } catch (error) {
      console.error('Error creating room:', error);
    }
  };

  if (loading) {
    return (
      <div className="w-80 bg-gray-800 text-white p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-600 rounded w-3/4 mb-4"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-600 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-gray-800 text-white flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Chat Rooms</h2>
            <p className="text-sm text-gray-400">Welcome, {user?.username}</p>
          </div>
          <button
            onClick={logout}
            className="text-gray-400 hover:text-white text-sm"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Rooms List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-300">Rooms</h3>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-indigo-400 hover:text-indigo-300 text-sm"
            >
              + Create
            </button>
          </div>
          
          <div className="space-y-2">
            {rooms.map((room) => (
              <div
                key={room._id}
                onClick={() => onRoomSelect(room)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedRoom?._id === room._id
                    ? 'bg-indigo-600'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-sm">{room.name}</h4>
                    <p className="text-xs text-gray-400 truncate">
                      {room.description || 'No description'}
                    </p>
                  </div>
                  <div className="text-xs text-gray-400">
                    {room.participants?.length || 0} members
                  </div>
                </div>
              </div>
            ))}
            
            {rooms.length === 0 && (
              <div className="text-center text-gray-400 py-8">
                <p>No rooms available</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="text-indigo-400 hover:text-indigo-300 text-sm mt-2"
                >
                  Create your first room
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Room</h3>
            
            <form onSubmit={handleCreateRoom}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Room Name
                </label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  placeholder="Enter room name"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={newRoomDescription}
                  onChange={(e) => setNewRoomDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  placeholder="Enter room description"
                  rows="3"
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewRoomName('');
                    setNewRoomDescription('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                >
                  Create Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
