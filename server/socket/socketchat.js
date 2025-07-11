import {joinRoom,
        sendMessage,
        editMessage,
        deleteMessage,
        leaveRoom,
        startTyping,
        stopTyping
        } from './socketchathandler'


const chathandlers = (io,socket)=>{
    socket.on('join-room',joinRoom);
    socket.on('send-message',sendMessage);
    socket.on('edit-message',editMessage);
    socket.on('delete-message',deleteMessage);
    socket.on('leave-room',leaveRoom);
    socket.on('start-typing',startTyping);
    socket.on('stop-typing',stopTyping)
}

export default chathandlers;