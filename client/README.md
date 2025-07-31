# Chat App Frontend

This is the React frontend for the chat application that connects to the Node.js/Socket.io backend.

## Features

- **Authentication**: Login and Registration with JWT tokens
- **Real-time Chat**: Socket.io integration for live messaging
- **Room Management**: Create, join, leave, and manage chat rooms
- **Message Features**: Send, edit, delete messages with typing indicators
- **User Management**: Add/remove users, admin controls
- **Responsive Design**: Tailwind CSS for modern UI

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ChatArea.jsx    # Main chat interface
│   ├── Sidebar.jsx     # Rooms sidebar
│   ├── ProtectedRoute.jsx # Route protection
│   └── RoomSettings.jsx # Room management modal
├── contexts/           # React contexts
│   ├── AuthContext.jsx # Authentication state
│   └── SocketContext.jsx # Socket.io connection
├── pages/              # Page components
│   ├── LoginPage.jsx   # Login form
│   ├── RegisterPage.jsx # Registration form
│   └── ChatPage.jsx    # Main chat interface
├── services/           # API services
│   └── api.js          # Axios API calls
├── utils/              # Utility functions
│   ├── constants.js    # App constants
│   └── helpers.js      # Helper functions
└── App.jsx             # Main app component
```

## Backend Integration

The frontend is designed to work with the following backend endpoints:

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/health` - Health check

### Chat Endpoints
- `POST /api/chat/rooms` - Create room
- `GET /api/chat/rooms` - Get user's rooms
- `PUT /api/chat/rooms/:id` - Update room
- `DELETE /api/chat/rooms` - Delete room
- `POST /api/chat/rooms/join` - Join room
- `POST /api/chat/rooms/leave` - Leave room
- `GET /api/chat/rooms/messages` - Get room messages
- And many more...

### Socket Events
The frontend handles these socket events:
- `join-room`, `leave-room`, `update-room`, `delete-room`
- `send-message`, `edit-message`, `delete-message`
- `start-typing`, `stop-typing`
- `add-admin`, `remove-admin`, `add-user`, `user-removed`

## Setup Instructions

1. Install dependencies (see below)
2. Configure environment variables in `.env`
3. Ensure the backend server is running on port 5000
4. Run the development server

## Usage

1. **Registration/Login**: Users can create accounts or login
2. **Room Management**: Create new rooms or join existing ones
3. **Real-time Chat**: Send messages that appear instantly
4. **Message Actions**: Edit or delete your own messages
5. **Typing Indicators**: See when others are typing
6. **User Status**: See who's online/offline

## Dependencies to Install

Run the following command to install all required dependencies:

```bash
npm install axios react-router-dom socket.io-client
```

## Development

```bash
npm run dev
```

This will start the development server on http://localhost:3000

## Building

```bash
npm run build
```

This creates an optimized production build.+ Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
