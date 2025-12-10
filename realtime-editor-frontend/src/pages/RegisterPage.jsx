import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setError('');
    try {
      await register(username, email, password);
      navigate('/'); 
    } catch (err) {
      setError(err);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card">
        <h2 className="auth-title">Create an Account</h2>
        <p className="auth-subtitle">Join the platform to start building your documents.</p>
        
        {error && <p className="error-message">{error}</p>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          
          <div className="input-group">
            <label htmlFor="username">Username</label>
            <input 
              id="username"
              type="text" 
              placeholder="Display Name" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              required 
            />
          </div>

          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <input 
              id="email"
              type="email" 
              placeholder="user@example.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input 
              id="password"
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          
          {/* Use the same primary button class */}
          <button type="submit" className="primary-button">Register</button>
        </form>
        
        <p className="auth-link">
          Already have an account? <Link to="/login">Log in here</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;