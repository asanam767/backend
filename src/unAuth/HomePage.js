// src/unAuth/HomePage.js (Placeholder - Replace with your actual code)
import React from 'react';
import { Link } from 'react-router-dom'; // Example import

const HomePage = () => {
  return (
    <div>
      <h1>Welcome to the App!</h1>
      <p>Please sign up or log in.</p>
      <Link to="/signup">Go to Sign Up</Link>
      {/* Add login link if you have a separate login page */}
    </div>
  );
};

export default HomePage; // <--- Make sure this line exists and is default!