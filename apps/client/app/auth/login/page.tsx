'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE } from '../../lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.detail || 'Login failed');
        return;
      }

      router.push('/');
    } catch {
      setError('Connection failed');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: 'white',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#07080e',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '360px',
        padding: '32px',
        borderRadius: '16px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.09)',
      }}>
        <h1 style={{
          fontSize: '18px',
          fontWeight: 600,
          color: 'rgba(255,255,255,0.85)',
          marginBottom: '24px',
        }}>Sign in</h1>

        {error && (
          <div style={{
            padding: '10px 14px',
            borderRadius: '8px',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.15)',
            color: 'rgba(248,113,113,0.9)',
            fontSize: '13px',
            marginBottom: '16px',
          }}>{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', marginBottom: '14px' }}>
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '6px' }}>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
            />
          </label>

          <label style={{ display: 'block', marginBottom: '22px' }}>
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '6px' }}>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              background: 'rgba(99,102,241,0.7)',
              border: 'none',
              color: 'white',
              fontSize: '14px',
              fontWeight: 500,
              cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = 'rgba(99,102,241,0.85)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(99,102,241,0.7)'; }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p style={{ marginTop: '18px', fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>
          No account?{' '}
          <a href="/auth/register" style={{ color: 'rgba(129,140,248,0.8)', textDecoration: 'none' }}>Register</a>
        </p>
      </div>
    </div>
  );
}
