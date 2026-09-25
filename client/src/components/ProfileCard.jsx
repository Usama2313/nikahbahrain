import React, { useState, useRef, useEffect } from 'react';
import { useSpring, animated } from '@react-spring/web';
import {
  Heart,
  MessageCircle,
  ShieldCheck,
  MapPin,
  User,
  ExternalLink
} from '../icons';
import confetti from 'canvas-confetti';

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

  return '';
};



export default function ProfileCard({
  profile,
  isFavorite = false,
  onToggleFavorite,
  onViewDetails
}) {
  const [hovered, setHovered] = useState(false);
  const cardRef = useRef(null);

  const initialImg = resolveImageUrl(profile.image, profile.id, profile.instagramPostId);
  const [imgSrc, setImgSrc] = useState(initialImg);
  const [imgError, setImgError] = useState(!initialImg);
  const [hasFallbackTried, setHasFallbackTried] = useState(false);

  useEffect(() => {
    const nextImg = resolveImageUrl(profile.image, profile.id, profile.instagramPostId);
    setImgSrc(nextImg);
    setImgError(!nextImg);
    setHasFallbackTried(false);
  }, [profile.image, profile.id, profile.instagramPostId]);

  const handleImageError = () => {
    if (!hasFallbackTried) {
      setHasFallbackTried(true);
      // Try local flyer image by instagramPostId
      if (profile.instagramPostId) {
        const localFlyer = `/uploads/ig_${profile.instagramPostId}.jpg`;
        if (localFlyer !== imgSrc) {
          setImgSrc(localFlyer);
          setImgError(false);
          return;
        }
      }
    }
    setImgError(true);
  };

  const handleImageLoad = () => {
    setImgError(false);
  };

  const hoverSpring = useSpring({
    boxShadow: hovered
      ? '0 20px 50px -12px rgba(212, 175, 55, 0.35), 0 0 30px rgba(212, 175, 55, 0.15)'
      : '0 4px 20px -4px rgba(0, 0, 0, 0.15)',
    borderColor: hovered ? 'rgba(212, 175, 55, 0.6)' : 'rgba(212, 175, 55, 0.2)',
    transform: hovered ? 'translateY(-4px)' : 'translateY(0px)',
    config: { tension: 280, friction: 22 }
  });

  const heartSpring = useSpring({
    transform: isFavorite ? 'scale(1.3) rotate(-8deg)' : 'scale(1)',
    config: { tension: 450, friction: 12 }
  });

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    onToggleFavorite(profile.id);
    if (!isFavorite) {
      confetti({
        particleCount: 25,
        spread: 50,
        origin: { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight },
        colors: ['#ef4444', '#f59e0b', '#d4af37', '#ffffff']
      });
    }
  };

  const handleWhatsAppChat = (e) => {
    e.stopPropagation();
    const phone = '97337188557';
    const message = `Assalamu Alaikum Qabul Hai Team,

I am interested in this verified proposal:
â€¢ Profile ID: ${profile.id}
â€¢ Candidate: ${profile.name} (${profile.gender === 'male' ? 'Groom' : 'Bride'})
â€¢ Age & Marital Status: ${profile.age} yrs (${profile.maritalStatus})
â€¢ Nationality: ${profile.nationality}
â€¢ Profession: ${profile.profession}
â€¢ Location: ${profile.location}
â€¢ Instagram Ref: ${profile.instagramPostUrl}

Please provide more details. JazakAllah Khair!`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleInstagramClick = (e) => {
    e.stopPropagation();
    if (profile.instagramPostUrl) window.open(profile.instagramPostUrl, '_blank');
  };

  const genderConfig = profile.gender === 'male'
    ? { badge: 'GROOM', badgeBg: 'linear-gradient(135deg,#1d4ed8,#3b82f6)' }
    : { badge: 'BRIDE', badgeBg: 'linear-gradient(135deg,#be185d,#ec4899)' };

    const maritalEmoji = { 'Never Married': '💍', 'Divorced': '🔄', '2nd Marriage': '✨', 'Widowed': '🕊️', 'Separated': '📋' }[profile.maritalStatus] || '📋';
  const nationalityFlag = { Pakistani: '🇵🇰', Indian: '🇮🇳', Bahraini: '🇧🇭', 'Saudi Arabia': '🇸🇦', Emirati: '🇦🇪' }[profile.nationality] || '🌍';

  const displayName = profile.name || `${profile.id} · ${(profile.nationality ? profile.nationality + ' ' : '')}${profile.gender === 'male' ? 'Groom' : 'Bride'}`;


  return (
    <animated.div
      ref={cardRef}
      onClick={() => onViewDetails && onViewDetails(profile)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...hoverSpring,
        cursor: 'pointer',
        height: '100%',
        width: '100%',
        maxWidth: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 'var(--radius-lg)',
        background: '#ffffff',
        border: '1.5px solid var(--gold-border)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* ── Image Section: 4:5 for flyer images, compact typography header for bio-data text cards ── */}
      <div style={{
        position: 'relative',
        width: '100%',
        aspectRatio: (imgSrc && !imgError) ? '4 / 5' : 'auto',
        minHeight: (imgSrc && !imgError) ? 'auto' : '150px',
        overflow: 'hidden',
        background: '#0f172a'
      }}>
        {imgSrc && !imgError ? (
          <img
            src={imgSrc}
            alt={profile.id}
            onError={handleImageError}
            onLoad={handleImageLoad}
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              objectPosition: 'center',
              display: 'block',
              background: '#0f172a'
            }}
          />
        ) : (
          <div style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: profile.gender === 'female'
              ? 'linear-gradient(135deg, #831843 0%, #500724 100%)'
              : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            flexDirection: 'column',
            gap: '8px',
            padding: '24px 16px',
            textAlign: 'center',
            position: 'relative'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--gold-primary)',
              boxShadow: '0 0 15px rgba(212,175,55,0.4)',
              marginBottom: '2px'
            }}>
              <User size={28} color="var(--gold-primary)" />
            </div>
            <div className="font-cinzel" style={{ color: '#ffffff', fontWeight: 800, fontSize: '1rem', letterSpacing: '0.4px', lineHeight: 1.2 }}>
              {displayName}
            </div>
            {(profile.age || profile.maritalStatus) && (
              <div style={{ color: '#fae182', fontSize: '0.78rem', fontWeight: 700 }}>
                {[profile.age ? `${profile.age} Yrs` : '', profile.maritalStatus].filter(Boolean).join(' • ')}
              </div>
            )}
            {profile.profession && (
              <div style={{ color: '#cbd5e1', fontSize: '0.72rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '90%' }}>
                💼 {profile.profession}
              </div>
            )}
            <div style={{ background: 'rgba(255,215,0,0.15)', color: '#ffd700', padding: '3px 10px', borderRadius: '9999px', fontSize: '0.68rem', fontWeight: 800, border: '1px solid rgba(255,215,0,0.3)', marginTop: '4px' }}>
              📋 Details Card
            </div>
          </div>
        )}

        {/* Top-left: Profile ID badge */}
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(6px)',
          color: '#ffd700',
          fontSize: '0.72rem',
          fontWeight: 800,
          padding: '3px 10px',
          borderRadius: '999px',
          letterSpacing: '0.5px',
          border: '1px solid rgba(255,215,0,0.3)'
        }}>
          {profile.id}
        </div>

        {/* Top-right: Bride/Groom badge */}
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: genderConfig.badgeBg,
          color: '#fff',
          fontSize: '0.68rem',
          fontWeight: 800,
          padding: '3px 10px',
          borderRadius: '999px',
          letterSpacing: '1px'
        }}>
          {genderConfig.badge}
        </div>

        {/* Bottom overlay gradient with action buttons */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 100%)',
          padding: '28px 12px 10px 12px',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '8px',
          alignItems: 'center'
        }}>
          {/* Instagram link */}
          {profile.instagramPostUrl && (
            <button
              onClick={handleInstagramClick}
              title="View on Instagram"
              style={{
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(6px)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '50%',
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#fff'
              }}
            >
              <ExternalLink size={15} />
            </button>
          )}

          {/* Heart favorite */}
          <animated.button
            onClick={handleFavoriteClick}
            style={{
              ...heartSpring,
              background: isFavorite ? 'rgba(239,68,68,0.85)' : 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(6px)',
              border: `1px solid ${isFavorite ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.3)'}`,
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#fff',
              outline: 'none'
            }}
            title={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
          >
            <Heart size={15} fill={isFavorite ? '#fff' : 'none'} strokeWidth={2.2} />
          </animated.button>
        </div>

        {/* Verified badge */}
        {profile.verified && (
          <div style={{
            position: 'absolute',
            bottom: '52px',
            left: '10px',
            background: '#10b981',
            color: '#fff',
            fontSize: '0.65rem',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: '999px',
            display: 'flex',
            alignItems: 'center',
            gap: '3px'
          }}>
            <ShieldCheck size={10} /> Verified
          </div>
        )}
      </div>

      {/* â”€â”€ Info Section below image â”€â”€ */}
      <div style={{
        padding: '10px 12px 12px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        flex: 1
      }}>
        {/* Marital Status + Nationality row — only display verified authentic fields */}
        {(profile.maritalStatus || profile.nationality) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', alignItems: 'center' }}>
            {profile.maritalStatus && (
              <span style={{
                background: '#fef9c3',
                border: '1px solid #fde68a',
                color: '#92400e',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '999px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px'
              }}>
                {maritalEmoji} {profile.maritalStatus}
              </span>
            )}
            {profile.nationality && (
              <span style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                color: '#166534',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '999px'
              }}>
                {nationalityFlag} {profile.nationality}
              </span>
            )}
          </div>
        )}

        {/* Location + age row — only display verified age */}
        {(profile.age || profile.location) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#475569', flexWrap: 'wrap' }}>
            {profile.age && (
              <span style={{ fontWeight: 600, color: '#334155' }}>{profile.age} yrs</span>
            )}
            {profile.age && profile.location && <span style={{ color: '#cbd5e1' }}>•</span>}
            {profile.location && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <MapPin size={11} color="#d4af37" /> {profile.location}
              </span>
            )}
          </div>
        )}

        {/* Profession */}
        {profile.profession && profile.profession !== 'Professional' && (
          <div style={{ fontSize: '0.75rem', color: '#334155', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            💼 {profile.profession}
          </div>
        )}

        {/* Education */}
        {profile.education && (
          <div style={{ fontSize: '0.74rem', color: '#475569', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            🎓 {profile.education}
          </div>
        )}

        {/* If no metadata exists, show clear indicator that all details are on the flyer picture */}
        {!profile.maritalStatus && !profile.nationality && !profile.age && (
          <div style={{ fontSize: '0.74rem', color: '#64748b', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '4px', margin: '2px 0' }}>
            <span>📄</span>
            <span>All details in flyer above</span>
          </div>
        )}

        {/* Sect / Caste small tags */}
        {(profile.sect || (profile.caste && profile.caste !== 'General')) && (
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            {profile.sect && (
              <span style={{ fontSize: '0.68rem', color: '#64748b', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '1px 7px', borderRadius: '999px', fontWeight: 600 }}>
                {profile.sect}
              </span>
            )}
            {profile.caste && profile.caste !== 'General' && (
              <span style={{ fontSize: '0.68rem', color: '#64748b', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '1px 7px', borderRadius: '999px', fontWeight: 600 }}>
                {profile.caste}
              </span>
            )}
          </div>
        )}

        {/* Actions row */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          <button
            onClick={(e) => { e.stopPropagation(); onViewDetails(profile); }}
            style={{ 
              flex: 1, 
              padding: '8px 0', 
              fontSize: '0.85rem',
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              color: '#334155',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontWeight: 600,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            Details
          </button>
          <button
            onClick={handleWhatsAppChat}
            className="btn-whatsapp"
            title="Enquire via WhatsApp"
            style={{ flex: 1, padding: '8px 0', fontSize: '0.85rem', width: 'auto' }}
          >
            <MessageCircle size={14} style={{ flexShrink: 0 }} />
            <span>Enquire</span>
          </button>
        </div>
      </div>
    </animated.div>
  );
}

