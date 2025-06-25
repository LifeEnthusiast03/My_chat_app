import express from  'express'
import User from '../models/user.js'

const router = express.Router();

router.post('/create-user',async(req,res)=>{
    try{
    const {username,email,password}=req.body;
    const user = new User({
        username,
        email,
        password
    });
    await user.save();
    res.status(201).json({
        message:'user created successfully',
        user:user.toJSON()
    });
    }
    catch(error){
        res.status(400).json({
            message:error.message,
            deatils:errors.errors
        });
    }

});


router.get('/users',async(req,res)=>{
    try{
        const users= await User.find({}).select('-password');
        res.json({
            count:users.length,
            users
        });
    }
    catch(error){
        res.status(500).json({
            error:error.message
        });
    }
});


export default router

