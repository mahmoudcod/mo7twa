'use client';
import { useState } from 'react';
import axios from 'axios';
import Link from 'next/link';

export default function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    country: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await axios.post('http://ub.mo7tawa.store/api/auth/register', formData); // Update the URL if necessary
      setSuccess(response.data.message); // Display success message from the API
    } catch (err) {
      setError(err.response?.data?.message || 'Error registering user');
    }
  };

  return (
    <div className="signup-container">
      <h2>Create New Account</h2>
      <form onSubmit={handleSubmit}>
        {/* Email Field */}
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={formData.email}
            onChange={handleChange}
          />
        </div>

        {/* Phone Field */}
        <div className="form-group">
          <label htmlFor="phone">Phone Number</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            required
            value={formData.phone}
            onChange={handleChange}
          />
        </div>

        {/* Country Field */}
        <div className="form-group">
          <label htmlFor="country">Country</label>
          <input
            id="country"
            name="country"
            type="text"
            autoComplete="country"
            required
            value={formData.country}
            onChange={handleChange}
          />
        </div>

        {/* Password Field */}
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <div className="password-input">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={formData.password}
              onChange={handleChange}
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <button type="submit" className="submit-button">Sign Up</button>

        {/* Error and Success Messages */}
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}
      </form>

      <p className="login-link">
        Already have an account? <Link href="/auth/login">Log in</Link>
      </p>

      {/* Styles (unchanged) */}
      <style jsx>{`
   .signup-container {
          max-width: 400px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f9f9f9;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        h2 {
          text-align: center;
          color: #333;
          margin-bottom: 20px;
        }

        .form-group {
          margin-bottom: 15px;
        }

        label {
          display: block;
          margin-bottom: 5px;
          color: #666;
        }

        input {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 16px;
        }

        .password-input {
          position: relative;
        }

        .toggle-password {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #666;
          cursor: pointer;
        }

        .submit-button {
          width: 100%;
          padding: 10px;
          background-color: #4a90e2;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 16px;
          cursor: pointer;
          transition: background-color 0.3s;
        }

        .submit-button:hover {
          background-color: #357abd;
        }

        .login-link {
          text-align: center;
          margin-top: 15px;
        }

        .login-link a {
          color: #4a90e2;
          text-decoration: none;
        }

        .login-link a:hover {
          text-decoration: underline;
        }
                .error-message {
                    color: red;
                    text-align: center;
                }

                .success-message {
                    color: green;
                    text-align: center;
                }
            `}</style>
    </div>
  );
}
