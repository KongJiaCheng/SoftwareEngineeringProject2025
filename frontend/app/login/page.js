"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  const router = useRouter();

  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 3000);
  };

  // redirect away from login if already logged in
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('token');
    const userStr = sessionStorage.getItem('user');

    if (token && userStr) {
      // both token and user exist – safe to go to main
      router.replace('/main');
      return;
    }

    if (token && !userStr) {
      // stale token from old session – clear it so no redirect loop
      localStorage.removeItem('token');
    }

    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
    };

    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [router]);


  const handleLogin = async (e) => {
    e?.preventDefault();
    
    if (!username || !password) {
      showToast('Please fill in all fields', 'warning');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ username, password }),
      });

      console.log('Response status:', res.status);

      if (!res.ok) {
        // Handle HTTP errors
        if (res.status === 404) {
          showToast('API endpoint not found. Please check the server.', 'error');
          return;
        }
        
        const errorData = await res.json().catch(() => ({}));
        showToast(errorData.error || `Login failed (${res.status})`, 'error');
        return;
      }

      const data = await res.json();
      console.log('Login response:', data);
      
      if (data.success) {
        // Store user info
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('user', JSON.stringify(data.user));
          localStorage.setItem('token', 'logged-in');
          if (rememberMe) {
            localStorage.setItem('rememberedUser', username);
          } else {
            localStorage.removeItem('rememberedUser');
          }
        }
        
        showToast(`Welcome ${data.user.username}! Redirecting...`, 'success');
        
        setTimeout(() => {
          // Redirect to MAIN PAGE
          router.replace('/main');
        }, 1500);
      } else {
        showToast(data.error || 'Login failed', 'error');
      }
      
    } catch (err) {
      console.error('Network error:', err);
      showToast('Network error. Please check your connection and try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Enter key press
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Enter' && !isLoading) {
        handleLogin();
      }
    };

    document.addEventListener('keypress', handleKeyPress);
    return () => document.removeEventListener('keypress', handleKeyPress);
  }, [isLoading, username, password]);

  // Check for remembered user
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const rememberedUser = localStorage.getItem('rememberedUser');
      if (rememberedUser) {
        setUsername(rememberedUser);
        setRememberMe(true);
      }
    }
  }, []);

  return (
    <div className="login-container">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}

      <div className="login-card">
        <div className="login-header">
          <div className="logo">
            <svg width="50" height="50" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" stroke="#667eea" strokeWidth="2"/>
              <path d="M12 12L15 15L12 18L9 15L12 12Z" fill="#667eea"/>
              <circle cx="12" cy="9" r="2" fill="#667eea"/>
            </svg>
          </div>
          <h1>Welcome Back</h1>
          <p>Sign in to your account to continue</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>

          <div className="remember-group">
            <input
              id="rememberMe"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={isLoading}
            />
            <label htmlFor="rememberMe">Remember me</label>
          </div>

          <button
            type="submit"
            className={`login-button ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>

      <style jsx>{`
        .login-container {
          margin: 0;
          padding: 0;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .login-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          padding: 40px;
          border-radius: 20px;
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
          width: 100%;
          max-width: 420px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          position: relative;
        }

        .login-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .logo {
          margin: 0 auto 15px;
        }

        .login-header h1 {
          color: #333;
          margin: 0 0 8px 0;
          font-size: 28px;
          font-weight: 600;
        }

        .login-header p {
          color: #666;
          margin: 0;
          font-size: 14px;
        }

        .login-form {
          display: flex;
          flex-direction: column;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          color: #333;
          font-weight: 500;
          font-size: 14px;
        }

        .form-group input {
          width: 100%;
          padding: 15px;
          border: 2px solid #e1e5e9;
          border-radius: 10px;
          font-size: 16px;
          transition: all 0.3s ease;
          box-sizing: border-box;
        }

        .form-group input:focus {
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
          outline: none;
        }

        .form-group input:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .remember-group {
          display: flex;
          align-items: center;
          margin-bottom: 25px;
        }

        .remember-group input {
          margin-right: 8px;
        }

        .remember-group label {
          color: #666;
          font-size: 14px;
          cursor: pointer;
          margin: 0;
        }

        .login-button {
          width: 100%;
          padding: 16px;
          background-color: #667eea;
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-bottom: 0;
        }

        .login-button:hover:not(:disabled) {
          background-color: #5a6fd8;
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
        }

        .login-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        /* Toast Styles */
        .toast {
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          padding: 12px 24px;
          border-radius: 8px;
          z-index: 9999;
          font-weight: 500;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
          color: white;
          animation: toastSlideIn 0.3s ease;
        }

        .toast-success {
          background: #4CAF50;
        }

        .toast-error {
          background: #f44336;
        }

        .toast-warning {
          background: #ff9800;
        }

        .toast-info {
          background: #2196F3;
        }

        @keyframes toastSlideIn {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        @media (max-width: 480px) {
          .login-card {
            padding: 30px 20px;
          }
          
          .login-header h1 {
            font-size: 24px;
          }
        }
      `}</style>
    </div>
  );
}
