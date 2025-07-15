import Room from'../models/rooms.js'
import Message from '../models/message.js'

const joinRoom = async(socket, data)=>{
        try{
              const {roomId,userData}=data;
              const userId = socket.user.userId;
              socket.join(roomId);
              socket.to(roomId).emit('user-joined',{
                user:userData,
                message:`${socket.user.username} joined the room`,
                timestamp:new Date()
              })

              socket.emit('Join-room-success',{
                roomId,
                message:'successfully joined the room'
              });
              console.log(`user ${socket.user.username} joined the room ${roomId}`);
              
        }
        catch(error){
                console.error('Socket join room error:', error);
                socket.emit('join-room-error', {
                message: 'Failed to join room',
                error: error.message
            });
        }
}

const updateroom = async(socket, data)=>{
        try{
              const {roomId,updatedRoom} = data;
              socket.to(roomId).emit('room-updated',{
                roomId,
                updatedRoom,
                updatedBy:socket.user.username,
                timestamp:new Date()
              })
              console.log(`Room ${roomId} updated by ${socket.user.username}`);
        }
        catch(error){
                 console.error('Socket update room error:', error);
                 socket.emit('update-room-error', {
                 message: 'Failed to update room',
                 error: error.message
             });
        }
}

const sendMessage = async(socket, data)=>{ 
        try{
                const {roomId,content,messageType='text',replyTo}=data;
                const userId = socket.user.userId;
                const messageData ={
                        content:content.trim(),
                        sender:userId,
                        room:roomId,
                        messageType,
                        replyTo:replyTo||null
                }
                const message = new Message(messageData);
                await message.save();
                await message.populate('sender', 'username avatar');
                if (replyTo) {
                await message.populate('replyTo', 'content sender');
                } 
                await Room.findByIdAndUpdate(roomId, {
                lastMessage: message._id
                });

                // Broadcast message to all participants in the room
                socket.to(roomId).emit('new-message', {
                message,
                timestamp: new Date()
                });
                socket.emit('message-sent', {
                message,
                timestamp: new Date()
                });

                console.log(`Message sent by ${socket.user.username} in room ${roomId}`)
        }
        catch(error){
                console.error('Socket send message error:', error);
                socket.emit('send-message-error', {
                message: 'Failed to send message',
                error: error.message
                });
        }
}

const editMessage = async(socket, data)=>{
        try{
                const{messageId,editMessage}=data;
                const userId = socket.user.userId;
                socket.to(editMessage.room).emit('message-edited',{
                        messageId,
                        editMessage,
                        editedBy:socket.user.username,
                        timestamp: new Date()
                })
                 console.log(`Message ${messageId} edited by ${socket.user.username}`);
        }
        catch(error){
                console.error('Socket edit message error:', error);
                socket.emit('edit-message-error', {
                message: 'Failed to edit message',
                error: error.message
                });
        }
}

const deleteMessage = async(socket, data)=>{
        try {
        const { messageId, roomId } = data;

        // Notify room participants about message deletion
        socket.to(roomId).emit('message-deleted', {
            messageId,
            deletedBy: socket.user.username,
            timestamp: new Date()
        });

        console.log(`Message ${messageId} deleted by ${socket.user.username}`);
    } catch (error) {
        console.error('Socket delete message error:', error);
        socket.emit('delete-message-error', {
            message: 'Failed to delete message',
            error: error.message
        });
    }
}

const leaveRoom = async(socket, data)=>{
        try{
                const {roomId} = data;
                const userId = socket.user.userId;
                socket.leave(roomId);
                socket.to(roomId).emit('user-left', {
                        userId,
                        username: socket.user.username,
                        message: `${socket.user.username} left the room`,
                        timestamp: new Date()
                })
        }
        catch(error){
                console.error('Socket leave room error:', error);
                socket.emit('leave-room-error', {
                message: 'Failed to leave room',
                error: error.message
            });
        }
}

const deleteRoom = async(socket, data)=>{
        try {
        const { roomId } = data;

        // Notify all participants about room deletion
        socket.to(roomId).emit('room-deleted', {
            roomId,
            deletedBy: socket.user.username,
            message: 'Room has been deleted',
            timestamp: new Date()
        });

        console.log(`Room ${roomId} deleted by ${socket.user.username}`);
    } catch (error) {
        console.error('Socket delete room error:', error);
        socket.emit('delete-room-error', {
            message: 'Failed to delete room',
            error: error.message
        });
    }
}

const startTyping = async(socket, data)=>{
        try {
        const { roomId } = data;

        // Notify other participants that user is typing
        socket.to(roomId).emit('user-typing', {
            userId: socket.user._id,
            username: socket.user.username,
            roomId,
            timestamp: new Date()
        });

        console.log(`${socket.user.username} started typing in room ${roomId}`);
    } catch (error) {
        console.error('Socket start typing error:', error);
    }
}

const stopTyping = async(socket, data)=>{
        try {
        const { roomId } = data;

        // Notify other participants that user stopped typing
        socket.to(roomId).emit('user-stopped-typing', {
            userId: socket.user._id,
            username: socket.user.username,
            roomId,
            timestamp: new Date()
        });

        console.log(`${socket.user.username} stopped typing in room ${roomId}`);
    } catch (error) {
        console.error('Socket stop typing error:', error);
    }   

}

const addAdmin = async(socket, data)=>{
        try {
        const { roomId, newAdminId, newAdminUsername } = data;

        // Notify room participants about new admin
        socket.to(roomId).emit('admin-added', {
            roomId,
            newAdminId,
            newAdminUsername,
            addedBy: socket.user.username,
            message: `${newAdminUsername} is now an admin`,
            timestamp: new Date()
        });

        console.log(`${newAdminUsername} made admin by ${socket.user.username} in room ${roomId}`);
    } catch (error) {
        console.error('Socket add admin error:', error);
        socket.emit('add-admin-error', {
            message: 'Failed to add admin',
            error: error.message
        });
    }
}

const removeAdmin = async(socket, data)=>{
        try {
        const { roomId, removedAdminId, removedAdminUsername } = data;

        // Notify room participants about admin removal
        socket.to(roomId).emit('admin-removed', {
            roomId,
            removedAdminId,
            removedAdminUsername,
            removedBy: socket.user.username,
            message: `${removedAdminUsername} is no longer an admin`,
            timestamp: new Date()
        });

        console.log(`${removedAdminUsername} removed as admin by ${socket.user.username} in room ${roomId}`);
    } catch (error) {
        console.error('Socket remove admin error:', error);
        socket.emit('remove-admin-error', {
            message: 'Failed to remove admin',
            error: error.message
        });
    }
}

const userRemoved = async(socket, data)=>{
        try {
        const { roomId, removedUserId, removedUsername } = data;

        // Notify room participants about user removal
        socket.to(roomId).emit('user-removed', {
            roomId,
            removedUserId,
            removedUsername,
            removedBy: socket.user.username,
            message: `${removedUsername} was removed from the room`,
            timestamp: new Date()
        });

        console.log(`${removedUsername} removed by ${socket.user.username} from room ${roomId}`);
    } catch (error) {
        console.error('Socket user removed error:', error);
        socket.emit('remove-user-error', {
            message: 'Failed to remove user',
            error: error.message
        });
    }
}

const addUser = async(socket, data)=>{  
        try {
        const { roomId, newUserId, newUsername } = data;

        // Notify room participants about new user addition
        socket.to(roomId).emit('user-added', {
            roomId,
            newUserId,
            newUsername,
            addedBy: socket.user.username,
            message: `${newUsername} was added to the room`,
            timestamp: new Date()
        });

        console.log(`${newUsername} added by ${socket.user.username} to room ${roomId}`);
    } catch (error) {
        console.error('Socket add user error:', error);
        socket.emit('add-user-error', {
            message: 'Failed to add user',
            error: error.message
        });
    }
}

export {
        joinRoom,
        updateroom,
        sendMessage,
        editMessage,
        deleteMessage,
        leaveRoom,
        deleteRoom,
        startTyping,
        stopTyping,
        addAdmin,
        removeAdmin,
        userRemoved,
        addUser
}