import jwt from 'jsonwebtoken';
import dotenv from 'dotenv'

dotenv.config();

//funtion of creation of token 

const generateToken = (payload)=>{
    try{
        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            {
            expiresIn: process.env.JWT_EXPIRES_IN || '7d',
            issuer: 'chat-app',
        }
        );
        return token
    }
    catch(error){
        console.error('Error genrating token',error);
        throw new Error("token geneation failed");
        
    }
}



// verify token 

const verifyToken = (token)=>{
    try{
        const decoded = jwt.verify(token,process.env.JWT_SECRET);
        return decoded
    }
    catch(error){
        console.error("Token verification failed");

        if (error.name === 'TokenExpiredError') {
        throw new Error('Token has expired');
        } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid token');
        } else {
        throw new Error('Token verification failed');
        }
        
    }
}

export {generateToken,verifyToken};