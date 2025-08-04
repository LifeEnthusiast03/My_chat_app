import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Users, Hash, MoreVertical, UserPlus, Settings, Search, Smile, Paperclip, X, Edit2, Trash2, Reply } from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';

const ChatApplication = () => {
  const { user } = useAuth();
  const { 
    socket, 
    isConnected, 
    onlineUsers, 
    joinRoom, 
    leaveRoom, 
    startTyping, 
    stopTyping,
    isUserOnline,
    getTypingUsers 
  } = useSocket();
  
  const {
    currentRoom,
    messages,
    loading,
    error,
    typingUsers,
    unreadCount,
    setCurrentRoom,
    loadMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    canEditMessage,
    canDeleteMessage,
    formatMessage,
    groupMessagesByDate,
    clearError
  } = useChat();

  // Local state
  const [rooms, setRooms] = useState([
    { _id: '1', name: 'General', type: 'public', memberCount: 12, lastMessage: 'Hey everyone!', unreadCount: 3 },
    { _id: '2', name: 'Random', type: 'public', memberCount: 8, lastMessage: 'Good morning', unreadCount: 0 },
    { _id: '3', name: 'Tech Talk', type: 'private', memberCount: 5, lastMessage: 'React is awesome', unreadCount: 1 },
    { _id: '4', name: 'Design Team', type: 'private', memberCount: 4, lastMessage: 'New mockups ready', unreadCount: 0 }
  ]);
  
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [showRoomSettings, setShowRoomSettings] = useState(false);
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messageInputRef = useRef(null);

  // Auto scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle room selection
  const handleRoomSelect = useCallback((room) => {
    if (currentRoom?._id !== room._id) {
      if (currentRoom) {
        leaveRoom(currentRoom._id);
      }
      
      setCurrentRoom(room);
      joinRoom(room._id, { userId: user._id, username: user.username });
      loadMessages(room._id);
      
      // Clear any editing states
      setEditingMessage(null);
      setReplyTo(null);
      clearError();
    }
  }, [currentRoom, leaveRoom, setCurrentRoom, joinRoom, loadMessages, user, clearError]);

  // Handle typing indicators
  const handleInputChange = (e) => {
    setMessageInput(e.target.value);
    
    if (!isTyping) {
      setIsTyping(true);
      startTyping(currentRoom?._id);
      
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        stopTyping(currentRoom?._id);
      }, 3000);
    } else {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        stopTyping(currentRoom?._id);
      }, 3000);
    }
  };

  // Handle message sending
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!messageInput.trim() || !currentRoom) return;

    if (editingMessage) {
      await editMessage(editingMessage._id, messageInput);
      setEditingMessage(null);
    } else {
      await sendMessage(messageInput, 'text', replyTo?._id);
      setReplyTo(null);
    }
    
    setMessageInput('');
    setIsTyping(false);
    stopTyping(currentRoom._id);
    clearTimeout(typingTimeoutRef.current);
  };

  // Handle message actions
  const handleEditMessage = (message) => {
    setEditingMessage(message);
    setMessageInput(message.content);
    messageInputRef.current?.focus();
  };

  const handleDeleteMessage = async (messageId) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      await deleteMessage(messageId);
    }
  };

  const handleReplyToMessage = (message) => {
    setReplyTo(message);
    messageInputRef.current?.focus();
  };

  // Filter rooms based on search
  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get current typing users (excluding current user)
  const currentTypingUsers = typingUsers.filter(user => user.userId !== user?._id);

  // Format timestamp
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Room List Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-800">Chats</h1>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600">{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search rooms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Room List */}
        <div className="flex-1 overflow-y-auto">
          {filteredRooms.map((room) => (
            <div
              key={room._id}
              onClick={() => handleRoomSelect(room)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                currentRoom?._id === room._id ? 'bg-blue-50 border-r-4 border-r-blue-500' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {room.type === 'public' ? (
                    <Hash className="w-5 h-5 text-gray-500" />
                  ) : (
                    <Users className="w-5 h-5 text-gray-500" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">{room.name}</h3>
                    <p className="text-sm text-gray-500 truncate">{room.lastMessage}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-1">
                  {room.unreadCount > 0 && (
                    <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                      {room.unreadCount}
                    </span>
                  )}
                  <span className="text-xs text-gray-400">{room.memberCount} members</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* User Info */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.username || 'Unknown User'}</p>
              <p className="text-xs text-gray-500">Online</p>
            </div>
            <Settings className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600" />
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentRoom ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {currentRoom.type === 'public' ? (
                  <Hash className="w-5 h-5 text-gray-500" />
                ) : (
                  <Users className="w-5 h-5 text-gray-500" />
                )}
                <div>
                  <h2 className="font-semibold text-gray-900">{currentRoom.name}</h2>
                  <p className="text-sm text-gray-500">
                    {onlineUsers.length} online • {currentRoom.memberCount} members
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600" />
                <MoreVertical 
                  className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600"
                  onClick={() => setShowRoomSettings(!showRoomSettings)}
                />
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                  {error}
                </div>
              )}

              {loading && (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                </div>
              )}

              {messages.map((message) => (
                <div key={message._id} className={`flex ${message.sender._id === user._id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.sender._id === user._id
                      ? 'bg-blue-500 text-white'
                      : 'bg-white border border-gray-200'
                  }`}>
                    {message.sender._id !== user._id && (
                      <p className="text-xs font-medium text-gray-600 mb-1">{message.sender.username}</p>
                    )}
                    
                    {message.replyTo && (
                      <div className="text-xs opacity-75 border-l-2 border-gray-300 pl-2 mb-2">
                        <p className="font-medium">{message.replyTo.sender.username}</p>
                        <p className="truncate">{message.replyTo.content}</p>
                      </div>
                    )}

                    <p className={`text-sm ${message.deleted ? 'italic opacity-75' : ''}`}>
                      {message.content}
                    </p>
                    
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs opacity-75">
                        {formatTime(message.createdAt)}
                      </span>
                      
                      {message.sender._id === user._id && !message.deleted && (
                        <div className="flex items-center space-x-1 ml-2">
                          {canEditMessage(message) && (
                            <Edit2 
                              className="w-3 h-3 cursor-pointer hover:opacity-75"
                              onClick={() => handleEditMessage(message)}
                            />
                          )}
                          {canDeleteMessage(message) && (
                            <Trash2 
                              className="w-3 h-3 cursor-pointer hover:opacity-75"
                              onClick={() => handleDeleteMessage(message._id)}
                            />
                          )}
                        </div>
                      )}
                      
                      {message.sender._id !== user._id && !message.deleted && (
                        <Reply 
                          className="w-3 h-3 cursor-pointer hover:opacity-75 ml-2"
                          onClick={() => handleReplyToMessage(message)}
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {currentTypingUsers.length > 0 && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg px-4 py-2">
                    <p className="text-sm text-gray-600">
                      {currentTypingUsers.map(u => u.username).join(', ')} {
                        currentTypingUsers.length === 1 ? 'is' : 'are'
                      } typing...
                    </p>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Reply Banner */}
            {replyTo && (
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Reply className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    Replying to <strong>{replyTo.sender.username}</strong>: {replyTo.content.substring(0, 50)}...
                  </span>
                </div>
                <X 
                  className="w-4 h-4 text-gray-500 cursor-pointer hover:text-gray-700"
                  onClick={() => setReplyTo(null)}
                />
              </div>
            )}

            {/* Message Input */}
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2">
                  <Paperclip className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600" />
                  <Smile className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600" />
                </div>
                
                <div className="flex-1">
                  <input
                    ref={messageInputRef}
                    type="text"
                    value={messageInput}
                    onChange={handleInputChange}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                    placeholder={editingMessage ? "Edit message..." : "Type a message..."}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                  className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
                
                {editingMessage && (
                  <button
                    onClick={() => {
                      setEditingMessage(null);
                      setMessageInput('');
                    }}
                    className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          /* No Room Selected */
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <Hash className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No room selected</h3>
              <p className="text-gray-500">Choose a room from the sidebar to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatApplication;