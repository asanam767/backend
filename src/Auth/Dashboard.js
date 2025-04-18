// src/components/Dashboard.js

import React, { useEffect, useState, useRef } from 'react';
import './Dashboard.css';
import { auth, db, functions, storage } from '../firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload } from '@fortawesome/free-solid-svg-icons';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// STRIPE - Only import if STRIPE_PUBLIC_KEY is available
const stripePromise = process.env.REACT_APP_STRIPE_PUBLIC_KEY 
  ? import('@stripe/stripe-js').then(module => module.loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY))
  : null;

const Dashboard = () => {
  const [userProfile, setUserProfile] = useState({
    profileImage: '',
    userEmail: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [purchaseButtonText, setPurchaseButtonText] = useState("Purchase");
  const purchasePrice = "5.00";

  useEffect(() => {
    const initializeUserProfile = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          navigate('/signup');
          return;
        }

        // Initialize basic profile
        setUserProfile(prev => ({
          ...prev,
          userEmail: user.email || '',
        }));

        // Get or create user document
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          // Create new user profile
          const newUserProfile = {
            userProfile: {
              profileImage: '',
              userEmail: user.email || '',
              createdAt: new Date().toISOString(),
            }
          };

          await setDoc(userDocRef, newUserProfile);
          setUserProfile(newUserProfile.userProfile);
        } else {
          // Update existing profile
          const data = userDoc.data();
          setUserProfile(prev => ({
            ...prev,
            ...data.userProfile,
          }));
        }
      } catch (err) {
        console.error('Error initializing user profile:', err);
        setError('Failed to initialize user profile. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };

    initializeUserProfile();
  }, [navigate]);

  const handleFileUpload = async (file) => {
    if (!file) return;
    
    setUploading(true);
    setUploadError(null);

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No authenticated user found');
      }

      const storageRef = ref(storage, `profile_pictures/${user.uid}/${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        'userProfile.profileImage': downloadUrl,
      });

      setUserProfile(prev => ({
        ...prev,
        profileImage: downloadUrl,
      }));
    } catch (err) {
      console.error('Error uploading file:', err);
      setUploadError('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/signup');
    } catch (err) {
      console.error('Error signing out:', err);
      setError('Failed to log out. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">
          <p className="loading">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button onClick={() => window.location.reload()} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-header">Welcome to Your Dashboard</h1>
      
      <div className="profile-section">
        {userProfile.profileImage ? (
          <img
            src={userProfile.profileImage}
            alt="Profile"
            className="profile-image"
          />
        ) : (
          <div className="profile-placeholder">No Image</div>
        )}
        <span className="user-email">{userProfile.userEmail}</span>

        <div className="upload-section">
          <FontAwesomeIcon 
            icon={faUpload} 
            className="upload-icon" 
            onClick={() => fileInputRef.current?.click()} 
            title="Upload Profile Image" 
          />
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleFileUpload(file);
              }
            }}
          />
          {uploading && <p className="uploading">Uploading...</p>}
          {uploadError && <p className="upload-error">{uploadError}</p>}
        </div>
      </div>

      {stripePromise && (
        <div className="purchase-section">
          <h2>Purchase Messagly Credits</h2>
          <p>Get Messagly credits for your account.</p>
          <button 
            className="purchase-button" 
            onClick={async () => {
              setPurchaseButtonText("Processing...");
              try {
                const createSession = httpsCallable(functions, 'startPaymentSession');
                const { data: { sessionId } } = await createSession({
                  plan: 'Messagly',
                  gclid: localStorage.getItem('gclid') || '',
                });
                
                const stripe = await stripePromise;
                const { error } = await stripe.redirectToCheckout({ sessionId });
                
                if (error) {
                  console.error('Stripe redirect error:', error);
                  setPurchaseButtonText("Retry");
                }
              } catch (err) {
                console.error('Purchase error:', err);
                setPurchaseButtonText("Retry");
              }
            }}
          >
            {purchaseButtonText}
          </button>
          <p className="purchase-price">${purchasePrice} USD</p>
        </div>
      )}

      <button className="logout-button" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
};

export default Dashboard;