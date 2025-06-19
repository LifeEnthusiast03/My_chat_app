import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const server = createServer(app);

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'chat server is running' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`);
});
