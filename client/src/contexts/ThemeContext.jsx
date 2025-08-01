import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Theme configurations
const themes = {
  light: {
    name: 'light',
    colors: {
      // Primary colors
      primary: '#3b82f6',
      primaryHover: '#2563eb',
      primaryLight: '#dbeafe',
      
      // Background colors
      background: '#ffffff',
      backgroundSecondary: '#f8fafc',
      backgroundTertiary: '#f1f5f9',
      
      // Text colors
      textPrimary: '#1e293b',
      textSecondary: '#64748b',
      textMuted: '#94a3b8',
      textInverse: '#ffffff',
      
      // Border colors
      border: '#e2e8f0',
      borderLight: '#f1f5f9',
      borderDark: '#cbd5e1',
      
      // Status colors
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
      
      // Chat specific colors
      messageOwn: '#3b82f6',
      messageOther: '#f1f5f9',
      messageOwnText: '#ffffff',
      messageOtherText: '#1e293b',
      
      // Online status
      online: '#10b981',
      offline: '#94a3b8',
      away: '#f59e0b',
      busy: '#ef4444',
      
      // Sidebar
      sidebarBackground: '#1e293b',
      sidebarText: '#cbd5e1',
      sidebarTextActive: '#ffffff',
      sidebarHover: '#334155'
    },
    shadows: {
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
    }
  },
  
  dark: {
    name: 'dark',
    colors: {
      // Primary colors
      primary: '#3b82f6',
      primaryHover: '#2563eb',
      primaryLight: '#1e3a8a',
      
      // Background colors
      background: '#0f172a',
      backgroundSecondary: '#1e293b',
      backgroundTertiary: '#334155',
      
      // Text colors
      textPrimary: '#f8fafc',
      textSecondary: '#cbd5e1',
      textMuted: '#94a3b8',
      textInverse: '#1e293b',
      
      // Border colors
      border: '#334155',
      borderLight: '#475569',
      borderDark: '#1e293b',
      
      // Status colors
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
      
      // Chat specific colors
      messageOwn: '#3b82f6',
      messageOther: '#334155',
      messageOwnText: '#ffffff',
      messageOtherText: '#f8fafc',
      
      // Online status
      online: '#10b981',
      offline: '#64748b',
      away: '#f59e0b',
      busy: '#ef4444',
      
      // Sidebar
      sidebarBackground: '#020617',
      sidebarText: '#94a3b8',
      sidebarTextActive: '#f8fafc',
      sidebarHover: '#1e293b'
    },
    shadows: {
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.3)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.3)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.3), 0 4px 6px -4px rgb(0 0 0 / 0.3)',
      xl: '0 20px 25px -5px rgb(0 0 0 / 0.3), 0 8px 10px -6px rgb(0 0 0 / 0.3)'
    }
  }
};

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState('light');
  const [systemPreference, setSystemPreference] = useState('light');

  // Detect system theme preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      setSystemPreference(e.matches ? 'dark' : 'light');
    };
    
    // Set initial value
    setSystemPreference(mediaQuery.matches ? 'dark' : 'light');
    
    // Listen for changes
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Load saved theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('chat-app-theme');
    if (savedTheme && themes[savedTheme]) {
      setCurrentTheme(savedTheme);
    } else {
      // Use system preference if no saved theme
      setCurrentTheme(systemPreference);
    }
  }, [systemPreference]);

  // Apply theme to document
  useEffect(() => {
    const theme = themes[currentTheme];
    const root = document.documentElement;
    
    // Set CSS custom properties
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
    
    Object.entries(theme.shadows).forEach(([key, value]) => {
      root.style.setProperty(`--shadow-${key}`, value);
    });
    
    // Set theme class on body
    document.body.className = document.body.className.replace(/theme-\w+/g, '');
    document.body.classList.add(`theme-${currentTheme}`);
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme.colors.background);
    }
  }, [currentTheme]);

  const setTheme = (themeName) => {
    if (themes[themeName]) {
      setCurrentTheme(themeName);
      localStorage.setItem('chat-app-theme', themeName);
    }
  };

  const toggleTheme = () => {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const useSystemTheme = () => {
    setCurrentTheme(systemPreference);
    localStorage.removeItem('chat-app-theme');
  };

  // Get theme-aware styles
  const getThemeStyles = () => themes[currentTheme];

  // Check if current theme is dark
  const isDark = currentTheme === 'dark';

  // Get status color
  const getStatusColor = (status) => {
    const theme = themes[currentTheme];
    switch (status) {
      case 'online':
        return theme.colors.online;
      case 'away':
        return theme.colors.away;
      case 'busy':
        return theme.colors.busy;
      case 'offline':
      default:
        return theme.colors.offline;
    }
  };

  // Get message background color
  const getMessageBgColor = (isOwn) => {
    const theme = themes[currentTheme];
    return isOwn ? theme.colors.messageOwn : theme.colors.messageOther;
  };

  // Get message text color
  const getMessageTextColor = (isOwn) => {
    const theme = themes[currentTheme];
    return isOwn ? theme.colors.messageOwnText : theme.colors.messageOtherText;
  };

  // Generate theme-aware CSS classes
  const getThemeClasses = (baseClasses = '') => {
    return `${baseClasses} theme-${currentTheme}`;
  };

  const value = {
    // Current theme state
    currentTheme,
    isDark,
    systemPreference,
    availableThemes: Object.keys(themes),
    
    // Theme data
    theme: themes[currentTheme],
    themes,
    
    // Theme methods
    setTheme,
    toggleTheme,
    useSystemTheme,
    
    // Utility methods
    getThemeStyles,
    getStatusColor,
    getMessageBgColor,
    getMessageTextColor,
    getThemeClasses
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};