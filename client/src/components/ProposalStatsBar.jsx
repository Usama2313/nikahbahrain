import React from 'react';
import { useSpring, animated } from '@react-spring/web';
import { Search, X, Sparkles, CheckCircle2 } from '../icons';

export default function ProposalStatsBar({
  totalProposals = 227,
  filteredCount = 227,
  maleCount = 115,
  femaleCount = 112,
  searchQuery = '',
  onSearchChange,
  activeTab = 'home',
  activeCategory = 'all'
}) {
  // Animated badge spring for total count
  const badgeSpring = useSpring({
    from: { opacity: 0, transform: 'scale(0.92)' },
    to: { opacity: 1, transform: 'scale(1)' },
    config: { tension: 350, friction: 22 }
  });

  const isFiltered = activeTab !== 'home' || activeCategory !== 'all' || Boolean(searchQuery.trim());

  return (
    <div
      style={{
        maxWidth: '1440px',
        margin: '14px auto 0 auto',
        padding: '0 20px'
      }}
    >
      <div
        className="stats-bar-inner"
        style={{
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
          flexWrap: 'wrap',
          background: 'linear-gradient(135deg, #0e2038 0%, #081424 100%)',
          border: '1.5px solid rgba(212, 175, 55, 0.45)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(212, 175, 55, 0.2)'
        }}
      >

        {/* Left: Total Numbers of Proposals Prominent Display */}
        <animated.div 
          className="stats-bar-counts"
          style={{ 
            ...badgeSpring, 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px', 
            flexWrap: 'wrap' 
          }}
        >
          {/* Main Total Proposals Counter (Ivory & Gold Pill from uploaded screenshot) */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '9999px',
              background: '#fefce8',
              border: '1.5px solid rgba(196, 155, 31, 0.55)',
              boxShadow: '0 2px 10px rgba(196, 155, 31, 0.2)'
            }}
          >
            <Sparkles size={16} color="#b45309" />
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', letterSpacing: '0.2px' }}>
              Total Proposals:
            </span>
            <span
              style={{
                fontSize: '1.05rem',
                fontWeight: 900,
                color: '#92400e',
                fontFamily: 'var(--font-cinzel)',
                letterSpacing: '0.5px'
              }}
            >
              {totalProposals}
            </span>
          </div>

          {/* Breakdown Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: '9999px',
                background: '#eff6ff',
                border: '1.5px solid #bfdbfe',
                color: '#1d4ed8',
                fontSize: '0.82rem',
                fontWeight: 700
              }}
            >
              👨 {maleCount} Grooms
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: '9999px',
                background: '#fdf2f8',
                border: '1.5px solid #fbcfe8',
                color: '#be185d',
                fontSize: '0.82rem',
                fontWeight: 700
              }}
            >
              👩 {femaleCount} Brides
            </span>
          </div>

          {/* Filtered Active Count if different */}
          {isFiltered && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: '9999px',
                background: '#ecfdf5',
                border: '1.5px solid #a7f3d0',
                color: '#065f46',
                fontSize: '0.82rem',
                fontWeight: 700
              }}
            >
              <CheckCircle2 size={14} />
              Showing {filteredCount} matching
            </span>
          )}
        </animated.div>

        {/* Right: Clean High-Contrast Search Bar */}
        <div 
          className="stats-bar-search"
          style={{ 
            position: 'relative', 
            minWidth: '260px', 
            flex: '0 1 360px',
            maxWidth: '100%',
            height: '42px'
          }}
        >
          <Search 
            size={16} 
            style={{ 
              position: 'absolute', 
              left: '14px', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: '#b45309',
              pointerEvents: 'none',
              zIndex: 2
            }} 
          />
          <input
            id="search-proposals-input"
            type="text"
            placeholder="Search name, profession, city, caste..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              width: '100%',
              height: '42px',
              padding: '9px 38px 9px 40px',
              borderRadius: '9999px',
              background: '#ffffff',
              border: '1.5px solid rgba(196, 155, 31, 0.45)',
              color: '#0f172a',
              fontSize: '0.88rem',
              fontFamily: 'var(--font-sans)',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'all 0.2s ease'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--gold-primary)';
              e.target.style.boxShadow = '0 0 0 3px rgba(196, 155, 31, 0.25)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(196, 155, 31, 0.45)';
              e.target.style.boxShadow = 'none';
            }}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              title="Clear search"
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2
              }}
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
