import React, { useState, useEffect } from 'react';
import { useSpring, animated, config } from '@react-spring/web';
import { 
  Users, 
  UserCheck, 
  UserX, 
  ShieldCheck, 
  Trash2, 
  CheckCircle, 
  PlusCircle, 
  Instagram, 
  ArrowLeft, 
  Phone, 
  MessageCircle, 
  Sparkles, 
  RefreshCw,
  ExternalLink,
  Edit
} from '../icons';
import confetti from 'canvas-confetti';
import API_BASE from '../api';

export default function AdminPanel({ onBackToPortal }) {
  const [stats, setStats] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncingInstagram, setSyncingInstagram] = useState(false);
  const [notification, setNotification] = useState(null);

  // Spring animation for admin container entrance
  const adminSpring = useSpring({
    from: { opacity: 0, transform: 'translateY(15px)' },
    to: { opacity: 1, transform: 'translateY(0px)' },
    config: config.gentle
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, profilesRes] = await Promise.all([
        fetch(`${API_BASE}/stats`),
        fetch(`${API_BASE}/profiles`)
      ]);
      const statsData = await statsRes.json();
      const profilesData = await profilesRes.json();

      if (statsData.success) setStats(statsData.stats);
      if (profilesData.success) setProfiles(profilesData.profiles);
    } catch (err) {
      console.error('Admin fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteProfile = async (id) => {
    if (!window.confirm(`Are you sure you want to remove profile ${id}?`)) return;

    try {
      const res = await fetch(`${API_BASE}/profiles/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        showNotification(`Profile ${id} removed successfully.`);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleVerified = async (profile) => {
    try {
      const res = await fetch(`${API_BASE}/profiles/${profile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verified: !profile.verified })
      });
      const data = await res.json();
      if (data.success) {
        showNotification(`Updated verification status for ${profile.name}`);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSyncToInstagram = async () => {
    setSyncingInstagram(true);
    try {
      showNotification('Connecting to @nikah_bahrain Instagram feed & extracting post cards...');
      const res = await fetch(`${API_BASE}/sync-instagram`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        showNotification(data.message || 'Successfully synced with @nikah_bahrain feed!');
        confetti({ particleCount: 70, spread: 70, origin: { y: 0.4 } });
        await fetchData();
      } else {
        showNotification(data.message || 'Instagram sync failed.');
      }
    } catch (err) {
      console.error('Sync error:', err);
      showNotification('Error connecting to Instagram scraper agent.');
    } finally {
      setSyncingInstagram(false);
    }
  };

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <animated.div 
      style={{
        ...adminSpring,
        maxWidth: '1440px',
        margin: '0 auto',
        padding: '24px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}
    >
      {/* Top Banner & Navigation */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={onBackToPortal}
            className="btn-ghost"
            style={{ padding: '8px 14px' }}
          >
            <ArrowLeft size={16} />
            <span>Back to Portal</span>
          </button>
          <div>
            <h1 
              className="font-cinzel gold-text-gradient"
              style={{ fontSize: '1.8rem', fontWeight: 800 }}
            >
              ADMINISTRATIVE COMMAND CENTER
            </h1>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Manage Matrimonial Categories, Quantities, Instagram Feed Sync & Applicant Forms
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleSyncToInstagram}
            disabled={syncingInstagram}
            className="btn-gold"
            style={{ fontSize: '0.85rem', padding: '9px 18px' }}
          >
            <Instagram size={15} />
            <span>{syncingInstagram ? 'Syncing...' : 'Sync Instagram Feed'}</span>
          </button>
          <button
            onClick={fetchData}
            className="btn-ghost"
            style={{ padding: '9px 12px' }}
            title="Refresh database"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.2)',
            border: '1px solid #10b981',
            color: '#a7f3d0',
            padding: '10px 18px',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <CheckCircle size={16} color="#10b981" />
          <span>{notification}</span>
        </div>
      )}

      {/* STATS METRICS DASHBOARD - QUANTITIES REQUESTED BY USER */}
      {stats && (
        <div>
          <h3 
            className="font-cinzel"
            style={{ fontSize: '1.1rem', color: 'var(--gold-light)', marginBottom: '14px', letterSpacing: '0.5px' }}
          >
            MATRIMONIAL DEMOGRAPHICS & QUANTITIES
          </h3>

          <div 
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px'
            }}
          >
            {/* Grooms (Never Married Men) */}
            <StatCard 
              label="All Grooms"
              count={stats.grooms}
              subtext="Single / Never Married"
              icon={Users}
              accent="#3b82f6"
            />

            {/* Brides (Never Married Women) */}
            <StatCard 
              label="All Brides"
              count={stats.brides}
              subtext="Single / Never Married"
              icon={Users}
              accent="#ec4899"
            />

            {/* Divorced Grooms (Men) */}
            <StatCard 
              label="Divorced Men"
              count={stats.divorcedGrooms}
              subtext="Divorced Grooms"
              icon={UserCheck}
              accent="#a855f7"
            />

            {/* Divorced Brides (Women) */}
            <StatCard 
              label="Divorced Women"
              count={stats.divorcedBrides}
              subtext="Divorced Brides"
              icon={UserCheck}
              accent="#d946ef"
            />

            {/* Widowed Grooms (Men) */}
            <StatCard 
              label="Widowed Men"
              count={stats.widowedGrooms}
              subtext="Widowed Grooms"
              icon={UserX}
              accent="#0ea5e9"
            />

            {/* Widowed Brides (Women) */}
            <StatCard 
              label="Widowed Women"
              count={stats.widowedBrides}
              subtext="Widowed Brides"
              icon={UserX}
              accent="#14b8a6"
            />

            {/* Pakistani Total */}
            <StatCard 
              label="Pakistani Candidates"
              count={stats.pakistani}
              subtext="Verified Pakistani Profiles"
              icon={Sparkles}
              accent="#10b981"
            />

            {/* Indian Total */}
            <StatCard 
              label="Indian Candidates"
              count={stats.indian}
              subtext="Verified Indian Profiles"
              icon={Sparkles}
              accent="#f97316"
            />
          </div>
        </div>
      )}

      {/* APPLICANT FORMS & PROFILES MANAGEMENT TABLE */}
      <div className="glass-panel" style={{ padding: '20px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h3 className="font-cinzel" style={{ fontSize: '1.2rem', color: 'var(--gold-light)' }}>
              Matrimonial Candidate Registry
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Review candidates, verify credentials, update categories, and sync with Instagram @nikah_bahrain
            </p>
          </div>
          <span className="gold-badge">
            Total {profiles.length} Active Records
          </span>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--gold-border)', color: 'var(--gold-light)' }}>
              <th style={{ padding: '12px 10px' }}>Candidate ID</th>
              <th style={{ padding: '12px 10px' }}>Photo & Name</th>
              <th style={{ padding: '12px 10px' }}>Gender & Age</th>
              <th style={{ padding: '12px 10px' }}>Category Tab</th>
              <th style={{ padding: '12px 10px' }}>Nationality</th>
              <th style={{ padding: '12px 10px' }}>Profession & Location</th>
              <th style={{ padding: '12px 10px' }}>Status</th>
              <th style={{ padding: '12px 10px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => (
              <tr 
                key={p.id}
                style={{ 
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  transition: 'background 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(212, 175, 55, 0.05)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '12px 10px', fontWeight: 700, color: 'var(--gold-light)' }}>
                  {p.id}
                </td>
                <td style={{ padding: '12px 10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img 
                      src={p.image} 
                      alt="" 
                      style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--gold-border)' }} 
                    />
                    <div>
                      <div style={{ fontWeight: 600, color: '#ffffff' }}>{p.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{p.sect}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '12px 10px' }}>
                  <span style={{ textTransform: 'capitalize', color: p.gender === 'male' ? '#93c5fd' : '#f9a8d4', fontWeight: 600 }}>
                    {p.gender}
                  </span> • {p.age} yrs
                </td>
                <td style={{ padding: '12px 10px' }}>
                  <span 
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-full)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}
                  >
                    {p.category}
                  </span>
                </td>
                <td style={{ padding: '12px 10px' }}>
                  <span style={{ fontWeight: 600 }}>
                    {p.nationality === 'Pakistani' ? '🇵🇰 Pakistani' : p.nationality === 'Indian' ? '🇮🇳 Indian' : '🇧🇭 Bahraini'}
                  </span>
                </td>
                <td style={{ padding: '12px 10px' }}>
                  <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.profession}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                    {p.location}
                  </div>
                </td>
                <td style={{ padding: '12px 10px' }}>
                  <button
                    onClick={() => handleToggleVerified(p)}
                    style={{
                      background: p.verified ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                      border: `1px solid ${p.verified ? '#10b981' : '#ef4444'}`,
                      color: p.verified ? '#6ee7b7' : '#fca5a5',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <ShieldCheck size={12} />
                    <span>{p.verified ? 'Verified' : 'Pending'}</span>
                  </button>
                </td>
                <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <a
                      href={`https://wa.me/97337188557?text=${encodeURIComponent(`Admin check on candidate: ${p.id} - ${p.name}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-ghost"
                      style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                      title="Direct WhatsApp"
                    >
                      <MessageCircle size={13} color="#25D366" />
                    </a>
                    <button
                      onClick={() => handleDeleteProfile(p.id)}
                      className="btn-ghost"
                      style={{ padding: '6px 10px', color: '#ef4444' }}
                      title="Delete profile"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* BOTTOM CONTACT & INSTAGRAM LINKS AS REQUESTED BY USER */}
      <div 
        className="glass-panel"
        style={{
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          border: '1px solid var(--gold-border)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h4 className="font-cinzel gold-text-gradient" style={{ fontSize: '1.2rem', fontWeight: 700 }}>
              Official Matrimonial Contact & Verification Channels
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Direct hotline lines for male and female family coordinators
            </p>
          </div>

          <a
            href="https://www.instagram.com/nikah_bahrain/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold"
            style={{ fontSize: '0.85rem' }}
          >
            <Instagram size={15} />
            <span>Open @nikah_bahrain Instagram</span>
          </a>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          {/* Male Coordinator */}
          <div 
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--gold-light)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>
                Male Family Coordinator
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginTop: '2px' }}>
                +973 3718 8557
              </div>
            </div>
            <a
              href="https://wa.me/97337188557"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp"
              style={{ padding: '8px 14px', fontSize: '0.8rem' }}
            >
              <MessageCircle size={14} /> WhatsApp
            </a>
          </div>

          {/* Female Coordinator */}
          <div 
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--gold-light)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>
                Female Family Coordinator
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginTop: '2px' }}>
                +973 3456 0078
              </div>
            </div>
            <a
              href="https://wa.me/97334560078"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp"
              style={{ padding: '8px 14px', fontSize: '0.8rem' }}
            >
              <MessageCircle size={14} /> WhatsApp
            </a>
          </div>

          {/* Official Google Form Link */}
          <div 
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--gold-light)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>
                Official Candidate Form
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ffffff', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '240px' }}>
                Candidate Registration Form
              </div>
            </div>
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSe8p6bnqIMv7sPlDrYdREZHkpmuVb5c5pWrSVWqr70NhvvRCQ/viewform"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost"
              style={{ padding: '8px 14px', fontSize: '0.8rem' }}
            >
              <ExternalLink size={14} /> Link
            </a>
          </div>
        </div>
      </div>
    </animated.div>
  );
}

function StatCard({ label, count, subtext, icon: Icon, accent }) {
  const cardSpring = useSpring({
    from: { opacity: 0, transform: 'scale(0.95)' },
    to: { opacity: 1, transform: 'scale(1)' },
    config: { tension: 300, friction: 20 }
  });

  return (
    <animated.div
      style={{
        ...cardSpring,
        background: 'rgba(11, 24, 44, 0.75)',
        border: '1px solid var(--gold-border)',
        borderRadius: 'var(--radius-md)',
        padding: '18px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div 
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '60px',
          height: '60px',
          background: `radial-gradient(circle, ${accent}22 0%, transparent 70%)`,
          pointerEvents: 'none'
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
          {label}
        </span>
        <Icon size={18} color={accent} />
      </div>

      <div 
        className="font-cinzel"
        style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.1 }}
      >
        {count}
      </div>

      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
        {subtext}
      </div>
    </animated.div>
  );
}
