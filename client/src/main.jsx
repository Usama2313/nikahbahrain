import { StrictMode } from 'react';
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

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
