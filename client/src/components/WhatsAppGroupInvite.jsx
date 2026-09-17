import React from 'react';
import logoImg from '../assets/logo.jpg';

export default function WhatsAppGroupInvite({ style = {}, showForwardBtn = true }) {
  const inviteUrl = 'https://chat.whatsapp.com/FCfPkrHUA1b2gpq64IhuNe?s=cl&p=i&mlu=0';
  const displayUrl = 'https://chat.whatsapp.com/FCfPkrHUA1b2gpq64IhuNe';

  return (
    <div
      className="wa-invite-wrapper"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        ...style
      }}
    >
      {/* WhatsApp Message Bubble */}
      <div
        className="wa-invite-bubble"
        style={{
          width: '100%',
          maxWidth: '330px',
          minWidth: 0,
          boxSizing: 'border-box',
          background: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 4px 16px rgba(11, 20, 26, 0.12), 0 1px 3px rgba(11, 20, 26, 0.08)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          position: 'relative'
        }}
      >
        {/* Chat Bubble Top-Left Tail Indicator (hidden on small screens via CSS or small enough) */}
        <div
          className="wa-bubble-tail"
          style={{
            position: 'absolute',
            top: 0,
            left: '-6px',
            width: 0,
            height: 0,
            borderTop: '6px solid #ffffff',
            borderLeft: '6px solid transparent',
            zIndex: 1
          }}
        />

        {/* Inner Gray Preview Card */}
        <div
          style={{
            margin: '6px 6px 4px 6px',
            background: '#f0f2f5',
            borderRadius: '8px',
            padding: '9px 11px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxSizing: 'border-box'
          }}
        >
          {/* Round Avatar with Gold Border */}
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              overflow: 'hidden',
              flexShrink: 0,
              border: '1.5px solid #d4af37',
              boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
              background: '#0d251c'
            }}
          >
            <img
              src={logoImg}
              alt="Nikah Bahrain"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block'
              }}
            />
          </div>

          {/* Group Title & Info */}
          <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: '0.92rem',
                color: '#111b21',
                lineHeight: 1.25,
                letterSpacing: '-0.1px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              Nikah Bahrain
            </div>
            <div
              style={{
                fontSize: '0.76rem',
                color: '#667781',
                marginTop: '1px',
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              Group chat invite
            </div>
            <div
              style={{
                fontSize: '0.72rem',
                color: '#8696a0',
                marginTop: '1px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: 1.2
              }}
            >
              chat.whatsapp.com
            </div>
          </div>
        </div>

        {/* Link Text */}
        <div style={{ padding: '8px 12px 10px 12px', boxSizing: 'border-box' }}>
          <a
            href={inviteUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#027eb5',
              fontSize: '0.82rem',
              wordBreak: 'break-all',
              overflowWrap: 'anywhere',
              textDecoration: 'underline',
              lineHeight: 1.35,
              display: 'block'
            }}
          >
            {displayUrl}
          </a>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: '#e9edef' }} />

        {/* Join Group Button */}
        <a
          href={inviteUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'block',
            padding: '11px 16px',
            textAlign: 'center',
            color: '#00a884',
            fontWeight: 700,
            fontSize: '0.94rem',
            textDecoration: 'none',
            background: '#ffffff',
            transition: 'background 0.15s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#f0f2f5')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
        >
          Join group
        </a>
      </div>

      {/* WhatsApp Forward Arrow Action Icon (shown on desktop, hidden on mobile via CSS) */}
      {showForwardBtn && (
        <a
          className="wa-invite-forward-btn"
          href={inviteUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Open WhatsApp Group Invite"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#54656f',
            cursor: 'pointer',
            textDecoration: 'none',
            flexShrink: 0,
            transition: 'transform 0.15s ease, background 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.08)';
            e.currentTarget.style.background = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
          }}
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="currentColor"
          >
            <path d="M12 4V1L20 9L12 17V14C7 14 3.5 15.6 1 19C2 14 5 9 12 4Z" />
          </svg>
        </a>
      )}
    </div>
  );
}
