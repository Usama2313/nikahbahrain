import React from 'react';
import { useSpring, animated } from '@react-spring/web';
import { 
  Phone, 
  MessageCircle, 
  Instagram, 
  Heart, 
  ShieldCheck, 
  ExternalLink,
  MapPin,
  Clock,
  Sparkles
} from '../icons';
import logoImg from '../assets/logo.jpg';

export default function ContactFooter({ onOpenCreateProfile }) {
  // Gentle floating spring for contact card badges
  const floatSpring = useSpring({
    loop: { reverse: true },
    from: { transform: 'translateY(0px)' },
    to: { transform: 'translateY(-4px)' },
    config: { tension: 120, friction: 14 }
  });

  return (
    <footer
      id="contact-section"
      style={{
        marginTop: '60px',
        background: 'linear-gradient(180deg, rgba(6, 14, 26, 0.7) 0%, #030813 100%)',
        borderTop: '1px solid var(--gold-border)',
        position: 'relative',
        zIndex: 10
      }}
    >
      <div 
        style={{
          maxWidth: '1440px',
          margin: '0 auto',
          padding: '60px 20px 30px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '40px'
        }}
      >
        {/* Top Contact Highlight Section */}
        <div
          className="glass-panel"
          style={{
            padding: '36px 30px',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div 
            style={{
              position: 'absolute',
              top: '-50px',
              right: '-50px',
              width: '200px',
              height: '200px',
              background: 'radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 70%)',
              borderRadius: '50%',
              pointerEvents: 'none'
            }}
          />

          <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 30px auto' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }} className="gold-badge">
              <Sparkles size={13} /> Official Confidential Family Support
            </div>
            <h2 className="font-cinzel gold-text-gradient" style={{ fontSize: '2rem', fontWeight: 800 }}>
              GET IN TOUCH WITH QABUL HAI
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: '6px' }}>
              Connect with our dedicated family coordinators for personal profile inquiries, proposal sharing, and family background verifications.
            </p>
          </div>

          {/* 3 Main Contact Cards: MALE, FEMALE, INSTAGRAM */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px'
            }}
          >
            {/* Male Coordinator */}
            <animated.div
              style={{
                ...floatSpring,
                background: 'rgba(9, 21, 38, 0.9)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '16px'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Male Family Coordinator
                  </span>
                  <span style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: '0.72rem', color: '#93c5fd' }}>
                    Brothers / Grooms
                  </span>
                </div>

                <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ffffff', letterSpacing: '0.5px' }}>
                  +973 3718 8557
                </div>

                <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                  Direct line for grooms, fathers, and brother family representatives.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <a
                  href="https://wa.me/97337188557"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-whatsapp"
                  style={{ flex: 1, padding: '10px' }}
                >
                  <MessageCircle size={16} />
                  <span>WhatsApp Male</span>
                </a>
                <a
                  href="tel:+97337188557"
                  className="btn-ghost"
                  style={{ padding: '10px 14px' }}
                  title="Direct Call"
                >
                  <Phone size={15} />
                </a>
              </div>
            </animated.div>

            {/* Female Coordinator */}
            <animated.div
              style={{
                ...floatSpring,
                background: 'rgba(9, 21, 38, 0.9)',
                border: '1px solid rgba(236, 72, 153, 0.3)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '16px'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f472b6', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Female Family Coordinator
                  </span>
                  <span style={{ background: 'rgba(236, 72, 153, 0.2)', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: '0.72rem', color: '#f472b6' }}>
                    Sisters / Brides
                  </span>
                </div>

                <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ffffff', letterSpacing: '0.5px' }}>
                  +973 3456 0078
                </div>

                <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                  Dedicated female coordinator providing total privacy for sisters & mothers.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <a
                  href="https://wa.me/97334560078"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-whatsapp"
                  style={{ flex: 1, padding: '10px', background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)', borderColor: 'rgba(236, 72, 153, 0.5)' }}
                >
                  <MessageCircle size={16} />
                  <span>WhatsApp Female</span>
                </a>
                <a
                  href="tel:+97334560078"
                  className="btn-ghost"
                  style={{ padding: '10px 14px' }}
                  title="Direct Call"
                >
                  <Phone size={15} />
                </a>
              </div>
            </animated.div>

            {/* Instagram Official Channel */}
            <animated.div
              style={{
                ...floatSpring,
                background: 'rgba(9, 21, 38, 0.9)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '16px'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gold-light)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Official Instagram Feed
                  </span>
                  <span className="gold-badge" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                    @Nikah_Bahrain
                  </span>
                </div>

                <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ffffff', letterSpacing: '0.5px' }}>
                  @Nikah_Bahrain
                </div>

                <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                  Daily verified candidate cards, stories, and matrimonial success announcements.
                </p>
              </div>

              <a
                href="https://instagram.com/Nikah_Bahrain"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gold"
                style={{ padding: '10px' }}
              >
                <Instagram size={16} />
                <span>Visit Instagram @Nikah_Bahrain</span>
              </a>
            </animated.div>
          </div>
        </div>

        {/* Brand Footer Info & Islamic Copyright */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '20px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            paddingTop: '24px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img 
              src={logoImg} 
              alt="Qabul Hai" 
              style={{ width: '42px', height: '42px', borderRadius: '50%', border: '1px solid var(--gold-border)' }}
            />
            <div>
              <div className="font-cinzel gold-text-gradient" style={{ fontWeight: 800, fontSize: '1.1rem' }}>
                QABUL HAI
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                Kingdom of Bahrain & GCC • Matrimonial Services
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            <button
              onClick={onOpenCreateProfile}
              style={{ background: 'transparent', border: 'none', color: 'var(--gold-light)', cursor: 'pointer', fontWeight: 600 }}
            >
              Submit Profile Form
            </button>
            <span>•</span>
            <a 
              href="https://docs.google.com/forms/d/e/1FAIpQLSe8p6bnqIMv7sPlDrYdREZHkpmuVb5c5pWrSVWqr70NhvvRCQ/viewform" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: 'var(--text-muted)', textDecoration: 'none' }}
            >
              Google Form
            </a>
            <span>•</span>
            <a 
              href="https://instagram.com/Nikah_Bahrain" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: 'var(--text-muted)', textDecoration: 'none' }}
            >
              Instagram
            </a>
          </div>

          <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)', textAlign: 'right' }}>
            © {new Date().getFullYear()} Qabul Hai. All matrimonial profiles verified according to Islamic guidelines.
          </div>
        </div>
      </div>
    </footer>
  );
}
