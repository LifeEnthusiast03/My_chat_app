import Room from '../models/rooms.js'
import Message from '../models/message.js'
import User from '../models/user.js'
import message from '../models/message.js'
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
        console.error(error.errors);
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
            console.error(error.errors);
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
                message:'Roomid is required'
            })
        }
        const room = await Room.findById(roomId)
        if(!room){
            return res.status(400).json({
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
        if(room.participants.some(p => p._id.toString() === userId)){
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
        console.error(error.errors);
        res.status(500).json({
            success:false,
            message:'Internal Server Error'
        });
        
    }
}
//return all the rooms for a user
const getRooms = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { page = 1, limit = 20, type = 'public' } = req.query;

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
//get the info of a paricular room like name ,descition,maxmember
const getRoomInfo = async(req,res)=>{
    try{
        const {roomId}=req.body;
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
            .populate('createdBy', 'username email avatar');;
        if(!room){
            return res.status(400).json({
                success:false,
                message:'No room found'
            })
        }
        if(!room.participants.some(p=>p._id.toString()===userId)){
            return res.status(400).json({
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
//get the infomation of room memebers
const getRoomParticipant = async(req,res)=>{
    try{
        const {roomId}=req.body;
        const userId = req.user.userId;
        if(!roomId){
            return res.status(400).json({
                success:false,
                message:'Room Id is required'
            })
        }
        const room =await Room.findById(roomId)
                    .populate('participants', 'username email avatar isOnline lastSeen status')
                    .populate('admins', 'username email avatar');
        if(!room){
            return res.status(400).json({
                success:false,
                message:"No room found"
            })
        }
        if(!room.participants.some(p=>p._id.toString()===userId)){
            return res.status(400).json({
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
        const userId = req.user.UserId;

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

        if(room.createdBy===userId){
            if(room.admins.length>=0){
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
                message:'Only admins can delete The rooms'
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
        const userId = req.user.id;

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
//remove admint
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
        const userId = req.user.id;

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

export{createRoom,updateRoom,joinRoom,addAdmin,removeAdmin,removeUser,editMessage,deleteMessage,getRooms,getRoomInfo,getRoomMessage,getRoomLastMessage,getRoomParticipant,leaveRoom,deleteRoom,cheakUserStatus}