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
        className="glass-panel"
        style={{
          padding: '14px 22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
          background: 'linear-gradient(135deg, rgba(14, 32, 56, 0.75) 0%, rgba(8, 20, 36, 0.9) 100%)',
          borderColor: 'rgba(212, 175, 55, 0.3)'
        }}
      >
        {/* Left: Total Numbers of Proposals Prominent Display */}
        <animated.div 
          style={{ 
            ...badgeSpring, 
            display: 'flex', 
            alignItems: 'center', 
            gap: '14px', 
            flexWrap: 'wrap' 
          }}
        >
          {/* Main Total Proposals Counter */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '9999px',
              background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.22) 0%, rgba(212, 175, 55, 0.08) 100%)',
              border: '1.5px solid rgba(250, 225, 130, 0.5)',
              boxShadow: '0 2px 14px rgba(212, 175, 55, 0.2)'
            }}
          >
            <Sparkles size={16} color="#fae182" />
            <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#ffffff', letterSpacing: '0.3px' }}>
              Total Proposals:
            </span>
            <span
              style={{
                fontSize: '1.05rem',
                fontWeight: 900,
                color: '#fae182',
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
                gap: '5px',
                padding: '4px 12px',
                borderRadius: '9999px',
                background: 'rgba(59, 130, 246, 0.14)',
                border: '1px solid rgba(59, 130, 246, 0.35)',
                color: '#93c5fd',
                fontSize: '0.8rem',
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
                padding: '4px 12px',
                borderRadius: '9999px',
                background: 'rgba(236, 72, 153, 0.14)',
                border: '1px solid rgba(236, 72, 153, 0.35)',
                color: '#f472b6',
                fontSize: '0.8rem',
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
                padding: '4px 12px',
                borderRadius: '9999px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                color: '#6ee7b7',
                fontSize: '0.8rem',
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
          style={{ 
            position: 'relative', 
            minWidth: '260px', 
            flex: '0 1 360px',
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
              color: 'var(--gold-light)',
              opacity: 0.8,
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
              padding: '9px 38px 9px 40px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(6, 15, 28, 0.85)',
              border: '1.5px solid rgba(212, 175, 55, 0.3)',
              color: '#ffffff',
              fontSize: '0.86rem',
              fontFamily: 'var(--font-sans)',
              outline: 'none',
              transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--gold-light)';
              e.target.style.boxShadow = '0 0 16px rgba(212, 175, 55, 0.4)';
              e.target.style.background = 'rgba(7, 18, 34, 0.95)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(212, 175, 55, 0.3)';
              e.target.style.boxShadow = 'none';
              e.target.style.background = 'rgba(6, 15, 28, 0.85)';
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
                color: 'var(--text-muted)',
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
