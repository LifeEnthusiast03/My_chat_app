import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import ConnectDb from './config/database.js'

dotenv.config();
ConnectDb();
const app = express();
const server = createServer(app);

app.use(cors());
app.use(express.json());

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
