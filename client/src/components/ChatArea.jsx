import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import { chatAPI } from '../services/api';

const ChatArea = ({ selectedRoom }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editContent, setEditContent] = useState('');
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
  const { socket, sendMessage, editMessage, deleteMessage, startTyping, stopTyping, joinRoom } = useSocket();
  const { user } = useAuth();

  useEffect(() => {
    if (selectedRoom && socket) {
      // Join the room
      joinRoom(selectedRoom._id, user);
      
      // Fetch existing messages
      fetchMessages();
      
      // Setup socket listeners
      const handleNewMessage = (messageData) => {
        setMessages(prev => [...prev, messageData]);
      };

      const handleMessageEdit = (editData) => {
        setMessages(prev => prev.map(msg => 
          msg._id === editData.messageId 
            ? { ...msg, content: editData.content, edited: true, editedAt: new Date() }
            : msg
        ));
      };

      const handleMessageDelete = (deleteData) => {
        setMessages(prev => prev.filter(msg => msg._id !== deleteData.messageId));
      };

      const handleUserTyping = (typingData) => {
        if (typingData.user._id !== user._id) {
          setTypingUsers(prev => {
            if (!prev.find(u => u._id === typingData.user._id)) {
              return [...prev, typingData.user];
            }
            return prev;
          });
        }
      };

      const handleUserStoppedTyping = (typingData) => {
        setTypingUsers(prev => prev.filter(u => u._id !== typingData.user._id));
      };

      socket.on('new-message', handleNewMessage);
      socket.on('message-edited', handleMessageEdit);
      socket.on('message-deleted', handleMessageDelete);
      socket.on('user-typing', handleUserTyping);
      socket.on('user-stopped-typing', handleUserStoppedTyping);

      return () => {
        socket.off('new-message', handleNewMessage);
        socket.off('message-edited', handleMessageEdit);
        socket.off('message-deleted', handleMessageDelete);
        socket.off('user-typing', handleUserTyping);
        socket.off('user-stopped-typing', handleUserStoppedTyping);
      };
    }
  }, [selectedRoom, socket, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    if (!selectedRoom) return;
    
    setLoading(true);
    try {
      const response = await chatAPI.getRoomMessages(selectedRoom._id);
      setMessages(response.data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedRoom) return;

    const messageData = {
      roomId: selectedRoom._id,
      content: newMessage.trim(),
      sender: user,
      timestamp: new Date()
    };

    sendMessage(messageData);
    setNewMessage('');
    
    // Stop typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    stopTyping(selectedRoom._id);
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    if (!selectedRoom) return;

    // Start typing indicator
    startTyping(selectedRoom._id);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(selectedRoom._id);
    }, 3000);
  };

  const handleEditMessage = (message) => {
    setEditingMessage(message._id);
    setEditContent(message.content);
  };

  const handleSaveEdit = () => {
    if (!editContent.trim()) return;
    
    editMessage({
      messageId: editingMessage,
      content: editContent.trim(),
      roomId: selectedRoom._id
    });
    
    setEditingMessage(null);
    setEditContent('');
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
    setEditContent('');
  };

  const handleDeleteMessage = (messageId) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      deleteMessage({
        messageId,
        roomId: selectedRoom._id
      });
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  if (!selectedRoom) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Welcome to Chat App
          </h3>
          <p className="text-gray-500">
            Select a room from the sidebar to start chatting
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedRoom.name}
            </h2>
            <p className="text-sm text-gray-500">
              {selectedRoom.participants?.length || 0} members
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const showDate = index === 0 || 
                formatDate(messages[index - 1]?.timestamp) !== formatDate(message.timestamp);
              
              return (
                <div key={message._id}>
                  {showDate && (
                    <div className="flex justify-center my-4">
                      <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-sm">
                        {formatDate(message.timestamp)}
                      </span>
                    </div>
                  )}
                  
                  <div className={`flex ${message.sender._id === user._id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.sender._id === user._id
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      {message.sender._id !== user._id && (
                        <div className="text-xs font-medium mb-1 text-gray-600">
                          {message.sender.username}
                        </div>
                      )}
                      
                      {editingMessage === message._id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-gray-900"
                            onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
                          />
                          <div className="flex space-x-2">
                            <button
                              onClick={handleSaveEdit}
                              className="text-xs bg-green-500 text-white px-2 py-1 rounded"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="text-xs bg-gray-500 text-white px-2 py-1 rounded"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div>{message.content}</div>
                          {message.edited && (
                            <div className="text-xs opacity-75 mt-1">
                              (edited)
                            </div>
                          )}
                        </>
                      )}
                      
                      <div className="flex justify-between items-center mt-1">
                        <div className="text-xs opacity-75">
                          {formatTime(message.timestamp)}
                        </div>
                        
                        {message.sender._id === user._id && editingMessage !== message._id && (
                          <div className="flex space-x-1 ml-2">
                            <button
                              onClick={() => handleEditMessage(message)}
                              className="text-xs opacity-75 hover:opacity-100"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteMessage(message._id)}
                              className="text-xs opacity-75 hover:opacity-100"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Typing indicator */}
            {typingUsers.length > 0 && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm">
                  {typingUsers.map(u => u.username).join(', ')} 
                  {typingUsers.length === 1 ? ' is' : ' are'} typing...
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message input */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <form onSubmit={handleSendMessage} className="flex space-x-4">
          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatArea;
