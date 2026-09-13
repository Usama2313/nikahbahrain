import React from 'react';
import { useSpring, animated } from '@react-spring/web';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange
}) {
  if (totalPages <= 1 && totalItems <= itemsPerPage) {
    return null;
  }

  // Calculate start and end indices
  const startIndex = Math.min((currentPage - 1) * itemsPerPage + 1, totalItems);
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 3) {
        start = 2;
        end = 4;
      } else if (currentPage >= totalPages - 2) {
        start = totalPages - 3;
        end = totalPages - 1;
      }

      if (start > 2) {
        pages.push('...');
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) {
        pages.push('...');
      }

      pages.push(totalPages);
    }

    return pages;
  };

  const pages = getPageNumbers();

  const handlePageClick = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
        margin: '40px 0 20px 0',
        padding: '20px',
        background: 'rgba(10, 25, 20, 0.4)',
        borderRadius: '16px',
        border: '1px solid rgba(35, 93, 70, 0.3)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)'
      }}
    >
      {/* Upper row: Page navigation buttons */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}
      >
        {/* First Page Button */}
        <button
          onClick={() => handlePageClick(1)}
          disabled={currentPage === 1}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '9999px',
            border: '1.5px solid #235d46',
            background: 'transparent',
            color: currentPage === 1 ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            opacity: currentPage === 1 ? 0.4 : 1,
            transition: 'all 0.2s ease'
          }}
          title="First Page"
        >
          <ChevronsLeft size={16} />
        </button>

        {/* Previous Button */}
        <button
          onClick={() => handlePageClick(currentPage - 1)}
          disabled={currentPage === 1}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '7px 16px',
            borderRadius: '9999px',
            border: '1.5px solid #235d46',
            background: 'transparent',
            color: currentPage === 1 ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            fontSize: '0.84rem',
            fontWeight: 600,
            opacity: currentPage === 1 ? 0.4 : 1,
            transition: 'all 0.2s ease'
          }}
        >
          <ChevronLeft size={16} />
          <span>Previous</span>
        </button>

        {/* Numbered Page Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {pages.map((p, idx) => {
            if (p === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  style={{
                    color: 'rgba(255,255,255,0.5)',
                    padding: '0 4px',
                    fontSize: '0.9rem',
                    userSelect: 'none'
                  }}
                >
                  ...
                </span>
              );
            }

            const isActive = p === currentPage;

            return (
              <PageButton
                key={`page-${p}`}
                pageNumber={p}
                isActive={isActive}
                onClick={() => handlePageClick(p)}
              />
            );
          })}
        </div>

        {/* Next Button */}
        <button
          onClick={() => handlePageClick(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '7px 16px',
            borderRadius: '9999px',
            border: '1.5px solid #235d46',
            background: 'transparent',
            color: currentPage === totalPages ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            fontSize: '0.84rem',
            fontWeight: 600,
            opacity: currentPage === totalPages ? 0.4 : 1,
            transition: 'all 0.2s ease'
          }}
        >
          <span>Next</span>
          <ChevronRight size={16} />
        </button>

        {/* Last Page Button */}
        <button
          onClick={() => handlePageClick(totalPages)}
          disabled={currentPage === totalPages}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '9999px',
            border: '1.5px solid #235d46',
            background: 'transparent',
            color: currentPage === totalPages ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            opacity: currentPage === totalPages ? 0.4 : 1,
            transition: 'all 0.2s ease'
          }}
          title="Last Page"
        >
          <ChevronsRight size={16} />
        </button>
      </div>

      {/* Lower row: Details & per page selector */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          maxWidth: '540px',
          fontSize: '0.82rem',
          color: 'var(--text-muted)',
          paddingTop: '8px',
          borderTop: '1px solid rgba(255,255,255,0.06)'
        }}
      >
        <div>
          Showing <strong style={{ color: '#fae182' }}>{startIndex}</strong> to <strong style={{ color: '#fae182' }}>{endIndex}</strong> of <strong style={{ color: '#fae182' }}>{totalItems}</strong> Proposals
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>Per page:</span>
          {[12, 24, 48].map((size) => (
            <button
              key={size}
              onClick={() => onItemsPerPageChange && onItemsPerPageChange(size)}
              style={{
                background: itemsPerPage === size ? '#235d46' : 'rgba(255,255,255,0.05)',
                color: itemsPerPage === size ? '#ffffff' : 'var(--text-muted)',
                border: `1px solid ${itemsPerPage === size ? '#235d46' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '6px',
                padding: '2px 8px',
                fontSize: '0.78rem',
                cursor: 'pointer',
                fontWeight: itemsPerPage === size ? 700 : 500,
                transition: 'all 0.2s ease'
              }}
            >
              {size}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function PageButton({ pageNumber, isActive, onClick }) {
  const spring = useSpring({
    transform: isActive ? 'scale(1.08)' : 'scale(1)',
    backgroundColor: isActive ? '#235d46' : 'transparent',
    borderColor: '#235d46',
    color: isActive ? '#ffffff' : '#cbd5e1',
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
