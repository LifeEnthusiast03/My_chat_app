import express from 'express'
import { registerUser,loginUser,logoutUser } from '../controllers/authcontroller.js'
import { authenticateToken,validate } from '../middleware/auth.js';
import { registerSchema, loginSchema, } from '../validators/authvalidators.js';
const router = express.Router();

router.post('/register',validate(registerSchema),registerUser);
router.post('/login',validate(loginSchema),loginUser);
router.post('/logout',authenticateToken,logoutUser)
router.get('/health',async(req,res)=>{
        res.status(200).json({
            message:"authroute is woring"
        })
})

export default router;