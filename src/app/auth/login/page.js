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
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        'https://ub.mo7tawa.store/api/auth/login',
        formData
      );
      const { token, user } = response.data;

      // Save token and user data in localStorage or cookies
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      router.push('/');
    } catch (error) {
      setErrorMessage(
        error.response ? error.response.data.message : 'Login failed'
      );
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

        <button type="submit" className="submit-button">
          Log In
        </button>
      </form>
      <p className="register-link">
        Don&apos;t have an account? <Link href="/auth/register">Sign up</Link>
      </p>

      <style jsx>{`
        .login-container {
          max-width: 400px;
          margin: 40px auto;
          padding: 32px;
          background-color: white;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }

        h2 {
          text-align: center;
          color: #1a1a1a;
          margin-bottom: 32px;
          font-size: 28px;
          font-weight: 600;
        }

        .form-group {
          margin-bottom: 24px;
        }

        label {
          display: block;
          margin-bottom: 8px;
          color: #4a4a4a;
          font-weight: 500;
          font-size: 14px;
        }

        input {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e8e8e8;
          border-radius: 8px;
          font-size: 16px;
          transition: all 0.3s ease;
          background-color: #fafafa;
        }

        input:focus {
          outline: none;
          border-color: #4a90e2;
          background-color: white;
          box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
        }

        .submit-button {
          width: 100%;
          padding: 14px;
          background-color: #4a90e2;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 8px;
        }

        .submit-button:hover {
          background-color: #357abd;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(74, 144, 226, 0.2);
        }

        .submit-button:active {
          transform: translateY(0);
          box-shadow: none;
        }

        .register-link {
          text-align: center;
          margin-top: 24px;
          color: #666;
          font-size: 14px;
        }

        .register-link a {
          color: #4a90e2;
          text-decoration: none;
          font-weight: 500;
          margin-left: 4px;
        }

        .register-link a:hover {
          text-decoration: underline;
        }

        .error {
          color: #e53935;
          background-color: #ffebee;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 24px;
          text-align: center;
          font-size: 14px;
          border: 1px solid rgba(229, 57, 53, 0.2);
        }
      `}</style>
    </div>
  );
}
