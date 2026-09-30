import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">⚡</div>
          <h1>Newtonite Operations</h1>
          <p className="login-subtitle">Operational Work Management</p>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div className="demo-accounts">
          <p className="demo-title">Demo Accounts (password: password123)</p>
          <div className="demo-list">
            <button className="demo-btn" onClick={() => { setEmail('admin@newtonite.com'); setPassword('password123'); }}>
              <span className="demo-role admin">Admin</span> admin@newtonite.com
            </button>
            <button className="demo-btn" onClick={() => { setEmail('sarah.chen@newtonite.com'); setPassword('password123'); }}>
              <span className="demo-role lead">Lead</span> sarah.chen@newtonite.com
            </button>
            <button className="demo-btn" onClick={() => { setEmail('alice.williams@newtonite.com'); setPassword('password123'); }}>
              <span className="demo-role member">Member</span> alice.williams@newtonite.com
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
