import Room from '../models/rooms.js'
import Message from '../models/message.js'
import User from '../models/user.js'
//create room 
const createRoom = async(req,res)=>{}
//update room 
const updateRoom = async(req,res)=>{}
//join room 
const joinRoom = async(req,res)=>{}
//return all the rooms for a user
const getRooms = async(req,res)=>{}
//get the info of a paricular room like name ,descition,maxmember
const getRoomInfo = async(req,res)=>{}
//get the infomation of room memebers
const getRoomParticipent = async(req,res)=>{}
//leave the room
const leaveRoom = async(req,res)=>{}
//delete the room
const deleteRoom = async(req,res)=>{}
//add admin
const addAdmin = async(req,res)=>{}
//remove admint
const removeAdmin = async(req,res)=>{}
//kick user
const removeUser = async(req,res)=>{}
//edit message
const editMessage = async(req,res)=>{}
//delete message
const deleteMessage = async(req,res)=>{}
//markasread
const markAsRead = async(req,res)=>{}
//markasdeliverd 
const markAsDelivered = async (req,res)=>{}
//unread message count 
const unreadMessageCount = async(req,res)=>{}
//return all the message for a particular room
const getRoomMessage = async(req,res)=>{}
//return the last message of the room
const getRoomLastMessage = async(req,res)=>{}
//getUserProileInfo
const getUserProileInfo= async(req,res)=>{}

//cheak if the user is online of offline
const cheakUserStatus = async(req,res)=>{}

export{createRoom,joinRoom,editMessage,deleteMessage,getRooms,getRoomInfo,getRoomMessage,getRoomLastMessage,getRoomParticipent,leaveRoom,deleteRoom,cheakUserStatus}