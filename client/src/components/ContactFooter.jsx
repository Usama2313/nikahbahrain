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

export default function ContactFooter({ onOpenCreateProfile, onOpenAdmin }) {
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
        background: '#f8fafc',
        borderTop: '1.5px solid var(--gold-border)',
        position: 'relative',
        zIndex: 10
      }}
    >
      <div 
        style={{
          maxWidth: '1440px',
          margin: '0 auto',
          padding: '50px 20px 30px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '36px'
        }}
      >
        {/* Top Contact Highlight Section */}
        <div
          className="glass-panel"
          style={{
            padding: '32px 24px',
            position: 'relative',
            overflow: 'hidden',
            background: '#ffffff',
            border: '1.5px solid var(--gold-border)'
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 28px auto' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '8px', background: '#fefce8', color: 'var(--text-gold)' }} className="gold-badge">
              <Sparkles size={13} /> Official Confidential Family Support
            </div>
            <h2 className="font-cinzel" style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a' }}>
              GET IN TOUCH WITH QABUL HAI
            </h2>
            <p style={{ color: '#475569', fontSize: '0.9rem', marginTop: '6px' }}>
              Connect with our dedicated family coordinators for personal profile inquiries, proposal sharing, and family background verifications.
            </p>
          </div>

          {/* 3 Main Contact Cards: MALE, FEMALE, INSTAGRAM */}
          <div
            className="contact-cards-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px'
            }}
          >
            {/* Male Coordinator */}
            <animated.div
              style={{
                ...floatSpring,
                background: '#ffffff',
                border: '1.5px solid #bfdbfe',
                borderRadius: 'var(--radius-lg)',
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '16px',
                boxShadow: '0 4px 16px rgba(59, 130, 246, 0.08)'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Male Family Coordinator
                  </span>
                  <span style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: '0.72rem', color: '#1d4ed8', fontWeight: 700 }}>
                    Brothers / Grooms
                  </span>
                </div>

                <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', letterSpacing: '0.5px' }}>
                  +973 3718 8557
                </div>

                <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '4px' }}>
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
                background: '#ffffff',
                border: '1.5px solid #fbcfe8',
                borderRadius: 'var(--radius-lg)',
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '16px',
                boxShadow: '0 4px 16px rgba(236, 72, 153, 0.08)'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#be185d', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Female Family Coordinator
                  </span>
                  <span style={{ background: '#fdf2f8', border: '1px solid #fbcfe8', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: '0.72rem', color: '#be185d', fontWeight: 700 }}>
                    Sisters / Brides
                  </span>
                </div>

                <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', letterSpacing: '0.5px' }}>
                  +973 3456 0078
                </div>

                <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '4px' }}>
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
                background: '#ffffff',
                border: '1.5px solid rgba(196, 155, 31, 0.35)',
                borderRadius: 'var(--radius-lg)',
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '16px',
                boxShadow: '0 4px 16px rgba(196, 155, 31, 0.08)'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-gold)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Official Instagram Feed
                  </span>
                  <span className="gold-badge" style={{ fontSize: '0.7rem', padding: '2px 8px', background: '#fefce8' }}>
                    @Nikah_Bahrain
                  </span>
                </div>

                <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', letterSpacing: '0.5px' }}>
                  @Nikah_Bahrain
                </div>

                <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '4px' }}>
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
          className="contact-footer-bottom"
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

          <div className="contact-footer-links" style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.82rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
            <button
              onClick={onOpenCreateProfile}
              style={{ background: 'transparent', border: 'none', color: 'var(--gold-light)', cursor: 'pointer', fontWeight: 600 }}
            >
              Submit Profile Form
            </button>
            <span>•</span>
            <a 
              href="https://forms.gle/sdKb75scXAag7gzt9" 
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
            {onOpenAdmin && (
              <>
                <span>•</span>
                <button
                  onClick={onOpenAdmin}
                  style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.82rem', textDecoration: 'underline' }}
                >
                  Admin Portal
                </button>
              </>
            )}
          </div>

          <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)', textAlign: 'right' }}>
            © {new Date().getFullYear()} Qabul Hai. All matrimonial profiles verified according to Islamic guidelines.
          </div>
        </div>
      </div>
    </footer>
  );
}
