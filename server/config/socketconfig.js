import {Server} from 'socket.io'
import socketAuthentication from '../middleware/socketmiddleware.js'

const configureSocket = (server)=>{
        const io = new Server(server,{
             cors: {
             origin: ['http://localhost:3000', 'http://127.0.0.1:5501', 'http://localhost:5501'],
             methods: ['GET', 'POST'],
             credentials: true
            }
        })
        io.use(socketAuthentication)
        return io;
}
export default configureSocket;