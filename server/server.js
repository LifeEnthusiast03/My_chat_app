import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import approute from './routes/test.js'
import connectDB from './config/database.js'
import authroute from './routes/auth.js'
import chatroute from './routes/chatroute.js'
import configureSocket from './config/socketconfig.js';
import chathandlers from './socket/socketchat.js';

dotenv.config();
connectDB();
const app = express();
const server = createServer(app);

app.use(cors());
app.use(express.json());
app.use('/api/test',approute);
app.use('/api/auth',authroute);
app.use('/api/chat',chatroute);


const io = configureSocket(server);


io.on('connection', (socket) => {
  console.log(`User connected: ${socket.user.username}`);
  
  // Set user as online
  socket.user.isOnline = true;
  socket.user.lastSeen = new Date();
  socket.user.save();
  
  // Register chat handlers
  chathandlers(io, socket);
  
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.user.username}`);
    socket.user.isOnline = false;
    socket.user.lastSeen = new Date();
    socket.user.save();
  });
});


app.get('/', (req, res) => {
  res.json({  
    message: 'Chat App Server Running!',
    database: 'MongoDB Atlas Connected',
    timestamp: new Date().toISOString() });
});

app.get('/api/test-db', async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    res.json({
      database: 'MongoDB Atlas',
      status: states[dbState],
      host: mongoose.connection.host,
      name: mongoose.connection.name
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`);
});
