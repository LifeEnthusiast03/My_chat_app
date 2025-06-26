import express from  'express'
import {createUser,getUser} from '../controllers/user.js';

const router = express.Router();

router.post('/create-user',createUser);
router.get('/users',getUser);


export default router

