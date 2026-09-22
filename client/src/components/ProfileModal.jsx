import React, { useState, useEffect } from 'react';
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
  Star,
  Maximize2,
  ZoomIn
} from '../icons';

const resolveImageUrl = (img, profileId, instagramPostId) => {
  // 1. If direct base64 image data, use directly
  if (img && typeof img === 'string' && img.startsWith('data:image/')) {
    return img;
  }

  // 2. If full external URL (Supabase storage, CDN, etc.), use directly
  if (img && typeof img === 'string' && (img.startsWith('https://') || img.startsWith('http://'))) {
    if (img.includes(':5000/uploads/')) {
      return img.substring(img.indexOf('/uploads/'));
    }
    return img;
  }

  // 3. Normalize relative upload URLs — always return clean relative /uploads/...
  if (img && typeof img === 'string') {
    let clean = img.trim();
    if (clean.startsWith('/public/uploads/')) clean = clean.replace('/public/uploads/', '/uploads/');
    if (clean.startsWith('public/uploads/')) clean = clean.replace('public/uploads/', '/uploads/');
    if (clean.startsWith('uploads/')) clean = `/${clean}`;
    if (clean.startsWith('/uploads/')) return clean;
    if (clean.includes('.') && !clean.includes('/')) return `/uploads/${clean}`;
  }

  // 4. Fallback to local Instagram flyer image by instagramPostId
  if (instagramPostId) {
    return `/uploads/ig_${instagramPostId}.jpg`;
  }

  // 5. Fallback to localStorage image cache if available
  if (profileId) {
    try {
      const cached = localStorage.getItem(`nikah_img_${profileId}`);
      if (cached) return cached;
    } catch (_) {}
  }

  return '';
};

export default function ProfileModal({ profile, isFavorite, onToggleFavorite, onClose }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const initialImg = resolveImageUrl(profile?.image, profile?.id, profile?.instagramPostId);
  const [modalImgSrc, setModalImgSrc] = useState(initialImg);
  const [modalImgError, setModalImgError] = useState(!initialImg);
  const [hasFallbackTried, setHasFallbackTried] = useState(false);

  useEffect(() => {
    const nextImg = resolveImageUrl(profile?.image, profile?.id, profile?.instagramPostId);
    setModalImgSrc(nextImg);
    setModalImgError(!nextImg);
    setHasFallbackTried(false);
  }, [profile?.image, profile?.id, profile?.instagramPostId]);

  const handleModalImgError = () => {
    if (!hasFallbackTried) {
      setHasFallbackTried(true);
      if (profile?.instagramPostId) {
        const localFlyer = `/uploads/ig_${profile.instagramPostId}.jpg`;
        if (localFlyer !== modalImgSrc) {
          setModalImgSrc(localFlyer);
          setModalImgError(false);
          return;
        }
      }
      try {
        const cached = localStorage.getItem(`nikah_img_${profile?.id}`);
        if (cached && cached !== modalImgSrc) {
          setModalImgSrc(cached);
          setModalImgError(false);
          return;
        }
      } catch (_) {}
    }
    setModalImgError(true);
  };

  const handleModalImgLoad = () => {
    setModalImgError(false);
    if (profile?.id && modalImgSrc && modalImgSrc.startsWith('data:image/')) {
      try {
        localStorage.setItem(`nikah_img_${profile.id}`, modalImgSrc);
      } catch (_) {}
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
      }
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, isFullscreen]);

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

  // Determine if the name is a generic auto-generated one
  const isGenericName = /^(Pakistani|Indian|Bahraini|Saudi|Emirati|\s*)\s*(Bride|Groom)/i.test((profile.name || '').trim())
    || /^(IG-|NPF-)/.test((profile.name || '').trim());

  // Use caption as fallback bio if about is empty
  const bioText = (profile.about && profile.about.trim() !== '') ? profile.about
    : (profile.caption && profile.caption.trim() !== '') ? profile.caption
    : '';

  const detailRows = [
    { icon: Calendar, label: 'Age', value: profile.age ? `${profile.age} Years` : '' },
    { icon: Ruler, label: 'Height', value: profile.height },
    { icon: Briefcase, label: 'Profession', value: profile.profession },
    { icon: GraduationCap, label: 'Education', value: profile.education },
    { icon: MapPin, label: 'Location', value: profile.location },
    { icon: Home, label: 'Residency', value: profile.residence },
    { icon: BookOpen, label: 'Sect', value: profile.sect },
    { icon: User, label: 'Caste', value: (profile.caste && profile.caste !== 'General') ? profile.caste : '' },
    { icon: FileText, label: 'Languages', value: profile.languages },
    { icon: Sparkles, label: 'Complexion & Build', value: [profile.complexion, profile.build].filter(Boolean).join(' • ') }
  ].filter(r => r.value && typeof r.value === 'string' && r.value.trim() !== '' && !r.value.includes('Confidential'));

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

        {/* Header Section with Full Image */}
        <div 
          className="modal-header"
          style={{ 
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Fallback emblem when flyer image is not present */}
          {(!modalImgSrc || modalImgError) && (
            <div style={{
              width: '100%',
              padding: '24px 16px 16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: profile.gender === 'male'
                ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
                : 'linear-gradient(135deg, #831843 0%, #500724 100%)',
              borderBottom: '2px solid var(--gold-primary)',
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid var(--gold-primary)',
                boxShadow: '0 0 20px rgba(212,175,55,0.4)',
                marginBottom: '8px'
              }}>
                <User size={32} color="var(--gold-primary)" />
              </div>
              <div style={{ color: '#ffd700', fontSize: '0.78rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>
                Nikah Bahrain Official Matrimonial Record
              </div>
            </div>
          )}

          {/* Full Complete Profile / Flyer Image */}
          {modalImgSrc && !modalImgError && (
            <animated.div style={avatarSpring}>
              <div 
                style={{
                  width: '100%',
                  position: 'relative',
                  background: '#f8fafc',
                  borderBottom: '1.5px solid var(--gold-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                <img
                  src={modalImgSrc}
                  alt={`${profile.id} - ${profile.name}`}
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    objectFit: 'contain',
                    cursor: 'zoom-in',
                  }}
                  onClick={() => setIsFullscreen(true)}
                  onError={handleModalImgError}
                  onLoad={handleModalImgLoad}
                  title="Click to view full image in high resolution"
                />
                <button
                  type="button"
                  onClick={() => setIsFullscreen(true)}
                  style={{
                    position: 'absolute',
                    bottom: '12px',
                    right: '12px',
                    background: 'rgba(15, 23, 42, 0.82)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    color: '#f59e0b',
                    border: '1px solid rgba(212, 175, 55, 0.5)',
                    borderRadius: '20px',
                    padding: '6px 14px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Maximize2 size={13} /> View Full Image
                </button>
              </div>
            </animated.div>
          )}


          {/* Name & Basic Info below image */}
          <div style={{
            padding: '20px 24px 16px 24px',
            background: genderConfig.headerBg,
            borderBottom: '1px solid var(--gold-border)',
            textAlign: 'center',
          }}>
            {/* Profile ID badge - prominent */}
            <div style={{ marginBottom: '8px' }}>
              <span
                style={{
                  background: 'linear-gradient(135deg, #0f172a, #1e293b)',
                  color: '#ffd700',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  padding: '5px 14px',
                  borderRadius: '999px',
                  letterSpacing: '0.8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  border: '1px solid rgba(255,215,0,0.4)'
                }}
              >
                <ShieldCheck size={13} /> Profile ID: {profile.id}
              </span>
            </div>

            <h2 
              className="font-cinzel"
              style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}
            >
              {profile.name}
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: '#475569', fontSize: '0.88rem', flexWrap: 'wrap' }}>
              {profile.age ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={14} /> {profile.age} Years
                </span>
              ) : null}
              {profile.age && profile.height ? <span>•</span> : null}
              {profile.height ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Ruler size={14} /> {profile.height}
                </span>
              ) : null}
              {(profile.age || profile.height) ? <span>•</span> : null}
              <span style={{ 
                color: genderConfig.accentColor,
                fontWeight: 800
              }}>
                {genderConfig.label}
              </span>
            </div>

            {/* Verified Badge */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
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
        </div>

        {/* Detail Sections */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

          {/* Nationality & Marital Status Labels */}
          {(profile.nationality || profile.maritalStatus || profile.instagramPostUrl) && (
            <animated.div style={sectionTrail[0]}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {profile.nationality ? (
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
                    {profile.nationality === 'Pakistani' ? '🇵🇰 Pakistani' : profile.nationality === 'Indian' ? '🇮🇳 Indian' : profile.nationality === 'Bahraini' ? '🇧🇭 Bahraini' : `🌍 ${profile.nationality}`}
                  </span>
                ) : null}

                {profile.maritalStatus ? (
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
                ) : null}

                {/* Instagram Source */}
                {profile.instagramPostUrl ? (
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
                ) : null}
              </div>
            </animated.div>
          )}

          {/* Info Grid - only if fields are present */}
          {detailRows.length > 0 && (
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
                  return (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', color: '#1e293b' }}>
                      <Icon size={16} color="var(--gold-primary)" style={{ flexShrink: 0 }} />
                      <span><strong style={{ color: 'var(--text-gold)' }}>{row.label}:</strong> {row.value}</span>
                    </div>
                  );
                })}
              </div>
            </animated.div>
          )}

          {/* Dedicated Family & Siblings Section - only if info is provided */}
          {(profile.siblings || profile.father || profile.mother || profile.family) && (
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
                {profile.siblings ? (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.88rem', flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--text-gold)', fontWeight: 700, minWidth: '110px', flexShrink: 0 }}>
                      • Siblings:
                    </span>
                    <span style={{ color: '#0f172a', fontWeight: 600 }}>
                      {profile.siblings}
                    </span>
                  </div>
                ) : null}

                {/* Father Labeled Row */}
                {profile.father ? (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.88rem', flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--text-gold)', fontWeight: 700, minWidth: '110px', flexShrink: 0 }}>
                      • Father:
                    </span>
                    <span style={{ color: '#334155' }}>
                      {profile.father}
                    </span>
                  </div>
                ) : null}

                {/* Mother Labeled Row */}
                {profile.mother ? (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.88rem', flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--text-gold)', fontWeight: 700, minWidth: '110px', flexShrink: 0 }}>
                      • Mother:
                    </span>
                    <span style={{ color: '#334155' }}>
                      {profile.mother}
                    </span>
                  </div>
                ) : null}

                {/* Family Background Row */}
                {profile.family ? (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.88rem', flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--text-gold)', fontWeight: 700, minWidth: '110px', flexShrink: 0 }}>
                      • Family:
                    </span>
                    <span style={{ color: '#475569' }}>
                      {profile.family}
                    </span>
                  </div>
                ) : null}
              </div>
            </animated.div>
          )}

          {/* About / Bio Section */}
          {bioText && bioText.trim() !== '' && (
            <animated.div style={sectionTrail[3]}>
              <h4 
                className="font-cinzel"
                style={{ fontSize: '0.98rem', color: 'var(--text-gold)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <FileText size={16} color="var(--gold-primary)" />
                Candidate Profile & Bio
              </h4>
              <p style={{ color: '#1e293b', fontSize: '0.88rem', lineHeight: '1.7', background: '#f8fafc', padding: '14px 16px', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0', whiteSpace: 'pre-line' }}>
                {bioText}
              </p>
            </animated.div>
          )}

          {/* No text details note for image-only profiles */}
          {!bioText && detailRows.length === 0 && (
            <animated.div style={sectionTrail[3]}>
              <div style={{
                background: '#fffdf5',
                border: '1px solid rgba(196,155,31,0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 16px',
                textAlign: 'center',
                color: '#92400e',
                fontSize: '0.88rem'
              }}>
                <Sparkles size={16} color="#d4af37" style={{ marginBottom: '6px' }} />
                <p style={{ margin: 0, fontWeight: 600 }}>All profile details are displayed in the flyer above.</p>
                <p style={{ margin: '4px 0 0', color: '#78716c', fontSize: '0.82rem' }}>Tap the image or "View Full Image" to see the complete profile flyer.</p>
              </div>
            </animated.div>
          )}

          {/* Requirements Section - only if provided */}
          {profile.requirements && profile.requirements.trim() !== '' && (
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
          )}

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

      {/* Fullscreen Lightbox for Complete Flyer Viewing */}
      {isFullscreen && modalImgSrc && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.94)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px',
            cursor: 'zoom-out',
          }}
          onClick={() => setIsFullscreen(false)}
        >
          <button
            onClick={() => setIsFullscreen(false)}
            style={{
              position: 'fixed',
              top: '18px',
              right: '18px',
              background: 'rgba(255, 255, 255, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              borderRadius: '50%',
              width: '42px',
              height: '42px',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10001,
              boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
            }}
            title="Close full screen"
          >
            <X size={22} />
          </button>
          <img
            src={modalImgSrc}
            alt={`${profile.id} - ${profile.name}`}
            style={{
              maxWidth: '96vw',
              maxHeight: '94vh',
              width: 'auto',
              height: 'auto',
              objectFit: 'contain',
              borderRadius: '8px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.6)',
              cursor: 'default',
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </animated.div>
  );
}
