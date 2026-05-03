import React, { useState } from 'react';
import { Building2, Mail, Lock, User, Eye, EyeOff, ArrowRight, Loader } from 'lucide-react';
import { api } from '../utils/api';
import { authStore } from '../utils/auth';
import { toast } from '../utils/toast';

export default function AuthPage({ onAuth }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const update = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = mode === 'login'
        ? await api.login({ email: form.email, password: form.password })
        : await api.signup({ name: form.name, email: form.email, password: form.password });
      authStore.setToken(data.token);
      authStore.setUser(data.user);
      toast.success(mode === 'login' ? `Welcome back, ${data.user.name}!` : `Account created! Welcome, ${data.user.name}!`);
      onAuth(data.user);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)',
      padding: '1.5rem',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'fixed', top: '-20%', left: '-10%', width: '60vw', height: '60vw',
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed', bottom: '-20%', right: '-10%', width: '50vw', height: '50vw',
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        width: '100%', maxWidth: '420px',
        background: 'var(--surface)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '20px',
        padding: '2.5rem 2rem',
        boxShadow: '0 30px 80px rgba(0,0,0,0.4)',
        position: 'relative',
        animation: 'modalIn 0.3s ease',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '3.5rem', height: '3.5rem', borderRadius: '14px',
            background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
            boxShadow: '0 8px 24px rgba(99,102,241,0.35)',
          }}>
            <Building2 size={22} color="#fff" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            Rent<span style={{ color: 'var(--primary-light)' }}>Master</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.35rem' }}>
            {mode === 'login' ? 'Sign in to your account' : 'Create a free account'}
          </p>
        </div>

        {/* Tab Toggle */}
        <div style={{
          display: 'flex', gap: '0.5rem', marginBottom: '1.75rem',
          background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '0.3rem',
        }}>
          {['login', 'signup'].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1, padding: '0.6rem', borderRadius: '9px', border: 'none',
              cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: '0.9rem',
              transition: 'all 0.2s',
              background: mode === m ? 'var(--primary)' : 'transparent',
              color: mode === m ? '#fff' : 'var(--text-muted)',
              boxShadow: mode === m ? '0 4px 12px rgba(99,102,241,0.3)' : 'none',
            }}>
              {m === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {mode === 'signup' && (
            <Field icon={<User size={16} />} placeholder="Full Name" value={form.name}
              onChange={update('name')} required />
          )}
          <Field icon={<Mail size={16} />} placeholder="Email Address" type="email"
            value={form.email} onChange={update('email')} required />
          <div style={{ position: 'relative' }}>
            <Field icon={<Lock size={16} />} placeholder="Password (min 6 chars)"
              type={showPwd ? 'text' : 'password'} value={form.password}
              onChange={update('password')} required />
            <button type="button" onClick={() => setShowPwd(v => !v)} style={{
              position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', padding: '0.25rem',
            }}>
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <button type="submit" disabled={loading} style={{
            marginTop: '0.5rem', padding: '0.85rem', borderRadius: '12px', border: 'none',
            background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
            color: '#fff', fontFamily: 'inherit', fontWeight: 700, fontSize: '1rem',
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            boxShadow: '0 6px 20px rgba(99,102,241,0.35)',
            transition: 'all 0.2s',
          }}>
            {loading
              ? <><Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Please wait...</>
              : <>{mode === 'login' ? 'Sign In' : 'Create Account'} <ArrowRight size={18} /></>
            }
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} style={{
            background: 'none', border: 'none', color: 'var(--primary-light)',
            fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem',
          }}>
            {mode === 'login' ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function Field({ icon, ...props }) {
  return (
    <div style={{ position: 'relative' }}>
      <span style={{
        position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)',
        color: 'var(--text-muted)', pointerEvents: 'none',
      }}>{icon}</span>
      <input {...props} style={{
        width: '100%', padding: '0.8rem 0.9rem 0.8rem 2.4rem',
        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '10px', color: 'var(--text-primary)', fontFamily: 'inherit',
        fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', transition: 'border 0.2s',
      }}
        onFocus={e => e.target.style.borderColor = 'var(--primary)'}
        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
      />
    </div>
  );
}
