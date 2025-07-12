import express from 'express';
import {createRoom,
        joinRoom,
        editMessage,
        deleteMessage,
        getRooms,
        getRoomInfo,
        getRoomMessage,
        getRoomLastMessage,
        getRoomParticipent,
        leaveRoom,
        deleteRoom,
        cheakUserStatus} from '../controllers/chatcontrollers'
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/createroom',createRoom);
router.post('/joinroom',joinRoom)
router.post('/editmessage',editMessage)
router.delete('/deleteMessage',deleteMessage)
router.get('/getrooms',getRooms);
router.get('/getroominfo',getRoomInfo);
router.get('/getroommessage',getRoomMessage);
router.get('/getlastmessage',getRoomLastMessage);
router.get('/getroomparticipant',getRoomParticipent);
router.post('/leaveroom',leaveRoom);
router.delete('/deleteroom',deleteRoom);
router.post('/userstatus',cheakUserStatus)

export default router;