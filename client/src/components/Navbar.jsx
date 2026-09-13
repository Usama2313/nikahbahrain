import React from 'react';
import { useSpring, animated } from '@react-spring/web';
import { 
  Heart, 
  PlusCircle, 
  Lock,
  Instagram,
  Sparkles,
  Home,
  User,
  PhoneCall
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
  activeTab = 'groom', 
  onSelectTab, 
  favoritesCount = 0, 
  onOpenCreateProfile, 
  onOpenAdmin,
  isAdminActive = false,
  onReplaySplash 
}) {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)'
      }}
    >
      {/* Top micro bar for Islamic greeting & official Instagram */}
      <div 
        style={{
          background: 'linear-gradient(90deg, #133a2b 0%, #1c523c 50%, #133a2b 100%)',
          borderBottom: '1px solid rgba(212, 175, 55, 0.25)',
          padding: '4px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.78rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="font-arabic" style={{ color: '#fae182', fontSize: '0.95rem' }}>
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </span>
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>•</span>
          <span style={{ color: '#e2e8f0', fontSize: '0.76rem' }}>
            Official Bahrain Matrimonial Portal • 227 Verified Instagram Proposals
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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
              fontSize: '0.78rem'
            }}
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
              fontSize: '0.74rem'
            }}
          >
            <Sparkles size={12} color="#fae182" />
            <span>Intro</span>
          </button>
        </div>
      </div>

      {/* Main Emerald Green Navigation Bar (matching uploaded picture) */}
      <div 
        style={{
          background: '#1e5641',
          borderBottom: '2px solid rgba(212, 175, 55, 0.4)',
          display: 'flex',
          alignItems: 'stretch',
          justifyContent: 'space-between',
          padding: '0 20px',
          minHeight: '56px',
          flexWrap: 'wrap'
        }}
      >
        {/* Brand Logo & Title */}
        <div 
          onClick={() => onSelectTab('home')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            userSelect: 'none',
            padding: '8px 0'
          }}
        >
          <div 
            style={{
              position: 'relative',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              padding: '2px',
              background: 'linear-gradient(135deg, #fae182, #d4af37, #b8860b)',
              boxShadow: '0 0 12px rgba(212, 175, 55, 0.5)',
              flexShrink: 0
            }}
          >
            <img 
              src={logoImg} 
              alt="Qabul Hai" 
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                objectFit: 'cover'
              }}
            />
          </div>

          <div>
            <div 
              className="font-cinzel"
              style={{ 
                fontSize: '1.25rem', 
                fontWeight: 800, 
                color: '#ffffff',
                letterSpacing: '0.8px',
                lineHeight: 1.1
              }}
            >
              QABUL HAI
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--gold-light)', letterSpacing: '0.5px' }}>
              Muslim Matrimony • Bahrain & GCC
            </div>
          </div>
        </div>

        {/* Center Tabs: Home | View Groom | View Bride | Favorites | Contact (matching picture) */}
        <nav 
          style={{
            display: 'flex',
            alignItems: 'stretch',
            gap: '0px',
            overflowX: 'auto',
            alignSelf: 'stretch'
          }}
        >
          {NAV_TABS.map((tab) => {
            const isActive = activeTab === tab.id && !isAdminActive;

            return (
              <NavbarTabButton
                key={tab.id}
                tab={tab}
                isActive={isActive}
                favoritesCount={favoritesCount}
                onClick={() => onSelectTab(tab.id)}
              />
            );
          })}
        </nav>

        {/* Right Actions: Create Profile Button & Admin */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0' }}>
          <button
            id="create-profile-btn"
            onClick={onOpenCreateProfile}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 18px',
              borderRadius: '9999px',
              background: 'linear-gradient(135deg, #d4af37 0%, #b8860b 100%)',
              border: '1px solid #fae182',
              color: '#0d251c',
              fontSize: '0.85rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(212, 175, 55, 0.4)',
              transition: 'all 0.2s ease'
            }}
          >
            <PlusCircle size={16} />
            <span>Create Profile</span>
          </button>

          <button
            id="admin-portal-btn"
            onClick={onOpenAdmin}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '7px 13px',
              borderRadius: '9999px',
              background: isAdminActive ? '#d4af37' : 'rgba(255, 255, 255, 0.1)',
              border: `1px solid ${isAdminActive ? '#fae182' : 'rgba(255, 255, 255, 0.2)'}`,
              color: isAdminActive ? '#0d251c' : '#ffffff',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Lock size={13} />
            <span>Admin</span>
          </button>
        </div>
      </div>
    </header>
  );
}

function NavbarTabButton({ tab, isActive, favoritesCount, onClick }) {
  // In the uploaded picture:
  // Inactive tab: white text on dark green (#1e5641)
  // Active tab: bold golden yellow block background (#d4a329) with dark green text (#123829)
  return (
    <button
      onClick={onClick}
      style={{
        background: isActive ? '#d4a329' : 'transparent',
        color: isActive ? '#143d2d' : '#ffffff',
        border: 'none',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        cursor: 'pointer',
        fontSize: '0.98rem',
        fontWeight: isActive ? 800 : 600,
        whiteSpace: 'nowrap',
        outline: 'none',
        transition: 'background 0.2s ease, color 0.2s ease',
        letterSpacing: '0.2px'
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
    >
      {tab.id === 'favorites' && (
        <Heart 
          size={16} 
          color="#ef4444" 
          fill="#ef4444" 
        />
      )}
      <span>{tab.label}</span>
      {tab.id === 'favorites' && favoritesCount > 0 && (
        <span
          style={{
            background: '#ef4444',
            color: '#ffffff',
            fontSize: '0.72rem',
            padding: '1px 6px',
            borderRadius: '10px',
            fontWeight: 800,
            lineHeight: 1.2
          }}
        >
          {favoritesCount}
        </span>
      )}
    </button>
  );
}
