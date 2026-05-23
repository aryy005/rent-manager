import React, { useState, useRef } from 'react';
import {
  Building2, Mail, Lock, User, Eye, EyeOff, ArrowRight, Loader,
  Home, BarChart3, FileText, Shield, Zap, CheckCircle2,
  IndianRupee, Users, MessageSquare, Bell,
} from 'lucide-react';
import { api } from '../utils/api';
import { authStore } from '../utils/auth';
import { toast } from '../utils/toast';

const FEATURES = [
  { icon: <Home size={20} />,          title: 'Room Management',  desc: 'Track rooms, tenants & occupancy in one place.' },
  { icon: <IndianRupee size={20} />,   title: 'Rent Collection',  desc: 'Record payments, dues & generate receipts instantly.' },
  { icon: <BarChart3 size={20} />,     title: 'Smart Analytics',  desc: 'Monthly income charts & occupancy stats.' },
  { icon: <FileText size={20} />,      title: 'Export Reports',   desc: 'Download PDF & Excel reports in one tap.' },
  { icon: <MessageSquare size={20} />, title: 'WhatsApp Alerts',  desc: 'Send rent reminders directly via WhatsApp.' },
  { icon: <Shield size={20} />,        title: 'Secure & Private', desc: 'End-to-end encrypted. Your data, only yours.' },
];

const PERKS = [
  { icon: <CheckCircle2 size={15} />, text: 'Free forever' },
  { icon: <Bell size={15} />,          text: 'Rent reminders' },
  { icon: <Shield size={15} />,        text: 'Data encrypted' },
  { icon: <Zap size={15} />,           text: '2-min setup' },
];

/* ── Touch-friendly input field ── */
function Field({ icon, label, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="ap-field-wrap">
      {label && <label className="ap-field-label">{label}</label>}
      <div style={{ position: 'relative' }}>
        <span className={`ap-field-icon ${focused ? 'focused' : ''}`}>{icon}</span>
        <input
          {...props}
          className={`ap-field-input ${focused ? 'focused' : ''}`}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </div>
    </div>
  );
}

export default function AuthPage({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const formRef = useRef(null);

  const update = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const scrollToForm = () => {
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  const switchMode = (m) => {
    setMode(m);
    scrollToForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = mode === 'login'
        ? await api.login({ email: form.email, password: form.password })
        : await api.signup({ name: form.name, email: form.email, password: form.password });
      authStore.setToken(data.token);
      authStore.setUser(data.user);
      toast.success(
        mode === 'login'
          ? `Welcome back, ${data.user.name}!`
          : `Account created! Welcome, ${data.user.name}!`
      );
      onAuth(data.user);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ap-root">

      {/* ═══════════════════════════════
           HERO  (Villa + topbar)
          ═══════════════════════════════ */}
      <div className="ap-hero">
        <div className="ap-villa" />
        <div className="ap-overlay" />

        {/* ── Top bar ── */}
        <div className="ap-topbar">
          <div className="ap-brand">
            <div className="ap-brand-icon"><Building2 size={18} color="#fff" /></div>
            <span className="ap-brand-name">Rent<span className="ap-brand-gold">Master</span></span>
          </div>

          {/* Sign In | Sign Up pill — centred */}
          <div className="ap-auth-pill">
            <button
              id="btn-signin"
              className={`ap-pill-btn ${mode === 'login' ? 'ap-pill-active' : ''}`}
              onClick={() => switchMode('login')}
            >
              Sign In
            </button>
            <button
              id="btn-signup"
              className={`ap-pill-btn ${mode === 'signup' ? 'ap-pill-active' : ''}`}
              onClick={() => switchMode('signup')}
            >
              Sign Up
            </button>
          </div>

          {/* Spacer mirrors brand */}
          <div className="ap-brand ap-brand-ghost" aria-hidden />
        </div>

        {/* ── Hero text ── */}
        <div className="ap-hero-body">
          <h1 className="ap-hero-title">
            Manage Rentals<br />
            <span className="ap-hero-accent">Like a Pro</span>
          </h1>
          <p className="ap-hero-sub">
            Rooms · Rent · Receipts · Reports — all in one app.
          </p>
          <div className="ap-stat-row">
            {[
              { icon: <Home size={13} />,  v: '500+', l: 'Rooms' },
              { icon: <Users size={13} />, v: '200+', l: 'Landlords' },
              { icon: <Zap size={13} />,   v: 'Free',  l: 'Forever' },
            ].map((s, i) => (
              <span key={i} className="ap-stat-chip">
                <span className="ap-stat-chip-icon">{s.icon}</span>
                <b>{s.v}</b> {s.l}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════
           FEATURE SCROLL STRIP
          ═══════════════════════════════ */}
      <div className="ap-feat-strip">
        <p className="ap-feat-label">Everything you need</p>
        <div className="ap-feat-scroll">
          {FEATURES.map((f, i) => (
            <div key={i} className="ap-feat-card">
              <div className="ap-feat-icon">{f.icon}</div>
              <div className="ap-feat-title">{f.title}</div>
              <div className="ap-feat-desc">{f.desc}</div>
            </div>
          ))}
        </div>
        {/* Scroll hint fade */}
        <div className="ap-feat-fade" />
      </div>

      {/* ═══════════════════════════════
           AUTH FORM
          ═══════════════════════════════ */}
      <div className="ap-form-outer" ref={formRef} id="ap-form-section">
        <div className="ap-form-card">
          {/* Gradient bar */}
          <div className="ap-form-bar" />

          {/* Card header */}
          <div className="ap-form-head">
            <div className="ap-form-head-icon">
              <Building2 size={19} color="#d97706" />
            </div>
            <h2 className="ap-form-title">
              {mode === 'login' ? 'Welcome back 👋' : 'Get started ✨'}
            </h2>
            <p className="ap-form-sub">
              {mode === 'login'
                ? 'Sign in to manage your properties'
                : 'Create your free account in seconds'}
            </p>
          </div>

          {/* Mode tabs */}
          <div className="ap-tabs">
            <button
              id="tab-login"
              className={`ap-tab ${mode === 'login' ? 'ap-tab-active' : ''}`}
              onClick={() => setMode('login')}
            >
              🔑&nbsp; Sign In
            </button>
            <button
              id="tab-signup"
              className={`ap-tab ${mode === 'signup' ? 'ap-tab-active' : ''}`}
              onClick={() => setMode('signup')}
            >
              ✍️&nbsp; Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="ap-form">
            {mode === 'signup' && (
              <Field
                icon={<User size={17} />}
                label="Full Name"
                placeholder="e.g. Aryan Malik"
                value={form.name}
                onChange={update('name')}
                autoComplete="name"
                required
              />
            )}
            <Field
              icon={<Mail size={17} />}
              label="Email Address"
              placeholder="you@email.com"
              type="email"
              value={form.email}
              onChange={update('email')}
              autoComplete="email"
              inputMode="email"
              required
            />
            <div className="ap-field-wrap">
              <label className="ap-field-label">Password</label>
              <div style={{ position: 'relative' }}>
                <span className="ap-field-icon"><Lock size={17} /></span>
                <input
                  placeholder="Min 6 characters"
                  type={showPwd ? 'text' : 'password'}
                  value={form.password}
                  onChange={update('password')}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  required
                  className="ap-field-input"
                  style={{ paddingRight: '3rem' }}
                />
                <button
                  type="button"
                  className="ap-pwd-toggle"
                  onClick={() => setShowPwd(v => !v)}
                  aria-label={showPwd ? 'Hide password' : 'Show password'}
                >
                  {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              id="btn-submit"
              disabled={loading}
              className="ap-submit"
            >
              {loading
                ? <><Loader size={19} className="spin" /> Please wait…</>
                : <>{mode === 'login' ? 'Sign In' : 'Create Account'} <ArrowRight size={19} /></>
              }
            </button>
          </form>

          {/* Switch */}
          <p className="ap-switch">
            {mode === 'login' ? "Don't have an account? " : 'Already registered? '}
            <button
              className="ap-switch-btn"
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            >
              {mode === 'login' ? 'Sign Up free →' : '← Sign In'}
            </button>
          </p>

          {/* Perks grid */}
          <div className="ap-perks">
            {PERKS.map((p, i) => (
              <div key={i} className="ap-perk">
                <span className="ap-perk-icon">{p.icon}</span>
                <span>{p.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="ap-footer">
        © 2025 RentMaster &nbsp;·&nbsp; Made for Indian Landlords ❤️
      </footer>

      {/* ══════════════════════════════════
           ALL STYLES  (mobile-first)
          ══════════════════════════════════ */}
      <style>{`
        /* ── Reset & root ── */
        .ap-root {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #faf7f2;
          font-family: 'Outfit', sans-serif;
          overflow-x: hidden;
        }

        /* ════════ HERO ════════ */
        .ap-hero {
          position: relative;
          min-height: 52vmax;         /* scales with viewport */
          max-height: 520px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .ap-villa {
          position: absolute; inset: 0;
          background: url('/villa_bg.png') center 38% / cover no-repeat;
          transform: scale(1.05);
          transition: transform 12s ease;
        }
        .ap-hero:hover .ap-villa { transform: scale(1); }
        .ap-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(
            175deg,
            rgba(10,6,2,0.60) 0%,
            rgba(18,12,3,0.48) 50%,
            rgba(250,247,242,0.97) 100%
          );
        }

        /* ── Top bar ── */
        .ap-topbar {
          position: relative; z-index: 3;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: env(safe-area-inset-top, 0px) 1.1rem 0;
          padding-top: max(env(safe-area-inset-top, 12px), 12px);
          padding-bottom: 0;
          gap: 0.5rem;
        }
        .ap-brand {
          display: flex; align-items: center; gap: 0.5rem;
          flex: 1; min-width: 0;
        }
        .ap-brand-ghost { visibility: hidden; pointer-events: none; }
        .ap-brand-icon {
          width: 36px; height: 36px; border-radius: 9px; flex-shrink: 0;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 3px 12px rgba(217,119,6,0.5);
        }
        .ap-brand-name {
          font-size: 1.15rem; font-weight: 800; color: #fff;
          letter-spacing: -0.02em;
          text-shadow: 0 1px 5px rgba(0,0,0,0.4);
          white-space: nowrap;
        }
        .ap-brand-gold { color: #fbbf24; }

        /* Sign In | Sign Up pill — always centred */
        .ap-auth-pill {
          display: flex; align-items: center;
          background: rgba(255,255,255,0.18);
          border: 1px solid rgba(255,255,255,0.38);
          border-radius: 999px;
          padding: 4px;
          backdrop-filter: blur(12px);
          gap: 2px;
          flex-shrink: 0;
        }
        .ap-pill-btn {
          background: none; border: none;
          padding: 0.42rem 1rem;
          border-radius: 999px;
          font-family: inherit; font-size: 0.84rem; font-weight: 700;
          cursor: pointer; color: rgba(255,255,255,0.85);
          transition: all 0.2s;
          white-space: nowrap;
          /* Minimum touch target */
          min-height: 36px;
        }
        .ap-pill-btn.ap-pill-active {
          background: #fff;
          color: #d97706;
          box-shadow: 0 2px 8px rgba(0,0,0,0.18);
        }
        .ap-pill-btn:not(.ap-pill-active):active {
          background: rgba(255,255,255,0.15);
        }

        /* ── Hero body ── */
        .ap-hero-body {
          position: relative; z-index: 2;
          padding: 1rem 1.1rem 2.5rem;
          margin-top: auto;        /* pushes text to bottom of hero */
        }
        .ap-hero-title {
          font-size: clamp(1.75rem, 6vw, 2.6rem);
          font-weight: 800; color: #fff;
          line-height: 1.18; margin: 0 0 0.6rem;
          letter-spacing: -0.03em;
          text-shadow: 0 2px 12px rgba(0,0,0,0.45);
        }
        .ap-hero-accent {
          background: linear-gradient(90deg, #fbbf24, #fb923c);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .ap-hero-sub {
          color: rgba(255,255,255,0.78);
          font-size: 0.95rem; line-height: 1.6;
          margin-bottom: 1rem;
        }
        .ap-stat-row { display: flex; flex-wrap: wrap; gap: 0.45rem; }
        .ap-stat-chip {
          display: inline-flex; align-items: center; gap: 0.35rem;
          background: rgba(255,255,255,0.15);
          border: 1px solid rgba(255,255,255,0.3);
          border-radius: 999px;
          padding: 0.32rem 0.75rem;
          font-size: 0.78rem; color: #fff;
          backdrop-filter: blur(8px);
          white-space: nowrap;
        }
        .ap-stat-chip-icon { color: #fbbf24; display: flex; }
        .ap-stat-chip b { font-weight: 700; }

        /* ════════ FEATURE STRIP ════════ */
        .ap-feat-strip {
          background: #fff;
          border-top: 1px solid #f0ece5;
          border-bottom: 1px solid #f0ece5;
          padding: 1.1rem 0 1.1rem 1.1rem;
          box-shadow: 0 2px 16px rgba(0,0,0,0.04);
          position: relative;
        }
        .ap-feat-label {
          font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.1em; color: #a8a29e;
          margin: 0 0 0.75rem 0;
          padding-right: 1.1rem;
        }
        /* Horizontally scrollable on mobile, wraps on desktop */
        .ap-feat-scroll {
          display: flex;
          gap: 0.65rem;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scroll-snap-type: x mandatory;
          scrollbar-width: none;
          padding-bottom: 4px;
          padding-right: 2.5rem; /* room for fade */
        }
        .ap-feat-scroll::-webkit-scrollbar { display: none; }
        .ap-feat-card {
          flex-shrink: 0;
          scroll-snap-align: start;
          width: 152px;
          display: flex; flex-direction: column; gap: 0.45rem;
          padding: 0.9rem 0.85rem;
          border-radius: 12px;
          background: #fef9f0;
          border: 1px solid #fde68a;
          transition: transform 0.2s, box-shadow 0.2s;
          cursor: default;
          -webkit-tap-highlight-color: transparent;
        }
        .ap-feat-card:active { transform: scale(0.97); }
        .ap-feat-icon {
          width: 36px; height: 36px; border-radius: 9px;
          background: linear-gradient(135deg, #fef3c7, #fde68a);
          display: flex; align-items: center; justify-content: center;
          color: #d97706;
        }
        .ap-feat-title { font-size: 0.82rem; font-weight: 700; color: #1c1400; }
        .ap-feat-desc  { font-size: 0.72rem; color: #78716c; line-height: 1.5; }
        /* Right-edge fade hint */
        .ap-feat-fade {
          position: absolute; top: 0; right: 0; bottom: 0; width: 2.5rem;
          background: linear-gradient(to right, transparent, #fff);
          pointer-events: none;
        }

        /* ════════ AUTH FORM ════════ */
        .ap-form-outer {
          background: #faf7f2;
          padding: 1.75rem 1rem 1.5rem;
          display: flex; justify-content: center;
          /* scroll-margin so the smooth scroll lands nicely */
          scroll-margin-top: 12px;
        }
        .ap-form-card {
          width: 100%; max-width: 420px;
          background: #fff;
          border: 1px solid #f0ece5;
          border-radius: 20px;
          padding: 1.75rem 1.5rem;
          box-shadow: 0 6px 32px rgba(0,0,0,0.07);
          position: relative; overflow: hidden;
          animation: apIn 0.35s ease;
        }
        @keyframes apIn {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ap-form-bar {
          position: absolute; top: 0; left: 0; right: 0; height: 4px;
          background: linear-gradient(90deg, #f59e0b, #fb923c, #fbbf24);
          border-radius: 20px 20px 0 0;
        }

        /* Card header */
        .ap-form-head { text-align: center; margin-bottom: 1.3rem; }
        .ap-form-head-icon {
          width: 44px; height: 44px; border-radius: 12px; margin: 0 auto 0.65rem;
          background: linear-gradient(135deg, #fef3c7, #fde68a);
          display: flex; align-items: center; justify-content: center;
        }
        .ap-form-title {
          font-size: 1.3rem; font-weight: 800; color: #1c1400;
          margin: 0 0 0.3rem; letter-spacing: -0.02em;
        }
        .ap-form-sub { font-size: 0.85rem; color: #78716c; }

        /* Tabs */
        .ap-tabs {
          display: flex; gap: 0.28rem;
          background: #f5f0e8; border-radius: 12px; padding: 0.25rem;
          border: 1px solid #ede8de; margin-bottom: 1.25rem;
        }
        .ap-tab {
          flex: 1;
          min-height: 44px;          /* touch target */
          padding: 0 0.5rem;
          border-radius: 9px; border: none;
          cursor: pointer; font-family: inherit; font-weight: 600; font-size: 0.9rem;
          transition: all 0.22s; background: transparent; color: #78716c;
          display: flex; align-items: center; justify-content: center;
          -webkit-tap-highlight-color: transparent;
        }
        .ap-tab.ap-tab-active {
          background: #fff; color: #d97706;
          box-shadow: 0 2px 8px rgba(0,0,0,0.09);
        }
        .ap-tab:active:not(.ap-tab-active) { background: rgba(0,0,0,0.05); }

        /* Form */
        .ap-form { display: flex; flex-direction: column; gap: 1rem; }

        /* Field */
        .ap-field-wrap { display: flex; flex-direction: column; gap: 0.3rem; }
        .ap-field-label {
          font-size: 0.78rem; font-weight: 600; color: #57534e;
          padding-left: 0.15rem;
        }
        .ap-field-icon {
          position: absolute; left: 0.85rem; top: 50%; transform: translateY(-50%);
          color: #9ca3af; pointer-events: none; transition: color 0.2s;
          display: flex;
        }
        .ap-field-icon.focused { color: #d97706; }
        .ap-field-input {
          width: 100%;
          padding: 0.85rem 0.9rem 0.85rem 2.6rem;
          min-height: 50px;          /* comfortable touch target */
          background: #f9fafb;
          border: 1.5px solid #e5e7eb;
          border-radius: 10px;
          color: #111827;
          font-family: inherit;
          font-size: 1rem;           /* prevents iOS zoom on focus */
          outline: none;
          box-sizing: border-box;
          transition: all 0.2s;
          -webkit-appearance: none;
        }
        .ap-field-input.focused,
        .ap-field-input:focus {
          background: #fffbf0;
          border-color: #f59e0b;
          box-shadow: 0 0 0 3px rgba(245,158,11,0.12);
        }
        .ap-field-input::placeholder { color: #c0bdb8; }

        /* Password toggle */
        .ap-pwd-toggle {
          position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer; color: #9ca3af;
          padding: 0.5rem;           /* bigger touch area */
          display: flex; align-items: center; justify-content: center;
          border-radius: 6px;
          -webkit-tap-highlight-color: transparent;
        }
        .ap-pwd-toggle:active { background: rgba(0,0,0,0.06); }

        /* Submit button */
        .ap-submit {
          min-height: 52px;          /* large touch target */
          padding: 0.9rem;
          border-radius: 14px; border: none;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: #fff; font-family: inherit; font-weight: 700; font-size: 1.05rem;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 0.5rem;
          width: 100%;
          box-shadow: 0 4px 18px rgba(217,119,6,0.38);
          transition: all 0.2s;
          letter-spacing: 0.01em;
          -webkit-tap-highlight-color: transparent;
        }
        .ap-submit:active:not(:disabled) {
          transform: scale(0.98);
          box-shadow: 0 2px 10px rgba(217,119,6,0.3);
        }
        .ap-submit:disabled { opacity: 0.6; cursor: not-allowed; }

        /* Switch */
        .ap-switch {
          text-align: center; margin-top: 1rem;
          font-size: 0.86rem; color: #78716c; line-height: 1.7;
        }
        .ap-switch-btn {
          background: none; border: none; color: #d97706; font-weight: 700;
          cursor: pointer; font-family: inherit; font-size: 0.86rem;
          text-decoration: underline; text-underline-offset: 2px;
          padding: 0.2rem 0.1rem;
          -webkit-tap-highlight-color: transparent;
        }
        .ap-switch-btn:active { opacity: 0.7; }

        /* Perks */
        .ap-perks {
          margin-top: 1.3rem;
          display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;
        }
        .ap-perk {
          display: flex; align-items: center; gap: 0.4rem;
          font-size: 0.78rem; color: #57534e;
          background: #fef9f0; border: 1px solid #fde68a;
          border-radius: 8px; padding: 0.55rem 0.65rem;
          white-space: nowrap;
        }
        .ap-perk-icon { color: #d97706; display: flex; flex-shrink: 0; }

        /* Footer */
        .ap-footer {
          text-align: center;
          padding: 1.1rem 1rem;
          padding-bottom: max(1.1rem, env(safe-area-inset-bottom, 1rem));
          font-size: 0.76rem; color: #a8a29e;
          background: #f0ece5; border-top: 1px solid #e5e0d5;
        }

        /* ════ TABLET  (≥ 600px) ════ */
        @media (min-width: 600px) {
          .ap-feat-scroll {
            flex-wrap: wrap;
            overflow-x: visible;
            padding-right: 0;
          }
          .ap-feat-fade { display: none; }
          .ap-feat-strip { padding: 1.4rem 1.5rem; }
          .ap-feat-card { width: auto; flex: 1 1 160px; }
          .ap-form-outer { padding: 2rem 1.5rem 2rem; }
          .ap-hero { max-height: 500px; }
        }

        /* ════ DESKTOP (≥ 900px) ════ */
        @media (min-width: 900px) {
          .ap-topbar { padding: 1.5rem 2.5rem; }
          .ap-hero-body { padding: 1.5rem 2.5rem 3rem; }
          .ap-hero-title { font-size: 2.6rem; }
          .ap-feat-strip { padding: 1.75rem 2rem; }
          .ap-feat-card { width: auto; flex: 1 1 180px; }
          .ap-pill-btn { padding: 0.45rem 1.1rem; font-size: 0.88rem; }
          .ap-form-outer { padding: 2.5rem 1.5rem 2.5rem; }
        }

        /* ════ Reduce motion ════ */
        @media (prefers-reduced-motion: reduce) {
          .ap-villa { transition: none; }
          @keyframes apIn { from { opacity: 1; } }
        }
      `}</style>
    </div>
  );
}
