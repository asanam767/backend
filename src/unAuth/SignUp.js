import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SignUp.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import { 
  auth, 
  googleProvider, 
  signInWithRedirect,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  getRedirectResult
} from '../firebase';

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Check for redirect result
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          navigate('/dashboard');
        }
      })
      .catch((error) => {
        console.error('Error with redirect sign-in:', error);
        setError('Failed to sign in with Google. Please try again.');
      });

    // Check if user is already logged in
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        navigate('/dashboard');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const actionCodeSettings = {
        url: window.location.origin + '/signup',
        handleCodeInApp: true
      };

      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', email);
      alert('Check your email for the sign-in link!');
    } catch (error) {
      console.error('Error sending sign-in link:', error);
      setError('Failed to send sign-in link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setLoading(true);
    signInWithRedirect(auth, googleProvider)
      .catch((error) => {
        console.error('Error initiating Google sign-in:', error);
        setError('Failed to start Google sign-in. Please try again.');
        setLoading(false);
      });
  };

  // Check if the current URL is a sign-in link
  useEffect(() => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let emailForSignIn = window.localStorage.getItem('emailForSignIn');
      
      if (!emailForSignIn) {
        emailForSignIn = window.prompt('Please provide your email for confirmation');
      }

      if (emailForSignIn) {
        setLoading(true);
        signInWithEmailLink(auth, emailForSignIn, window.location.href)
          .then(() => {
            window.localStorage.removeItem('emailForSignIn');
            navigate('/dashboard');
          })
          .catch((error) => {
            console.error('Error signing in with email link:', error);
            setError('Failed to complete sign-in. Please try again.');
          })
          .finally(() => {
            setLoading(false);
          });
      }
    }
  }, [navigate]);

  return (
    <div className="signup-container">
      <div className="signup-card">
        <h2 className="signup-header">Welcome to Messagly</h2>
        {error && <p className="signup-error">{error}</p>}
        <form className="signup-form" onSubmit={handleEmailSignIn}>
          <input
            type="email"
            placeholder="Enter your email"
            className="signup-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />
          <button type="submit" className="signup-button" disabled={loading}>
            {loading ? 'Please wait...' : 'Continue with Email'}
          </button>
        </form>
        <div className="signup-divider">
          <span className="signup-line"></span>
          <span className="signup-or">OR</span>
          <span className="signup-line"></span>
        </div>
        <div className="signup-google-container">
          <button 
            className="signup-google-button" 
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <FontAwesomeIcon icon={faGoogle} className="signup-google-icon" />
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignUp; 