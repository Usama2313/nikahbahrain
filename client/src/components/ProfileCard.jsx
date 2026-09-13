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
} from 'lucide-react';
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

  // Nationality badge styling
  const nationalityBadge = {
    Pakistani: { flag: '🇵🇰', label: 'Pakistani', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.4)', text: '#6ee7b7' },
    Indian: { flag: '🇮🇳', label: 'Indian', bg: 'rgba(249, 115, 22, 0.15)', border: 'rgba(249, 115, 22, 0.4)', text: '#fdba74' },
    Bahraini: { flag: '🇧🇭', label: 'Bahraini', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.4)', text: '#fca5a5' }
  }[profile.nationality] || { flag: '🌍', label: profile.nationality, bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.4)', text: '#93c5fd' };

  // Marital status badge styling
  const maritalBadge = {
    'Never Married': { emoji: '💍', bg: 'rgba(212, 175, 55, 0.15)', border: 'rgba(212, 175, 55, 0.4)', text: '#fce588' },
    'Divorced': { emoji: '🔄', bg: 'rgba(168, 85, 247, 0.15)', border: 'rgba(168, 85, 247, 0.4)', text: '#d8b4fe' },
    'Widowed': { emoji: '🕊️', bg: 'rgba(14, 165, 233, 0.15)', border: 'rgba(14, 165, 233, 0.4)', text: '#7dd3fc' }
  }[profile.maritalStatus] || { emoji: '📋', bg: 'rgba(255, 255, 255, 0.1)', border: 'rgba(255, 255, 255, 0.2)', text: '#ffffff' };

  // Gender gradient and icon
  const genderConfig = profile.gender === 'male' 
    ? { 
        gradient: 'linear-gradient(135deg, #1e3a5f 0%, #0c2340 100%)',
        accentBorder: 'rgba(59, 130, 246, 0.4)',
        iconBg: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
        label: 'GROOM'
      }
    : {
        gradient: 'linear-gradient(135deg, #4a1942 0%, #2d1033 100%)',
        accentBorder: 'rgba(236, 72, 153, 0.4)',
        iconBg: 'linear-gradient(135deg, #ec4899, #be185d)',
        label: 'BRIDE'
      };

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
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 'var(--radius-lg)',
        background: 'linear-gradient(145deg, rgba(9, 25, 48, 0.95) 0%, rgba(6, 17, 34, 0.98) 100%)',
        border: '1px solid',
        overflow: 'hidden',
        position: 'relative',
        transition: 'background 0.3s ease'
      }}
    >
      {/* Animated glow overlay on hover */}
      <animated.div
        style={{
          position: 'absolute',
          inset: 0,
          background: genderConfig.gradient,
          opacity: springProps.glowOpacity.to(o => o * 0.15),
          pointerEvents: 'none',
          zIndex: 0,
          borderRadius: 'var(--radius-lg)'
        }}
      />

      {/* Top Header Section with ID, Avatar & Badges */}
      <div 
        style={{
          padding: '18px 18px 14px 18px',
          position: 'relative',
          zIndex: 1,
          borderBottom: '1px solid rgba(255,255,255,0.06)'
        }}
      >
        {/* Top Row: ID + Verified + Heart */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '14px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span 
              style={{
                background: 'rgba(4, 10, 20, 0.85)',
                border: '1px solid var(--gold-border)',
                color: 'var(--gold-light)',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 'var(--radius-full)',
                letterSpacing: '0.5px'
              }}
            >
              {profile.id}
            </span>
            {profile.verified && (
              <span 
                style={{
                  background: 'rgba(16, 185, 129, 0.85)',
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
              background: 'rgba(5, 12, 22, 0.85)',
              border: `1px solid ${isFavorite ? '#ef4444' : 'rgba(255,255,255,0.15)'}`,
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: isFavorite ? '0 0 14px rgba(239, 68, 68, 0.5)' : 'none',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <animated.div
            style={{
              ...avatarSpring,
              width: '56px',
              height: '56px',
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
            <User size={26} color="#ffffff" />
            <span
              style={{
                position: 'absolute',
                bottom: '-4px',
                right: '-4px',
                background: genderConfig.iconBg,
                fontSize: '0.6rem',
                fontWeight: 800,
                color: '#fff',
                padding: '1px 5px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid rgba(255,255,255,0.3)',
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
                fontSize: '1.15rem',
                fontWeight: 700,
                color: 'var(--gold-light)',
                letterSpacing: '0.3px',
                marginBottom: '3px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {profile.name}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.83rem', color: 'var(--text-muted)' }}>
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
          padding: '10px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          zIndex: 1,
          borderBottom: '1px solid rgba(255,255,255,0.04)'
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
            padding: '4px 10px',
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
            padding: '4px 10px',
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
              background: 'rgba(212, 175, 55, 0.1)',
              border: '1px solid rgba(212, 175, 55, 0.25)',
              color: 'var(--gold-light)',
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
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--text-dim)',
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
          padding: '14px 18px 16px 18px',
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
                  fontSize: '0.83rem', 
                  color: '#e2e8f0'
                }}
              >
                <Icon size={14} color={item.color} style={{ flexShrink: 0 }} />
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
                gap: '8px',
                fontSize: '0.79rem',
                color: '#cbd5e1',
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(212, 175, 55, 0.15)'
              }}
            >
              <strong style={{ color: 'var(--gold-light)', flexShrink: 0 }}>Siblings:</strong>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {profile.siblings}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons: Chat on WhatsApp & View Details */}
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '8px', 
            borderTop: '1px solid rgba(255,255,255,0.06)',
            paddingTop: '12px'
          }}
        >
          {/* Chat Button -> WhatsApp to Male +97337188557 */}
          <button
            onClick={handleWhatsAppChat}
            className="btn-whatsapp"
            title="Chat via WhatsApp with details to Male Coordinator +97337188557"
          >
            <MessageCircle size={15} />
            <span>Chat WhatsApp</span>
          </button>

          {/* View Details Modal */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(profile);
            }}
            className="btn-ghost"
            style={{
              padding: '8px 12px',
              fontSize: '0.84rem'
            }}
          >
            <Eye size={15} color="var(--gold-primary)" />
            <span>Details</span>
          </button>
        </div>
      </div>
    </animated.div>
  );
}
