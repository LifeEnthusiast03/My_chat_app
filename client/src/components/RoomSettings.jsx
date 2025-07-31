import React, { useState, useEffect } from 'react';
import { chatAPI } from '../services/api';

const RoomSettings = ({ room, onClose, onRoomUpdate }) => {
  const [roomData, setRoomData] = useState({
    name: room?.name || '',
    description: room?.description || ''
  });
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    if (room) {
      setRoomData({
        name: room.name,
        description: room.description || ''
      });
      fetchParticipants();
    }
  }, [room]);

  const fetchParticipants = async () => {
    try {
      const response = await chatAPI.getRoomParticipants(room._id);
      setParticipants(response.data || []);
    } catch (error) {
      console.error('Error fetching participants:', error);
    }
  };

  const handleUpdateRoom = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await chatAPI.updateRoom(room._id, roomData);
      if (response.success) {
        onRoomUpdate(response.data);
        onClose();
      }
    } catch (error) {
      console.error('Error updating room:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoom = async () => {
    if (window.confirm('Are you sure you want to delete this room? This action cannot be undone.')) {
      try {
        await chatAPI.deleteRoom(room._id);
        onClose();
      } catch (error) {
        console.error('Error deleting room:', error);
      }
    }
  };

  if (!room) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Room Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('general')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                activeTab === 'general'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              General
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                activeTab === 'members'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Members
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-96">
          {activeTab === 'general' && (
            <form onSubmit={handleUpdateRoom} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Room Name
                </label>
                <input
                  type="text"
                  value={roomData.name}
                  onChange={(e) => setRoomData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={roomData.description}
                  onChange={(e) => setRoomData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  rows="3"
                  placeholder="Room description (optional)"
                />
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={handleDeleteRoom}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  Delete Room
                </button>
                
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {activeTab === 'members' && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4">
                Room Members ({participants.length})
              </h3>
              <div className="space-y-3">
                {participants.map((participant) => (
                  <div key={participant._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {participant.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {participant.username}
                        </p>
                        <p className="text-xs text-gray-500">
                          {participant.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        participant.isOnline
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {participant.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </div>
                ))}
                
                {participants.length === 0 && (
                  <p className="text-gray-500 text-center py-4">
                    No members found
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomSettings;
