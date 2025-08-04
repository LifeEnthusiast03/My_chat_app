import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { ChatProvider } from './contexts/ChatContext';
import ProtectedRoute from './protectedroute/protectedroute';
import AuthPage from './pages/auth/authpage';
import ChatApplication from './components/dummy';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <ChatProvider>
                    <Router>
        <div className="App">
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <ChatApplication />
                </ProtectedRoute>
              } 
            />
            
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
        </ChatProvider>
      </SocketProvider>

    </AuthProvider>
  );
}

export default App;