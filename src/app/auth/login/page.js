'use client'
import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter(); // To navigate after login

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8000/api/auth/login', formData); // Replace with your actual API URL
      const { token, user } = response.data;

      // Save token in localStorage or cookies
      localStorage.setItem('token', token);

      // Redirect to a dashboard or home page after successful login
      router.push('/');
    } catch (error) {
      setErrorMessage(error.response ? error.response.data.message : 'Login failed');
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      {errorMessage && <p className="error">{errorMessage}</p>}
      <form onSubmit={handleSubmit}>
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

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={formData.password}
            onChange={handleChange}
          />
        </div>

        <button type="submit" className="submit-button">Log In</button>
      </form>

      <p className="register-link">
        Don't have an account? <Link href="/auth/register">Sign up</Link>
      </p>

      <style jsx>{`
        .login-container {
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

        .register-link {
          text-align: center;
          margin-top: 15px;
        }

        .register-link a {
          color: #4a90e2;
          text-decoration: none;
        }

        .register-link a:hover {
          text-decoration: underline;
        }

        .error {
          color: red;
          margin-bottom: 15px;
          text-align: center;
        }
      `}</style>
    </div>
  );
}
