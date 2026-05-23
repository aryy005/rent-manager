import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

/**
 * InstallPrompt
 * ─────────────
 * Shows a native-feeling "Add to Home Screen" bottom sheet.
 * • On Android Chrome  → intercepts beforeinstallprompt → shows our custom UI
 * • On iOS Safari      → shows manual instructions (no API available)
 * • On desktop         → shows a subtle top banner
 *
 * Dismissed state is persisted in localStorage for 7 days.
 */
export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    if (isStandalone) return;

    // Check if dismissed recently
    const dismissed = localStorage.getItem('rm_install_dismissed');
    if (dismissed && Date.now() - Number(dismissed) < 7 * 24 * 60 * 60 * 1000) return;

    const ua = navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(ua) && !window.MSStream;
    const mobile = /android|iphone|ipad|ipod/i.test(ua);
    setIsIOS(ios);
    setIsDesktop(!mobile);

    if (ios) {
      // iOS: show manual instructions after 3s
      setTimeout(() => setShow(true), 3000);
      return;
    }

    // Android / Desktop: wait for browser prompt event
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShow(true), 2000);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShow(false);
    setDeferredPrompt(null);
  };

  const dismiss = () => {
    setShow(false);
    localStorage.setItem('rm_install_dismissed', String(Date.now()));
  };

  if (!show) return null;

  /* ── iOS manual instructions ── */
  if (isIOS) {
    return (
      <div style={styles.sheet}>
        <div style={styles.sheetInner}>
          <button onClick={dismiss} style={styles.closeBtn} aria-label="Close"><X size={18} /></button>
          <div style={styles.iconRow}>
            <div style={styles.appIcon}><Smartphone size={22} color="#d97706" /></div>
            <div>
              <div style={styles.sheetTitle}>Install RentMaster</div>
              <div style={styles.sheetSub}>Add to your Home Screen</div>
            </div>
          </div>
          <div style={styles.iosTip}>
            <span>Tap the</span>
            <span style={styles.shareIcon}>⎋</span>
            <span>Share button, then tap <strong>"Add to Home Screen"</strong></span>
          </div>
          <button onClick={dismiss} style={styles.dismissBtn}>Got it</button>
        </div>
      </div>
    );
  }

  /* ── Desktop banner ── */
  if (isDesktop) {
    return (
      <div style={styles.banner}>
        <div style={styles.bannerLeft}>
          <div style={styles.bannerIcon}><Download size={16} color="#d97706" /></div>
          <span style={styles.bannerText}>
            Install <strong>RentMaster</strong> on your computer for faster access
          </span>
        </div>
        <div style={styles.bannerActions}>
          <button onClick={handleInstall} style={styles.bannerInstall}>Install App</button>
          <button onClick={dismiss} style={styles.bannerDismiss} aria-label="Dismiss"><X size={16} /></button>
        </div>
      </div>
    );
  }

  /* ── Android / others — bottom sheet ── */
  return (
    <div style={styles.sheet}>
      <div style={styles.sheetInner}>
        <button onClick={dismiss} style={styles.closeBtn} aria-label="Close"><X size={18} /></button>
        <div style={styles.iconRow}>
          <img src="/icon-192.png" alt="RentMaster" style={styles.appIconImg} />
          <div>
            <div style={styles.sheetTitle}>Install RentMaster</div>
            <div style={styles.sheetSub}>Free · Works offline · Instant access</div>
          </div>
        </div>
        <ul style={styles.featureList}>
          {['One-tap access from home screen', 'Works offline — no internet needed', 'Faster than the browser version'].map((f, i) => (
            <li key={i} style={styles.featureItem}>✓ {f}</li>
          ))}
        </ul>
        <button onClick={handleInstall} style={styles.installBtn}>
          <Download size={18} /> Add to Home Screen
        </button>
        <button onClick={dismiss} style={styles.laterBtn}>Maybe Later</button>
      </div>
    </div>
  );
}

/* ── Styles ── */
const styles = {
  /* Bottom sheet */
  sheet: {
    position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
    background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
    animation: 'swSlideUp 0.3s ease',
  },
  sheetInner: {
    background: '#fff',
    borderRadius: '20px 20px 0 0',
    padding: '1.5rem 1.25rem',
    paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 1.5rem))',
    position: 'relative',
    fontFamily: 'Outfit, sans-serif',
  },
  closeBtn: {
    position: 'absolute', top: '1rem', right: '1rem',
    background: '#f5f0e8', border: 'none', borderRadius: '50%',
    width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: '#78716c',
  },
  iconRow: {
    display: 'flex', alignItems: 'center', gap: '0.9rem', marginBottom: '1.1rem',
  },
  appIcon: {
    width: 52, height: 52, borderRadius: 14, flexShrink: 0,
    background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  appIconImg: {
    width: 52, height: 52, borderRadius: 14, objectFit: 'cover',
  },
  sheetTitle: { fontSize: '1.05rem', fontWeight: 800, color: '#1c1400' },
  sheetSub: { fontSize: '0.82rem', color: '#78716c', marginTop: 2 },
  featureList: {
    listStyle: 'none', padding: 0, margin: '0 0 1.1rem',
    display: 'flex', flexDirection: 'column', gap: '0.45rem',
  },
  featureItem: { fontSize: '0.88rem', color: '#57534e' },
  installBtn: {
    width: '100%', padding: '0.9rem',
    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
    color: '#fff', border: 'none', borderRadius: 14,
    fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1rem',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '0.5rem', boxShadow: '0 4px 16px rgba(217,119,6,0.38)',
  },
  laterBtn: {
    width: '100%', padding: '0.7rem', marginTop: '0.5rem',
    background: 'none', border: 'none', color: '#78716c',
    fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '0.9rem',
    cursor: 'pointer',
  },
  iosTip: {
    background: '#fef9f0', border: '1px solid #fde68a',
    borderRadius: 10, padding: '0.85rem',
    fontSize: '0.88rem', color: '#57534e',
    display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap',
    marginBottom: '1rem',
  },
  shareIcon: { fontSize: '1.3rem', color: '#007aff' },
  dismissBtn: {
    width: '100%', padding: '0.8rem',
    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
    color: '#fff', border: 'none', borderRadius: 12,
    fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '0.95rem',
    cursor: 'pointer',
  },

  /* Desktop banner */
  banner: {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
    background: '#fff', borderBottom: '1px solid #f0ece5',
    boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
    padding: '0.65rem 1.25rem',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
    fontFamily: 'Outfit, sans-serif',
  },
  bannerLeft: { display: 'flex', alignItems: 'center', gap: '0.65rem' },
  bannerIcon: {
    width: 32, height: 32, borderRadius: 8,
    background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  bannerText: { fontSize: '0.88rem', color: '#57534e' },
  bannerActions: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  bannerInstall: {
    padding: '0.42rem 1rem', borderRadius: 8, border: 'none',
    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
    color: '#fff', fontFamily: 'Outfit, sans-serif', fontWeight: 700,
    fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap',
  },
  bannerDismiss: {
    background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af',
    padding: '0.3rem', display: 'flex', alignItems: 'center',
  },
};
