import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext'; // Import AuthProvider and useAuth
import HomePage from './unAuth/HomePage';
import SignUp from './unAuth/SignUp';     // Import SignUp
import Dashboard from './Auth/Dashboard'; // Import Dashboard - Corrected casing
import './App.css';

// Wrapper component to handle protected routes
function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // Or a spinner component
  }
  

  return currentUser ? children : <Navigate to="/signup" />;
}

// Wrapper component to handle routes for unauthenticated users
function UnauthenticatedRoute({ children }) {
    const { currentUser, loading } = useAuth();

    if (loading) {
        return <div>Loading...</div>; // Or a spinner component
    }

    return !currentUser ? children : <Navigate to="/dashboard" />;
}


function App() {
  return (
    <div className="App">
      <AuthProvider> {/* Wrap everything with AuthProvider */}
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

          {/* Optional: Redirect any other path */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </div>
  );
}

export default App;