import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';


// World-Class Button Click Animations: Dynamic Ripple Wave + Golden Micro-Sparkles Burst
if (typeof window !== 'undefined') {
  document.addEventListener('pointerdown', (e) => {
    const btn = e.target.closest('button, .btn-gold, .btn-whatsapp, .btn-ghost, a[role="button"], [data-clickable="true"]');
    if (!btn) return;

    // 1. Inside-button ripple wave
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.6;
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const ripple = document.createElement('span');
    ripple.className = 'btn-click-ripple';
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    // Ensure parent can contain ripple
    const prevPosition = window.getComputedStyle(btn).position;
    if (prevPosition === 'static') {
      btn.style.position = 'relative';
    }
    btn.style.overflow = 'hidden';

    btn.appendChild(ripple);
    setTimeout(() => {
      ripple.remove();
    }, 700);

    // 2. Radiant micro-sparkles burst around click point
    const sparkleCount = 5;
    for (let i = 0; i < sparkleCount; i++) {
      const sparkle = document.createElement('div');
      sparkle.className = 'click-sparkle-particle';
      sparkle.style.left = `${e.clientX}px`;
      sparkle.style.top = `${e.clientY}px`;

      const angle = (i / sparkleCount) * 2 * Math.PI + (Math.random() * 0.4 - 0.2);
      const distance = 22 + Math.random() * 26;
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance;

      sparkle.style.setProperty('--dx', `${dx}px`);
      sparkle.style.setProperty('--dy', `${dy}px`);

      document.body.appendChild(sparkle);
      setTimeout(() => {
        sparkle.remove();
      }, 600);
    }
  });
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('REACT_ERROR_BOUNDARY_CAUGHT:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '30px', color: '#b91c1c', background: '#fef2f2', fontFamily: 'monospace', maxWidth: '800px', margin: '40px auto', borderRadius: '12px', border: '1.5px solid #f87171' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '10px' }}>Application Error Encountered</h2>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{String(this.state.error?.stack || this.state.error)}</pre>
          <button onClick={() => { window.location.href = '/'; }} style={{ marginTop: '16px', padding: '8px 16px', cursor: 'pointer', background: '#b91c1c', color: '#fff', border: 'none', borderRadius: '6px' }}>Return to Home</button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);


