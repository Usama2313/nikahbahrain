import React, { useState, useRef } from 'react';
import { useSpring, useTrail, animated, config } from '@react-spring/web';
import { 
  Heart, 
  MessageCircle, 
  ShieldCheck, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Calendar, 
  Instagram, 
  Eye,
  CheckCircle2,
  Sparkles,
  User,
  Ruler,
  BookOpen
} from '../icons';
import confetti from 'canvas-confetti';

export default function ProfileCard({ 
  profile, 
  isFavorite = false, 
  onToggleFavorite, 
  onViewDetails 
}) {
  const [hovered, setHovered] = useState(false);
  const [justFavorited, setJustFavorited] = useState(false);
  const cardRef = useRef(null);

  // 3D Tilt React-Spring animation with enhanced physics
  const [springProps, api] = useSpring(() => ({
    xys: [0, 0, 1],
    glowOpacity: 0,
    config: { mass: 1, tension: 350, friction: 26 }
  }));

  // Heart pop spring physics with bouncy overshoot
  const heartSpring = useSpring({
    transform: isFavorite ? 'scale(1.3) rotate(-8deg)' : justFavorited ? 'scale(0.8)' : 'scale(1)',
    color: isFavorite ? '#ef4444' : '#cbd5e1',
    config: { tension: 450, friction: 12 }
  });

  // Hover elevation spring
  const hoverSpring = useSpring({
    boxShadow: hovered 
      ? '0 20px 50px -12px rgba(212, 175, 55, 0.35), 0 0 30px rgba(212, 175, 55, 0.15)' 
      : '0 4px 20px -4px rgba(0, 0, 0, 0.5)',
    borderColor: hovered ? 'rgba(212, 175, 55, 0.5)' : 'rgba(212, 175, 55, 0.15)',
    config: { tension: 280, friction: 22 }
  });

  // Gender avatar spring pulse
  const avatarSpring = useSpring({
    transform: hovered ? 'scale(1.08)' : 'scale(1)',
    boxShadow: hovered 
      ? `0 0 24px ${profile.gender === 'male' ? 'rgba(59, 130, 246, 0.5)' : 'rgba(236, 72, 153, 0.5)'}` 
      : '0 0 0px transparent',
    config: { tension: 300, friction: 18 }
  });

  // Info items stagger on hover
  const infoItems = [
    { icon: Briefcase, text: profile.profession, color: 'var(--gold-primary)' },
    { icon: GraduationCap, text: profile.education, color: 'var(--gold-primary)' },
    { icon: MapPin, text: profile.location, color: 'var(--gold-primary)' },
  ];

  const infoTrail = useTrail(infoItems.length, {
    transform: hovered ? 'translateX(0px)' : 'translateX(-3px)',
    opacity: 1,
    config: { tension: 320, friction: 22 }
  });

  const calc = (x, y, rect) => [
    -(y - rect.top - rect.height / 2) / 20,
    (x - rect.left - rect.width / 2) / 20,
    1.03
  ];
  const trans = (x, y, s) => `perspective(800px) rotateX(${x}deg) rotateY(${y}deg) scale(${s})`;

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    api.start({ xys: calc(e.clientX, e.clientY, rect), glowOpacity: 1 });
  };

  const handleMouseLeave = () => {
    setHovered(false);
    api.start({ xys: [0, 0, 1], glowOpacity: 0 });
  };

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    onToggleFavorite(profile.id);

    if (!isFavorite) {
      setJustFavorited(true);
      confetti({
        particleCount: 25,
        spread: 50,
        origin: { 
          x: e.clientX / window.innerWidth, 
          y: e.clientY / window.innerHeight 
        },
        colors: ['#ef4444', '#f59e0b', '#d4af37', '#ffffff']
      });
      setTimeout(() => setJustFavorited(false), 800);
    }
  };

  // WhatsApp click -> Male +97337188557
  const handleWhatsAppChat = (e) => {
    e.stopPropagation();
    const phone = '97337188557';
    const message = `Assalamu Alaikum Qabul Hai Team,

I am interested in this verified proposal:
• Profile ID: ${profile.id}
• Candidate: ${profile.name} (${profile.gender === 'male' ? 'Groom' : 'Bride'})
• Age & Marital Status: ${profile.age} yrs (${profile.maritalStatus})
• Nationality: ${profile.nationality}
• Profession: ${profile.profession}
• Siblings: ${profile.siblings || 'N/A'}
• Location: ${profile.location}
• Instagram Ref: ${profile.instagramPostUrl}

Please provide more details. JazakAllah Khair!`;

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Nationality badge styling - high contrast for white background
  const nationalityBadge = {
    Pakistani: { flag: '🇵🇰', label: 'Pakistani', bg: '#ecfdf5', border: '#a7f3d0', text: '#065f46' },
    Indian: { flag: '🇮🇳', label: 'Indian', bg: '#fff7ed', border: '#fed7aa', text: '#9a3412' },
    Bahraini: { flag: '🇧🇭', label: 'Bahraini', bg: '#fef2f2', border: '#fecaca', text: '#991b1b' }
  }[profile.nationality] || { flag: '🌍', label: profile.nationality, bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af' };

  // Marital status badge styling - high contrast for white background
  const maritalBadge = {
    'Never Married': { emoji: '💍', bg: '#fefce8', border: '#fef08a', text: '#854d0e' },
    'Divorced': { emoji: '🔄', bg: '#faf5ff', border: '#e9d5ff', text: '#6b21a8' },
    '2nd Marriage': { emoji: '✨', bg: '#fff7ed', border: '#ffedd5', text: '#c2410c' },
    'Widowed': { emoji: '🕊️', bg: '#f0f9ff', border: '#bae6fd', text: '#0369a1' }
  }[profile.maritalStatus] || { emoji: '📋', bg: '#f1f5f9', border: '#cbd5e1', text: '#334155' };

  // Gender gradient and icon
  const genderConfig = profile.gender === 'male' 
    ? { 
        gradient: 'linear-gradient(135deg, #1e40af 0%, #1d4ed8 100%)',
        accentBorder: 'rgba(59, 130, 246, 0.4)',
        iconBg: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
        label: 'GROOM'
      }
    : {
        gradient: 'linear-gradient(135deg, #db2777 0%, #be185d 100%)',
        accentBorder: 'rgba(236, 72, 153, 0.4)',
        iconBg: 'linear-gradient(135deg, #ec4899, #be185d)',
        label: 'BRIDE'
      };

  // Pure clean white card surface with crisp gold border
  const cardBackground = '#ffffff';

  return (
    <animated.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={() => onViewDetails(profile)}
      style={{
        transform: springProps.xys.to(trans),
        ...hoverSpring,
        cursor: 'pointer',
        height: '100%',
        width: '100%',
        maxWidth: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 'var(--radius-lg)',
        background: cardBackground,
        border: '1.5px solid var(--gold-border)',
        boxShadow: '0 4px 18px rgba(0, 0, 0, 0.05)',
        overflow: 'hidden',
        position: 'relative',
        transition: 'background 0.3s ease, border-color 0.3s ease'
      }}
    >
      {/* Top Header Section with ID, Avatar & Badges */}
      <div 
        style={{
          padding: '16px 16px 12px 16px',
          position: 'relative',
          zIndex: 1,
          borderBottom: '1px solid #f1f5f9'
        }}
      >
        {/* Top Row: ID + Verified + Heart */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span 
              style={{
                background: '#fefce8',
                border: '1px solid rgba(196, 155, 31, 0.4)',
                color: 'var(--text-gold)',
                fontSize: '0.72rem',
                fontWeight: 800,
                padding: '3px 9px',
                borderRadius: 'var(--radius-full)',
                letterSpacing: '0.5px'
              }}
            >
              {profile.id}
            </span>
            {profile.verified && (
              <span 
                style={{
                  background: '#10b981',
                  color: '#ffffff',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-full)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px'
                }}
              >
                <ShieldCheck size={11} /> Verified
              </span>
            )}
          </div>

          {/* Heart Favorite Button */}
          <animated.button
            onClick={handleFavoriteClick}
            style={{
              ...heartSpring,
              background: '#f8fafc',
              border: `1px solid ${isFavorite ? '#ef4444' : 'rgba(0,0,0,0.1)'}`,
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: isFavorite ? '0 0 10px rgba(239, 68, 68, 0.3)' : 'none',
              outline: 'none'
            }}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart
              size={16}
              fill={isFavorite ? '#ef4444' : 'none'}
              strokeWidth={2.2}
            />
          </animated.button>
        </div>

        {/* Avatar Circle + Name & Age */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <animated.div
            style={{
              ...avatarSpring,
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: genderConfig.iconBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              border: `2px solid ${genderConfig.accentBorder}`,
              position: 'relative'
            }}
          >
            <User size={24} color="#ffffff" />
            <span
              style={{
                position: 'absolute',
                bottom: '-4px',
                right: '-4px',
                background: genderConfig.iconBg,
                fontSize: '0.58rem',
                fontWeight: 800,
                color: '#fff',
                padding: '1px 5px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid rgba(255,255,255,0.6)',
                letterSpacing: '0.5px'
              }}
            >
              {genderConfig.label}
            </span>
          </animated.div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 
              className="font-cinzel"
              style={{
                fontSize: '1.1rem',
                fontWeight: 800,
                color: '#0f172a',
                letterSpacing: '0.2px',
                marginBottom: '2px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {profile.name}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#64748b' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Calendar size={12} /> {profile.age} yrs
              </span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Ruler size={12} /> {profile.height}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Badges Row: Nationality + Marital Status */}
      <div
        style={{
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          flexWrap: 'wrap',
          zIndex: 1,
          borderBottom: '1px solid #f1f5f9'
        }}
      >
        {/* Nationality Checked Label */}
        <span
          style={{
            background: nationalityBadge.bg,
            border: `1px solid ${nationalityBadge.border}`,
            color: nationalityBadge.text,
            fontSize: '0.74rem',
            fontWeight: 700,
            padding: '3px 9px',
            borderRadius: 'var(--radius-full)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <CheckCircle2 size={11} />
          <span>{nationalityBadge.flag} {nationalityBadge.label}</span>
        </span>

        {/* Marital Status Checked Label */}
        <span
          style={{
            background: maritalBadge.bg,
            border: `1px solid ${maritalBadge.border}`,
            color: maritalBadge.text,
            fontSize: '0.74rem',
            fontWeight: 700,
            padding: '3px 9px',
            borderRadius: 'var(--radius-full)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <CheckCircle2 size={11} />
          <span>{maritalBadge.emoji} {profile.maritalStatus}</span>
        </span>

        {/* Caste tag */}
        {profile.caste && profile.caste !== 'General' && (
          <span
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              color: '#475569',
              fontSize: '0.7rem',
              fontWeight: 600,
              padding: '3px 8px',
              borderRadius: 'var(--radius-full)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px'
            }}
          >
            <User size={10} /> Caste: {profile.caste}
          </span>
        )}

        {/* Sect small tag */}
        {profile.sect && (
          <span
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              color: '#64748b',
              fontSize: '0.7rem',
              fontWeight: 600,
              padding: '3px 8px',
              borderRadius: 'var(--radius-full)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px'
            }}
          >
            <BookOpen size={10} /> {profile.sect}
          </span>
        )}
      </div>

      {/* Card Content & Info Details with Staggered Animation */}
      <div 
        style={{ 
          padding: '14px 16px 16px 16px',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          justifyContent: 'space-between',
          zIndex: 1
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
          {infoTrail.map((trailStyle, idx) => {
            const item = infoItems[idx];
            const Icon = item.icon;
            return (
              <animated.div 
                key={idx} 
                style={{
                  ...trailStyle,
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  fontSize: '0.86rem', 
                  fontWeight: 500,
                  color: '#1e293b'
                }}
              >
                <Icon size={14} color="var(--gold-primary)" style={{ flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.text}
                </span>
              </animated.div>
            );
          })}

          {/* Explicit Siblings Label Row if available */}
          {profile.siblings && (
            <div 
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '6px',
                fontSize: '0.82rem',
                color: '#334155',
                background: '#fefce8',
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(196, 155, 31, 0.25)'
              }}
            >
              <strong style={{ color: 'var(--text-gold)', flexShrink: 0 }}>Siblings:</strong>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {profile.siblings}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons: Chat on WhatsApp & View Details */}
        <div className="profile-card-actions" style={{ width: '100%', boxSizing: 'border-box' }}>
          {/* Chat Button -> WhatsApp to Male +97337188557 */}
          <button
            onClick={handleWhatsAppChat}
            className="btn-whatsapp"
            title="Chat via WhatsApp with details to Male Coordinator +97337188557"
            style={{ minWidth: 0, overflow: 'hidden' }}
          >
            <MessageCircle size={15} style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Chat WhatsApp</span>
          </button>

          {/* View Details Modal */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(profile);
            }}
            className="btn-ghost"
            style={{
              padding: '8px 14px',
              fontSize: '0.84rem',
              flexShrink: 0,
              whiteSpace: 'nowrap'
            }}
          >
            <Eye size={15} color="var(--gold-primary)" style={{ flexShrink: 0 }} />
            <span>Details</span>
          </button>
        </div>
      </div>
    </animated.div>
  );
}
