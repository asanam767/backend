// src/Auth/UserPrompts.js
import React, { useState } from 'react';
import './UserPrompts.css'; // Make sure this CSS file exists

const UserPrompts = ({ prompts, onSubmit }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() !== '') {
      onSubmit(input.trim()); // Call the function passed from Dashboard
      setInput(''); // Clear input after submit
    }
  };

  return (
    <div className="user-prompts-container">
      <form onSubmit={handleSubmit} className="user-prompts-form">
        <input
          type="text"
          placeholder="What do you wanna know?"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="user-prompts-input"
        />
        <button type="submit" className="user-prompts-button">
          Submit
        </button>
      </form>

      {/* Output Box for Displaying Prompts */}
      <div className="prompts-output">
        <h2>Your Prompts:</h2>
        {prompts.length > 0 ? (
          <ul className="prompts-list">
            {prompts.map((prompt, index) => (
              <li key={index} className="prompt-item">
                {prompt}
              </li>
            ))}
          </ul>
        ) : (
          <p className="no-prompts">No prompts submitted yet.</p>
        )}
      </div>
    </div>
  );
};

export default UserPrompts; // Default export