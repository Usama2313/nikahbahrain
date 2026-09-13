import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTrail, animated } from '@react-spring/web';
import Navbar from './components/Navbar';
import CategoryBar from './components/CategoryBar';
import FilterBar, { AGE_RANGES } from './components/FilterBar';
import ProfileCard from './components/ProfileCard';
import ProfileModal from './components/ProfileModal';
import CreateProfileModal from './components/CreateProfileModal';
import AdminPanel from './components/AdminPanel';
import ContactFooter from './components/ContactFooter';
import Pagination from './components/Pagination';
import SplashIntro from './components/SplashIntro';
import { Sparkles, AlertCircle, RefreshCw, RotateCcw } from './icons';

import API_BASE from './api';

export default function App() {
  // 1. Splash Intro Screen State
  const [showSplash, setShowSplash] = useState(false);

  // 2. Navigation State ('groom' default to match screenshot)
  const [activeTab, setActiveTab] = useState('groom');
  const [activeCategory, setActiveCategory] = useState('all');
  const [isAdminActive, setIsAdminActive] = useState(false);

  // 3. Unique Visitor ID (persisted in localStorage)
  const [visitorId] = useState(() => {
    let id = localStorage.getItem('nikah_bahrain_visitor_id');
    if (!id) {
      id = 'user_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
      localStorage.setItem('nikah_bahrain_visitor_id', id);
    }
    return id;
  });

  // 4. Profiles & Favorites Data State
  const [profiles, setProfiles] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 5. Additional Search & Nationality Filters State
  const [selectedNationality, setSelectedNationality] = useState('all');
  const [selectedGender, setSelectedGender] = useState('all');
  const [selectedMaritalStatus, setSelectedMaritalStatus] = useState('all');
  const [selectedAgeRange, setSelectedAgeRange] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 6. Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const profilesTopRef = useRef(null);

  // 7. Modals State
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [isCreateProfileOpen, setIsCreateProfileOpen] = useState(false);

  // Handle URL hash / route for /admin
  useEffect(() => {
    const handleLocationChange = () => {
      if (window.location.pathname === '/admin' || window.location.hash === '#/admin' || window.location.hash === '#admin') {
        setIsAdminActive(true);
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

  // Fetch initial profiles & visitor favorites
  const fetchProfiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/profiles`);
      const data = await res.json();
      if (data.success) {
        setProfiles(data.profiles);
      } else {
        setError('Unable to load matrimonial profiles.');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Could not connect to the backend server. Please verify the API is running.');
    } finally {
      setLoading(false);
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
  }, [activeTab, activeCategory, selectedNationality, selectedGender, selectedMaritalStatus, selectedAgeRange, searchQuery]);

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

  // Tab change handler
  const handleTabChange = (tabId) => {
    if (tabId === 'contact') {
      const el = document.getElementById('contact-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }
    setActiveTab(tabId);
    setIsAdminActive(false);
    setActiveCategory('all');
    window.history.pushState(null, '', window.location.pathname);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setActiveCategory('all');
    setSelectedNationality('all');
    setSelectedGender('all');
    setSelectedMaritalStatus('all');
    setSelectedAgeRange('all');
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
    // 'home' tab shows all profiles (no filter)

    // 2. Category Filter (from uploaded picture: ALL, NEVER MARRIED, DIVORCED, 2ND MARRIAGE, LATE WIFE)
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

    // 3. Nationality Filter
    if (selectedNationality !== 'all') {
      result = result.filter(
        (p) => p.nationality.toLowerCase() === selectedNationality.toLowerCase()
      );
    }

    // 4. Marital Status filter from dropdown (if any)
    if (selectedMaritalStatus !== 'all') {
      result = result.filter((p) => p.maritalStatus === selectedMaritalStatus);
    }

    // 5. Age Range
    if (selectedAgeRange !== 'all') {
      const range = AGE_RANGES.find(r => r.id === selectedAgeRange);
      if (range) {
        result = result.filter((p) => p.age >= range.min && p.age <= range.max);
      }
    }

    // 6. Search query
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
  }, [profiles, activeTab, activeCategory, selectedNationality, selectedMaritalStatus, selectedAgeRange, searchQuery, favorites]);

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
        window.history.pushState(null, '', window.location.pathname);
      }
      return next;
    });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
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
              window.history.pushState(null, '', window.location.pathname);
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
            />

            {/* 3B. Refined Search & Nationality Filter Bar */}
            <FilterBar
              selectedNationality={selectedNationality}
              onSelectNationality={setSelectedNationality}
              selectedGender={selectedGender}
              onSelectGender={setSelectedGender}
              selectedMaritalStatus={selectedMaritalStatus}
              onSelectMaritalStatus={setSelectedMaritalStatus}
              selectedAgeRange={selectedAgeRange}
              onSelectAgeRange={setSelectedAgeRange}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              totalCount={filteredProfiles.length}
              currentCategoryTitle={
                activeTab === 'groom' 
                  ? 'Grooms / Male Proposals' 
                  : activeTab === 'bride' 
                  ? 'Brides / Female Proposals' 
                  : activeTab === 'favorites'
                  ? 'My Favorited Proposals'
                  : 'All Nikah Proposals'
              }
              onResetFilters={handleResetFilters}
            />

            {/* Profiles Feed Section */}
            <div
              ref={profilesTopRef}
              style={{
                maxWidth: '1440px',
                margin: '24px auto',
                padding: '0 20px'
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
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                      gap: '24px'
                    }}
                  >
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
