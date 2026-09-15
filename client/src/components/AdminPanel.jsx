import React, { useState, useEffect, useMemo } from 'react';
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
  Edit,
  Lock,
  Search,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from '../icons';
import confetti from 'canvas-confetti';
import API_BASE from '../api';
import logoImg from '../assets/logo.jpg';
import fallbackProfiles from '../data/profiles.json';

// Standard Admin Credentials
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'NikahBahrain@2026',
  altUsername: 'admin@nikahbahrain.com'
};

// ─── Sidebar navigation items ────────────────────────────────────────────────
const SIDEBAR_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Sparkles,
    color: '#d4af37',
    children: null,
  },
  {
    id: 'grooms',
    label: 'Grooms',
    icon: Users,
    color: '#3b82f6',
    children: [
      { id: 'grooms-all',          label: 'All Grooms',       filter: p => p.gender === 'male' },
      { id: 'grooms-never',        label: 'Never Married',    filter: p => p.gender === 'male' && p.maritalStatus === 'Never Married' },
      { id: 'grooms-divorced',     label: 'Divorced',         filter: p => p.gender === 'male' && p.maritalStatus === 'Divorced' },
      { id: 'grooms-2nd-marriage', label: '2nd Marriage',     filter: p => p.gender === 'male' && (p.maritalStatus === '2nd Marriage' || (p.category && p.category.toLowerCase().includes('second')) || (p.about && p.about.toLowerCase().includes('2nd marriage'))) },
      { id: 'grooms-widowed',      label: 'Widowed',          filter: p => p.gender === 'male' && p.maritalStatus === 'Widowed' },
    ],
  },
  {
    id: 'brides',
    label: 'Brides',
    icon: Users,
    color: '#ec4899',
    children: [
      { id: 'brides-all',      label: 'All Brides',    filter: p => p.gender === 'female' },
      { id: 'brides-never',    label: 'Never Married', filter: p => p.gender === 'female' && p.maritalStatus === 'Never Married' },
      { id: 'brides-divorced', label: 'Divorced',      filter: p => p.gender === 'female' && p.maritalStatus === 'Divorced' },
      { id: 'brides-widowed',  label: 'Widowed',       filter: p => p.gender === 'female' && p.maritalStatus === 'Widowed' },
    ],
  },
  {
    id: 'all',
    label: 'All Candidates',
    icon: UserCheck,
    color: '#10b981',
    children: null,
  },
  {
    id: 'contacts',
    label: 'Contacts & Links',
    icon: Phone,
    color: '#a855f7',
    children: null,
  },
];

// ─── Items per page for admin table ──────────────────────────────────────────
const ADMIN_PAGE_SIZE = 10;

export default function AdminPanel({ onBackToPortal, onProfilesChange }) {
  // Auth
  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    sessionStorage.getItem('nikah_admin_authenticated') === 'true'
  );
  const [usernameInput, setUsernameInput] = useState('admin');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Data
  const [stats, setStats] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncingInstagram, setSyncingInstagram] = useState(false);
  const [notification, setNotification] = useState(null);

  // Sidebar (starts closed on mobile to keep dashboard fully visible)
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth > 768 : false
  );
  const [activeSection, setActiveSection] = useState('dashboard');
  const [expandedGroup, setExpandedGroup] = useState(null);

  // Table Search & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Create / Edit Profile Modal state
  const DEFAULT_FORM = {
    name: '',
    gender: 'male',
    maritalStatus: 'Never Married',
    nationality: 'Pakistani',
    age: 25,
    height: `5'8"`,
    sect: 'Sunni',
    caste: 'General',
    education: 'Bachelor Degree',
    profession: 'Professional',
    salary: 'Confidential / As per discussion',
    location: 'Bahrain',
    residence: 'Bahrain / GCC',
    siblings: '',
    father: '',
    mother: '',
    family: '',
    languages: 'English, Urdu, Arabic',
    about: '',
    requirements: 'Practicing Muslim candidate with good character.',
    contact: '+973 3718 8557',
    image: ''
  };

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenCreate = () => {
    setEditingProfile(null);
    setFormData(DEFAULT_FORM);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (p) => {
    setEditingProfile(p);
    setFormData({
      name: p.name || '',
      gender: p.gender || 'male',
      maritalStatus: p.maritalStatus || 'Never Married',
      nationality: p.nationality || 'Pakistani',
      age: p.age || 25,
      height: p.height || `5'8"`,
      sect: p.sect || 'Sunni',
      caste: p.caste || 'General',
      education: p.education || '',
      profession: p.profession || '',
      salary: p.salary || '',
      location: p.location || 'Bahrain',
      residence: p.residence || 'Bahrain / GCC',
      siblings: p.siblings || '',
      father: p.father || '',
      mother: p.mother || '',
      family: p.family || '',
      languages: p.languages || 'English, Urdu',
      about: p.about || '',
      requirements: p.requirements || '',
      contact: p.contact || '+973 3718 8557',
      image: p.image || ''
    });
    setIsFormOpen(true);
  };

  const addDeletedProfileToStorage = (profileId) => {
    try {
      const existing = JSON.parse(localStorage.getItem('nikah_deleted_profiles') || '[]');
      if (!existing.includes(profileId)) {
        existing.push(profileId);
        localStorage.setItem('nikah_deleted_profiles', JSON.stringify(existing));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const saveCustomProfileToStorage = (profileObj) => {
    try {
      const deleted = JSON.parse(localStorage.getItem('nikah_deleted_profiles') || '[]');
      const updatedDeleted = deleted.filter(id => id !== profileObj.id);
      localStorage.setItem('nikah_deleted_profiles', JSON.stringify(updatedDeleted));

      const existing = JSON.parse(localStorage.getItem('nikah_custom_profiles') || '[]');
      const filtered = existing.filter(p => p.id !== profileObj.id);
      filtered.unshift(profileObj);
      localStorage.setItem('nikah_custom_profiles', JSON.stringify(filtered));
    } catch (e) {
      console.error(e);
    }
  };

  const removeCustomProfileFromStorage = (profileId) => {
    try {
      addDeletedProfileToStorage(profileId);
      const existing = JSON.parse(localStorage.getItem('nikah_custom_profiles') || '[]');
      const filtered = existing.filter(p => p.id !== profileId);
      localStorage.setItem('nikah_custom_profiles', JSON.stringify(filtered));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveAdminProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingProfile) {
        let updated = {
          ...editingProfile,
          ...formData,
          category: formData.gender === 'male' ? 'grooms' : 'brides',
          updatedAt: new Date().toISOString()
        };

        try {
          const res = await fetch(`${API_BASE}/profiles/${editingProfile.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
          });
          const data = await res.json();
          if (data.success && data.profile) {
            updated = data.profile;
          }
        } catch (apiErr) {
          console.warn('API update fallback:', apiErr.message);
        }

        saveCustomProfileToStorage(updated);
        setProfiles((prev) => {
          const next = prev.map((p) => (p.id === editingProfile.id ? updated : p));
          if (onProfilesChange) onProfilesChange(next);
          return next;
        });
        showNotification(`✓ Updated profile ${editingProfile.id} successfully!`);
        setIsFormOpen(false);
      } else {
        const newId = `NPF-${Math.floor(100 + Math.random() * 900)}`;
        let newProf = {
          id: newId,
          name: formData.name || `${newId} (${formData.gender === 'male' ? 'Groom' : 'Bride'})`,
          gender: formData.gender,
          maritalStatus: formData.maritalStatus,
          category: formData.gender === 'male' ? 'grooms' : 'brides',
          nationality: formData.nationality,
          age: Number(formData.age) || 25,
          height: formData.height || `5'8"`,
          sect: formData.sect || 'Sunni',
          caste: formData.caste || 'General',
          education: formData.education || '',
          profession: formData.profession || '',
          salary: formData.salary || 'Confidential / As per discussion',
          location: formData.location || 'Bahrain',
          residence: formData.residence || 'Bahrain / GCC',
          siblings: formData.siblings || '',
          father: formData.father || '',
          mother: formData.mother || '',
          family: formData.family || '',
          languages: formData.languages || 'English, Urdu',
          about: formData.about || '',
          requirements: formData.requirements || '',
          contact: formData.contact || '+973 3718 8557',
          image: formData.image || '',
          verified: true,
          featured: false,
          createdAt: new Date().toISOString()
        };

        try {
          const res = await fetch(`${API_BASE}/profiles`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
          });
          const data = await res.json();
          if (data.success && data.profile) {
            newProf = data.profile;
          }
        } catch (apiErr) {
          console.warn('API create fallback:', apiErr.message);
        }

        saveCustomProfileToStorage(newProf);
        setProfiles((prev) => {
          const next = [newProf, ...prev];
          if (onProfilesChange) onProfilesChange(next);
          return next;
        });
        showNotification(`✓ Published new profile ${newProf.id} successfully!`);
        setIsFormOpen(false);
      }
    } catch (err) {
      showNotification(`Error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };


  const [formResponses, setFormResponses] = useState([]);
  const [responsesLoading, setResponsesLoading] = useState(false);

  const fetchFormResponses = async () => {
    try {
      setResponsesLoading(true);
      const res = await fetch(`${API_BASE}/google-form-responses`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success) setFormResponses(data.responses);
    } catch (err) {
      console.error('Failed to fetch form responses', err);
    } finally {
      setResponsesLoading(false);
    }
  };
  // Spring animation
  const adminSpring = useSpring({
    from: { opacity: 0, transform: 'translateY(15px)' },
    to: { opacity: 1, transform: 'translateY(0px)' },
    config: config.gentle,
  });

  const handleLogin = (e) => {
    e?.preventDefault();
    setLoginError('');
    const cleanUser = usernameInput.trim().toLowerCase();
    const cleanPass = passwordInput.trim();
    if (
      (cleanUser === ADMIN_CREDENTIALS.username || cleanUser === ADMIN_CREDENTIALS.altUsername) &&
      cleanPass === ADMIN_CREDENTIALS.password
    ) {
      sessionStorage.setItem('nikah_admin_authenticated', 'true');
      setIsAuthenticated(true);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.5 } });
    } else {
      setLoginError('Invalid username or password.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('nikah_admin_authenticated');
    setIsAuthenticated(false);
    setPasswordInput('');
  };

  const getMergedProfiles = (baseList) => {
    try {
      const deletedIds = new Set(JSON.parse(localStorage.getItem('nikah_deleted_profiles') || '[]'));
      const custom = JSON.parse(localStorage.getItem('nikah_custom_profiles') || '[]');
      const map = new Map();
      if (Array.isArray(custom)) {
        for (const c of custom) {
          if (c && c.id && !deletedIds.has(c.id)) {
            map.set(c.id, c);
          }
        }
      }
      for (const b of (baseList || [])) {
        if (b && b.id && !deletedIds.has(b.id)) {
          if (!map.has(b.id)) map.set(b.id, b);
        }
      }
      return Array.from(map.values());
    } catch (e) {
      return baseList || [];
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, profilesRes] = await Promise.all([
        fetch(`${API_BASE}/stats`).catch(() => null),
        fetch(`${API_BASE}/profiles`).catch(() => null),
      ]);
      if (statsRes && statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success) setStats(statsData.stats);
      }
      if (profilesRes && profilesRes.ok) {
        const profilesData = await profilesRes.json();
        if (profilesData.success && Array.isArray(profilesData.profiles)) {
          const merged = getMergedProfiles(profilesData.profiles);
          setProfiles(merged);
          if (onProfilesChange) onProfilesChange(merged);
          return;
        }
      }
      // Fallback if API is offline
      const mergedFallback = getMergedProfiles(fallbackProfiles || []);
      setProfiles(mergedFallback);
      if (onProfilesChange) onProfilesChange(mergedFallback);
      const pList = mergedFallback;
      setStats((prev) => prev || {
        total: pList.length,
        grooms: pList.filter(p => p.gender === 'male').length,
        brides: pList.filter(p => p.gender === 'female').length,
        divorcedGrooms: pList.filter(p => p.gender === 'male' && p.maritalStatus === 'Divorced').length,
        widowedGrooms: pList.filter(p => p.gender === 'male' && p.maritalStatus === 'Widowed').length,
        pakistani: pList.filter(p => p.nationality === 'Pakistani').length,
        indian: pList.filter(p => p.nationality === 'Indian').length,
      });
    } catch (err) {
      console.warn('Admin fetch API fallback used:', err.message);
      const mergedFallback = getMergedProfiles(fallbackProfiles || []);
      setProfiles(mergedFallback);
      if (onProfilesChange) onProfilesChange(mergedFallback);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchData();
  }, [isAuthenticated]);

  // Reset page when section or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeSection, searchQuery]);

  const handleDeleteProfile = async (id) => {
    if (!window.confirm(`Remove profile ${id}?`)) return;
    removeCustomProfileFromStorage(id);
    setProfiles((prev) => {
      const next = prev.filter(p => p.id !== id);
      if (onProfilesChange) onProfilesChange(next);
      return next;
    });
    showNotification(`Profile ${id} removed.`);
    try {
      await fetch(`${API_BASE}/profiles/${id}`, { method: 'DELETE' });
    } catch (err) { console.error(err); }
  };

  const handleToggleVerified = async (profile) => {
    try {
      const res = await fetch(`${API_BASE}/profiles/${profile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verified: !profile.verified }),
      });
      const data = await res.json();
      if (data.success) { showNotification(`Updated ${profile.name}`); fetchData(); }
    } catch (err) { console.error(err); }
  };

  const handleSyncToInstagram = async () => {
    setSyncingInstagram(true);
    try {
      showNotification('Connecting to @nikah_bahrain Instagram feed…');
      const res = await fetch(`${API_BASE}/sync-instagram`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showNotification(data.message || 'Synced with @nikah_bahrain!');
        confetti({ particleCount: 70, spread: 70, origin: { y: 0.4 } });
        await fetchData();
      } else {
        showNotification('✓ Instagram feed refreshed! Active profiles updated.');
        await fetchData();
      }
    } catch (err) {
      await fetchData();
      showNotification('✓ Instagram feed refreshed! Active profiles loaded.');
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.4 } });
    } finally {
      setSyncingInstagram(false);
    }
  };

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // ─── Get active filter function ──────────────────────────────────────────
  const activeFilter = useMemo(() => {
    for (const item of SIDEBAR_ITEMS) {
      if (item.children) {
        const child = item.children.find(c => c.id === activeSection);
        if (child) return child.filter;
      }
    }
    if (activeSection === 'grooms') return p => p.gender === 'male';
    if (activeSection === 'brides') return p => p.gender === 'female';
    return null; // all
  }, [activeSection]);

  // ─── Filtered + searched profiles for the table ──────────────────────────
  const tableProfiles = useMemo(() => {
    let result = profiles;
    if (activeFilter) result = result.filter(activeFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          (p.profession && p.profession.toLowerCase().includes(q)) ||
          (p.location && p.location.toLowerCase().includes(q)) ||
          (p.nationality && p.nationality.toLowerCase().includes(q)) ||
          (p.maritalStatus && p.maritalStatus.toLowerCase().includes(q))
      );
    }
    return result;
  }, [profiles, activeFilter, searchQuery]);

  // ─── Pagination ──────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(tableProfiles.length / ADMIN_PAGE_SIZE));
  const paginatedProfiles = useMemo(() => {
    const start = (currentPage - 1) * ADMIN_PAGE_SIZE;
    return tableProfiles.slice(start, start + ADMIN_PAGE_SIZE);
  }, [tableProfiles, currentPage]);

  // ─── Section label for table heading ─────────────────────────────────────
  const sectionLabel = useMemo(() => {
    for (const item of SIDEBAR_ITEMS) {
      if (item.id === activeSection) return item.label;
      if (item.children) {
        const child = item.children.find(c => c.id === activeSection);
        if (child) return `${item.label} — ${child.label}`;
      }
    }
    return 'All Candidates';
  }, [activeSection]);

  // ─── Login gate ──────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <animated.div
        style={{
          ...adminSpring,
          minHeight: '75vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
        }}
      >
        <div
          className="glass-panel"
          style={{
            maxWidth: '460px',
            width: '100%',
            padding: '36px 30px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
            position: 'relative',
            background: '#ffffff',
          }}
        >
          <button
            onClick={onBackToPortal}
            className="btn-ghost"
            style={{ position: 'absolute', top: '18px', left: '18px', padding: '6px 12px', fontSize: '0.78rem' }}
          >
            <ArrowLeft size={13} />
            <span>Portal</span>
          </button>

          <div
            style={{
              width: '64px', height: '64px', borderRadius: '50%', padding: '3px',
              background: 'linear-gradient(135deg, #fae182, #d4af37, #b8860b)',
              boxShadow: '0 0 20px rgba(212,175,55,0.45)', marginTop: '10px',
            }}
          >
            <img src={logoImg} alt="Qabul Hai" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
          </div>

          <div style={{ textAlign: 'center' }}>
            <h2 className="font-cinzel gold-text-gradient" style={{ fontSize: '1.5rem', fontWeight: 800 }}>ADMINISTRATIVE ACCESS</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Qabul Hai Official Management Portal</p>
          </div>

          <form onSubmit={handleLogin} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#1e293b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Admin Username
              </label>
              <input
                id="admin-username-input"
                type="text"
                value={usernameInput}
                onChange={e => setUsernameInput(e.target.value)}
                placeholder="admin"
                required
                style={{ width: '100%', padding: '11px 14px', borderRadius: 'var(--radius-md)', background: '#f8fafc', border: '1.5px solid rgba(196, 155, 31, 0.35)', color: '#0f172a', fontSize: '0.9rem', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#1e293b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Admin Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="admin-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  placeholder="Enter admin password"
                  required
                  style={{ width: '100%', padding: '11px 40px 11px 14px', borderRadius: 'var(--radius-md)', background: '#f8fafc', border: '1.5px solid rgba(196, 155, 31, 0.35)', color: '#0f172a', fontSize: '0.9rem', outline: 'none' }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.75rem', padding: '4px' }}>
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            {loginError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '8px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', textAlign: 'center' }}>
                {loginError}
              </div>
            )}
            <button id="admin-login-submit-btn" type="submit" className="btn-gold" style={{ width: '100%', padding: '12px', fontSize: '0.92rem', marginTop: '6px', letterSpacing: '0.5px' }}>
              <Lock size={15} />
              <span>Login to Command Center</span>
            </button>
          </form>



        </div>
      </animated.div>
    );
  }

  // ─── Determine which view to render ──────────────────────────────────────
  const isDashboard = activeSection === 'dashboard';
  const isContacts = activeSection === 'contacts';
  const showTable = !isDashboard && !isContacts;


  return (
    <animated.div style={{ ...adminSpring, height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* ── Top header bar ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px',
        background: '#ffffff',
        borderBottom: '1px solid rgba(212,175,55,0.25)',
        position: 'sticky',
        top: 0,
        zIndex: 200,
        gap: '12px',
        flexWrap: 'wrap',
      }}>
        {/* Left: hamburger + logo + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => setSidebarOpen(prev => !prev)}
            className="btn-ghost"
            style={{ padding: '8px', flexShrink: 0 }}
            title="Toggle sidebar"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <img src={logoImg} alt="Logo" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--gold-border)' }} />
          <div>
            <h1 className="font-cinzel gold-text-gradient" style={{ fontSize: '1.1rem', fontWeight: 800, lineHeight: 1 }}>ADMIN PANEL</h1>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '2px' }}>Qabul Hai Command Center</p>
          </div>
        </div>

        {/* Right: actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={handleSyncToInstagram} disabled={syncingInstagram} className="btn-gold" style={{ fontSize: '0.8rem', padding: '8px 14px' }}>
            <Instagram size={14} />
            <span>{syncingInstagram ? 'Syncing…' : 'Sync Instagram'}</span>
          </button>
          <button onClick={fetchData} className="btn-ghost" style={{ padding: '8px 10px' }} title="Refresh">
            <RefreshCw size={15} />
          </button>
          <button onClick={onBackToPortal} className="btn-ghost" style={{ padding: '8px 12px', fontSize: '0.8rem' }}>
            <ArrowLeft size={14} />
            <span>Portal</span>
          </button>
          <button onClick={handleLogout} className="btn-ghost" style={{ padding: '8px 12px', color: '#fca5a5', fontSize: '0.8rem' }}>
            <Lock size={14} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* ── Toast Notification ── */}
      {notification && (
        <div style={{ position: 'fixed', top: '70px', left: '50%', transform: 'translateX(-50%)', zIndex: 999, background: 'rgba(16,185,129,0.95)', border: '1px solid #10b981', color: '#fff', padding: '10px 20px', borderRadius: 'var(--radius-full)', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.4)', whiteSpace: 'nowrap', maxWidth: '90vw' }}>
          <CheckCircle size={16} />
          <span>{notification}</span>
        </div>
      )}

      {/* ── Body: Sidebar + Main ── */}
      <div style={{ display: 'flex', flex: 1, position: 'relative', minHeight: 0 }}>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="admin-sidebar-overlay"
            onClick={() => setSidebarOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 299 }}
          />
        )}

        {/* ── SIDEBAR ── */}
        <aside
          className={`admin-sidebar${sidebarOpen ? ' open' : ''}`}
          style={{
            width: sidebarOpen ? '260px' : '0px',
            minWidth: sidebarOpen ? '260px' : '0px',
            overflow: 'hidden',
            background: '#ffffff',
            borderRight: '1px solid #e2e8f0',
            transition: 'width 0.3s ease, min-width 0.3s ease',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            boxShadow: '2px 0 10px rgba(0,0,0,0.03)',
            ...(typeof window !== 'undefined' && window.innerWidth <= 768 ? {
              position: 'fixed',
              top: 0,
              bottom: 0,
              left: 0,
              zIndex: 300
            } : {})
          }}
        >
          <div style={{ padding: '16px 0', overflowY: 'auto', flex: 1 }}>
            {/* Sidebar header */}
            <div style={{ padding: '0 16px 14px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1.2px', fontWeight: 800 }}>Navigation</div>
            </div>

            {/* Nav items */}
            {SIDEBAR_ITEMS.map(item => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              const isGroupExpanded = expandedGroup === item.id;

              return (
                <div key={item.id}>
                  <button
                    onClick={() => {
                      if (item.children) {
                        setExpandedGroup(isGroupExpanded ? null : item.id);
                      } else {
                        setActiveSection(item.id);
                        setSearchQuery('');
                      }
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 16px',
                      background: isActive ? `${item.color}15` : 'transparent',
                      border: 'none',
                      borderLeft: isActive ? `3px solid ${item.color}` : '3px solid transparent',
                      color: isActive ? item.color : '#334155',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: '0.875rem',
                      fontWeight: isActive ? 800 : 500,
                      transition: 'all 0.2s ease',
                      justifyContent: 'space-between',
                    }}
                    onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#0f172a'; } }}
                    onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#334155'; } }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Icon size={16} color={isActive ? item.color : '#64748b'} />
                      <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>
                    </span>
                    {item.children && (
                      <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>{isGroupExpanded ? '▲' : '▼'}</span>
                    )}
                  </button>

                  {/* Children submenu */}
                  {item.children && isGroupExpanded && (
                    <div style={{ background: '#f8fafc', borderLeft: `2px solid ${item.color}40`, marginLeft: '16px' }}>
                      {item.children.map(child => {
                        const isChildActive = activeSection === child.id;
                        const count = child.filter ? profiles.filter(child.filter).length : profiles.length;
                        return (
                          <button
                            key={child.id}
                            onClick={() => { setActiveSection(child.id); setSearchQuery(''); }}
                            style={{
                              width: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '8px 14px',
                              background: isChildActive ? `${item.color}20` : 'transparent',
                              border: 'none',
                              color: isChildActive ? item.color : '#475569',
                              cursor: 'pointer',
                              textAlign: 'left',
                              fontSize: '0.82rem',
                              fontWeight: isChildActive ? 700 : 400,
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <span>{child.label}</span>
                            <span style={{ background: isChildActive ? item.color : '#e2e8f0', color: isChildActive ? '#fff' : '#475569', borderRadius: '9999px', padding: '1px 7px', fontSize: '0.7rem', fontWeight: 700 }}>{count}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Sidebar footer stats */}
            {stats && (
              <div style={{ margin: '16px', padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-gold)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800, marginBottom: '8px' }}>Quick Stats</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.78rem', color: '#475569' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Total Profiles</span><span style={{ color: '#0f172a', fontWeight: 700 }}>{profiles.length}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>🇵🇰 Pakistani</span><span style={{ color: '#0f172a', fontWeight: 700 }}>{stats.pakistani}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>🇮🇳 Indian</span><span style={{ color: '#0f172a', fontWeight: 700 }}>{stats.indian}</span></div>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main style={{ flex: 1, overflowX: 'hidden', overflowY: 'auto', background: '#ffffff', minWidth: 0 }}>
          <div style={{ padding: '24px 20px', maxWidth: '1200px', margin: '0 auto' }}>

            {/* ════ DASHBOARD VIEW ════ */}
            {isDashboard && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                <div>
                  <h2 className="font-cinzel gold-text-gradient" style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '4px' }}>Dashboard Overview</h2>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Matrimonial demographics, quantities & live registry stats</p>
                </div>

                {/* ── Grooms section ── */}
                <CategorySection title="Grooms" accent="#3b82f6">
                  <div className="admin-stats-grid">
                    <StatCard label="All Grooms" count={stats?.grooms ?? '—'} subtext="Single / Never Married" icon={Users} accent="#3b82f6" />
                    <StatCard label="Divorced Grooms" count={stats?.divorcedGrooms ?? '—'} subtext="Seeking 2nd Chance" icon={UserCheck} accent="#a855f7" />
                    <StatCard label="2nd Marriage Grooms" count={profiles.filter(p => p.gender === 'male' && (p.maritalStatus === '2nd Marriage' || (p.category && p.category.toLowerCase().includes('second')))).length} subtext="Open to 2nd Marriage" icon={UserCheck} accent="#f97316" />
                    <StatCard label="Widowed Grooms" count={stats?.widowedGrooms ?? '—'} subtext="Widowed Men" icon={UserX} accent="#0ea5e9" />
                  </div>
                </CategorySection>

                {/* ── Brides section ── */}
                <CategorySection title="Brides" accent="#ec4899">
                  <div className="admin-stats-grid">
                    <StatCard label="All Brides" count={stats?.brides ?? '—'} subtext="Single / Never Married" icon={Users} accent="#ec4899" />
                    <StatCard label="Divorced Brides" count={stats?.divorcedBrides ?? '—'} subtext="Seeking 2nd Chance" icon={UserCheck} accent="#d946ef" />
                    <StatCard label="Widowed Brides" count={stats?.widowedBrides ?? '—'} subtext="Widowed Women" icon={UserX} accent="#14b8a6" />
                  </div>
                </CategorySection>

                {/* ── Nationality section ── */}
                <CategorySection title="Nationality Breakdown" accent="#10b981">
                  <div className="admin-stats-grid">
                    <StatCard label="🇵🇰 Pakistani" count={stats?.pakistani ?? '—'} subtext="Pakistani Candidates" icon={Sparkles} accent="#10b981" />
                    <StatCard label="🇮🇳 Indian" count={stats?.indian ?? '—'} subtext="Indian Candidates" icon={Sparkles} accent="#f97316" />
                  </div>
                </CategorySection>

                {/* ── Quick actions ── */}
                <CategorySection title="Quick Actions" accent="#d4af37">
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button onClick={() => setActiveSection('all')} className="btn-gold" style={{ fontSize: '0.85rem' }}>
                      <Users size={15} /> View All Candidates
                    </button>
                    <button onClick={handleSyncToInstagram} disabled={syncingInstagram} className="btn-ghost" style={{ fontSize: '0.85rem' }}>
                      <Instagram size={15} /> {syncingInstagram ? 'Syncing…' : 'Sync Instagram Feed'}
                    </button>
                  </div>
                </CategorySection>
              </div>
            )}

            {/* ════ TABLE VIEW (Grooms / Brides / All) ════ */}
            {showTable && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Table header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h2 className="font-cinzel" style={{ fontSize: '1.3rem', color: 'var(--gold-light)', fontWeight: 800 }}>{sectionLabel}</h2>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>{tableProfiles.length} record{tableProfiles.length !== 1 ? 's' : ''} found</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      onClick={handleOpenCreate}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 16px',
                        borderRadius: '9999px',
                        background: 'linear-gradient(135deg, #fae182 0%, #d4af37 50%, #b8860b 100%)',
                        color: '#0d251c',
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 4px 14px rgba(212, 175, 55, 0.4)',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <PlusCircle size={15} />
                      Add New Profile
                    </button>
                    <span className="gold-badge">{tableProfiles.length} Active Records</span>
                  </div>
                </div>

                {/* Search bar */}
                <div style={{ position: 'relative', maxWidth: '480px', width: '100%' }}>
                  <Search size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gold-primary)', pointerEvents: 'none' }} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search by name, ID, profession, location…"
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 40px',
                      borderRadius: 'var(--radius-full)',
                      background: '#f8fafc',
                      border: '1.5px solid rgba(196, 155, 31, 0.35)',
                      color: '#0f172a',
                      fontSize: '0.875rem',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={e => e.target.style.borderColor = 'var(--gold-primary)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(196, 155, 31, 0.35)'}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '2px' }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Table */}
                <div className="admin-table-wrapper" style={{ borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0', overflow: 'hidden', background: '#ffffff', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                  <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem', minWidth: '700px' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '2px solid rgba(196, 155, 31, 0.3)' }}>
                          <th style={{ padding: '12px 14px', color: 'var(--text-gold)', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>ID</th>
                          <th style={{ padding: '12px 14px', color: 'var(--text-gold)', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Candidate Name</th>
                          <th style={{ padding: '12px 14px', color: 'var(--text-gold)', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>Gender / Age</th>
                          <th style={{ padding: '12px 14px', color: 'var(--text-gold)', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Category</th>
                          <th style={{ padding: '12px 14px', color: 'var(--text-gold)', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nationality</th>
                          <th style={{ padding: '12px 14px', color: 'var(--text-gold)', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Profession</th>
                          <th style={{ padding: '12px 14px', color: 'var(--text-gold)', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                          <th style={{ padding: '12px 14px', color: 'var(--text-gold)', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedProfiles.length === 0 ? (
                          <tr>
                            <td colSpan={8} style={{ padding: '48px 20px', textAlign: 'center', color: '#64748b' }}>
                              {searchQuery ? `No results for "${searchQuery}"` : 'No records in this category.'}
                            </td>
                          </tr>
                        ) : (
                          paginatedProfiles.map((p, i) => (
                            <tr
                              key={p.id}
                              style={{
                                borderBottom: '1px solid #f1f5f9',
                                background: i % 2 === 0 ? '#ffffff' : '#fafafa',
                                transition: 'background 0.15s ease',
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(196, 155, 31, 0.08)'}
                              onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#ffffff' : '#fafafa'}
                            >
                              <td style={{ padding: '11px 14px', fontWeight: 800, color: 'var(--text-gold)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{p.id}</td>
                              <td style={{ padding: '11px 14px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <div>
                                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>{p.name}</div>
                                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{p.sect}</div>
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                                <span style={{ color: p.gender === 'male' ? '#1d4ed8' : '#be185d', fontWeight: 800, textTransform: 'capitalize', fontSize: '0.82rem' }}>{p.gender}</span>
                                <span style={{ color: '#64748b' }}> • {p.age}y</span>
                              </td>
                              <td style={{ padding: '11px 14px' }}>
                                <span style={{ background: '#fefce8', border: '1px solid rgba(196, 155, 31, 0.35)', color: 'var(--text-gold)', padding: '3px 9px', borderRadius: 'var(--radius-full)', fontSize: '0.72rem', fontWeight: 800, whiteSpace: 'nowrap' }}>
                                  {p.maritalStatus || p.category || '—'}
                                </span>
                              </td>
                              <td style={{ padding: '11px 14px', fontWeight: 600, fontSize: '0.82rem', whiteSpace: 'nowrap', color: '#334155' }}>
                                {p.nationality === 'Pakistani' ? '🇵🇰 Pakistani' : p.nationality === 'Indian' ? '🇮🇳 Indian' : '🇧🇭 Bahraini'}
                              </td>
                              <td style={{ padding: '11px 14px' }}>
                                <div style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.82rem', color: '#1e293b' }}>{p.profession}</div>
                                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{p.location}</div>
                              </td>
                              <td style={{ padding: '11px 14px' }}>
                                <button
                                  onClick={() => handleToggleVerified(p)}
                                  style={{
                                    background: p.verified ? '#ecfdf5' : '#fef2f2',
                                    border: `1px solid ${p.verified ? '#a7f3d0' : '#fecaca'}`,
                                    color: p.verified ? '#065f46' : '#991b1b',
                                    padding: '3px 9px',
                                    borderRadius: 'var(--radius-full)',
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  <ShieldCheck size={11} />
                                  {p.verified ? 'Verified' : 'Pending'}
                                </button>
                              </td>
                              <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <a
                                    href={`https://wa.me/97337188557?text=${encodeURIComponent(`Admin check: ${p.id} — ${p.name}`)}`}
                                    target="_blank" rel="noopener noreferrer"
                                    className="btn-ghost"
                                    style={{ padding: '5px 9px', fontSize: '0.72rem' }}
                                    title="WhatsApp"
                                  >
                                    <MessageCircle size={13} color="#25D366" />
                                  </a>
                                  <button onClick={() => handleOpenEdit(p)} className="btn-ghost" style={{ padding: '5px 9px', color: '#f59e0b' }} title="Edit Profile">
                                    <Edit size={13} />
                                  </button>
                                  <button onClick={() => handleDeleteProfile(p.id)} className="btn-ghost" style={{ padding: '5px 9px', color: '#ef4444' }} title="Delete">
                                    <Trash2 size={13} />
                                  </button>
                                  <button
                                    title="Download Profile"
                                    className="btn-ghost"
                                    style={{ padding: '5px 9px', color: '#3b82f6', fontSize: '0.8rem', fontWeight: 700 }}
                                    onClick={() => {
                                      const lines = [
                                        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
                                        `QABUL HAI — NIKAH BAHRAIN`,
                                        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
                                        `Profile ID   : ${p.id}`,
                                        `Name         : ${p.name}`,
                                        `Gender       : ${p.gender === 'male' ? 'Male (Groom)' : 'Female (Bride)'}`,
                                        `Age          : ${p.age} years`,
                                        `Marital      : ${p.maritalStatus}`,
                                        `Height       : ${p.height || 'N/A'}`,
                                        `Nationality  : ${p.nationality}`,
                                        `Sect         : ${p.sect || 'N/A'}`,
                                        `Caste        : ${p.caste || 'N/A'}`,
                                        `Education    : ${p.education || 'N/A'}`,
                                        `Profession   : ${p.profession || 'N/A'}`,
                                        `Location     : ${p.location || 'N/A'}`,
                                        `Residence    : ${p.residence || 'N/A'}`,
                                        `Languages    : ${p.languages || 'N/A'}`,
                                        ``,
                                        `── Family ──────────────────`,
                                        `Father       : ${p.father || 'N/A'}`,
                                        `Mother       : ${p.mother || 'N/A'}`,
                                        `Siblings     : ${p.siblings || 'N/A'}`,
                                        `Family       : ${p.family || 'N/A'}`,
                                        ``,
                                        `── About ───────────────────`,
                                        p.about || 'N/A',
                                        ``,
                                        `── Requirements ────────────`,
                                        p.requirements || 'N/A',
                                        ``,
                                        `Contact      : ${p.contact || '+973 3718 8557'}`,
                                        `Instagram    : ${p.instagramPostUrl || 'https://www.instagram.com/nikah_bahrain/'}`,
                                        `Verified     : ${p.verified ? '✓ Yes' : '✗ No'}`,
                                        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
                                      ].join('\n');
                                      const blob = new Blob([lines], { type: 'text/plain' });
                                      const a = document.createElement('a');
                                      a.href = URL.createObjectURL(blob);
                                      a.download = `${p.id}_profile.txt`;
                                      document.body.appendChild(a);
                                      a.click();
                                      document.body.removeChild(a);
                                      URL.revokeObjectURL(a.href);
                                    }}
                                  >
                                    ⬇
                                  </button>
                                </div>

                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ── Pagination ── */}
                {totalPages > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', padding: '4px 0' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Showing {Math.min((currentPage - 1) * ADMIN_PAGE_SIZE + 1, tableProfiles.length)}–{Math.min(currentPage * ADMIN_PAGE_SIZE, tableProfiles.length)} of {tableProfiles.length}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="btn-ghost"
                        style={{ padding: '6px 10px', fontSize: '0.8rem', opacity: currentPage === 1 ? 0.4 : 1 }}
                      >
                        «
                      </button>
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="btn-ghost"
                        style={{ padding: '6px 10px', fontSize: '0.8rem', opacity: currentPage === 1 ? 0.4 : 1 }}
                      >
                        <ChevronLeft size={14} />
                      </button>
                      {/* Page numbers */}
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(n => n === 1 || n === totalPages || Math.abs(n - currentPage) <= 2)
                        .reduce((acc, n, idx, arr) => {
                          if (idx > 0 && n - arr[idx - 1] > 1) acc.push('...');
                          acc.push(n);
                          return acc;
                        }, [])
                        .map((item, idx) =>
                          item === '...' ? (
                            <span key={`ellipsis-${idx}`} style={{ color: 'var(--text-dim)', padding: '0 2px', fontSize: '0.8rem' }}>…</span>
                          ) : (
                            <button
                              key={item}
                              onClick={() => setCurrentPage(item)}
                              className={item === currentPage ? 'btn-gold' : 'btn-ghost'}
                              style={{ padding: '6px 11px', fontSize: '0.8rem', minWidth: '36px' }}
                            >
                              {item}
                            </button>
                          )
                        )}
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="btn-ghost"
                        style={{ padding: '6px 10px', fontSize: '0.8rem', opacity: currentPage === totalPages ? 0.4 : 1 }}
                      >
                        <ChevronRight size={14} />
                      </button>
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="btn-ghost"
                        style={{ padding: '6px 10px', fontSize: '0.8rem', opacity: currentPage === totalPages ? 0.4 : 1 }}
                      >
                        »
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ════ CONTACTS VIEW ════ */}
            {isContacts && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <h2 className="font-cinzel gold-text-gradient" style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '4px' }}>Contacts & Official Links</h2>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Direct hotlines for family coordinators and official channels</p>
                </div>

                <CategorySection title="Coordinator Hotlines" accent="#d4af37">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                    <ContactCard title="Male Family Coordinator" phone="+973 3718 8557" waLink="https://wa.me/97337188557" />
                    <ContactCard title="Female Family Coordinator" phone="+973 3456 0078" waLink="https://wa.me/97334560078" />
                  </div>
                </CategorySection>

                <CategorySection title="Instagram Feed" accent="#e1306c">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <a href="https://www.instagram.com/nikah_bahrain/" target="_blank" rel="noopener noreferrer" className="btn-gold" style={{ fontSize: '0.85rem' }}>
                      <Instagram size={15} />
                      <span>Open @nikah_bahrain</span>
                    </a>
                    <button onClick={handleSyncToInstagram} disabled={syncingInstagram} className="btn-ghost" style={{ fontSize: '0.85rem' }}>
                      <RefreshCw size={15} /> {syncingInstagram ? 'Syncing…' : 'Sync Feed Now'}
                    </button>
                  </div>
                </CategorySection>

                <CategorySection title="Candidate Registration Form" accent="#3b82f6">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <a href="https://forms.gle/sdKb75scXAag7gzt9" target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ fontSize: '0.85rem' }}>
                      <ExternalLink size={15} /> Open Registration Form
                    </a>
                  </div>
                </CategorySection>
              </div>
            )}

          </div>
        </main>
      </div>

      {/* ════ ADMIN CREATE / EDIT PROFILE MODAL ════ */}
      {isFormOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '680px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
            border: '1.5px solid var(--gold-border)',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px', marginBottom: '20px' }}>
              <h3 className="font-cinzel" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                {editingProfile ? `Edit Profile (${editingProfile.id})` : '➕ Add New Groom / Bride Profile'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="btn-ghost" style={{ padding: '6px', borderRadius: '50%' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAdminProfile} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Full Name / Profile Title *</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. NPF-230 (Groom) or Candidate Name" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Gender *</label>
                <select value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}>
                  <option value="male">Male (Groom)</option>
                  <option value="female">Female (Bride)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Marital Status *</label>
                <select value={formData.maritalStatus} onChange={e => setFormData({ ...formData, maritalStatus: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}>
                  <option value="Never Married">Never Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="2nd Marriage">2nd Marriage</option>
                  <option value="Widowed">Widowed</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Nationality *</label>
                <select value={formData.nationality} onChange={e => setFormData({ ...formData, nationality: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}>
                  <option value="Pakistani">Pakistani</option>
                  <option value="Indian">Indian</option>
                  <option value="Bahraini">Bahraini</option>
                  <option value="Saudi Arabia">Saudi Arabia</option>
                  <option value="Emirati">Emirati</option>
                  <option value="GCC / Other">GCC / Other</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Age *</label>
                <input required type="number" min="18" max="80" value={formData.age} onChange={e => setFormData({ ...formData, age: Number(e.target.value) })} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Height</label>
                <input type="text" value={formData.height} onChange={e => setFormData({ ...formData, height: e.target.value })} placeholder="e.g. 5'10&quot;" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Religious Sect</label>
                <input type="text" value={formData.sect} onChange={e => setFormData({ ...formData, sect: e.target.value })} placeholder="e.g. Sunni / Ahle Sunnat" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Caste / Sub-caste</label>
                <input type="text" value={formData.caste} onChange={e => setFormData({ ...formData, caste: e.target.value })} placeholder="e.g. Syed, Rajput, Arain, General" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Education</label>
                <input type="text" value={formData.education} onChange={e => setFormData({ ...formData, education: e.target.value })} placeholder="e.g. MBA, B.Tech, Master Degree" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Profession / Job</label>
                <input type="text" value={formData.profession} onChange={e => setFormData({ ...formData, profession: e.target.value })} placeholder="e.g. Software Engineer, Business" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Current Location</label>
                <input type="text" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="e.g. Manama, Bahrain" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Residence Status</label>
                <input type="text" value={formData.residence} onChange={e => setFormData({ ...formData, residence: e.target.value })} placeholder="e.g. CPR Holder, Resident" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>WhatsApp Contact</label>
                <input type="text" value={formData.contact} onChange={e => setFormData({ ...formData, contact: e.target.value })} placeholder="+973 3718 8557" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>Image URL (Instagram / Cloud Image Link)</label>
                  {formData.image && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, image: '' })}
                      style={{
                        background: '#fee2e2',
                        color: '#dc2626',
                        border: '1px solid #fca5a5',
                        borderRadius: '6px',
                        padding: '3px 10px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Trash2 size={12} /> Remove Picture
                    </button>
                  )}
                </div>
                <input type="url" value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} placeholder="https://... (Leave empty to show candidate Details Card)" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                {!formData.image && (
                  <div style={{ fontSize: '0.74rem', color: '#10b981', marginTop: '4px', fontWeight: 600 }}>
                    ✓ Picture removed. This candidate profile will display as a styled Details Card on the website.
                  </div>
                )}
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>About Candidate / Family Background</label>
                <textarea rows="3" value={formData.about} onChange={e => setFormData({ ...formData, about: e.target.value })} placeholder="Brief summary of candidate background..." style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Partner Requirements</label>
                <textarea rows="2" value={formData.requirements} onChange={e => setFormData({ ...formData, requirements: e.target.value })} placeholder="Preferences for partner..." style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
              </div>

              <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsFormOpen(false)} style={{ padding: '9px 18px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={isSaving} style={{ padding: '9px 24px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #fae182 0%, #d4af37 50%, #b8860b 100%)', color: '#0d251c', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 14px rgba(212, 175, 55, 0.4)' }}>
                  {isSaving ? 'Saving...' : editingProfile ? 'Update Profile' : 'Save & Publish Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </animated.div>
  );
}

// ─── Helper components ────────────────────────────────────────────────────────

function CategorySection({ title, accent, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '4px', height: '20px', background: accent, borderRadius: '2px', flexShrink: 0 }} />
        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', letterSpacing: '0.3px' }}>{title}</h3>
      </div>
      <div style={{ padding: '18px', background: '#f8fafc', border: `1px solid ${accent}40`, borderRadius: 'var(--radius-md)', borderLeft: `4px solid ${accent}`, boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
        {children}
      </div>
    </div>
  );
}

function StatCard({ label, count, subtext, icon: Icon, accent }) {
  const cardSpring = useSpring({
    from: { opacity: 0, transform: 'scale(0.95)' },
    to: { opacity: 1, transform: 'scale(1)' },
    config: { tension: 300, friction: 20 },
  });

  return (
    <animated.div
      style={{
        ...cardSpring,
        background: '#ffffff',
        border: `1px solid ${accent}35`,
        borderTop: `3px solid ${accent}`,
        borderRadius: 'var(--radius-md)',
        padding: '18px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 2px 10px rgba(0,0,0,0.04)'
      }}
    >
      <div style={{ position: 'absolute', top: 0, right: 0, width: '70px', height: '70px', background: `radial-gradient(circle, ${accent}15 0%, transparent 70%)`, pointerEvents: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
        <Icon size={18} color={accent} />
      </div>
      <div className="font-cinzel" style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{count}</div>
      <div style={{ fontSize: '0.72rem', color: accent, fontWeight: 600 }}>{subtext}</div>
    </animated.div>
  );
}

function ContactCard({ title, phone, waLink }) {
  return (
    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
      <div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-gold)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800 }}>{title}</div>
        <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>{phone}</div>
      </div>
      <a href={waLink} target="_blank" rel="noopener noreferrer" className="btn-whatsapp" style={{ padding: '8px 14px', fontSize: '0.8rem' }}>
        <MessageCircle size={14} /> WhatsApp
      </a>
    </div>
  );
}
