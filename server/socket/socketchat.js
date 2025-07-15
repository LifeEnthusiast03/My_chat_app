import {
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
} from './socketchathandler.js'

const chathandlers = (io, socket) => {
    // Room management
    socket.on('join-room', (data) => joinRoom(socket, data));
    socket.on('update-room', (data) => updateroom(socket, data));
    socket.on('leave-room', (data) => leaveRoom(socket, data));
    socket.on('delete-room', (data) => deleteRoom(socket, data));
    
    // Message management
    socket.on('send-message', (data) => sendMessage(socket, data));
    socket.on('edit-message', (data) => editMessage(socket, data));
    socket.on('delete-message', (data) => deleteMessage(socket, data));
    
    // Typing indicators
    socket.on('start-typing', (data) => startTyping(socket, data));
    socket.on('stop-typing', (data) => stopTyping(socket, data));
    
    // Admin management
    socket.on('add-admin', (data) => addAdmin(socket, data));
    socket.on('remove-admin', (data) => removeAdmin(socket, data));
    
    // User management
    socket.on('add-user', (data) => addUser(socket, data));
    socket.on('user-removed', (data) => userRemoved(socket, data));
}

export default chathandlers;