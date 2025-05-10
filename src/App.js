// src/App.js
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext'; // Assumes AuthContext exports these correctly
import HomePage from './unAuth/HomePage'; // Check export in HomePage.js
import SignUp from './unAuth/SignUp';     // Check export in SignUp.js
import Dashboard from './Auth/Dashboard'; // Default export is correct here
import './App.css'; // Make sure this CSS file exists

// Wrapper component to handle protected routes
function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    // Optional: Add a more visually appealing loading indicator
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading Authentication...</div>;
  }

  // If not loading and no user, redirect to signup/login
  return currentUser ? children : <Navigate to="/signup" replace />; // Use replace to avoid back button issues
}

// Wrapper component to handle routes for unauthenticated users
function UnauthenticatedRoute({ children }) {
    const { currentUser, loading } = useAuth();

    if (loading) {
        return <div style={{ padding: '20px', textAlign: 'center' }}>Loading Authentication...</div>;
    }

    // If not loading and IS a user, redirect to dashboard
    return !currentUser ? children : <Navigate to="/dashboard" replace />;
}


function App() {
  return (
    <div className="App">
      <AuthProvider> {/* AuthProvider needs to be defined correctly in AuthContext.js */}
        <Routes>
          {/* Unauthenticated Routes */}
          <Route path="/" element={
            <UnauthenticatedRoute>
              <HomePage />
            </UnauthenticatedRoute>
          } />
          <Route path="/signup" element={
            <UnauthenticatedRoute>
              <SignUp />
            </UnauthenticatedRoute>
          } />

          {/* Authenticated Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />

          {/* Catch-all Redirect */}
          {/* Consider redirecting to home page or a 404 page */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </div>
  );
}

export default App;