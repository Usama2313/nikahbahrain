import React, { useState } from 'react';
import { useSpring, animated } from '@react-spring/web';

export const CATEGORIES = [
  { id: 'all', label: 'ALL' },
  { id: 'never-married', label: 'NEVER MARRIED' },
  { id: 'divorced', label: 'DIVORCED' },
  { id: '2nd-marriage', label: '2ND MARRIAGE' },
  { id: 'late-wife', label: 'LATE WIFE' }
];

export const NATIONALITIES = [
  { id: 'all', label: 'All' },
  { id: 'Pakistani', label: '🇵🇰 Pakistani' },
  { id: 'Indian', label: '🇮🇳 Indian' },
  { id: 'Bahraini', label: '🇧🇭 Bahraini' },
];

export default function CategoryBar({
  activeCategory = 'all',
  onSelectCategory,
  activeTab = 'home',
  counts = {},
  activeNationality = 'all',
  onSelectNationality,
  onSelectGender,
}) {
  // Determine the label for the widowed/late category based on current tab
  const getCategoryLabel = (catId) => {
    if (catId === 'late-wife') {
      if (activeTab === 'bride') return 'LATE HUSBAND';
      return 'LATE WIFE / WIDOWED';
    }
    if (catId === '2nd-marriage') return '2ND MARRIAGE';
    if (catId === 'never-married') return 'NEVER MARRIED';
    if (catId === 'divorced') return 'DIVORCED';
    return 'ALL';
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '14px 20px 6px 20px' }}>
      {/* Row 1: View Groom/Bride + Nationality */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '8px', scrollbarWidth: 'none', msOverflowStyle: 'none', flexWrap: 'wrap' }}>
        <GenderPill label="👨 View Grooms" isSelected={activeTab === 'groom'} onClick={() => onSelectGender && onSelectGender('groom')} color="#3b82f6" />
        <GenderPill label="👩 View Brides" isSelected={activeTab === 'bride'} onClick={() => onSelectGender && onSelectGender('bride')} color="#ec4899" />
        <span style={{ color: '#cbd5e1', fontSize: '1.1rem', flexShrink: 0, margin: '0 2px' }}>|</span>
        {NATIONALITIES.map((nat) => (
          <NationalityPill key={nat.id} label={nat.label} isSelected={activeNationality === nat.id} onClick={() => onSelectNationality && onSelectNationality(nat.id)} />
        ))}
      </div>
      {/* Row 2: Category pills */}
      <div className="category-pills-row" style={{ display: 'flex', alignItems: 'center', gap: '10px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '6px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {CATEGORIES.map((cat) => {
          const isSelected = activeCategory === cat.id;
          const label = getCategoryLabel(cat.id);
          const count = counts[cat.id];
          return (
            <CategoryPill key={cat.id} label={label} isSelected={isSelected} count={count} onClick={() => onSelectCategory(cat.id)} />
          );
        })}
      </div>
    </div>
  );
}

function GenderPill({ label, isSelected, onClick, color }) {
  const [hovered, setHovered] = useState(false);
  const spring = useSpring({
    transform: hovered ? 'scale(1.05) translateY(-1px)' : isSelected ? 'scale(1.02)' : 'scale(1)',
    backgroundColor: isSelected ? color : hovered ? '#f8fafc' : '#ffffff',
    borderColor: isSelected ? color : hovered ? color : '#e2e8f0',
    color: isSelected ? '#ffffff' : hovered ? color : '#475569',
    boxShadow: isSelected ? `0 4px 14px ${color}55` : hovered ? '0 2px 8px rgba(0,0,0,0.1)' : '0 1px 4px rgba(0,0,0,0.06)',
    config: { tension: 400, friction: 22 }
  });
  return (
    <animated.button onClick={onClick} style={{ ...spring, border: '1.5px solid', borderRadius: '9999px', padding: '6px 16px', fontSize: '0.82rem', fontWeight: isSelected ? 800 : 600, letterSpacing: '0.3px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap', flexShrink: 0, outline: 'none' }} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      {label}
    </animated.button>
  );
}

function NationalityPill({ label, isSelected, onClick }) {
  const [hovered, setHovered] = useState(false);
  const spring = useSpring({
    transform: hovered ? 'scale(1.04) translateY(-1px)' : isSelected ? 'scale(1.02)' : 'scale(1)',
    backgroundColor: isSelected ? '#0f172a' : hovered ? '#f1f5f9' : '#ffffff',
    borderColor: isSelected ? '#0f172a' : hovered ? '#94a3b8' : '#e2e8f0',
    color: isSelected ? '#ffffff' : hovered ? '#0f172a' : '#64748b',
    boxShadow: isSelected ? '0 4px 14px rgba(15,23,42,0.3)' : hovered ? '0 2px 8px rgba(0,0,0,0.1)' : '0 1px 4px rgba(0,0,0,0.06)',
    config: { tension: 400, friction: 22 }
  });
  return (
    <animated.button onClick={onClick} style={{ ...spring, border: '1.5px solid', borderRadius: '9999px', padding: '5px 14px', fontSize: '0.78rem', fontWeight: isSelected ? 700 : 500, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap', flexShrink: 0, outline: 'none' }} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      {label}
    </animated.button>
  );
}

function CategoryPill({ label, isSelected, count, onClick }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  // World-Class Spring animation for Category Pills
  const spring = useSpring({
    transform: pressed
      ? 'scale(0.95) translateY(1px)'
      : hovered
      ? 'scale(1.04) translateY(-2px)'
      : isSelected
      ? 'scale(1.02) translateY(0px)'
      : 'scale(1) translateY(0px)',
    backgroundColor: isSelected
      ? '#235d46'
      : hovered
      ? '#ecfdf5'
      : 'rgba(255, 255, 255, 0.96)',
    borderColor: isSelected ? '#1b4332' : hovered ? '#1e5641' : '#235d46',
    color: isSelected ? '#ffffff' : '#1e5641',
    boxShadow: isSelected
      ? '0 6px 18px rgba(35, 93, 70, 0.4), 0 0 10px rgba(35, 93, 70, 0.2)'
      : hovered
      ? '0 4px 14px rgba(35, 93, 70, 0.2)'
      : '0 2px 6px rgba(0, 0, 0, 0.08)',
    config: { tension: 400, friction: 22 }
  });

  return (
    <animated.button
      className="category-pill"
      onClick={onClick}
      style={{
        ...spring,
        position: 'relative',
        border: '1.5px solid',
        borderRadius: '9999px',
        padding: '7px 22px',
        fontSize: '0.85rem',
        fontWeight: isSelected ? 800 : 600,
        letterSpacing: '0.6px',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        whiteSpace: 'nowrap',
        flexShrink: 0,
        outline: 'none',
        overflow: 'hidden'
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setPressed(false);
      }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
    >
      <span>{label}</span>
      {typeof count === 'number' && count > 0 && (
        <span
          style={{
            background: isSelected ? 'rgba(255, 255, 255, 0.25)' : 'rgba(35, 93, 70, 0.12)',
            color: isSelected ? '#ffffff' : '#1e5641',
            fontSize: '0.72rem',
            padding: '1px 8px',
            borderRadius: '12px',
            fontWeight: 800,
            transition: 'all 0.2s ease'
          }}
        >
          {count}
        </span>
      )}
    </animated.button>
  );
}
