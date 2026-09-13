import React, { useState, useEffect } from 'react';
import { useSpring, animated } from '@react-spring/web';
import {
  Heart,
  PlusCircle,
  Instagram,
  Sparkles,
  Home,
  User,
  PhoneCall,
  Menu,
  X
} from '../icons';
import logoImg from '../assets/logo.jpg';

export const NAV_TABS = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'groom', label: 'View Groom', icon: User, gender: 'male' },
  { id: 'bride', label: 'View Bride', icon: User, gender: 'female' },
  { id: 'favorites', label: 'Favorites', icon: Heart, isFav: true },
  { id: 'contact', label: 'Contact', icon: PhoneCall, isContact: true }
];

export const TABS = NAV_TABS;

export default function Navbar({
  activeTab = 'home',
  onSelectTab,
  favoritesCount = 0,
  onOpenCreateProfile,
  isAdminActive = false,
  onReplaySplash
}) {
  const [btnHovered, setBtnHovered] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Close menu when tab is selected
  const handleTabSelect = (tabId) => {
    setMobileMenuOpen(false);
    onSelectTab(tabId);
  };

  const createBtnSpring = useSpring({
    transform: btnHovered ? 'translateY(-2.5px) scale(1.03)' : 'translateY(0px) scale(1)',
    boxShadow: btnHovered
      ? '0 10px 25px rgba(212, 175, 55, 0.6), 0 0 15px rgba(250, 225, 130, 0.4)'
      : '0 4px 14px rgba(212, 175, 55, 0.35)',
    config: { tension: 380, friction: 18 }
  });

  const plusIconSpring = useSpring({
    transform: btnHovered ? 'rotate(90deg) scale(1.15)' : 'rotate(0deg) scale(1)',
    config: { tension: 350, friction: 16 }
  });

  // Mobile menu drawer animation
  const drawerSpring = useSpring({
    transform: mobileMenuOpen ? 'translateY(0%)' : 'translateY(-110%)',
    opacity: mobileMenuOpen ? 1 : 0,
    config: { tension: 320, friction: 28 }
  });

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)' }}>
      {/* Top micro bar */}
      <div
        style={{
          background: 'linear-gradient(90deg, #133a2b 0%, #1c523c 50%, #133a2b 100%)',
          borderBottom: '1px solid rgba(212, 175, 55, 0.25)',
          padding: '4px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.78rem',
          flexWrap: 'wrap',
          gap: '4px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="font-arabic" style={{ color: '#fae182', fontSize: 'clamp(0.78rem, 2vw, 0.96rem)', letterSpacing: '0.5px' }}>
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <a
            href="https://www.instagram.com/nikah_bahrain/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              color: '#fae182',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.78rem',
              transition: 'transform 0.2s ease, opacity 0.2s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <Instagram size={13} />
            <span>@nikah_bahrain</span>
          </a>
          <button
            onClick={onReplaySplash}
            title="Replay intro animation"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.74rem',
              transition: 'color 0.2s ease, transform 0.2s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#fae182'; e.currentTarget.style.transform = 'scale(1.08)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <Sparkles size={12} color="#fae182" />
            <span>Intro</span>
          </button>
        </div>
      </div>

      {/* Main Nav Bar */}
      <div
        style={{
          background: '#1e5641',
          borderBottom: '2px solid rgba(212, 175, 55, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          minHeight: '56px',
          position: 'relative'
        }}
      >
        {/* Brand Logo */}
        <div
          onClick={() => handleTabSelect('home')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            userSelect: 'none',
            padding: '8px 0',
            flexShrink: 0,
            transition: 'transform 0.2s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <div style={{
            position: 'relative',
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            padding: '2px',
            background: 'linear-gradient(135deg, #fae182, #d4af37, #b8860b)',
            boxShadow: '0 0 14px rgba(212, 175, 55, 0.5)',
            flexShrink: 0
          }}>
            <img
              src={logoImg}
              alt="Qabul Hai"
              style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
            />
          </div>
          <div>
            <div
              className="font-cinzel"
              style={{
                fontSize: 'clamp(0.9rem, 3vw, 1.25rem)',
                fontWeight: 800,
                color: '#ffffff',
                letterSpacing: '0.8px',
                lineHeight: 1.1
              }}
            >
              QABUL HAI
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--gold-light)', letterSpacing: '0.5px' }}>
              Muslim Matrimony • Bahrain
            </div>
          </div>
        </div>

        {/* Desktop Tabs */}
        {!isMobile && (
          <nav style={{ display: 'flex', alignItems: 'stretch', gap: '2px', overflowX: 'auto', alignSelf: 'stretch', flex: 1, justifyContent: 'center' }}>
            {NAV_TABS.map((tab) => (
              <NavbarTabButton
                key={tab.id}
                tab={tab}
                isActive={activeTab === tab.id && !isAdminActive}
                favoritesCount={favoritesCount}
                onClick={() => handleTabSelect(tab.id)}
              />
            ))}
          </nav>
        )}

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0', flexShrink: 0 }}>
          {!isMobile && (
            <animated.button
              id="create-profile-btn"
              onClick={onOpenCreateProfile}
              style={{
                ...createBtnSpring,
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                padding: '8px 16px',
                borderRadius: '9999px',
                background: 'linear-gradient(135deg, #fae182 0%, #d4af37 50%, #b8860b 100%)',
                border: '1.5px solid #fae182',
                color: '#0d251c',
                fontSize: '0.82rem',
                fontWeight: 800,
                cursor: 'pointer',
                letterSpacing: '0.3px',
                overflow: 'hidden',
                outline: 'none'
              }}
              className="btn-aura"
              onMouseEnter={() => setBtnHovered(true)}
              onMouseLeave={() => setBtnHovered(false)}
            >
              <animated.span style={{ ...plusIconSpring, display: 'flex', alignItems: 'center' }}>
                <PlusCircle size={15} />
              </animated.span>
              <span>Create Profile</span>
            </animated.button>
          )}

          {/* Mobile: Hamburger */}
          {isMobile && (
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              style={{
                background: 'transparent',
                border: '1.5px solid rgba(250, 225, 130, 0.4)',
                borderRadius: '8px',
                color: '#fae182',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px',
                width: '38px',
                height: '38px',
                transition: 'background 0.2s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(250,225,130,0.12)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {isMobile && (
        <animated.div
          style={{
            ...drawerSpring,
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: '#0f3325',
            borderBottom: '2px solid rgba(212,175,55,0.35)',
            zIndex: 99,
            boxShadow: '0 12px 36px rgba(0,0,0,0.6)',
            pointerEvents: mobileMenuOpen ? 'all' : 'none'
          }}
        >
          <div style={{ padding: '8px 0' }}>
            {NAV_TABS.map((tab) => {
              const isActive = activeTab === tab.id && !isAdminActive;
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabSelect(tab.id)}
                  style={{
                    width: '100%',
                    background: isActive ? 'rgba(212,175,55,0.18)' : 'transparent',
                    border: 'none',
                    borderLeft: isActive ? '3px solid #d4af37' : '3px solid transparent',
                    color: isActive ? '#fae182' : '#ffffff',
                    padding: '14px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '0.95rem',
                    fontWeight: isActive ? 700 : 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s ease, border-color 0.15s ease'
                  }}
                >
                  {tab.id === 'favorites'
                    ? <Heart size={18} color={isActive ? '#ef4444' : '#ef4444'} fill="#ef4444" />
                    : <IconComponent size={18} color={isActive ? '#fae182' : '#94a3b8'} />
                  }
                  <span>{tab.label}</span>
                  {tab.id === 'favorites' && favoritesCount > 0 && (
                    <span style={{
                      background: '#ef4444',
                      color: '#fff',
                      fontSize: '0.7rem',
                      padding: '1px 6px',
                      borderRadius: '12px',
                      fontWeight: 800
                    }}>
                      {favoritesCount}
                    </span>
                  )}
                </button>
              );
            })}

            <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '4px' }}>
              <button
                onClick={() => { setMobileMenuOpen(false); onOpenCreateProfile(); }}
                className="btn-gold"
                style={{ width: '100%', padding: '12px', fontSize: '0.9rem' }}
              >
                <PlusCircle size={16} />
                <span>Create Profile</span>
              </button>
            </div>
          </div>
        </animated.div>
      )}
    </header>
  );
}

function NavbarTabButton({ tab, isActive, favoritesCount, onClick }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const tabSpring = useSpring({
    transform: pressed
      ? 'scale(0.95) translateY(1px)'
      : hovered && !isActive
      ? 'translateY(-2px) scale(1.03)'
      : isActive
      ? 'translateY(0px) scale(1.01)'
      : 'translateY(0px) scale(1)',
    backgroundColor: isActive
      ? '#d4a329'
      : hovered
      ? 'rgba(255, 255, 255, 0.12)'
      : 'rgba(0, 0, 0, 0)',
    boxShadow: isActive
      ? '0 4px 18px rgba(212, 163, 41, 0.45), inset 0 1px 2px rgba(255, 255, 255, 0.5)'
      : hovered
      ? '0 4px 12px rgba(0, 0, 0, 0.2)'
      : 'none',
    color: isActive ? '#103424' : hovered ? '#fae182' : '#ffffff',
    config: { tension: 400, friction: 24 }
  });

  const iconSpring = useSpring({
    transform: hovered ? 'scale(1.18) rotate(-4deg)' : isActive ? 'scale(1.08)' : 'scale(1)',
    config: { tension: 350, friction: 18 }
  });

  const IconComponent = tab.icon;

  return (
    <animated.button
      onClick={onClick}
      style={{
        ...tabSpring,
        position: 'relative',
        border: 'none',
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        cursor: 'pointer',
        fontSize: '0.88rem',
        fontWeight: isActive ? 800 : 600,
        whiteSpace: 'nowrap',
        outline: 'none',
        letterSpacing: '0.3px',
        overflow: 'hidden',
        height: '100%',
        minHeight: '56px'
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
    >
      {isActive && (
        <span style={{
          position: 'absolute',
          bottom: 0,
          left: '15%',
          right: '15%',
          height: '3.5px',
          borderRadius: '4px 4px 0 0',
          background: '#ffffff',
          boxShadow: '0 0 10px rgba(255, 255, 255, 0.8), 0 0 18px rgba(250, 225, 130, 0.8)'
        }} />
      )}

      <animated.span style={{ ...iconSpring, display: 'flex', alignItems: 'center' }}>
        {tab.id === 'favorites' ? (
          <Heart size={15} color={isActive ? '#dc2626' : '#ef4444'} fill="#ef4444" className={isActive ? 'animate-heart-pop' : ''} />
        ) : (
          <IconComponent size={15} color={isActive ? '#103424' : hovered ? '#fae182' : '#ffffff'} />
        )}
      </animated.span>

      <span>{tab.label}</span>

      {tab.id === 'favorites' && favoritesCount > 0 && (
        <span style={{
          background: '#ef4444',
          color: '#ffffff',
          fontSize: '0.68rem',
          padding: '2px 6px',
          borderRadius: '12px',
          fontWeight: 800,
          lineHeight: 1.2,
          boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)'
        }}>
          {favoritesCount}
        </span>
      )}
    </animated.button>
  );
}
