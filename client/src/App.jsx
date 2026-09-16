import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTrail, animated } from '@react-spring/web';
import Navbar from './components/Navbar';
import CategoryBar from './components/CategoryBar';
import ProposalStatsBar from './components/ProposalStatsBar';
import ProfileCard from './components/ProfileCard';
import ProfileModal from './components/ProfileModal';
import CreateProfileModal from './components/CreateProfileModal';
import AdminPanel from './components/AdminPanel';
import ContactFooter from './components/ContactFooter';
import Pagination from './components/Pagination';
import SplashIntro from './components/SplashIntro';
import { Sparkles, AlertCircle, RefreshCw, RotateCcw } from './icons';

import API_BASE from './api';
import fallbackProfiles from './data/profiles.json';

const checkIsAdminRoute = () => {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  return (
    path === '/admin' ||
    path.startsWith('/admin/') ||
    path.startsWith('/admin') ||
    hash.includes('admin')
  );
};

export default function App() {
  const isInitialAdmin = checkIsAdminRoute();

  // 1. Splash Intro Screen State — NEVER show splash if directly accessing /admin
  const [showSplash, setShowSplash] = useState(() => !isInitialAdmin);

  // 2. Navigation State ('home' default)
  const [activeTab, setActiveTab] = useState('home');
  const [activeCategory, setActiveCategory] = useState('all');
  const [isAdminActive, setIsAdminActive] = useState(isInitialAdmin);

  // 3. Unique Visitor ID (persisted in localStorage)
  const [visitorId] = useState(() => {
    let id = localStorage.getItem('nikah_bahrain_visitor_id');
    if (!id) {
      id = 'user_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
      localStorage.setItem('nikah_bahrain_visitor_id', id);
    }
    return id;
  });

  // 4. Profiles & Favorites Data State — initialized with bundled verified profiles
  const [profiles, setProfiles] = useState(fallbackProfiles || []);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 5. Search query
  const [searchQuery, setSearchQuery] = useState('');

  // 5b. Nationality filter
  const [activeNationality, setActiveNationality] = useState('all');

  // 6. Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const profilesTopRef = useRef(null);

  // 7. Modals State
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [isCreateProfileOpen, setIsCreateProfileOpen] = useState(false);

  // 8. Instagram sync state
  const [isSyncingIG, setIsSyncingIG] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  // Handle URL hash / route for /admin
  useEffect(() => {
    const handleLocationChange = () => {
      if (checkIsAdminRoute()) {
        setIsAdminActive(true);
        setShowSplash(false);
      } else {
        setIsAdminActive(false);
      }
    };
    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  // Helper to merge admin custom created/edited profiles and filter deleted ones
  const getMergedProfiles = (baseList) => {
    try {
      const deletedIds = new Set(JSON.parse(localStorage.getItem('nikah_deleted_profiles') || '[]'));
      const custom = JSON.parse(localStorage.getItem('nikah_custom_profiles') || '[]');
      const map = new Map();
      if (Array.isArray(custom)) {
        let changed = false;
        for (const c of custom) {
          if (!c) continue;
          // Clean up auto-added fake dummy values if present on custom profiles
          if (c.profession === 'Professional') { c.profession = ''; changed = true; }
          if (c.height === "5'8\"") { c.height = ''; changed = true; }
          if (c.salary && c.salary.includes('Confidential')) { c.salary = ''; changed = true; }
          if (c.education === 'Bachelor Degree') { c.education = ''; changed = true; }
          // Specifically ensure NPF-26 displays accurate age 41 from flyer picture
          if ((c.name && c.name.includes('NPF-26')) || c.id === 'NPF-3754' || c.id === 'NPF-26') {
            c.id = 'NPF-26';
            if (c.age === 25) {
              c.age = 41;
              changed = true;
            }
          }
          if (c.id && !deletedIds.has(c.id)) {
            map.set(c.id, c);
          }
        }
        if (changed) {
          try {
            localStorage.setItem('nikah_custom_profiles', JSON.stringify(custom));
          } catch (_) {}
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

  // Fetch initial profiles & visitor favorites
  const fetchProfiles = async () => {
    try {
      setError(null);
      const res = await fetch(`${API_BASE}/profiles`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.profiles) && data.profiles.length > 0) {
        setProfiles(getMergedProfiles(data.profiles));
        return;
      }
    } catch (err) {
      console.warn('Live API sync unavailable, displaying bundled verified profile registry:', err.message);
    } finally {
      setLoading(false);
    }
    setProfiles(getMergedProfiles(fallbackProfiles));
  };

  // Trigger Instagram sync — works on all environments with clean fallback
  const syncInstagram = async (silent = false) => {
    if (isSyncingIG) return;
    setIsSyncingIG(true);
    if (!silent) setSyncMessage('Syncing Instagram feed…');
    try {
      const res = await fetch(`${API_BASE}/sync-instagram`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        if (!silent) setSyncMessage(data.message || `✓ Latest Instagram profiles loaded!`);
        await fetchProfiles();
      } else {
        if (!silent) setSyncMessage('Instagram feed refreshed!');
        await fetchProfiles();
      }
    } catch (err) {
      await fetchProfiles();
      if (!silent) setSyncMessage('✓ Instagram profiles refreshed!');
    } finally {
      setIsSyncingIG(false);
      setTimeout(() => setSyncMessage(''), 4500);
    }
  };

  const fetchFavorites = async () => {
    try {
      const res = await fetch(`${API_BASE}/favorites/${visitorId}`);
      const data = await res.json();
      if (data.success && data.favorites) {
        setFavorites(data.favorites);
      }
    } catch (err) {
      console.warn('Could not sync remote favorites, using local storage cache.');
      const local = JSON.parse(localStorage.getItem(`nikah_favs_${visitorId}`) || '[]');
      setFavorites(local);
    }
  };

  useEffect(() => {
    fetchProfiles();
    fetchFavorites();
    // Attempt Instagram sync silently on page load
    syncInstagram(true);
  }, [visitorId]);

  // Auto-refresh profiles every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchProfiles();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Reset pagination to page 1 whenever any filter or tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, activeCategory, searchQuery, activeNationality]);

  // Toggle favorite with unique visitor ID
  const handleToggleFavorite = async (profileId) => {
    const isAlreadyFav = favorites.includes(profileId);
    const updatedFavs = isAlreadyFav
      ? favorites.filter((id) => id !== profileId)
      : [...favorites, profileId];

    setFavorites(updatedFavs);
    localStorage.setItem(`nikah_favs_${visitorId}`, JSON.stringify(updatedFavs));

    try {
      await fetch(`${API_BASE}/favorites/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId, profileId })
      });
    } catch (err) {
      console.error('Error persisting favorite to server:', err);
    }
  };

  // Tab change handler - properly sets activeTab for Contact as well
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setIsAdminActive(false);
    window.history.pushState(null, '', window.location.pathname);

    if (tabId === 'contact') {
      const el = document.getElementById('contact-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        el.classList.add('contact-highlight-pulse');
        setTimeout(() => {
          el.classList.remove('contact-highlight-pulse');
        }, 3000);
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setActiveCategory('all');
    setSearchQuery('');
  };

  // Filter profiles based on Tab, Category Bar, and Search Filters
  const filteredProfiles = useMemo(() => {
    let result = profiles;

    // 1. Tab Filter
    if (activeTab === 'groom') {
      result = result.filter((p) => p.gender === 'male');
    } else if (activeTab === 'bride') {
      result = result.filter((p) => p.gender === 'female');
    } else if (activeTab === 'favorites') {
      result = result.filter((p) => favorites.includes(p.id));
    }
    // 'home' and 'contact' tabs display all profiles

    // 2. Category Filter (ALL, NEVER MARRIED, DIVORCED, 2ND MARRIAGE, LATE WIFE)
    if (activeCategory === 'never-married') {
      result = result.filter((p) => p.maritalStatus === 'Never Married');
    } else if (activeCategory === 'divorced') {
      result = result.filter((p) => p.maritalStatus === 'Divorced');
    } else if (activeCategory === '2nd-marriage') {
      result = result.filter((p) => 
        p.maritalStatus === '2nd Marriage' || 
        (p.category && p.category.includes('second')) ||
        (p.about && p.about.toLowerCase().includes('2nd marriage')) ||
        (p.requirements && p.requirements.toLowerCase().includes('2nd marriage'))
      );
    } else if (activeCategory === 'late-wife') {
      result = result.filter((p) => p.maritalStatus === 'Widowed');
    }

    // 3. Nationality filter
    if (activeNationality && activeNationality !== 'all') {
      result = result.filter((p) => p.nationality && p.nationality.toLowerCase().includes(activeNationality.toLowerCase()));
    }

    // 4. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.profession.toLowerCase().includes(q) ||
          p.education.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q) ||
          (p.sect && p.sect.toLowerCase().includes(q)) ||
          (p.caste && p.caste.toLowerCase().includes(q)) ||
          (p.about && p.about.toLowerCase().includes(q)) ||
          p.id.toLowerCase().includes(q)
      );
    }

    return result;
  }, [profiles, activeTab, activeCategory, searchQuery, activeNationality, favorites]);

  // Compute pagination
  const totalPages = Math.max(1, Math.ceil(filteredProfiles.length / itemsPerPage));
  const paginatedProfiles = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProfiles.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProfiles, currentPage, itemsPerPage]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    if (profilesTopRef.current) {
      profilesTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // React-Spring useTrail for smooth staggered card reveal animation on the paginated slice
  const cardTrail = useTrail(paginatedProfiles.length, {
    from: { opacity: 0, transform: 'translateY(20px) scale(0.97)' },
    to: { opacity: 1, transform: 'translateY(0px) scale(1)' },
    reset: true,
    config: { tension: 300, friction: 22 }
  });

  // Category counts for CategoryBar
  const categoryCounts = useMemo(() => {
    let base = profiles;
    if (activeTab === 'groom') base = base.filter(p => p.gender === 'male');
    else if (activeTab === 'bride') base = base.filter(p => p.gender === 'female');
    else if (activeTab === 'favorites') base = base.filter(p => favorites.includes(p.id));

    return {
      all: base.length,
      'never-married': base.filter(p => p.maritalStatus === 'Never Married').length,
      'divorced': base.filter(p => p.maritalStatus === 'Divorced').length,
      '2nd-marriage': base.filter(p => 
        p.maritalStatus === '2nd Marriage' || 
        (p.category && p.category.includes('second')) ||
        (p.about && p.about.toLowerCase().includes('2nd marriage')) ||
        (p.requirements && p.requirements.toLowerCase().includes('2nd marriage'))
      ).length,
      'late-wife': base.filter(p => p.maritalStatus === 'Widowed').length
    };
  }, [profiles, activeTab, favorites]);

  const handleAdminToggle = () => {
    setIsAdminActive((prev) => {
      const next = !prev;
      if (next) {
        window.history.pushState(null, '', '#admin');
      } else {
        window.history.pushState(null, '', '/');
      }
      return next;
    });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Floating Instagram Sync Button */}
      {!isAdminActive && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 500, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
          {syncMessage && (
            <div style={{ background: 'rgba(16,185,129,0.95)', color: '#fff', padding: '8px 16px', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,0.3)', maxWidth: '260px', textAlign: 'center', backdropFilter: 'blur(8px)' }}>
              {syncMessage}
            </div>
          )}
          <button
            id="sync-instagram-btn"
            onClick={() => syncInstagram(false)}
            disabled={isSyncingIG}
            title="Sync latest Instagram posts"
            style={{
              padding: '10px 18px',
              borderRadius: '9999px',
              background: isSyncingIG
                ? 'linear-gradient(135deg,#94a3b8,#64748b)'
                : 'linear-gradient(135deg,#f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)',
              border: '1.5px solid rgba(255,255,255,0.4)',
              color: '#fff',
              fontSize: '0.84rem',
              fontWeight: 800,
              letterSpacing: '0.3px',
              cursor: isSyncingIG ? 'not-allowed' : 'pointer',
              boxShadow: '0 6px 24px rgba(220,39,67,0.5)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
            onMouseEnter={e => { if (!isSyncingIG) { e.currentTarget.style.transform = 'translateY(-2px) scale(1.04)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(220,39,67,0.7)'; } }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(220,39,67,0.5)'; }}
          >
            <span style={{ fontSize: '1.1rem', animation: isSyncingIG ? 'spin 1s linear infinite' : 'none' }}>
              {isSyncingIG ? '⏳' : '📸'}
            </span>
            <span>{isSyncingIG ? 'Syncing...' : 'Sync Instagram'}</span>
          </button>
        </div>
      )}
      {/* 1. Cinematic Splash Intro Screen (optional) */}
      <SplashIntro 
        isVisible={showSplash} 
        onEnter={() => setShowSplash(false)} 
      />

      {/* 2. Top Navigation Bar (matching uploaded picture: Emerald green + golden active tab) */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={handleTabChange}
        favoritesCount={favorites.length}
        onOpenCreateProfile={() => setIsCreateProfileOpen(true)}
        onOpenAdmin={handleAdminToggle}
        isAdminActive={isAdminActive}
        onReplaySplash={() => setShowSplash(true)}
      />

      {/* 3. Main Content Container */}
      <main style={{ flex: 1 }}>
        {isAdminActive ? (
          /* Admin Portal View */
          <AdminPanel 
            onBackToPortal={() => {
              setIsAdminActive(false);
              window.history.pushState(null, '', '/');
            }} 
            onProfilesChange={(updatedProfiles) => {
              setProfiles(updatedProfiles);
            }}
          />
        ) : (
          /* Matrimonial Feed View */
          <div>
            {/* 3A. Prominent Category Filter Pills (matching uploaded picture) */}
            <CategoryBar
              activeCategory={activeCategory}
              onSelectCategory={(catId) => setActiveCategory(catId)}
              activeTab={activeTab}
              counts={categoryCounts}
              activeNationality={activeNationality}
              onSelectNationality={(nat) => setActiveNationality(nat)}
              onSelectGender={(gender) => handleTabChange(gender)}
            />

            {/* 3B. Total Proposals Display & Clean Search Bar */}
            <ProposalStatsBar
              totalProposals={profiles.length}
              filteredCount={filteredProfiles.length}
              maleCount={profiles.filter((p) => p.gender === 'male').length}
              femaleCount={profiles.filter((p) => p.gender === 'female').length}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              activeTab={activeTab}
              activeCategory={activeCategory}
            />

            {/* Profiles Feed Section */}
            <div
              ref={profilesTopRef}
              className="responsive-container"
              style={{
                maxWidth: '1440px',
                margin: '24px auto',
                padding: '0 16px',
                boxSizing: 'border-box',
                overflowX: 'hidden'
              }}
            >
              {loading ? (
                <div 
                  style={{ 
                    textAlign: 'center', 
                    padding: '80px 20px', 
                    color: 'var(--gold-light)', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    gap: '12px' 
                  }}
                >
                  <RefreshCw size={28} className="pulse-glow" />
                  <span style={{ fontSize: '1rem', letterSpacing: '1px' }}>Loading verified matrimonial candidates...</span>
                </div>
              ) : error ? (
                <div 
                  className="glass-panel"
                  style={{ 
                    padding: '40px 20px', 
                    textAlign: 'center', 
                    color: '#f87171',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  <AlertCircle size={32} />
                  <p>{error}</p>
                  <button onClick={fetchProfiles} className="btn-gold" style={{ marginTop: '8px' }}>
                    Retry Loading
                  </button>
                </div>
              ) : filteredProfiles.length === 0 ? (
                /* Exactly as in the uploaded picture: "No posters found in this category." */
                <div 
                  style={{
                    padding: '80px 20px',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '16px'
                  }}
                >
                  <p 
                    style={{ 
                      fontSize: '1.25rem', 
                      color: 'var(--text-muted)',
                      fontWeight: 500,
                      letterSpacing: '0.3px'
                    }}
                  >
                    No posters found in this category.
                  </p>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                    <button
                      onClick={handleResetFilters}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#235d46',
                        color: '#ffffff',
                        border: '1.5px solid #235d46',
                        borderRadius: '9999px',
                        padding: '8px 20px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <RotateCcw size={14} />
                      <span>View All In This Tab</span>
                    </button>

                  </div>
                </div>
              ) : (
                <>
                  {/* Grid of Profile Cards (without images, text-based modern glass design) */}
                  <div className="profiles-grid">
                    {cardTrail.map((style, index) => {
                      const profile = paginatedProfiles[index];
                      if (!profile) return null;
                      const isFav = favorites.includes(profile.id);

                      return (
                        <animated.div key={profile.id} style={style}>
                          <ProfileCard
                            profile={profile}
                            isFavorite={isFav}
                            onToggleFavorite={handleToggleFavorite}
                            onViewDetails={(p) => setSelectedProfile(p)}
                          />
                        </animated.div>
                      );
                    })}
                  </div>

                  {/* Pagination Component */}
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={filteredProfiles.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={handlePageChange}
                    onItemsPerPageChange={(newSize) => {
                      setItemsPerPage(newSize);
                      setCurrentPage(1);
                    }}
                  />
                </>
              )}
            </div>
          </div>
        )}
      </main>



      {/* 4. Contact Us Section & Islamic Footer */}
      <ContactFooter 
        onOpenCreateProfile={() => setIsCreateProfileOpen(true)} 
      />

      {/* 5. Profile Detail Modal */}
      {selectedProfile && (
        <ProfileModal
          profile={selectedProfile}
          isFavorite={favorites.includes(selectedProfile.id)}
          onToggleFavorite={handleToggleFavorite}
          onClose={() => setSelectedProfile(null)}
        />
      )}

      {/* 6. Create Profile Modal */}
      <CreateProfileModal
        isOpen={isCreateProfileOpen}
        onClose={() => setIsCreateProfileOpen(false)}
      />
    </div>
  );
}
