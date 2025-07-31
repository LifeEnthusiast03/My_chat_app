//Constants for the chat application

export const API_BASE_URL = 'http://localhost:5000/api';
export const SOCKET_URL = 'http://localhost:5000';

export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  FILE: 'file',
  SYSTEM: 'system'
};

export const ROOM_TYPES = {
  DIRECT: 'direct',
  GROUP: 'group',
  CHANNEL: 'channel'
};

export const USER_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  AWAY: 'away',
  BUSY: 'busy'
};

export const SOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  
  // Rooms
  JOIN_ROOM: 'join-room',
  LEAVE_ROOM: 'leave-room',
  UPDATE_ROOM: 'update-room',
  DELETE_ROOM: 'delete-room',
  
  // Messages
  SEND_MESSAGE: 'send-message',
  NEW_MESSAGE: 'new-message',
  EDIT_MESSAGE: 'edit-message',
  MESSAGE_EDITED: 'message-edited',
  DELETE_MESSAGE: 'delete-message',
  MESSAGE_DELETED: 'message-deleted',
  
  // Typing
  START_TYPING: 'start-typing',
  STOP_TYPING: 'stop-typing',
  USER_TYPING: 'user-typing',
  USER_STOPPED_TYPING: 'user-stopped-typing',
  
  // User management
  ADD_USER: 'add-user',
  REMOVE_USER: 'user-removed',
  ADD_ADMIN: 'add-admin',
  REMOVE_ADMIN: 'remove-admin',
  
  // User status
  USER_ONLINE: 'user-online',
  USER_OFFLINE: 'user-offline',
  USER_JOINED: 'user-joined',
  
  // Errors
  JOIN_ROOM_ERROR: 'join-room-error',
  UPDATE_ROOM_ERROR: 'update-room-error',
  
  // Success
  JOIN_ROOM_SUCCESS: 'Join-room-success'
};

export const VALIDATION_RULES = {
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 20,
    PATTERN: /^[a-zA-Z0-9_]+$/
  },
  PASSWORD: {
    MIN_LENGTH: 6,
    MAX_LENGTH: 1024,
    PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/
  },
  EMAIL: {
    MAX_LENGTH: 255,
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  ROOM_NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 50
  },
  MESSAGE: {
    MAX_LENGTH: 2000
  }
};

export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  THEME: 'theme',
  LAST_ROOM: 'lastRoom'
};
