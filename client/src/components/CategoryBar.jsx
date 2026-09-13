import React from 'react';
import { useSpring, animated } from '@react-spring/web';

export const CATEGORIES = [
  { id: 'all', label: 'ALL' },
  { id: 'never-married', label: 'NEVER MARRIED' },
  { id: 'divorced', label: 'DIVORCED' },
  { id: '2nd-marriage', label: '2ND MARRIAGE' },
  { id: 'late-wife', label: 'LATE WIFE' }
];

export default function CategoryBar({
  activeCategory = 'all',
  onSelectCategory,
  activeTab = 'groom',
  counts = {}
}) {
  // Determine the label for the widowed category based on current tab
  const getCategoryLabel = (catId) => {
    if (catId === 'late-wife') {
      if (activeTab === 'bride') return 'LATE HUSBAND';
      return 'LATE WIFE';
    }
    return catId === 'all' ? 'ALL' : catId.replace('-', ' ').toUpperCase();
  };

  return (
    <div
      style={{
        maxWidth: '1440px',
        margin: '0 auto',
        padding: '18px 20px 8px 20px'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap'
        }}
      >
        {CATEGORIES.map((cat) => {
          const isSelected = activeCategory === cat.id;
          const label = getCategoryLabel(cat.id);
          const count = counts[cat.id];

          return (
            <CategoryPill
              key={cat.id}
              label={label}
              isSelected={isSelected}
              count={count}
              onClick={() => onSelectCategory(cat.id)}
            />
          );
        })}
      </div>
    </div>
  );
}

function CategoryPill({ label, isSelected, count, onClick }) {
  // Spring animation for smooth bounce on active toggle
  const spring = useSpring({
    transform: isSelected ? 'scale(1.03)' : 'scale(1)',
    backgroundColor: isSelected ? '#235d46' : 'rgba(255, 255, 255, 0.95)',
    borderColor: '#235d46',
    color: isSelected ? '#ffffff' : '#1e5641',
    boxShadow: isSelected 
      ? '0 4px 14px rgba(35, 93, 70, 0.35)' 
      : '0 2px 6px rgba(0, 0, 0, 0.08)',
    config: { tension: 360, friction: 22 }
  });

  return (
    <animated.button
      onClick={onClick}
      style={{
        ...spring,
        border: '1.5px solid #235d46',
        borderRadius: '9999px',
        padding: '7px 22px',
        fontSize: '0.85rem',
        fontWeight: isSelected ? 700 : 600,
        letterSpacing: '0.6px',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        whiteSpace: 'nowrap',
        outline: 'none',
        transition: 'border-color 0.2s ease, transform 0.15s ease'
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = '#ecfdf5';
          e.currentTarget.style.borderColor = '#1b4332';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
          e.currentTarget.style.borderColor = '#235d46';
        }
      }}
    >
      <span>{label}</span>
      {typeof count === 'number' && count > 0 && (
        <span
          style={{
            background: isSelected ? 'rgba(255, 255, 255, 0.22)' : 'rgba(35, 93, 70, 0.12)',
            color: isSelected ? '#ffffff' : '#1e5641',
            fontSize: '0.72rem',
            padding: '1px 7px',
            borderRadius: '12px',
            fontWeight: 700
          }}
        >
          {count}
        </span>
      )}
    </animated.button>
  );
}
