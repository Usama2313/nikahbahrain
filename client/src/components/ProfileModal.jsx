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
        headerBg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
        label: 'GROOM',
        accentColor: '#1d4ed8'
      }
    : {
        gradient: 'linear-gradient(135deg, #ec4899, #be185d)',
        headerBg: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)',
        label: 'BRIDE',
        accentColor: '#be185d'
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
      className="modal-overlay"
      style={{
        ...backdropSpring,
        position: 'fixed',
        inset: 0,
        zIndex: 500,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto'
      }}
      onClick={onClose}
    >
      <animated.div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          ...modalSpring,
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: 'var(--radius-lg)',
          background: '#ffffff',
          border: '1.5px solid var(--gold-border)',
          boxShadow: '0 20px 50px -10px rgba(0, 0, 0, 0.25), 0 0 25px rgba(196, 155, 31, 0.15)',
          position: 'relative'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            background: '#f1f5f9',
            border: '1px solid rgba(0,0,0,0.12)',
            borderRadius: '50%',
            width: '34px',
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#334155',
            zIndex: 10
          }}
          title="Close modal"
        >
          <X size={18} />
        </button>

        {/* Header Section with Avatar */}
        <div 
          className="modal-header"
          style={{ 
            padding: '30px 24px 20px 24px',
            background: genderConfig.headerBg,
            borderBottom: '1px solid var(--gold-border)',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Avatar */}
          <animated.div
            style={{
              ...avatarSpring,
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: genderConfig.gradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px auto',
              border: '3px solid #ffffff',
              boxShadow: `0 6px 20px ${profile.gender === 'male' ? 'rgba(59, 130, 246, 0.35)' : 'rgba(236, 72, 153, 0.35)'}`,
              position: 'relative'
            }}
          >
            <User size={38} color="#ffffff" />
          </animated.div>

          <h2 
            className="font-cinzel"
            style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}
          >
            {profile.name}
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: '#475569', fontSize: '0.88rem', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={14} /> {profile.age} Years
            </span>
            <span>•</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Ruler size={14} /> {profile.height}
            </span>
            <span>•</span>
            <span style={{ 
              color: genderConfig.accentColor,
              fontWeight: 800
            }}>
              {genderConfig.label}
            </span>
          </div>

          {/* ID & Verified Badges */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
            <span className="gold-badge" style={{ background: '#fefce8', color: 'var(--text-gold)' }}>
              <ShieldCheck size={13} /> {profile.id}
            </span>
            <span 
              style={{
                background: '#10b981',
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
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

          {/* Nationality & Marital Status Labels */}
          <animated.div style={sectionTrail[0]}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span
                style={{
                  background: profile.nationality === 'Pakistani' ? '#ecfdf5' : profile.nationality === 'Indian' ? '#fff7ed' : '#fef2f2',
                  border: '1px solid var(--gold-border)',
                  color: profile.nationality === 'Pakistani' ? '#065f46' : profile.nationality === 'Indian' ? '#9a3412' : '#991b1b',
                  fontSize: '0.8rem',
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
                  background: '#fefce8',
                  border: '1px solid rgba(196, 155, 31, 0.4)',
                  color: 'var(--text-gold)',
                  fontSize: '0.8rem',
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
                  color: 'var(--text-gold)',
                  fontSize: '0.78rem',
                  textDecoration: 'none',
                  background: '#fefce8',
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid rgba(196, 155, 31, 0.3)'
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
              className="modal-detail-grid"
              style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '10px',
                background: '#f8fafc',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid #e2e8f0'
              }}
            >
              {detailRows.map((row, idx) => {
                const Icon = row.icon;
                return row.value ? (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', color: '#1e293b' }}>
                    <Icon size={16} color="var(--gold-primary)" style={{ flexShrink: 0 }} />
                    <span><strong style={{ color: 'var(--text-gold)' }}>{row.label}:</strong> {row.value}</span>
                  </div>
                ) : null;
              })}
            </div>
          </animated.div>

          {/* Dedicated Family & Siblings Section */}
          <animated.div style={sectionTrail[2]}>
            <h4 
              className="font-cinzel"
              style={{ fontSize: '0.98rem', color: 'var(--text-gold)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Users size={16} color="var(--gold-primary)" />
              Family & Sibling Information
            </h4>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                background: '#fffdf5',
                padding: '14px 16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(196, 155, 31, 0.25)'
              }}
            >
              {/* Siblings Labeled Row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.88rem', flexWrap: 'wrap' }}>
                <span style={{ color: 'var(--text-gold)', fontWeight: 700, minWidth: '110px', flexShrink: 0 }}>
                  • Siblings:
                </span>
                <span style={{ color: '#0f172a', fontWeight: 600 }}>
                  {profile.siblings || 'Available upon family request'}
                </span>
              </div>

              {/* Father Labeled Row */}
              {profile.father && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.88rem', flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--text-gold)', fontWeight: 700, minWidth: '110px', flexShrink: 0 }}>
                    • Father:
                  </span>
                  <span style={{ color: '#334155' }}>
                    {profile.father}
                  </span>
                </div>
              )}

              {/* Mother Labeled Row */}
              {profile.mother && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.88rem', flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--text-gold)', fontWeight: 700, minWidth: '110px', flexShrink: 0 }}>
                    • Mother:
                  </span>
                  <span style={{ color: '#334155' }}>
                    {profile.mother}
                  </span>
                </div>
              )}

              {/* Family Background Row */}
              {profile.family && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.88rem', flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--text-gold)', fontWeight: 700, minWidth: '110px', flexShrink: 0 }}>
                    • Family:
                  </span>
                  <span style={{ color: '#475569' }}>
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
              style={{ fontSize: '0.98rem', color: 'var(--text-gold)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <FileText size={16} color="var(--gold-primary)" />
              Candidate Profile & Short Bio
            </h4>
            <p style={{ color: '#1e293b', fontSize: '0.88rem', lineHeight: '1.6', background: '#f8fafc', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
              {profile.about}
            </p>
          </animated.div>

          {/* Requirements Section */}
          <animated.div style={sectionTrail[4]}>
            <h4 
              className="font-cinzel"
              style={{ fontSize: '0.98rem', color: 'var(--text-gold)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Sparkles size={16} color="var(--gold-primary)" />
              Partner Requirements & Expectations
            </h4>
            <p style={{ color: '#1e293b', fontSize: '0.88rem', lineHeight: '1.6', background: '#fffdf5', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(196, 155, 31, 0.25)' }}>
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
              gap: '10px', 
              flexWrap: 'wrap',
              borderTop: '1px solid #e2e8f0',
              paddingTop: '16px'
            }}
          >
            {/* Direct WhatsApp to Male +97337188557 */}
            <button
              onClick={handleWhatsAppChat}
              className="btn-whatsapp"
              style={{
                flex: '1 1 240px',
                padding: '12px 20px',
                fontSize: '0.92rem'
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
                padding: '12px 18px',
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
