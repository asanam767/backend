// src/Auth/Dashboard.js (Corrected: Hooks inside component, imports fixed)

// ** React Imports **
import React, { useEffect, useState } from 'react'; // Make sure useEffect, useState are imported
import { useNavigate } from 'react-router-dom';    // Import useNavigate

// ** Firebase Imports **
import { auth } from '../firebase'; // Use YOUR firebase setup file path
import { signOut } from 'firebase/auth';

// ** CSS Import **
import './Dashboard.css'; // Make sure you have basic CSS

// --- Component Definition ---
const Dashboard = () => {
  // --- State Hooks (MUST be inside the component) ---
  const [error, setError] = useState(null);        // For errors
  const [userEmail, setUserEmail] = useState('');   // User's email
  const [profileImageUrl, setProfileImageUrl] = useState(''); // Profile image URL

  // --- Other Hooks (MUST be inside the component) ---
  const navigate = useNavigate(); // Hook for navigation

  // --- Effect Hook (MUST be inside the component) ---
  useEffect(() => {
    console.log("Dashboard useEffect running.");

    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => { // Make callback async
      console.log(`AUTH Listener: Auth state changed. User object initial:`, user);

      if (user) {
        // --- User Logged In ---
        setUserEmail(user.email || 'No Email'); // Use state setter
        let currentPhotoURL = user.photoURL;

        // Check if photoURL is missing initially & try reloading
        if (!currentPhotoURL) {
          console.warn("AUTH Listener: user.photoURL is initially null/empty. Attempting user.reload().");
          try {
            // Wait a tiny bit for propagation, then reload
            await new Promise(resolve => setTimeout(resolve, 1500)); // Delay 1.5 seconds
            await user.reload(); // Force refresh user data from backend
            console.log("AUTH Listener: user.reload() completed. Checking auth.currentUser.");
            currentPhotoURL = auth.currentUser?.photoURL; // Check updated currentUser
          } catch (reloadError) {
            console.error("AUTH Listener: Error during user.reload():", reloadError);
            setError("Failed to refresh user data."); // Use state setter
          }
        }

        // Set state based on potentially updated photoURL
        if (currentPhotoURL) {
          console.log(`AUTH Listener: Setting profileImageUrl from ${currentPhotoURL ? 'auth object' : 'still null'}: ${currentPhotoURL?.slice(0, 60)}...`);
          setProfileImageUrl(currentPhotoURL); // Use state setter
        } else {
          console.warn("AUTH Listener: photoURL still null/empty after check/reload.");
          setProfileImageUrl(''); // Use state setter
        }
        setError(null); // Use state setter

      } else {
        // --- User Logged Out ---
        console.log("AUTH Listener: User logged out.");
        // Reset state
        setUserEmail('');           // Use state setter
        setProfileImageUrl('');     // Use state setter
        setError(null);             // Use state setter
        navigate('/signup');        // Use navigate function
      }
    });

    // --- Cleanup Function for useEffect ---
    return () => {
      console.log(">>> Dashboard Component Unmounting: Cleaning up Auth listener.");
      unsubscribeAuth();
    };
  }, [navigate]); // Dependency array for useEffect

  // --- Logout Button Handler ---
  const handleLogout = async () => {
    console.log("Logout button clicked.");
    try {
      await signOut(auth); // Use imported signOut and auth
      console.log("Sign out successful.");
    } catch (error) {
      console.error('Error signing out:', error);
      setError("Failed to logout."); // Use state setter
    }
  };
  // --- ---

  // --- Render Logic ---
  const isUserLoaded = !!userEmail; // Determine if user info is loaded
  console.log(`--- Rendering Dashboard: isUserLoaded=${isUserLoaded}, error=${error}, profileImageUrl=${profileImageUrl ? profileImageUrl.slice(0,30)+'...' : 'empty'}`);

  return (
    <div className="dashboard-container" style={{ textAlign: 'center', padding: '20px' }}>
      <h1>Welcome to Your Dashboard</h1>

      {/* Show loading only if email isn't set yet */}
      {!isUserLoaded && !error && (
           <p style={{ color: 'blue' }}>Loading user...</p>
      )}

      {error && (
        <p style={{ color: 'red' }}>Error: {error}</p>
      )}

      {/* Show profile info only when user is loaded and no error */}
      {isUserLoaded && !error && (
        <>
          <p>Email: {userEmail}</p>
          {profileImageUrl ? (
            <img
              src={profileImageUrl}
              alt="User Profile"
              className="profile-image" // Ensure you have CSS for this class
              style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #ccc' }} // Basic inline styles
              onError={(e) => {
                console.error("REACT RENDER Error: Failed loading image in <img> tag. URL:", profileImageUrl);
                setError("Failed to load profile image resource."); // Use state setter
              }}
            />
          ) : (
            // This shows if user is loaded, no error, but image URL state is still empty
            <p>No profile image set.</p>
          )}
        </>
      )}
      {/* --- End Conditional Rendering --- */}

      <button
        className="logout-button"
        onClick={handleLogout}
        style={{ marginTop: '20px', padding: '10px 20px' }}
      >
        Logout
      </button>
    </div>
  );
  // --- ---
}; // --- End of Dashboard Component ---

export default Dashboard;