import User from '../models/user.js'
import jwt from 'jsonwebtoken'

const socketAuthentication = async(socket,next)=>{
    try{
        const token = socket.handshake.auth.token;
        if(!token){
            return next(new Error('No token provided'));
        }
        const decoded = jwt.verify(token ,process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        if(!user){
            return next(new Error('User not found'));
        }
        socket.userId=user._id;
        socket.user = user;
        next();
    }
    catch(error){
        next(new Error('Authentication failed'));
    }
}
export default socketAuthentication;