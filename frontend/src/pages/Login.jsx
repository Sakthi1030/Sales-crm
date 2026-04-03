/**
 * pages/Login.jsx — Sign-in screen with role selector
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, FormField, inputStyle, Spinner } from '../components/ui';

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [email,    setEmail]    = useState('admin@nexuscrm.io');
  const [password, setPassword] = useState('admin123');
  const [role,     setRole]     = useState('admin');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const prefill = (r) => {
    setRole(r);
    if (r === 'admin') { setEmail('admin@nexuscrm.io'); setPassword('admin123'); }
    else               { setEmail('sarah@nexuscrm.io'); setPassword('password123'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#0f1117',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'DM Sans', sans-serif", color: '#f0f2f8',
    }}>
      <div style={{
        background: '#161b27', border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 18, padding: 40, width: 390, maxWidth: '95vw',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 28 }}>
          <div style={{ width: 40, height: 40, background: '#4f7ef8', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#fff' }}>N</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>Nexus CRM</div>
        </div>

        <div style={{ fontSize: 22, fontWeight: 600, textAlign: 'center', marginBottom: 6 }}>Welcome back</div>
        <div style={{ fontSize: 13, color: '#5a6378', textAlign: 'center', marginBottom: 28 }}>Sign in to your workspace</div>

        <form onSubmit={handleSubmit}>
          <FormField label="Email">
            <input
              style={inputStyle} type="email" value={email}
              onChange={e => setEmail(e.target.value)} required
            />
          </FormField>
          <FormField label="Password">
            <input
              style={inputStyle} type="password" value={password}
              onChange={e => setPassword(e.target.value)} required
            />
          </FormField>

          {/* Role selector */}
          <div style={{ marginBottom: 24 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0',
            }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
              <span style={{ fontSize: 11, color: '#5a6378' }}>Sign in as</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { id: 'admin', icon: '🛡️', label: 'Admin',     desc: 'Full access' },
                { id: 'rep',   icon: '💼', label: 'Sales Rep', desc: 'Limited access' },
              ].map(r => (
                <div
                  key={r.id}
                  onClick={() => prefill(r.id)}
                  style={{
                    padding: 14, border: `1.5px solid ${role === r.id ? '#4f7ef8' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: 10, cursor: 'pointer', textAlign: 'center',
                    background: role === r.id ? 'rgba(79,126,248,0.12)' : 'transparent',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontSize: 20, marginBottom: 6 }}>{r.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{r.label}</div>
                  <div style={{ fontSize: 11, color: '#5a6378', marginTop: 2 }}>{r.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.12)', color: '#ef4444',
              borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16,
            }}>{error}</div>
          )}

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: 11, background: '#4f7ef8', color: '#fff',
            border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            {loading ? <><Spinner size={16} /> Signing in…</> : 'Sign In →'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: '#5a6378' }}>
          Demo credentials are pre-filled above
        </div>
      </div>
    </div>
  );
}
