import React from 'react';
import { useSpring, animated } from '@react-spring/web';
import { 
  X, 
  ExternalLink, 
  CheckCircle2, 
  ShieldCheck
} from '../icons';

export default function CreateProfileModal({ isOpen, onClose }) {
  // Spring animation for modal entrance
  const modalSpring = useSpring({
    transform: isOpen ? 'scale(1) translateY(0px)' : 'scale(0.9) translateY(20px)',
    opacity: isOpen ? 1 : 0,
    config: { tension: 340, friction: 24 }
  });

  const backdropSpring = useSpring({
    opacity: isOpen ? 1 : 0,
    config: { duration: 180 }
  });

  if (!isOpen) return null;

  return (
    <animated.div
      style={{
        ...backdropSpring,
        position: 'fixed',
        inset: 0,
        zIndex: 600,
        backgroundColor: 'rgba(3, 8, 16, 0.88)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <animated.div
        onClick={(e) => e.stopPropagation()}
        style={{
          ...modalSpring,
          width: '100%',
          maxWidth: '900px',
          height: '92vh',
          maxHeight: '900px',
          borderRadius: 'var(--radius-lg)',
          background: 'linear-gradient(145deg, #091a32 0%, #061122 100%)',
          border: '1px solid var(--gold-border)',
          boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.9), 0 0 30px rgba(212, 175, 55, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(5, 12, 22, 0.8)'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 
                className="font-cinzel gold-text-gradient"
                style={{ fontSize: '1.4rem', fontWeight: 800 }}
              >
                Create Matrimonial Profile
              </h3>
              <span className="gold-badge">
                <ShieldCheck size={12} /> Confidential & Halal
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Fill the official Google Form below to list your proposal on Qabul Hai & Instagram
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <a
              href="https://forms.gle/sdKb75scXAag7gzt9"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold"
              style={{ fontSize: '0.8rem', padding: '6px 14px' }}
              title="Open Google Form in full tab"
            >
              <ExternalLink size={14} />
              <span>Open in Full Tab</span>
            </a>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '50%',
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#ffffff'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Embedded Google Form */}
        <div style={{ flex: 1, position: 'relative', background: '#ffffff', overflow: 'hidden' }}>
          <iframe
            title="Qabul Hai Matrimonial Application Form"
            src="https://forms.gle/sdKb75scXAag7gzt9?embedded=true"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              display: 'block'
            }}
          />

          {/* Note overlay banner for users */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'rgba(6, 14, 26, 0.95)',
              borderTop: '1px solid var(--gold-border)',
              padding: '10px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#e2e8f0',
              fontSize: '0.82rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} color="var(--gold-primary)" />
              <span>
                Official Google Form Embed. If your browser restricts embedded forms, click <strong>Open in Full Tab</strong> above.
              </span>
            </div>
            <a
              href="https://forms.gle/sdKb75scXAag7gzt9"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold"
              style={{ padding: '6px 16px', fontSize: '0.78rem' }}
            >
              Open Google Form
            </a>
          </div>
        </div>
      </animated.div>
    </animated.div>
  );
}
