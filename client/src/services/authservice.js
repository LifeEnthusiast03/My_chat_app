// services/AuthService.js
class AuthService {
  constructor() {
    this.baseURL = 'http://localhost:5000/api';
  }

  // Make HTTP requests with proper error handling
  async makeRequest(url, options = {}) {
    try {
      const response = await fetch(`${this.baseURL}${url}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Register new user
  register = async (userData) => {
    try {
      const { username, email, password } = userData;
      
      if (!username || !email || !password) {
        throw new Error('All fields are required');
      }

      const response = await this.makeRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password }),
      });

      // Store token in localStorage
      if (response.data?.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }

      return response;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  // Login user
  login = async (credentials) => {
    try {
      const { email, password } = credentials;
      
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      const response = await this.makeRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      // Store token and user data
      if (response.data?.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }

      return response;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  // Logout user
  logout = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (token) {
        await this.makeRequest('/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      return { success: true, message: 'Logged out successfully' };
    } catch (error) {
      // Even if the API call fails, we should clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      console.error('Logout error:', error);
      throw error;
    }
  };

  // Get current user from localStorage
  getCurrentUser = () => {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  };

  // Get current token
  getToken = () => {
    return localStorage.getItem('token');
  };

  // Check if user is authenticated
  isAuthenticated = () => {
    const token = this.getToken();
    const user = this.getCurrentUser();
    return !!(token && user);
  };

  // Verify token validity (optional - for checking token expiration)
  verifyToken = async () => {
    try {
      const token = this.getToken();
      if (!token) return false;

      // You can add a verify endpoint to your backend
      const response = await this.makeRequest('/auth/verify', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.success;
    } catch (error) {
      console.error('Token verification failed:', error);
      // If token is invalid, clear it
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return false;
    }
  };
}

// Export singleton instance
const authService = new AuthService();
export default authService;