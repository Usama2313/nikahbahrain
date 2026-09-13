import React, { useState } from 'react';
import { useSpring, useTrail, animated } from '@react-spring/web';
import { Search, Globe, Filter, Sparkles, SlidersHorizontal, X, ChevronDown, Calendar, User, BookOpen, Ruler } from 'lucide-react';

const NATIONALITIES = [
  { id: 'all', label: 'All Nationalities', flag: '🌍' },
  { id: 'pakistani', label: 'Pakistani', flag: '🇵🇰' },
  { id: 'indian', label: 'Indian', flag: '🇮🇳' },
  { id: 'bahraini', label: 'Bahraini / GCC', flag: '🇧🇭' }
];

const MARITAL_STATUSES = [
  { id: 'all', label: 'All Statuses' },
  { id: 'Never Married', label: '💍 Never Married' },
  { id: 'Divorced', label: '🔄 Divorced' },
  { id: 'Widowed', label: '🕊️ Widowed' }
];

const GENDER_OPTIONS = [
  { id: 'all', label: 'All Genders' },
  { id: 'male', label: '👨 Grooms Only' },
  { id: 'female', label: '👩 Brides Only' }
];

const AGE_RANGES = [
  { id: 'all', label: 'All Ages' },
  { id: '18-25', label: '18 – 25 yrs', min: 18, max: 25 },
  { id: '26-30', label: '26 – 30 yrs', min: 26, max: 30 },
  { id: '31-35', label: '31 – 35 yrs', min: 31, max: 35 },
  { id: '36-45', label: '36 – 45 yrs', min: 36, max: 45 },
  { id: '46+', label: '46+ yrs', min: 46, max: 100 }
];

export default function FilterBar({
  selectedNationality,
  onSelectNationality,
  selectedGender = 'all',
  onSelectGender,
  selectedMaritalStatus = 'all',
  onSelectMaritalStatus,
  selectedAgeRange = 'all',
  onSelectAgeRange,
  searchQuery,
  onSearchChange,
  totalCount = 0,
  currentCategoryTitle = 'All Proposals',
  onResetFilters
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Advanced panel spring animation
  const advancedSpring = useSpring({
    height: showAdvanced ? 'auto' : 0,
    opacity: showAdvanced ? 1 : 0,
    transform: showAdvanced ? 'translateY(0px)' : 'translateY(-8px)',
    config: { tension: 320, friction: 26 }
  });

  // Count badge spring
  const countSpring = useSpring({
    from: { transform: 'scale(0.8)', opacity: 0 },
    to: { transform: 'scale(1)', opacity: 1 },
    reset: true,
    config: { tension: 400, friction: 18 }
  });

  // Filter button hover spring  
  const toggleSpring = useSpring({
    transform: showAdvanced ? 'rotate(180deg)' : 'rotate(0deg)',
    config: { tension: 300, friction: 20 }
  });

  const hasActiveFilters = selectedNationality !== 'all' || 
    selectedGender !== 'all' || 
    selectedMaritalStatus !== 'all' || 
    selectedAgeRange !== 'all' || 
    searchQuery.trim();

  return (
    <div
      style={{
        maxWidth: '1440px',
        margin: '18px auto 0 auto',
        padding: '0 20px'
      }}
    >
      <div
        className="glass-panel"
        style={{
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}
      >
        {/* Top Row: Title + Count + Search + Toggle */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap'
          }}
        >
          {/* Current Active Category Title & Count */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <h2 
              className="font-cinzel"
              style={{ 
                fontSize: '1.25rem', 
                fontWeight: 700, 
                color: 'var(--gold-light)' 
              }}
            >
              {currentCategoryTitle}
            </h2>
            <animated.span 
              style={{
                ...countSpring,
                fontSize: '0.82rem',
                color: 'var(--text-muted)',
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '2px 10px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid rgba(255,255,255,0.08)',
                fontWeight: 600
              }}
            >
              {totalCount} {totalCount === 1 ? 'Profile' : 'Profiles'} Found
            </animated.span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 auto', justifyContent: 'flex-end' }}>
            {/* Search Box */}
            <div 
              style={{
                position: 'relative',
                minWidth: '240px',
                flex: '0 1 360px'
              }}
            >
              <Search 
                size={16} 
                style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: 'var(--gold-light)',
                  opacity: 0.7
                }} 
              />
              <input
                id="search-profiles-input"
                type="text"
                placeholder="Search name, profession, sect, city, caste..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 38px',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(5, 12, 22, 0.7)',
                  border: '1px solid var(--gold-border)',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  fontFamily: 'var(--font-sans)',
                  outline: 'none',
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--gold-light)';
                  e.target.style.boxShadow = '0 0 12px rgba(212, 175, 55, 0.3)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--gold-border)';
                  e.target.style.boxShadow = 'none';
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-dim)',
                    cursor: 'pointer',
                    padding: '2px'
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Advanced Filters Toggle Button */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 16px',
                borderRadius: 'var(--radius-full)',
                background: showAdvanced ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${showAdvanced ? 'var(--gold-primary)' : 'rgba(255, 255, 255, 0.12)'}`,
                color: showAdvanced ? 'var(--gold-light)' : 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '0.84rem',
                fontWeight: 600,
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
            >
              <SlidersHorizontal size={15} />
              <span>Filters</span>
              <animated.span style={toggleSpring}>
                <ChevronDown size={14} />
              </animated.span>
              {hasActiveFilters && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: '#ef4444',
                    border: '2px solid #091930'
                  }}
                />
              )}
            </button>

            {/* Reset button (shown if active filters) */}
            {hasActiveFilters && (
              <button
                onClick={onResetFilters}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '9px 14px',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#fca5a5',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 600
                }}
              >
                <X size={13} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Nationality Filters (always visible) */}
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            flexWrap: 'wrap' 
          }}
        >
          <span 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px', 
              fontSize: '0.78rem', 
              color: 'var(--text-dim)', 
              textTransform: 'uppercase',
              letterSpacing: '1px',
              fontWeight: 600 
            }}
          >
            <Globe size={13} /> Nationality:
          </span>

          {NATIONALITIES.map((nat) => {
            const isSelected = selectedNationality.toLowerCase() === nat.id.toLowerCase();
            return (
              <NationalityPill
                key={nat.id}
                nationality={nat}
                isSelected={isSelected}
                onClick={() => onSelectNationality(nat.id)}
              />
            );
          })}
        </div>

        {/* Advanced Filters Panel (collapsible) */}
        {showAdvanced && (
          <animated.div
            style={{
              overflow: 'hidden',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              paddingTop: '14px'
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '14px'
              }}
            >
              {/* Gender Filter */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.76rem', color: 'var(--gold-light)', marginBottom: '6px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  <User size={12} /> Gender
                </label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {GENDER_OPTIONS.map(g => (
                    <FilterChip
                      key={g.id}
                      label={g.label}
                      isSelected={selectedGender === g.id}
                      onClick={() => onSelectGender(g.id)}
                    />
                  ))}
                </div>
              </div>

              {/* Marital Status Filter */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.76rem', color: 'var(--gold-light)', marginBottom: '6px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  <Sparkles size={12} /> Marital Status
                </label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {MARITAL_STATUSES.map(ms => (
                    <FilterChip
                      key={ms.id}
                      label={ms.label}
                      isSelected={selectedMaritalStatus === ms.id}
                      onClick={() => onSelectMaritalStatus(ms.id)}
                    />
                  ))}
                </div>
              </div>

              {/* Age Range Filter */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.76rem', color: 'var(--gold-light)', marginBottom: '6px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  <Calendar size={12} /> Age Range
                </label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {AGE_RANGES.map(ar => (
                    <FilterChip
                      key={ar.id}
                      label={ar.label}
                      isSelected={selectedAgeRange === ar.id}
                      onClick={() => onSelectAgeRange(ar.id)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </animated.div>
        )}
      </div>
    </div>
  );
}

function FilterChip({ label, isSelected, onClick }) {
  const chipSpring = useSpring({
    transform: isSelected ? 'scale(1.02)' : 'scale(1)',
    backgroundColor: isSelected ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255, 255, 255, 0.04)',
    borderColor: isSelected ? 'var(--gold-primary)' : 'rgba(255, 255, 255, 0.1)',
    color: isSelected ? '#fae182' : 'var(--text-muted)',
    config: { tension: 320, friction: 20 }
  });

  return (
    <animated.button
      onClick={onClick}
      style={{
        ...chipSpring,
        border: '1px solid',
        borderRadius: 'var(--radius-full)',
        padding: '5px 11px',
        fontSize: '0.78rem',
        fontWeight: isSelected ? 700 : 500,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        outline: 'none',
        whiteSpace: 'nowrap'
      }}
    >
      {label}
    </animated.button>
  );
}

function NationalityPill({ nationality, isSelected, onClick }) {
  const pillSpring = useSpring({
    transform: isSelected ? 'scale(1.03)' : 'scale(1)',
    backgroundColor: isSelected ? 'rgba(212, 175, 55, 0.22)' : 'rgba(255, 255, 255, 0.04)',
    borderColor: isSelected ? 'var(--gold-primary)' : 'rgba(255, 255, 255, 0.1)',
    color: isSelected ? '#fae182' : 'var(--text-muted)',
    config: { tension: 280, friction: 18 }
  });

  return (
    <animated.button
      onClick={onClick}
      style={{
        ...pillSpring,
        border: '1px solid',
        borderRadius: 'var(--radius-full)',
        padding: '6px 13px',
        fontSize: '0.82rem',
        fontWeight: isSelected ? 700 : 500,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        outline: 'none'
      }}
    >
      <span>{nationality.flag}</span>
      <span>{nationality.label}</span>
    </animated.button>
  );
}

export { AGE_RANGES };
