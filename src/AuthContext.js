// src/AuthContext.js (Placeholder - Replace with your actual implementation)
import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth } from './firebase'; // Import your Firebase auth instance
import { onAuthStateChanged } from 'firebase/auth';

// Create the context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => { // <--- Named export for the hook
  return useContext(AuthContext);
};

// Provider component
export const AuthProvider = ({ children }) => { // <--- Named export for the provider
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true); // Start loading until auth state is known

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Auth State Changed in Context:", user ? user.uid : 'null');
      setCurrentUser(user); // Set user (or null if logged out)
      setLoading(false); // Auth state determined, stop loading
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []); // Empty dependency array means this runs once on mount

  const value = {
    currentUser,
    loading,
    // You can add other auth-related functions here if needed (e.g., login, logout)
    // login: (email, password) => { /* ... */ },
    // logout: () => auth.signOut(),
  };

  // Render children only after initial loading is complete? Optional.
  // Or show loading state within protected routes as done in App.js
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Note: This file uses NAMED exports (export const ...),
// which matches the import { AuthProvider, useAuth } in App.js