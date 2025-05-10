// src/App.js (Updated to import SignPage)
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'; // Import Router here
import { AuthProvider, useAuth } from './AuthContext';
import HomePage from './unAuth/HomePage';
import SignPage from './unAuth/SignPage'; // <--- Import SignPage instead of SignUp
import Dashboard from './Auth/Dashboard';
import './App.css';
import './firebase'; // Initialize firebase
// Removed Helmet/GA4 for simplicity, add back if needed

// PrivateRoute remains the same
const PrivateRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  return currentUser ? children : <Navigate to="/" replace />; // Redirect to home if not logged in
};

// UnauthenticatedRoute (Optional but good practice)
const UnauthenticatedRoute = ({ children }) => {
    const { currentUser, loading } = useAuth();
    if (loading) return <div>Loading...</div>;
    return !currentUser ? children : <Navigate to="/dashboard" replace />; // Redirect to dashboard if logged in
}

function App() {
  return (
    <AuthProvider>
      <Router> {/* Ensure Router wraps Routes */}
        <div className="App">
          <Routes>
             {/* Use UnauthenticatedRoute for home/signup */}
            <Route path="/" element={
                <UnauthenticatedRoute><HomePage /></UnauthenticatedRoute>
            } />
            <Route path="/signup" element={
                <UnauthenticatedRoute><SignPage /></UnauthenticatedRoute> // <--- Use SignPage component
            } />
            {/* Use PrivateRoute for dashboard */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute> <Dashboard /> </PrivateRoute>
              }
            />
             {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;