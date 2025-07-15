# Real-Time Chat Application

A real-time chat application built with Node.js, Express, Socket.IO, and MongoDB.

## Features

- User authentication (register/login/logout)
- Create and manage chat rooms (public/private/direct)
- Real-time messaging with Socket.IO
- Message editing, deletion, and replies
- Typing indicators and read receipts
- User roles (admin/participant)
- Online/offline status tracking

## Tech Stack

- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **Real-time**: Socket.IO
- **Auth**: JWT, bcryptjs
- **Validation**: Zod

## Quick Start

1. **Clone and install**
   ```bash
   git clone https://github.com/LifeEnthusiast03/My_chat_app.git
   cd server
   npm install
   ```

2. **Environment setup**
   Create `.env` file:
   ```env
   MONGODB_URI=mongodb://localhost:27017/chatapp
   JWT_SECRET=your-secret-key
   JWT_EXPIRES_IN=7d
   PORT=5000
   CLIENT_URL=http://localhost:5000
   ```

3. **Run the application**
   ```bash
   npm run dev  # Development
   npm start    # Production
   ```

## API Routes

### Authentication (`/api/auth`)
- `POST /register` - Register user
- `POST /login` - Login user
- `POST /logout` - Logout user

### Chat (`/api/chat`) - *Requires authentication*
- `POST /rooms` - Create room
- `GET /rooms` - Get user's rooms
- `POST /rooms/join` - Join room
- `POST /rooms/leave` - Leave room
- `GET /rooms/messages` - Get messages
- `PUT /messages` - Edit message
- `DELETE /messages` - Delete message

## Socket Events

### Client → Server
- `join-room`, `leave-room`
- `send-message`, `edit-message`, `delete-message`
- `start-typing`, `stop-typing`

### Server → Client
- `user-joined`, `user-left`
- `new-message`, `message-edited`, `message-deleted`
- `user-typing`, `user-stopped-typing`

## Project Structure

```
server/
├── config/          # Database & Socket config
├── controllers/     # Business logic
├── middleware/      # Auth & validation
├── models/          # MongoDB schemas
├── routes/          # API routes
├── socket/          # Socket.IO handlers
├── utils/           # JWT utilities
└── validators/      # Input validation
```

## Database Models

- **User**: username, email, password, online status
- **Room**: name, type, participants, admins, settings
- **Message**: content, sender, room, reactions, read status

## License

ISC