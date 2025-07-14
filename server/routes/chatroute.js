import express from 'express';
import { 
  createRoom, 
  updateRoom, 
  joinRoom, 
  getRooms, 
  getRoomInfo, 
  getRoomParticipants, 
  leaveRoom, 
  deleteRoom, 
  addAdmin, 
  removeAdmin, 
  removeUser, 
  addUser, 
  getUserProfileInfo, 
  editMessage, 
  deleteMessage, 
  markAsRead, 
  markAsDelivered, 
  unreadMessageCount, 
  getRoomMessages, 
  getRoomLastMessage, 
  checkUserStatus 
} from '../controllers/chatcontrollers.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Room management routes
router.post('/rooms', createRoom);                          
router.get('/rooms', getRooms);                          
router.get('/rooms/info', getRoomInfo);                    
router.put('/rooms/:roomId', updateRoom);                  
router.delete('/rooms', deleteRoom);                        

// Room participation routes
router.post('/rooms/join', joinRoom);                      
router.post('/rooms/leave', leaveRoom);                    
router.get('/rooms/participants', getRoomParticipants);     
// User management in rooms
router.post('/rooms/users', addUser);                      
router.delete('/rooms/users', removeUser);                 
router.post('/rooms/admins', addAdmin);                    
router.delete('/rooms/admins', removeAdmin);                

// Message routes
router.get('/rooms/messages', getRoomMessages);             
router.get('/rooms/messages/last', getRoomLastMessage);    
router.put('/messages', editMessage);                       
router.delete('/messages', deleteMessage);                  
// Message status routes
router.post('/messages/read', markAsRead);                  
router.post('/messages/delivered', markAsDelivered);       
router.get('/rooms/unread-count', unreadMessageCount);     

// User profile and status routes
router.get('/users/profile', getUserProfileInfo);         
router.get('/users/status', checkUserStatus);               

export default router;