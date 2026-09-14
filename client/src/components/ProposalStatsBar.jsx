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
        className="glass-panel stats-bar-inner"
        style={{
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
          flexWrap: 'wrap',
          background: '#ffffff',
          borderColor: 'var(--gold-border)',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)'
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
          {/* Main Total Proposals Counter */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '9999px',
              background: '#fefce8',
              border: '1.5px solid rgba(196, 155, 31, 0.45)',
              boxShadow: '0 2px 8px rgba(196, 155, 31, 0.15)'
            }}
          >
            <Sparkles size={16} color="var(--gold-primary)" />
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', letterSpacing: '0.2px' }}>
              Total Proposals:
            </span>
            <span
              style={{
                fontSize: '1.05rem',
                fontWeight: 800,
                color: 'var(--text-gold)',
                fontFamily: 'var(--font-cinzel)',
                letterSpacing: '0.5px'
              }}
            >
              {totalProposals}
            </span>
          </div>

          {/* Breakdown Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '9999px',
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                color: '#1d4ed8',
                fontSize: '0.78rem',
                fontWeight: 700
              }}
            >
              👨 {maleCount} Grooms
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '9999px',
                background: '#fdf2f8',
                border: '1px solid #fbcfe8',
                color: '#be185d',
                fontSize: '0.78rem',
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
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '9999px',
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                color: '#065f46',
                fontSize: '0.78rem',
                fontWeight: 600
              }}
            >
              <CheckCircle2 size={13} />
              Showing {filteredCount} matching
            </span>
          )}
        </animated.div>

        {/* Right: Sleek Search Bar */}
        <div 
          className="stats-bar-search"
          style={{ 
            position: 'relative', 
            minWidth: '0', 
            flex: '1 1 260px',
            maxWidth: '100%'
          }}
        >
          <Search 
            size={16} 
            style={{ 
              position: 'absolute', 
              left: '14px', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: 'var(--gold-primary)',
              opacity: 0.9,
              pointerEvents: 'none'
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
              padding: '9px 36px 9px 38px',
              borderRadius: 'var(--radius-full)',
              background: '#f8fafc',
              border: '1.5px solid rgba(196, 155, 31, 0.35)',
              color: '#0f172a',
              fontSize: '0.86rem',
              fontFamily: 'var(--font-sans)',
              outline: 'none',
              transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--gold-primary)';
              e.target.style.boxShadow = '0 0 0 3px rgba(196, 155, 31, 0.15)';
              e.target.style.background = '#ffffff';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(196, 155, 31, 0.35)';
              e.target.style.boxShadow = 'none';
              e.target.style.background = '#f8fafc';
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
                justifyContent: 'center'
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
