import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SignPage.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import { auth, googleProvider, signInWithRedirect, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, getRedirectResult } from '../firebase';

const SignPage = () => {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Check for redirect result
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          navigate('/dashboard');
        }
      })
      .catch((error) => {
        console.error("Error with redirect sign-in", error);
      });

    // Check if the user is signing in with an email link
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let email = window.localStorage.getItem('emailForSignIn');
      if (!email) {
        email = window.prompt('Please provide your email for confirmation');
      }
      signInWithEmailLink(auth, email, window.location.href)
        .then(() => {
          window.localStorage.removeItem('emailForSignIn');
          navigate('/dashboard');
        })
        .catch((error) => {
          console.error("Error signing in with email link", error);
        });
    }
  }, [navigate]);

  const handleEmailSignIn = (e) => {
    e.preventDefault();
    const actionCodeSettings = {
      url: window.location.origin + '/signup',
      handleCodeInApp: true,
    };

    sendSignInLinkToEmail(auth, email, actionCodeSettings)
      .then(() => {
        window.localStorage.setItem('emailForSignIn', email);
        alert('Check your email for the sign-in link!');
      })
      .catch((error) => {
        console.error("Error sending sign-in link to email", error);
      });
  };

  const handleGoogleSignIn = () => {
    signInWithRedirect(auth, googleProvider)
      .catch((error) => {
        console.error("Error initiating Google sign-in", error);
      });
  };

  return (
    <div className="sign-container">
      <div className="sign-card">
        <h2 className="sign-header">Let's get started!</h2>
        <form className="sign-form" onSubmit={handleEmailSignIn}>
          <input
            type="email"
            placeholder="Enter your email"
            className="sign-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" className="sign-button">
            Sign in with Email
          </button>
        </form>
        <div className="sign-divider">
          <span className="sign-line"></span>
          <span className="sign-or">OR</span>
          <span className="sign-line"></span>
        </div>
        <div className="sign-google-container">
          <button className="sign-google-button" onClick={handleGoogleSignIn}>
            <FontAwesomeIcon icon={faGoogle} className="sign-google-icon" />
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignPage;