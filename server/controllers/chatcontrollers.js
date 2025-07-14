import Room from '../models/rooms.js'
import Message from '../models/message.js'
import User from '../models/user.js'

//create room 
const createRoom = async(req,res)=>{
    try{
        const {name,description,type='public',maxParticipants}= req.body
        const userId=req.user.userId;
        if(!name||name.trim().length===0){
            return res.status(400).json({
                success:false,
                message:'Name is required'
            })
        }
        const existroom = await Room.findOne({
            name:name.trim(),
            createdBy:userId
        })
        if(existroom){
            return res.status(400).json({
                success:false,
                message:"Room Already Exist"
            })
        }
        const roomData={
            name:name.trim(),
            description:description?.trim()||"",
            type:type,
            createdBy:userId,
            participants:[userId],
            admins:[userId],
            maxParticipants:maxParticipants
        }
        const room = new Room(roomData);
        await room.save();
        await room.populate('participants','username email avatar isOnline')
        await room.populate('createdBy','username email avatar isOnline')
        res.status(201).json({
            success:true,
            message:"Room successfully created",
            data:room
        })
    }
    catch(error){
        console.error('Create room error:', error);
        res.status(500).json({
            success:false,
            message:'Internal server Error'
        })
    }
}

//update room 
const updateRoom = async(req,res)=>{
    try{
        const {roomId} = req.params;
        const {name,description,avatar,settings}=req.body;
        const userId = req.user.userId;
        const existroom = await Room.findById(roomId);
        if(!existroom){
           return  res.status(404).json({
                success:false,
                message:"Room not found"
            })
        }
        if(!existroom.admins.includes(userId)){
            return res.status(403).json({
                success:false,
                message:"Only admins can update group"
            })
        }
        if(name&&name.trim().length>0)existroom.name=name.trim();
        if(description !== undefined)existroom.description=description?.trim()||'';
        if(avatar!==undefined)existroom.avatar=avatar;
        if(settings)existroom.settings={...existroom.settings,...settings};
        await existroom.save();
        await existroom.populate('participants','username email avatar isOnline')

        res.status(200).json({
            success:true,
            message:'Update Room successful',
            data:existroom
        })
    }
    catch(error){
            console.error('Update room error:', error);
            res.status(500).json({
                success:false,
                message:'Internal server error'
            })
    }
}

//join room 
const joinRoom = async(req,res)=>{
    try{
        const {roomId}=req.body;
        const userId=req.user.userId;
        if(!roomId){
            return res.status(400).json({
                success:false,
                message:'Room id is required'
            })
        }
        const room = await Room.findById(roomId)
        if(!room){
            return res.status(404).json({
                success:false,
                message:'Room not found'
            })
        }
        if(!room.isActive){
             return res.status(400).json({
                success:false,
                message:'Room is not Active'
            })
        }
        if(room.participants.length>=room.maxParticipants){
             return res.status(400).json({
                success:false,
                message:'Room is full'
            })
        }
        if(room.participants.some(p => p.toString() === userId)){
             return res.status(400).json({
                success:false,
                message:'User Already in the room'
            })
        }
        if(room.type==='private'&&room.settings.requireApproval){
             return res.status(400).json({
                success:false,
                message:'Room is private need Admin approval'
            })
        }
        room.participants.push(userId);
        await room.save();

        const systemMessage = new Message({
            content:`${req.user.username} joined the room`,
            sender:userId,
            room:roomId,
            messageType:'system'
        })
        await systemMessage.save();
        await room.populate('participants', 'username email avatar isOnline');
        res.status(200).json({
            success:true,
            message:'Joined room successfully',
            data:room
        })

    }
    catch(error){
        console.error('Join room error:', error);
        res.status(500).json({
            success:false,
            message:'Internal Server Error'
        });
        
    }
}

//return all the rooms for a 
const getRooms = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { page = 1, limit = 20, type } = req.query;

        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 20;

        const query = {
            participants: userId,
            isActive: true
        };

        if (type) {
            query.type = type;
        }

        const rooms = await Room.find(query)
            .populate('participants', 'username email avatar isOnline')
            .populate('lastMessage')
            .populate('createdBy', 'username email avatar')
            .sort({ updatedAt: -1 })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum);

        const totalRooms = await Room.countDocuments(query);

        res.status(200).json({
            success: true,
            message: 'Fetched rooms successfully',
            data: rooms,
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(totalRooms / limitNum),
                totalRooms
            }
        });
    } catch (error) {
        console.error('Get rooms error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

//get the info of a particular room like name, description, maxmember
const getRoomInfo = async(req,res)=>{
    try{
        const {roomId} = req.query; 
        const userId = req.user.userId;
        if(!roomId){
            return res.status(400).json({
                success:false,
                message:'Room id is required'
            })
        }
        const room = await Room.findById(roomId)
            .populate('participants', 'username email avatar isOnline lastSeen')
            .populate('admins', 'username email avatar')
            .populate('createdBy', 'username email avatar');
        if(!room){
            return res.status(404).json({
                success:false,
                message:'No room found'
            })
        }
        if(!room.participants.some(p=>p._id.toString()===userId)){
            return res.status(403).json({
                success:false,
                message:'Access Denied'
            });
        }
        res.status(200).json({
            success:true,
            data:room
        });
    }
    catch(error){
         console.error('Get room info error:', error);
            res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

//get the information of room members
const getRoomParticipants = async(req,res)=>{
    try{
        const {roomId} = req.query; // Changed from req.body to req.query
        const userId = req.user.userId;
        if(!roomId){
            return res.status(400).json({
                success:false,
                message:'Room Id is required'
            })
        }
        const room = await Room.findById(roomId)
                    .populate('participants', 'username email avatar isOnline lastSeen status')
                    .populate('admins', 'username email avatar');
        if(!room){
            return res.status(404).json({
                success:false,
                message:"No room found"
            })
        }
        if(!room.participants.some(p=>p._id.toString()===userId)){
            return res.status(403).json({
                success:false,
                message:"Access Denied"
            })
        }
        res.status(200).json({
            success:true,
            data:{
                participants:room.participants,
                admins:room.admins,
                totalCount:room.participants.length
            }
        });
    }
    catch(error){
            console.error('Get room participants error:', error);
            res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

//leave the room
const leaveRoom = async(req,res)=>{
    try{
        const { roomId } = req.body;
        const userId = req.user.userId; // Fixed: was req.user.UserId

        if (!roomId) {
            return res.status(400).json({
                success: false,
                message: 'Room ID is required'
            });
        }

        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        // Check if user is in room
        if (!room.participants.includes(userId)) {
            return res.status(400).json({
                success: false,
                message: 'User not in room'
            });
        }

        // Remove user from participants and admins
        room.participants = room.participants.filter(p => p.toString() !== userId);
        room.admins = room.admins.filter(a => a.toString() !== userId);

        if(room.createdBy.toString()===userId){ // Fixed: added .toString()
            if(room.admins.length>0){ // Fixed: changed >= to >
                room.createdBy=room.admins[0];
            }
            else if (room.participants.length>0){
                room.createdBy=room.participants[0];
                room.admins.push(room.participants[0]);
            }
            else{
                room.isActive=false;
            }
        }
        await room.save();

        const systemMessage = new Message({
            content: `${req.user.username} left the room`,
            sender: userId,
            room: roomId,
            messageType: 'system'
        });
        await systemMessage.save();

        res.json({
            success: true,
            message: 'Left room successfully'
        });

    }
    catch(error){
        console.error('Leave room error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

//delete the room
const deleteRoom = async(req,res)=>{
    try{
        const { roomId } = req.body;
        const userId = req.user.userId;

        if (!roomId) {
            return res.status(400).json({
                success: false,
                message: 'Room ID is required'
            });
        }

        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }
        if (room.createdBy.toString() !== userId){
            return res.status(403).json({
                success:false,
                message:'Only room creator can delete the room' 
            })
        }
        await Message.deleteMany({room:roomId});
        await Room.findByIdAndDelete(roomId);
        res.json({
            success: true,
            message: 'Room deleted successfully'
        });
        
    }
    catch(error){
            console.error('Delete room error:', error);
            res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

//add admin
const addAdmin = async(req,res)=>{
    try{
        const { roomId, userId: targetUserId } = req.body;
        const userId = req.user.userId; 

        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        // Check if current user is admin
        if (!room.admins.includes(userId)) {
            return res.status(403).json({
                success: false,
                message: 'Only admins can add other admins'
            });
        }

        // Check if target user is in room
        if (!room.participants.includes(targetUserId)) {
            return res.status(400).json({
                success: false,
                message: 'User is not in room'
            });
        }

        // Check if already admin
        if (room.admins.includes(targetUserId)) {
            return res.status(400).json({
                success: false,
                message: 'User is already an admin'
            });
        }

        room.admins.push(targetUserId);
        await room.save();

        res.json({
            success: true,
            message: 'Admin added successfully'
        });
    } catch (error) {
        console.error('Add admin error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

//remove admin
const removeAdmin = async(req,res)=>{
    try {
        const { roomId, userId: targetUserId } = req.body;
        const userId = req.user.userId;

        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        // Check if current user is admin or removing themselves
        if (!room.admins.includes(userId) && userId !== targetUserId) {
            return res.status(403).json({
                success: false,
                message: 'Only admins can remove other admins'
            });
        }

        // Can't remove room creator
        if (room.createdBy.toString() === targetUserId) {
            return res.status(400).json({
                success: false,
                message: 'Cannot remove room creator as admin'
            });
        }

        room.admins = room.admins.filter(a => a.toString() !== targetUserId);
        await room.save();

        res.json({
            success: true,
            message: 'Admin removed successfully'
        });
    } catch (error) {
        console.error('Remove admin error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

//kick user
const removeUser = async(req,res)=>{
    try{
        const { roomId, userId: targetUserId } = req.body;
        const userId = req.user.userId; 

        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        // Check if current user is admin
        if (!room.admins.includes(userId)&&userId!==targetUserId) {
            return res.status(403).json({
                success: false,
                message: 'Only admins can remove users'
            });
        }

        // Can't remove room creator
        if (room.createdBy.toString() === targetUserId) {
            return res.status(400).json({
                success: false,
                message: 'Cannot remove room creator'
            });
        }

        // Remove user from participants and admins
        room.participants = room.participants.filter(p => p.toString() !== targetUserId);
        room.admins = room.admins.filter(a => a.toString() !== targetUserId);

        await room.save();

        // Create system message
        const targetUser = await User.findById(targetUserId);
        const systemMessage = new Message({
            content: `${targetUser.username} was removed from the room`,
            sender: userId,
            room: roomId,
            messageType: 'system'
        });
        await systemMessage.save();

        res.json({
            success: true,
            message: 'User removed successfully'
        });
    } catch (error) {
        console.error('Remove user error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

//add user
const addUser = async(req,res)=>{
    try{
        const {roomId,userId:targetUserId}=req.body;
        const userId=req.user.userId;
        if(!roomId){
            return res.status(400).json({
                success:false,
                message:'Room id is required'
            })
        }
        const room = await Room.findById(roomId);
        const targetUser = await User.findById(targetUserId);
        if(!room){
            return res.status(404).json({
                success:false,
                message:'No room Found'
            })
        }
        if(!targetUser){
            return res.status(404).json({
                success:false,
                message:'User to be added not found'
            })
        }
        if(!room.admins.includes(userId)){
            return res.status(403).json({
                success:false,
                message:'Only Admins Can Add Members'
            })
        }
        if(room.participants.includes(targetUserId)){
            return res.status(400).json({
                success:false,
                message:'User already in the room',
            })
        }
        if(room.participants.length>=room.maxParticipants){
                return res.status(400).json({
                    success:false,
                    message:'Room is Full'
                })
        }
        room.participants.push(targetUserId);
        await room.save();
        res.json({
            success:true,
            message:'User added to room successfully'
        })

    }
    catch(error){
            console.error('Adding user Error:', error);
            res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

//getUserProfileInfo
const getUserProfileInfo = async(req,res)=>{
    try{
        const {userId:targetUserId} = req.query;
        const userId = req.user.userId;
        
        const user = await User.findById(targetUserId||userId).select('-password');
        if(!user){
            return res.status(404).json({
                success:false,
                message:'User Not found'
            })
        }
        res.status(200).json({
             success:true,
             data:user,
             message:'Fetch data successfully'
        })
    }
    catch(error){
            console.error('Get user profile error:', error);
            res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

//edit message
const editMessage = async(req,res)=>{
    try{
            const {messageId,content}=req.body;
            const userId = req.user.userId;
            if(!messageId||!content){
                return res.status(400).json({
                    success:false,
                    message:'Message id and content is required'
                })
            }
            const message = await Message.findById(messageId);
            if(!message){
                return res.status(404).json({
                    success:false,
                    message:'Message not found'
                })
            }
            if(message.sender.toString()!==userId){
                return res.status(403).json({
                    success:false,
                    message:'Only sender can Edit message'
                })
            }
            if (message.deleted) {
            return res.status(403).json({
                success: false,
                message: 'Cannot edit deleted message'
                });
            }
            message.content=content.trim();
            message.edited=true;
            message.editedAt=new Date();
            await message.save();
            await message.populate('sender', 'username avatar');
            res.status(200).json({
                success:true,
                message:'Message Edited Successfully',
                data:message
            })
    }
    catch(error){
            console.error('Edit message error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
           });
    }
}

//delete message
const deleteMessage = async(req,res)=>{
    try{
        const {messageId}=req.body;
        const userId = req.user.userId;
        if(!messageId){
            return res.status(400).json({
                success:false, 
                message:'Message id is required'
            });
        }
        const message = await Message.findById(messageId);
        if(!message){
                return res.status(404).json({
                success:false,
                message:'Message not found'
            })
        }
       
        const room = await Room.findById(message.room);
        const canDelete = message.sender.toString() === userId || 
                         room.admins.includes(userId);

        if (!canDelete) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this message'
            });
        }
        if(message.deleted){
            return res.status(409).json({
                success:false, 
                message:'Message is Already Deleted'
            })
        }
        message.content='This Message Is Deleted';
        message.deleted = true;
        await message.save();
        res.json({
            success:true,
            message:'Message deleted successfully'
        })
    }
    catch(error){
        console.error('Delete message error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

//mark as read
const markAsRead = async(req,res)=>{
    try{
        const { messageId } = req.body;
        const userId = req.user.userId;
        if(!messageId){
            return res.status(400).json({
                success:false,
                message:'Message id is required'
            })
        }
        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        // Check if already read
        const alreadyRead = message.readBy.some(r => r.user.toString() === userId);
        if (!alreadyRead) {
            message.readBy.push({ user: userId });
            await message.save();
        }

        res.json({
            success: true,
            message: 'Message marked as read'
        });
        
    }
    catch(error){
        console.error('Mark as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

//mark as delivered 
const markAsDelivered = async (req,res)=>{
    try {
        const { messageId } = req.body;
        const userId = req.user.userId;
        if(!messageId){
            return res.status(400).json({
                success:false,
                message:'Message id is required'
            })
        }
        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        // Check if already delivered
        const alreadyDelivered = message.deliveredTo.some(d => d.user.toString() === userId);
        if (!alreadyDelivered) {
            message.deliveredTo.push({ user: userId });
            await message.save();
        }

        res.json({
            success: true,
            message: 'Message marked as delivered'
        });
    } catch (error) {
        console.error('Mark as delivered error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

//unread message count 
const unreadMessageCount = async(req,res)=>{
    try {
        const { roomId } = req.query;
        const userId = req.user.userId;

        const query = {
            room: roomId,
            sender: { $ne: userId },
            deleted: false,
            'readBy.user': { $ne: userId }
        };

        const count = await Message.countDocuments(query);

        res.json({
            success: true,
            data: { unreadCount: count }
        });
    } catch (error) {
        console.error('Unread message count error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

//return all the messages for a particular room
const getRoomMessages = async(req,res)=>{
    try {
        const { roomId, page = 1, limit = 50 } = req.query;
        const userId = req.user.userId;

        if (!roomId) {
            return res.status(400).json({
                success: false,
                message: 'Room ID is required'
            });
        }

        // Check if user is in room
        const room = await Room.findById(roomId);
        if (!room || !room.participants.includes(userId)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const messages = await Message.find({
            room: roomId,
            deleted: false
        })
            .populate('sender', 'username avatar')
            .populate('replyTo', 'content sender')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const totalMessages = await Message.countDocuments({
            room: roomId,
            deleted: false
        });

        res.json({
            success: true,
            data: messages.reverse(),
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalMessages / limit),
                totalMessages
            }
        });
    } catch (error) {
        console.error('Get room messages error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

//get last message for a room
const getRoomLastMessage = async(req,res)=>{
    try {
        const { roomId } = req.query;
        const userId = req.user.userId;

        if (!roomId) {
            return res.status(400).json({
                success: false,
                message: 'Room ID is required'
            });
        }

        // Check if user is in room
        const room = await Room.findById(roomId);
        if (!room || !room.participants.includes(userId)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const lastMessage = await Message.findOne({
            room: roomId,
            deleted: false
        })
            .populate('sender', 'username avatar')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: lastMessage
        });
    } catch (error) {
        console.error('Get room last message error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

//check if the user is online or offline
const checkUserStatus = async(req,res)=>{
    try {
        const { userId: targetUserId } = req.query; 

        if (!targetUserId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        const user = await User.findById(targetUserId)
            .select('isOnline lastSeen status');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: {
                isOnline: user.isOnline,
                lastSeen: user.lastSeen,
                status: user.status
            }
        });
    } catch (error) {
        console.error('Check user status error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

export {
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
}