import User from '../models/user.js'

async function createUser(req,res) {
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
            deatils:error.errors
        });
    }
}
async function getUser(req,res) {
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
}
export {createUser,getUser};
