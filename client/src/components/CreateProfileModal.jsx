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
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '10px'
      }}
      onClick={onClose}
    >
      <animated.div
        onClick={(e) => e.stopPropagation()}
        style={{
          ...modalSpring,
          width: '100%',
          maxWidth: '880px',
          height: '92vh',
          maxHeight: '880px',
          borderRadius: 'var(--radius-lg)',
          background: '#ffffff',
          border: '1.5px solid var(--gold-border)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#f8fafc',
            flexWrap: 'wrap',
            gap: '10px'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3 
                className="font-cinzel"
                style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}
              >
                Create Matrimonial Profile
              </h3>
              <span className="gold-badge" style={{ background: '#fefce8', color: 'var(--text-gold)' }}>
                <ShieldCheck size={12} /> Confidential & Halal
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#475569', marginTop: '2px' }}>
              Fill the official Google Form below to list your proposal on Qabul Hai & Instagram
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <a
              href="https://forms.gle/sdKb75scXAag7gzt9"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold"
              style={{ fontSize: '0.78rem', padding: '6px 14px' }}
              title="Open Google Form in full tab"
            >
              <ExternalLink size={13} />
              <span>Open in Full Tab</span>
            </a>
            <button
              onClick={onClose}
              style={{
                background: '#f1f5f9',
                border: '1px solid rgba(0,0,0,0.1)',
                borderRadius: '50%',
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#334155'
              }}
              title="Close form"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Embedded Google Form */}
        <div style={{ flex: 1, position: 'relative', background: '#ffffff', overflow: 'hidden', width: '100%' }}>
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
              background: '#ffffff',
              borderTop: '1px solid var(--gold-border)',
              padding: '10px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#334155',
              fontSize: '0.8rem',
              flexWrap: 'wrap',
              gap: '8px',
              boxShadow: '0 -4px 12px rgba(0,0,0,0.05)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={15} color="var(--gold-primary)" />
              <span>
                Official Google Form. If your browser restricts embedded forms, click <strong>Open in Full Tab</strong>.
              </span>
            </div>
            <a
              href="https://forms.gle/sdKb75scXAag7gzt9"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold"
              style={{ padding: '5px 14px', fontSize: '0.76rem' }}
            >
              <ExternalLink size={12} />
              <span>Open Form</span>
            </a>
          </div>
        </div>
      </animated.div>
    </animated.div>
  );
}
