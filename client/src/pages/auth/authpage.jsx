import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const { login, register, loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      window.location.href = '/dashboard';
    }
  }, [isAuthenticated]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      if (isLogin) {
        const response = await login({
          email: formData.email,
          password: formData.password
        });
        
        if (response.success) {
          setSuccess('Login successful! Redirecting...');
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 1000);
        }
      } else {
        const response = await register({
          username: formData.username,
          email: formData.email,
          password: formData.password
        });
        
        if (response.success) {
          setSuccess('Registration successful! Redirecting...');
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 1000);
        }
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setSuccess('');
    setFormData({
      username: '',
      email: '',
      password: ''
    });
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url("./background.jpg")',
        }}
      >
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/50"></div>
        
        {/* Atmospheric gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-900/20 via-transparent to-blue-900/30"></div>
      </div>

      {/* Animated rain effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-px bg-gradient-to-b from-transparent via-white/20 to-transparent animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              height: `${30 + Math.random() * 50}px`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${1.5 + Math.random()}s`
            }}
          ></div>
        ))}
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        {/* Glass Card Effect */}
        <div className="max-w-md w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8 relative">
          {/* Water droplet effects on the card */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white/30 rounded-full blur-sm animate-bounce"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${2 + Math.random() * 2}s`
                }}
              ></div>
            ))}
          </div>

          <div className="text-center mb-8 relative z-10">
            <h1 className="text-3xl font-bold text-white drop-shadow-lg">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-white/80 mt-2 drop-shadow-sm">
              {isLogin ? 'Sign in to your account' : 'Join our chat community'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-500/20 border border-red-400/30 rounded-lg backdrop-blur-sm">
              <p className="text-red-100 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-500/20 border border-green-400/30 rounded-lg backdrop-blur-sm">
              <p className="text-green-100 text-sm">{success}</p>
            </div>
          )}

          <div className="space-y-6 relative z-10">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2 drop-shadow-sm">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/15 border border-white/25 rounded-lg text-white placeholder-white/60 focus:ring-2 focus:ring-teal-400/60 focus:border-teal-400/60 outline-none transition-all backdrop-blur-sm"
                  placeholder="Enter your username"
                  required={!isLogin}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2 drop-shadow-sm">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/15 border border-white/25 rounded-lg text-white placeholder-white/60 focus:ring-2 focus:ring-teal-400/60 focus:border-teal-400/60 outline-none transition-all backdrop-blur-sm"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2 drop-shadow-sm">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/15 border border-white/25 rounded-lg text-white placeholder-white/60 focus:ring-2 focus:ring-teal-400/60 focus:border-teal-400/60 outline-none transition-all backdrop-blur-sm"
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-teal-500/80 hover:bg-teal-600/90 disabled:bg-gray-500/60 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:hover:scale-100"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          </div>

          <div className="mt-8 text-center relative z-10">
            <p className="text-white/80 drop-shadow-sm">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={toggleMode}
                className="text-teal-300 hover:text-teal-200 font-semibold transition-colors underline underline-offset-4 hover:no-underline"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>

          {/* Subtle footer */}
          <div className="mt-6 pt-6 border-t border-white/20 relative z-10">
            <div className="text-center">
              <p className="text-white/50 text-sm italic drop-shadow-sm">
                "Connect through every weather"
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;