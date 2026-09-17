import React, { useState } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from '../icons';

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange
}) {
  const [jumpValue, setJumpValue] = useState('');

  if (totalPages <= 1 && totalItems <= itemsPerPage) {
    return null;
  }

  // Calculate start and end indices
  const startIndex = Math.min((currentPage - 1) * itemsPerPage + 1, totalItems);
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

  // Format large numbers with commas (e.g. 1,000,000)
  const fmt = (n) => (n || 0).toLocaleString();

  // Generate page numbers to show — smart windowed pagination
  const getPageNumbers = () => {
    const pages = [];

    if (totalPages <= 9) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    pages.push(1);

    let start = Math.max(2, currentPage - 2);
    let end = Math.min(totalPages - 1, currentPage + 2);

    if (currentPage <= 4) { start = 2; end = 6; }
    else if (currentPage >= totalPages - 3) { start = totalPages - 5; end = totalPages - 1; }

    if (start > 2) pages.push('...');
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) pages.push('...');
    pages.push(totalPages);

    return pages;
  };

  const pages = getPageNumbers();

  const handlePageClick = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  const handleJump = (e) => {
    e.preventDefault();
    const page = parseInt(jumpValue, 10);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      onPageChange(page);
      setJumpValue('');
    }
  };

  const btnBase = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: '9999px', cursor: 'pointer', transition: 'all 0.2s ease',
    outline: 'none', userSelect: 'none'
  };

  const navBtn = (disabled) => ({
    ...btnBase,
    width: '36px', height: '36px',
    border: '1.5px solid #235d46',
    background: 'transparent',
    color: disabled ? '#cbd5e1' : '#1e5641',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '14px',
        margin: '36px 0 20px 0',
        padding: '18px 16px',
        background: '#ffffff',
        borderRadius: '16px',
        border: '1.5px solid var(--gold-border)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box'
      }}
    >
      {/* Top row: navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>

        {/* First Page */}
        <button onClick={() => handlePageClick(1)} disabled={currentPage === 1} style={navBtn(currentPage === 1)} title="First Page">
          <ChevronsLeft size={16} />
        </button>

        {/* Previous */}
        <button
          onClick={() => handlePageClick(currentPage - 1)}
          disabled={currentPage === 1}
          style={{ ...navBtn(currentPage === 1), width: 'auto', padding: '7px 14px', gap: '4px', fontSize: '0.84rem', fontWeight: 700 }}
        >
          <ChevronLeft size={16} />
          <span>Prev</span>
        </button>

        {/* Numbered Page Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {pages.map((p, idx) =>
            p === '...' ? (
              <span key={`ellipsis-${idx}`} style={{ color: '#94a3b8', padding: '0 4px', fontSize: '0.9rem', userSelect: 'none' }}>…</span>
            ) : (
              <PageButton key={`page-${p}`} pageNumber={p} isActive={p === currentPage} onClick={() => handlePageClick(p)} />
            )
          )}
        </div>

        {/* Next */}
        <button
          onClick={() => handlePageClick(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={{ ...navBtn(currentPage === totalPages), width: 'auto', padding: '7px 14px', gap: '4px', fontSize: '0.84rem', fontWeight: 700 }}
        >
          <span>Next</span>
          <ChevronRight size={16} />
        </button>

        {/* Last Page */}
        <button onClick={() => handlePageClick(totalPages)} disabled={currentPage === totalPages} style={navBtn(currentPage === totalPages)} title="Last Page">
          <ChevronsRight size={16} />
        </button>
      </div>

      {/* Bottom row: stats + per-page + jump-to */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          maxWidth: '640px',
          fontSize: '0.82rem',
          color: '#475569',
          paddingTop: '10px',
          borderTop: '1px solid #e2e8f0',
          flexWrap: 'wrap',
          gap: '10px'
        }}
      >
        {/* Showing X–Y of Z */}
        <div style={{ whiteSpace: 'nowrap' }}>
          Showing <strong style={{ color: 'var(--text-gold)' }}>{fmt(startIndex)}</strong> – <strong style={{ color: 'var(--text-gold)' }}>{fmt(endIndex)}</strong> of <strong style={{ color: 'var(--text-gold)' }}>{fmt(totalItems)}</strong> proposals
        </div>

        {/* Per-page selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
          <span>Per page:</span>
          {[12, 24, 48, 100].map((size) => (
            <button
              key={size}
              onClick={() => onItemsPerPageChange && onItemsPerPageChange(size)}
              style={{
                background: itemsPerPage === size ? '#235d46' : '#f1f5f9',
                color: itemsPerPage === size ? '#ffffff' : '#334155',
                border: `1.5px solid ${itemsPerPage === size ? '#235d46' : '#cbd5e1'}`,
                borderRadius: '6px',
                padding: '3px 9px',
                fontSize: '0.78rem',
                cursor: 'pointer',
                fontWeight: itemsPerPage === size ? 800 : 600,
                transition: 'all 0.2s ease'
              }}
            >
              {size}
            </button>
          ))}
        </div>

        {/* Jump to page — only show when there are many pages */}
        {totalPages > 10 && (
          <form onSubmit={handleJump} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ whiteSpace: 'nowrap' }}>Go to:</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={jumpValue}
              onChange={e => setJumpValue(e.target.value)}
              placeholder={`1–${fmt(totalPages)}`}
              style={{
                width: '72px',
                padding: '4px 8px',
                border: '1.5px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '0.82rem',
                color: '#334155',
                outline: 'none',
                textAlign: 'center'
              }}
            />
            <button
              type="submit"
              style={{
                background: '#235d46',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '4px 12px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Go
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function PageButton({ pageNumber, isActive, onClick }) {
  const spring = useSpring({
    transform: isActive ? 'scale(1.08)' : 'scale(1)',
    backgroundColor: isActive ? '#235d46' : 'transparent',
    borderColor: '#235d46',
    color: isActive ? '#ffffff' : '#1e5641',
    boxShadow: isActive ? '0 4px 12px rgba(35, 93, 70, 0.4)' : 'none',
    config: { tension: 350, friction: 22 }
  });

  return (
    <animated.button
      onClick={onClick}
      style={{
        ...spring,
        width: '36px',
        height: '36px',
        borderRadius: '9999px',
        border: '1.5px solid',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.84rem',
        fontWeight: isActive ? 800 : 600,
        cursor: 'pointer',
        outline: 'none',
        userSelect: 'none'
      }}
    >
      {pageNumber}
    </animated.button>
  );
}
