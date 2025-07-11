import {Server} from 'socket.io'
import socketAuthentication from '../middleware/socketmiddleware.js'

const configureSocket = (server)=>{
        const io = new Server(server,{
             cors: {
             origin: process.env.CLIENT_URL || "http://localhost:3000",
             methods: ["GET", "POST"],
             credentials: true
            }
        })
        io.use(socketAuthentication)
        return io;
}
export default configureSocket;