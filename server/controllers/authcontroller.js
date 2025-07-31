import { generateToken } from "../utils/jwt.js";
import User from "../models/user.js";
const registerUser = async(req, res) => {
    try {
        const { username, email, password } = req.body;
        console.log('upto this is okay');
        
        const existUser = await User.findOne({
            $or: [{ email }, { username }]
        });
        
        if (existUser) {
            return res.status(400).json({
                success: false,
                message: existUser.email === email 
                ? 'Email already registered' 
                : 'Username already taken'
            });
        }

        const user = new User({
            username,
            email,
            password
        });
        
        await user.save();
        
        const token = generateToken({
            userId: user._id,
            username: user.username,
            email: user.email
        });
        
        res.json({
            success: true,
            message: 'User registered successfully',
            data: {
                user,
                token
            }
        });
        
    } catch(error) {
        console.error('Registration error:', error);
    
        // Handle MongoDB validation errors
        if (error.name === 'ValidationError') {
            const errorMessages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errorMessages
            });
        }

        // Handle duplicate key errors
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                success: false,
                message: `${field} already exists`
            });
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}


const loginUser = async (req,res)=>{
    try{
        const {email,password}= req.body;
        const user = await User.findOne({email});
        if(!user){
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            })
        }
        const isValidpassword = await user.comparePassword(password);
        if(!isValidpassword){
            return res.status(401).json({
                sucess:false,
                message:'Invalid Password'
            })
        }
        user.isOnline= true;
        user.lastSeen= new Date();

        await user.save();
        const token = generateToken({
              userId: user._id,
              username: user.username,
              email: user.email
        });


        res.json({
             success: true,
             message: 'User login sucessful',
             data: {
                 user,
                 token
             }
        })
    }
    catch(error){
            console.error('Login error:', error);
            res.status(500).json({
            success: false,
            message: 'Internal server error'
        })
    }
}


const logoutUser =async (req,res)=>{
        try{
            const userid= req.user.userid;
            await User.findByIdAndUpdate(userid,{
                isOnline:false,
                lastSeen:new Date()
            })
            res.json({
                success:true,
                message:'User logout Sucessfully'
            })
        }
        catch(error){   
            console.error('Logout error:', error);
                res.status(500).json({
                success: false,
                message: 'Internal server error'
             });
        }
}

const verifyToken = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            message: 'Token is valid',
            data: {
                userId: user._id,
                username: user.username,
                email: user.email,
                isOnline: user.isOnline
            }
        });
    } catch (error) {
        console.error('Token verification error:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
export{registerUser,loginUser,logoutUser,verifyToken};




