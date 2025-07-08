import { verifyToken } from "../utils/jwt.js";

const authenticateToken = (req,res,next)=>{
        try{
            const authHeader = req.headers.authorization;
            const token = authHeader && authHeader.split(' ')[1];

            if(!token){
                return res.status(401).json({
                    success: false,
                    message: 'Access token is required'
                })
            }
            const decoded = verifyToken(token);
            req.user= decoded;
            next()
        }
        catch(error){
            console.error('Authentication error:', error);
            if (error.message === 'Token has expired') {
            return res.status(401).json({
            success: false,
            message: 'Token has expired'
          });
            } else if (error.message === 'Invalid token') {
            return res.status(401).json({
            success: false,
            message: 'Invalid token'
          });
            } else {
            return res.status(500).json({
            success: false,
            message: 'Internal server error'
          });
        }
      }
}

const validate = (schema) => (req, res, next) => {
    try {
        req.body = schema.parse(req.body);
        next();
    } catch (err) {
        return res.status(400).json({ 
            success: false,
            message: 'Validation failed',
            errors: err.errors 
        });
    }
};

export {authenticateToken,validate}