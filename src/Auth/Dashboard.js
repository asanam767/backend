// src/Auth/Dashboard.js (Based on Mentor's code, Stripe removed, function name updated)

import React, { useEffect, useState, useRef } from 'react';
import './Dashboard.css'; // Make sure this CSS file exists and is styled
import { auth, db, functions, storage } from '../firebase'; // Use YOUR firebase config file path
import { signOut } from 'firebase/auth';
// ** Firestore Imports - Adjusted based on Mentor's likely usage **
// Mentor's code likely uses getDoc for initial load, onSnapshot for updates, updateDoc for adding prompts/answers
import { doc, getDoc, onSnapshot, updateDoc, arrayUnion } from 'firebase/firestore';
// ** Firebase Functions Import **
import { httpsCallable } from 'firebase/functions'; // Use this for on_call functions
import { useNavigate } from 'react-router-dom';
import UserPrompts from './UserPrompts'; // Assuming path is correct

// ** Removed FontAwesome and Storage imports as they were for profile upload **
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import { faUpload } from '@fortawesome/free-solid-svg-icons';
// import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// ** Removed Stripe Imports **
// import { loadStripe } from '@stripe/stripe-js';
// const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

const Dashboard = () => {
  // State based on mentor's code
  const [userProfile, setUserProfile] = useState({ profileImage: '', userEmail: '' });
  // const [quote, setQuote] = useState(null); // Removed quote feature
  const [prompts, setPrompts] = useState([]);
  const [AIResponses, setAIResponses] = useState([]); // Check Firestore field name!
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // ** Removed State/Refs related to profile upload and Stripe **
  // const fileInputRef = useRef(null);
  // const [uploading, setUploading] = useState(false);
  // const [uploadError, setUploadError] = useState(null);
  // const [purchaseButtonText, setPurchaseButtonText] = useState("Purchase");
  // const purchasePrice = "5.00";

  // --- Effect for Auth state and Firestore listener ---
  useEffect(() => {
    // Fetch initial profile data (like mentor's fetchUserProfile)
    // Note: Mentor's code fetches this ONCE, relies on listener after
    const fetchInitialUserProfile = async (userId) => {
      try {
        const userDocRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          // Check if userProfile exists before setting
          if (data.userProfile) {
             setUserProfile(data.userProfile);
          } else {
             console.warn("Firestore doc exists, but userProfile field missing for:", userId);
             // Set default or handle appropriately
             setUserProfile({ profileImage: '', userEmail: 'Email missing in profile' });
          }
          // Set initial prompts/answers if needed, though listener will overwrite
          setPrompts(data.prompts || []);
          setAIResponses(data.AIanswers || []); // Use AIanswers
        } else {
          console.log('User document does not exist yet for:', userId);
          // This might happen if onUserCreate hasn't finished yet
          // setError('User profile not found initially.'); // Maybe don't set error yet
        }
      } catch (err) {
        console.error('Error fetching initial user profile:', err);
        setError('Failed to fetch user profile.');
      } finally {
         setLoading(false); // Stop loading after initial fetch attempt
      }
    };

    // Listener for real-time updates (like mentor's second listener)
    let unsubscribeFirestore = null;
    const setupFirestoreListener = (userId) => {
        const userDocRef = doc(db, 'users', userId);
        console.log(`Setting up Firestore listener for: ${userDocRef.path}`);
        unsubscribeFirestore = onSnapshot(userDocRef, (docSnap) => {
            console.log("Firestore Snapshot Received. Exists:", docSnap.exists());
            if (docSnap.exists()) {
                const data = docSnap.data();
                console.log(" Firestore Data:", data);
                // Update profile state as well from listener if needed
                if (data.userProfile) {
                   setUserProfile(data.userProfile);
                }
                setPrompts(data.prompts || []);
                setAIResponses(data.AIanswers || []); // Ensure this matches Firestore field
                setError(null); // Clear errors if listener works
                 if(loading) setLoading(false); // Ensure loading stops if initial fetch failed but listener worked
            } else {
                console.warn('User document disappeared or does not exist in listener.');
                setPrompts([]);
                setAIResponses([]);
                // Maybe set an error or handle state if doc vanishes
                 if(loading) setLoading(false);
            }
        }, (err) => {
            console.error('Error in Firestore listener:', err);
            setError('Failed to listen for profile updates.');
             if(loading) setLoading(false);
        });
    };

    // Auth state listener
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      // Cleanup previous Firestore listener if user changes/logs out
      if (unsubscribeFirestore) {
        console.log("Cleaning up previous Firestore listener.");
        unsubscribeFirestore();
        unsubscribeFirestore = null;
      }
       // Reset state on auth change
        setUserProfile({ profileImage: '', userEmail: '' });
        setPrompts([]);
        setAIResponses([]);
        setError(null);
        setLoading(true); // Start loading until user data/listener is set up


      if (user) {
        console.log("User is logged in:", user.uid);
        // Fetch initial data first
        fetchInitialUserProfile(user.uid);
        // Then set up the real-time listener
        setupFirestoreListener(user.uid);
        // You could also try reading from user.photoURL / user.email directly
        // setUserProfile({ profileImage: user.photoURL || '', userEmail: user.email || '' });
      } else {
        console.log("User is logged out.");
        setLoading(false); // Stop loading if logged out
        navigate('/signup'); // Redirect to signup/login
      }
    });

    // Cleanup auth listener on component unmount
    return () => {
        console.log("Dashboard unmounting. Cleaning up listeners.");
        unsubscribeAuth();
        if (unsubscribeFirestore) {
           unsubscribeFirestore();
        }
    };
  }, [navigate]); // Dependency array

  // --- Logout Handler (Mentor's version adapted) ---
  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Navigation happens via onAuthStateChanged listener
    } catch (err) {
      console.error('Error signing out:', err);
      setError('Failed to log out.');
    }
  };

  // --- Prompt Submit Handler (Mentor's version adapted) ---
  const handleUserPromptSubmit = async (prompt) => {
    const user = auth.currentUser;
    if (user) {
      setError(null); // Clear previous errors
      const userDocRef = doc(db, 'users', user.uid);
      try {
        // 1. Add the prompt to 'prompts' array in Firestore (Frontend action)
        console.log(`Adding prompt to Firestore: "${prompt}"`);
        await updateDoc(userDocRef, {
          prompts: arrayUnion(prompt),
        });
        console.log("Prompt added successfully.");

        // 2. Call the Python Callable Cloud Function
        console.log("Calling 'generateCompletion' function...");
        // Use the EXACT name of the Python function defined with @https_fn.on_call
        const generateAI = httpsCallable(functions, 'generateCompletion');
        const result = await generateAI({ userPrompt: prompt }); // Pass data payload
        console.log("Cloud function result:", result);

        // 3. Process result - Mentor's code adds the reply to Firestore HERE.
        // BUT our Python function now saves the reply. So this part is redundant IF
        // the Python function successfully saves to 'AIanswers'.
        // The onSnapshot listener should pick up the change made by the Python function.

        // We can check if the function returned the expected data for logging:
        if (result.data && result.data.reply) {
          console.log("Function returned reply:", result.data.reply);
          // No need to updateDoc here again, let the listener handle it.
        } else {
           // This might indicate an issue in the Python function's return value
          console.error('Invalid or missing reply data from Cloud Function:', result.data);
          setError('Received an unexpected response from the AI service.');
        }

      } catch (err) {
        // Handle errors from updateDoc or httpsCallable
        console.error('Error handling user prompt submission:', err);
        // Provide more specific error feedback if possible
        let message = 'Failed to submit prompt or retrieve AI response.';
        if (err.code && err.message) { // Firebase Callable error structure
            message = `Error: ${err.code} - ${err.message}`;
        } else if (err.message) {
            message = err.message;
        }
        setError(message);
      }
    } else {
      setError('User not authenticated.');
    }
  };

  // --- Removed Profile Upload Handlers ---
  // const handleFileChange = async (...) => { ... };
  // const triggerFileInput = () => { ... };

  // --- Removed Purchase Handlers ---
  // const initiatePurchase = async () => { ... };
  // const handlePurchaseClick = () => { ... };


  // --- Render Logic ---
  if (loading) {
    return (
      <div className="dashboard-container">
        <p className="loading">Loading Dashboard...</p>
      </div>
    );
  }

  // Display general errors prominently
  if (error) {
    return (
      <div className="dashboard-container">
        <p className="error-message">Error: {error}</p>
        {/* Optionally add a retry button or suggest logging out/in */}
         <button className="logout-button" onClick={handleLogout}>Logout</button>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Use email from state */}
      <h1 className="dashboard-header">Welcome, {userProfile.userEmail || 'User'}!</h1>

      {/* Profile Section - Simplified, reads from state */}
      <div className="profile-section">
        {userProfile.profileImage ? (
          <img
            src={userProfile.profileImage}
            alt="Profile"
            className="profile-image"
            onError={(e) => { console.error("Error loading profile image:", userProfile.profileImage); e.target.src = ''; /* or placeholder */}} // Handle broken image links
          />
        ) : (
          <div className="profile-placeholder">No Image</div> // Placeholder
        )}
         {/* Removed redundant email span */}
      </div>

      {/* Removed Upload Button/Icon */}
      {/* Removed Purchase Section */}

      {/* UserPrompts component - Passes prompts state and submit handler */}
      <UserPrompts prompts={prompts} onSubmit={handleUserPromptSubmit} />
       {/* Display prompt submission errors locally if needed, though general error state exists */}
       {/* {promptError && <p className="error-message">{promptError}</p>} */}


      {/* Display AI Responses - Reads from state */}
      <div className="ai-responses-section">
        <h2>AI Responses:</h2>
        {AIResponses.length > 0 ? (
          <ul className="ai-responses-list">
            {AIResponses.map((response, index) => (
              <li key={index} className="ai-response-item">
                {response}
              </li>
            ))}
          </ul>
        ) : (
          <p className="no-ai-responses">No AI responses generated yet.</p>
        )}
      </div>

      <button className="logout-button" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
};

export default Dashboard; // Correct default export