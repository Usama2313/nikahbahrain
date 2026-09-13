import React, { useEffect } from 'react';
import { useSpring, useTrail, animated } from '@react-spring/web';
import { 
  X, 
  Heart, 
  MessageCircle, 
  ShieldCheck, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Instagram, 
  CheckCircle2, 
  Sparkles, 
  User, 
  Users,
  Home, 
  FileText,
  PhoneCall,
  Calendar,
  Ruler,
  BookOpen,
  Star
} from '../icons';

export default function ProfileModal({ profile, isFavorite, onToggleFavorite, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Spring animation for modal entrance with elastic effect
  const modalSpring = useSpring({
    from: { opacity: 0, transform: 'scale(0.85) translateY(30px)' },
    to: { opacity: 1, transform: 'scale(1) translateY(0px)' },
    config: { tension: 280, friction: 22 }
  });

  const backdropSpring = useSpring({
    from: { opacity: 0 },
    to: { opacity: 1 },
    config: { duration: 200 }
  });

  // Staggered reveal for detail sections
  const sections = ['badges', 'info', 'family', 'about', 'requirements', 'actions'];
  const sectionTrail = useTrail(sections.length, {
    from: { opacity: 0, transform: 'translateY(15px)' },
    to: { opacity: 1, transform: 'translateY(0px)' },
    config: { tension: 260, friction: 24 },
    delay: 150
  });

  // Avatar pulse animation
  const avatarSpring = useSpring({
    from: { transform: 'scale(0.8)' },
    to: { transform: 'scale(1)' },
    config: { tension: 300, friction: 15 }
  });

  if (!profile) return null;

  const handleWhatsAppChat = () => {
    const phone = '97337188557';
    const message = `Assalamu Alaikum Qabul Hai Team,

I would like to inquire regarding profile:
• ID: ${profile.id} - ${profile.name}
• Gender: ${profile.gender === 'male' ? 'Groom' : 'Bride'}
• Marital Status: ${profile.maritalStatus}
• Nationality: ${profile.nationality}
• Profession: ${profile.profession}
• Siblings: ${profile.siblings || 'N/A'}
• Location: ${profile.location}
• Official Instagram: ${profile.instagramPostUrl}

Please share requirements & family verification steps.`;

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const genderConfig = profile.gender === 'male' 
    ? { 
        gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
        headerBg: 'linear-gradient(135deg, #0c2340 0%, #1e3a5f 50%, #0c2340 100%)',
        label: 'GROOM',
        accentColor: '#60a5fa'
      }
    : {
        gradient: 'linear-gradient(135deg, #ec4899, #be185d)',
        headerBg: 'linear-gradient(135deg, #2d1033 0%, #4a1942 50%, #2d1033 100%)',
        label: 'BRIDE',
        accentColor: '#f472b6'
      };

  const detailRows = [
    { icon: Briefcase, label: 'Profession', value: profile.profession },
    { icon: GraduationCap, label: 'Education', value: profile.education },
    { icon: MapPin, label: 'Location', value: profile.location },
    { icon: Home, label: 'Residency', value: profile.residence },
    { icon: BookOpen, label: 'Sect', value: profile.sect },
    { icon: User, label: 'Caste', value: profile.caste },
    { icon: FileText, label: 'Languages', value: profile.languages },
    { icon: Sparkles, label: 'Complexion & Build', value: [profile.complexion, profile.build].filter(Boolean).join(' • ') }
  ];

  return (
    <animated.div
      style={{
        ...backdropSpring,
        position: 'fixed',
        inset: 0,
        zIndex: 500,
        backgroundColor: 'rgba(3, 8, 16, 0.88)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        overflowY: 'auto'
      }}
      onClick={onClose}
    >
      <animated.div
        onClick={(e) => e.stopPropagation()}
        style={{
          ...modalSpring,
          width: '100%',
          maxWidth: '700px',
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: 'var(--radius-lg)',
          background: 'linear-gradient(145deg, #091930 0%, #061122 100%)',
          border: '1px solid var(--gold-border)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.85), 0 0 40px rgba(212, 175, 55, 0.2)',
          position: 'relative'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(0,0,0,0.6)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#ffffff',
            zIndex: 10
          }}
        >
          <X size={18} />
        </button>

        {/* Header Section with Large Avatar */}
        <div 
          style={{ 
            padding: '36px 30px 24px 30px',
            background: genderConfig.headerBg,
            borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Decorative radial glow */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '300px',
            height: '300px',
            background: `radial-gradient(circle, ${profile.gender === 'male' ? 'rgba(59, 130, 246, 0.12)' : 'rgba(236, 72, 153, 0.12)'} 0%, transparent 70%)`,
            pointerEvents: 'none'
          }} />

          {/* Avatar */}
          <animated.div
            style={{
              ...avatarSpring,
              width: '90px',
              height: '90px',
              borderRadius: '50%',
              background: genderConfig.gradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              border: '3px solid rgba(255,255,255,0.2)',
              boxShadow: `0 0 30px ${profile.gender === 'male' ? 'rgba(59, 130, 246, 0.4)' : 'rgba(236, 72, 153, 0.4)'}`,
              position: 'relative'
            }}
          >
            <User size={42} color="#ffffff" />
          </animated.div>

          <h2 
            className="font-cinzel gold-text-gradient"
            style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px' }}
          >
            {profile.name}
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={14} /> {profile.age} Years
            </span>
            <span>•</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Ruler size={14} /> {profile.height}
            </span>
            <span>•</span>
            <span style={{ 
              background: genderConfig.gradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 700
            }}>
              {genderConfig.label}
            </span>
          </div>

          {/* ID & Verified Badges */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '14px' }}>
            <span className="gold-badge">
              <ShieldCheck size={13} /> {profile.id}
            </span>
            <span 
              style={{
                background: 'rgba(16, 185, 129, 0.9)',
                color: '#ffffff',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <CheckCircle2 size={12} /> 100% Verified
            </span>
          </div>
        </div>

        {/* Detail Sections */}
        <div style={{ padding: '24px 30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Nationality & Marital Status Labels */}
          <animated.div style={sectionTrail[0]}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span
                style={{
                  background: profile.nationality === 'Pakistani' ? 'rgba(16, 185, 129, 0.2)' : profile.nationality === 'Indian' ? 'rgba(249, 115, 22, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid var(--gold-border)',
                  color: 'var(--gold-light)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-full)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <CheckCircle2 size={13} />
                {profile.nationality === 'Pakistani' ? '🇵🇰 Pakistani' : profile.nationality === 'Indian' ? '🇮🇳 Indian' : '🇧🇭 Bahraini'}
              </span>

              <span 
                style={{
                  background: 'rgba(212, 175, 55, 0.15)',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  color: 'var(--gold-light)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-full)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <CheckCircle2 size={13} />
                {profile.maritalStatus}
              </span>

              {/* Instagram Source */}
              <a
                href={profile.instagramPostUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  color: 'var(--gold-light)',
                  fontSize: '0.78rem',
                  textDecoration: 'none',
                  background: 'rgba(212, 175, 55, 0.1)',
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid rgba(212, 175, 55, 0.2)'
                }}
              >
                <Instagram size={13} />
                <span>@nikah_bahrain</span>
              </a>
            </div>
          </animated.div>

          {/* Info Grid */}
          <animated.div style={sectionTrail[1]}>
            <div 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '10px',
                background: 'rgba(255,255,255,0.02)',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(255,255,255,0.06)'
              }}
            >
              {detailRows.map((row, idx) => {
                const Icon = row.icon;
                return row.value ? (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', color: '#e2e8f0' }}>
                    <Icon size={16} color="var(--gold-primary)" style={{ flexShrink: 0 }} />
                    <span><strong style={{ color: 'var(--gold-light)' }}>{row.label}:</strong> {row.value}</span>
                  </div>
                ) : null;
              })}
            </div>
          </animated.div>

          {/* Dedicated Family & Siblings Section (Instagram Flyer Exact Labels) */}
          <animated.div style={sectionTrail[2]}>
            <h4 
              className="font-cinzel"
              style={{ fontSize: '1rem', color: 'var(--gold-light)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Users size={16} color="var(--gold-primary)" />
              Family & Sibling Information (Original Flyer Details)
            </h4>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                background: 'rgba(212, 175, 55, 0.04)',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(212, 175, 55, 0.15)'
              }}
            >
              {/* Siblings Labeled Row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--gold-light)', fontWeight: 700, minWidth: '130px', flexShrink: 0 }}>
                  • Siblings:
                </span>
                <span style={{ color: '#ffffff', fontWeight: 600 }}>
                  {profile.siblings || 'Available upon family request'}
                </span>
              </div>

              {/* Father Labeled Row */}
              {profile.father && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.88rem' }}>
                  <span style={{ color: 'var(--gold-light)', fontWeight: 700, minWidth: '130px', flexShrink: 0 }}>
                    • Father:
                  </span>
                  <span style={{ color: '#e2e8f0' }}>
                    {profile.father}
                  </span>
                </div>
              )}

              {/* Mother Labeled Row */}
              {profile.mother && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.88rem' }}>
                  <span style={{ color: 'var(--gold-light)', fontWeight: 700, minWidth: '130px', flexShrink: 0 }}>
                    • Mother:
                  </span>
                  <span style={{ color: '#e2e8f0' }}>
                    {profile.mother}
                  </span>
                </div>
              )}

              {/* Family Background Row */}
              {profile.family && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.88rem' }}>
                  <span style={{ color: 'var(--gold-light)', fontWeight: 700, minWidth: '130px', flexShrink: 0 }}>
                    • Family:
                  </span>
                  <span style={{ color: '#cbd5e1' }}>
                    {profile.family}
                  </span>
                </div>
              )}
            </div>
          </animated.div>

          {/* About Section */}
          <animated.div style={sectionTrail[3]}>
            <h4 
              className="font-cinzel"
              style={{ fontSize: '1rem', color: 'var(--gold-light)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <FileText size={16} color="var(--gold-primary)" />
              Candidate Profile & Short Bio
            </h4>
            <p style={{ color: '#e2e8f0', fontSize: '0.9rem', lineHeight: '1.7', background: 'rgba(255,255,255,0.03)', padding: '14px 16px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {profile.about}
            </p>
          </animated.div>

          {/* Requirements Section */}
          <animated.div style={sectionTrail[4]}>
            <h4 
              className="font-cinzel"
              style={{ fontSize: '1rem', color: 'var(--gold-light)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Sparkles size={16} color="var(--gold-primary)" />
              Partner Requirements & Expectations
            </h4>
            <p style={{ color: '#e2e8f0', fontSize: '0.9rem', lineHeight: '1.7', background: 'rgba(212, 175, 55, 0.05)', padding: '14px 16px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(212, 175, 55, 0.15)' }}>
              {profile.requirements}
            </p>
          </animated.div>

          {/* Action Buttons */}
          <animated.div 
            style={{
              ...sectionTrail[5],
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              gap: '12px', 
              flexWrap: 'wrap',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              paddingTop: '18px'
            }}
          >
            {/* Direct WhatsApp to Male +97337188557 */}
            <button
              onClick={handleWhatsAppChat}
              className="btn-whatsapp"
              style={{
                flex: '1 1 260px',
                padding: '13px 24px',
                fontSize: '0.95rem'
              }}
            >
              <MessageCircle size={18} />
              <span>Connect on WhatsApp (+97337188557)</span>
            </button>

            {/* Favorite button */}
            <button
              onClick={() => onToggleFavorite(profile.id)}
              className="btn-ghost"
              style={{
                padding: '13px 20px',
                borderColor: isFavorite ? '#ef4444' : undefined,
                color: isFavorite ? '#ef4444' : undefined
              }}
            >
              <Heart size={18} fill={isFavorite ? '#ef4444' : 'none'} />
              <span>{isFavorite ? 'Favorited' : 'Add to Favorites'}</span>
            </button>
          </animated.div>
        </div>
      </animated.div>
    </animated.div>
  );
}
