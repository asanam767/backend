import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// Make sure this path matches your file structure exactly
import HomePage from './unAuth/HomePage';
import './App.css';

function App() {
  return (
 
      <div className="App"> {/* Adding a wrapper div for safety */}
        
          <HomePage />
    
      </div>
    
  );
}

export default App;