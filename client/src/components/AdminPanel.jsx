import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Upload,
  Download,
  Copy,
  Image,
  FileText,
  AlertCircle,
} from '../icons';
import confetti from 'canvas-confetti';
import API_BASE from '../api';
import logoImg from '../assets/logo.jpg';
import fallbackProfiles from '../data/profiles.json';
import fallbackDeletedIds from '../data/deleted_ids.json';
import WhatsAppGroupInvite from './WhatsAppGroupInvite';

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
  const [profiles, setProfiles] = useState(() => {
    const deletedSet = new Set((fallbackDeletedIds || []).map(String));
    return (fallbackProfiles || []).filter(p => p && p.id && !deletedSet.has(String(p.id)));
  });
  const [stats, setStats] = useState(() => {
    const deletedSet = new Set((fallbackDeletedIds || []).map(String));
    const pList = (fallbackProfiles || []).filter(p => p && p.id && !deletedSet.has(String(p.id)));
    return {
      total: pList.length,
      grooms: pList.filter(p => p.gender === 'male').length,
      brides: pList.filter(p => p.gender === 'female').length,
      divorcedGrooms: pList.filter(p => p.gender === 'male' && p.maritalStatus === 'Divorced').length,
      widowedGrooms: pList.filter(p => p.gender === 'male' && p.maritalStatus === 'Widowed').length,
      pakistani: pList.filter(p => p.nationality === 'Pakistani').length,
      indian: pList.filter(p => p.nationality === 'Indian').length,
    };
  });
  const [loading, setLoading] = useState(false);
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

  const handleNavSelect = (sectionId) => {
    setActiveSection(sectionId);
    setSearchQuery('');
    setCurrentPage(1);
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  };

  // Create / Edit Profile Modal state
  const DEFAULT_FORM = {
    name: '',
    gender: 'male',
    maritalStatus: 'Never Married',
    nationality: 'Pakistani',
    age: '',
    height: '',
    sect: '',
    caste: '',
    education: '',
    profession: '',
    salary: '',
    location: 'Bahrain',
    residence: 'Bahrain Resident',
    siblings: '',
    father: '',
    mother: '',
    family: '',
    languages: '',
    about: '',
    requirements: '',
    contact: '+973 3718 8557',
    image: '',
    instagramPostUrl: ''
  };

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [loginErrors, setLoginErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [instagramModalProfile, setInstagramModalProfile] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const generateInstagramCaption = (p) => {
    if (!p) return '';
    const isMale = p.gender === 'male';
    const candidateType = isMale ? 'GROOM' : 'BRIDE';
    const id = p.id || 'NPF-Proposal';
    const nat = p.nationality || 'Pakistani';
    return `✨ BISMILLAHIR RAHMANIR RAHEEM ✨\n\n` +
      `💍 PROPOSAL: ${id} | ${candidateType} (${nat.toUpperCase()})\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `• Age: ${p.age} years\n` +
      `• Marital Status: ${p.maritalStatus}\n` +
      `• Height: ${p.height || "5'8\""}\n` +
      `• Sect: ${p.sect || 'Sunni'}\n` +
      (p.caste && p.caste !== 'General' ? `• Caste: ${p.caste}\n` : '') +
      `• Education: ${p.education || 'Graduate'}\n` +
      `• Profession: ${p.profession || 'Professional'}\n` +
      `• Current Location: ${p.location || 'Bahrain'}\n` +
      `• Residence: ${p.residence || 'Bahrain Resident'}\n` +
      `• Languages: ${p.languages || 'Arabic, English'}\n` +
      (p.father ? `• Father: ${p.father}\n` : '') +
      (p.mother ? `• Mother: ${p.mother}\n` : '') +
      (p.siblings ? `• Siblings: ${p.siblings}\n` : '') +
      `\n📝 ABOUT CANDIDATE:\n${p.about || 'Practicing, Deen-conscious candidate from a respected and noble family settled in Bahrain.'}\n\n` +
      `🎯 PARTNER EXPECTATIONS:\n${p.requirements || 'Seeking a practicing, well-mannered Muslim partner residing in Bahrain or GCC.'}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📩 TO CONNECT: Send a Direct Message to @nikah_bahrain with Profile ID ${id}\n` +
      `💬 WhatsApp: ${p.contact || '+973 3718 8557'}\n\n` +
      `#NikahBahrain #QabulHai #HalalNikah #BahrainMatrimonial #MuslimMatrimony #GCCMuslims #NPF`;
  };

  // Client-side image compression using HTML5 Canvas
  const compressImage = (file, maxWidth = 1080, maxHeight = 1080, quality = 0.82) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxWidth || height > maxHeight) {
            if (width / height > maxWidth / maxHeight) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => resolve(e.target.result);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  };

  const handleImageFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const compressedDataUrl = await compressImage(file);
      if (compressedDataUrl) {
        // Show preview immediately with base64
        setFormData(prev => ({ ...prev, image: compressedDataUrl }));
        setFormErrors(prev => { const copy = { ...prev }; delete copy.image; return copy; });

        try {
          // Try to get a permanent URL via Supabase Storage / local disk
          const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
          const res = await fetch(`${API_BASE}/upload-image`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: compressedDataUrl, filename: safeName })
          });
          const d = await res.json();
          if (d.success && d.url) {
            // Prefer permanent URL over base64 — works on mobile/all devices
            setFormData(prev => ({ ...prev, image: d.url }));
            showNotification(d.storageType === 'supabase'
              ? '✓ Picture uploaded to cloud — works on all devices!'
              : '✓ Picture optimized and ready!');
          } else {
            showNotification('✓ Picture ready (stored locally).');
          }
        } catch (_) {
          showNotification('✓ Picture ready.');
        }
      }
    } catch (err) {
      console.error('Image upload error:', err);
      showNotification('⚠️ Image upload failed. Please try again.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleDownloadFlyer = (p) => {
    if (!p?.image) {
      showNotification('No flyer image attached to this profile.');
      return;
    }
    const a = document.createElement('a');
    a.href = p.image;
    a.download = `${p.id || 'proposal'}_flyer.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showNotification('✓ Flyer image download started!');
  };

  const handleCopyInstagramCaption = (text) => {
    navigator.clipboard.writeText(text);
    confetti({ particleCount: 40, spread: 50, origin: { y: 0.5 } });
    showNotification('✓ Instagram caption copied to clipboard!');
  };

  const handleOpenInstagramToPost = (p) => {
    const caption = generateInstagramCaption(p);
    navigator.clipboard.writeText(caption);
    if (p.image) handleDownloadFlyer(p);
    showNotification('✓ Caption copied & flyer downloaded! Opening Instagram...');
    window.open('https://www.instagram.com/', '_blank');
  };

  const handleExportJson = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(profiles, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", "profiles.json");
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showNotification('✓ Exported profiles.json successfully!');
    } catch (err) {
      showNotification(`Export error: ${err.message}`);
    }
  };

  const [creationMode, setCreationMode] = useState('form'); // 'form' (Tab 1: Form Filling) | 'picture' (Tab 2: Picture & Instagram Link)

  const handleOpenCreate = (mode = 'form') => {
    setEditingProfile(null);
    setCreationMode(mode);
    setFormErrors({});
    const maxNpf = profiles.reduce((max, p) => {
      const m = (p.id || '').match(/NPF-?(\d+)/i);
      if (m) {
        const n = parseInt(m[1], 10);
        return n > max && n < 9000 ? n : max;
      }
      return max;
    }, 228);
    const nextId = `NPF-${maxNpf + 1}`;

    setFormData({
      ...DEFAULT_FORM,
      name: `${nextId} (Groom)`,
      gender: 'male',
      maritalStatus: 'Never Married',
      nationality: 'Pakistani',
      about: '',
      image: '',
      instagramPostUrl: ''
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (p) => {
    setEditingProfile(p);
    setCreationMode(p.image ? 'picture' : 'form');
    setFormErrors({});
    setFormData({
      name: p.name || `${p.id} (${p.gender === 'female' ? 'Bride' : 'Groom'})`,
      gender: p.gender || 'male',
      maritalStatus: p.maritalStatus || 'Never Married',
      nationality: p.nationality || 'Pakistani',
      age: p.age !== null && p.age !== undefined ? p.age : '',
      height: p.height || '',
      sect: p.sect || '',
      caste: p.caste || '',
      education: p.education || '',
      profession: p.profession || '',
      salary: p.salary || '',
      location: p.location || 'Bahrain',
      residence: p.residence || 'Bahrain Resident',
      siblings: p.siblings || '',
      father: p.father || '',
      mother: p.mother || '',
      family: p.family || '',
      languages: p.languages || '',
      about: p.about || '',
      requirements: p.requirements || '',
      contact: p.contact || '+973 3718 8557',
      image: p.image || '',
      instagramPostUrl: p.instagramPostUrl || ''
    });
    setIsFormOpen(true);
  };

  const validateProfileForm = () => {
    const errs = {};

    if (formData.age !== '' && formData.age !== null && formData.age !== undefined) {
      const numAge = Number(formData.age);
      if (isNaN(numAge) || numAge < 18 || numAge > 90) {
        errs.age = 'Age must be a valid number between 18 and 90.';
      }
    }

    if (formData.instagramPostUrl?.trim()) {
      const url = formData.instagramPostUrl.trim();
      if (!/^https?:\/\/(www\.)?instagram\.com\//i.test(url) && !url.includes('instagram.com')) {
        errs.instagramPostUrl = 'Please enter a valid Instagram URL (e.g. https://www.instagram.com/p/...).';
      }
    }

    return errs;
  };

  const handleSaveAdminProfile = async (e, openInstagram = false) => {
    if (e && e.preventDefault) e.preventDefault();

    const errs = validateProfileForm();
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      showNotification('⚠️ Please correct the highlighted errors in the form.');
      return;
    }
    setFormErrors({});

    setIsSaving(true);
    try {
      const maxNpf = profiles.reduce((max, p) => {
        const m = (p.id || '').match(/NPF-?(\d+)/i);
        if (m) {
          const n = parseInt(m[1], 10);
          return n > max && n < 9000 ? n : max;
        }
        return max;
      }, 228);
      const nextAutoId = `NPF-${maxNpf + 1}`;

      let candidateName = formData.name?.trim();
      if (!candidateName) {
        candidateName = `${editingProfile?.id || nextAutoId} (${formData.gender === 'female' ? 'Bride' : 'Groom'})`;
      }

      const candidateAge = formData.age !== '' && formData.age !== null && !isNaN(Number(formData.age))
        ? Number(formData.age)
        : null;

      let igPostId = '';
      if (formData.instagramPostUrl) {
        const match = formData.instagramPostUrl.match(/\/p\/([a-zA-Z0-9_-]+)/);
        if (match) igPostId = match[1];
      }

      let finalImageUrl = formData.image?.trim() || '';
      if (finalImageUrl.startsWith('data:image/')) {
        try {
          const safeName = `profile_${Date.now()}`;
          const uploadRes = await fetch(`${API_BASE}/upload-image`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: finalImageUrl, filename: safeName })
          });
          const uploadData = await uploadRes.json();
          if (uploadData.success && uploadData.url) {
            finalImageUrl = uploadData.url;
          }
        } catch (_) {}
      }

      const marital = formData.maritalStatus?.trim() || editingProfile?.maritalStatus || 'Never Married';
      let profCat = formData.gender === 'female' ? 'brides' : 'grooms';
      if (marital === 'Divorced') profCat = formData.gender === 'female' ? 'divorced-brides' : 'divorced-grooms';
      else if (marital === 'Widowed') profCat = formData.gender === 'female' ? 'widowed-brides' : 'widowed-grooms';

      if (editingProfile) {
        let updated = {
          ...editingProfile,
          ...formData,
          name: candidateName,
          age: candidateAge,
          image: finalImageUrl,
          instagramPostUrl: formData.instagramPostUrl?.trim() || '',
          instagramPostId: igPostId || editingProfile.instagramPostId || '',
          maritalStatus: marital,
          nationality: formData.nationality?.trim() || editingProfile.nationality || 'Pakistani',
          category: profCat,
          salary: formData.salary?.trim() || '',
          location: formData.location?.trim() || 'Bahrain',
          residence: formData.residence?.trim() || 'Bahrain Resident',
          siblings: formData.siblings?.trim() || '',
          father: formData.father?.trim() || '',
          mother: formData.mother?.trim() || '',
          family: formData.family?.trim() || '',
          languages: formData.languages?.trim() || '',
          about: formData.about?.trim() || '',
          requirements: formData.requirements?.trim() || '',
          contact: formData.contact?.trim() || '+973 3718 8557',
          height: formData.height?.trim() || '',
          profession: formData.profession?.trim() || '',
          education: formData.education?.trim() || '',
          sect: formData.sect?.trim() || '',
          caste: formData.caste?.trim() || '',
          updatedAt: new Date().toISOString()
        };

        // Immediately update React state for instant UI update
        setProfiles((prev) => {
          const next = prev.map((p) => (p.id === updated.id ? updated : p));
          if (onProfilesChange) onProfilesChange(next);
          return next;
        });

        // Save to backend database
        try {
          const res = await fetch(`${API_BASE}/profiles/${editingProfile.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated)
          });
          const data = await res.json();
          if (data.success && data.profile) {
            setProfiles((prev) => {
              const next = prev.map((p) => (p.id === data.profile.id ? data.profile : p));
              if (onProfilesChange) onProfilesChange(next);
              return next;
            });
          }
        } catch (serverErr) {
          console.warn('[Admin] Server update notice:', serverErr.message);
        }

        showNotification(`✓ Updated profile ${updated.id} successfully!`);
        setIsFormOpen(false);
        if (openInstagram) setInstagramModalProfile(updated);
      } else {
        let nextCustomId = nextAutoId;
        const npfMatch = candidateName.match(/NPF-?(\d+)/i);
        if (npfMatch) {
          nextCustomId = `NPF-${npfMatch[1]}`;
        }

        let newProf = {
          ...formData,
          id: nextCustomId,
          name: candidateName,
          age: candidateAge,
          maritalStatus: marital,
          nationality: formData.nationality?.trim() || 'Pakistani',
          category: profCat,
          salary: formData.salary?.trim() || '',
          location: formData.location?.trim() || 'Bahrain',
          residence: formData.residence?.trim() || 'Bahrain Resident',
          siblings: formData.siblings?.trim() || '',
          father: formData.father?.trim() || '',
          mother: formData.mother?.trim() || '',
          family: formData.family?.trim() || '',
          languages: formData.languages?.trim() || '',
          about: formData.about?.trim() || '',
          requirements: formData.requirements?.trim() || '',
          contact: formData.contact?.trim() || '+973 3718 8557',
          height: formData.height?.trim() || '',
          profession: formData.profession?.trim() || '',
          education: formData.education?.trim() || '',
          sect: formData.sect?.trim() || '',
          caste: formData.caste?.trim() || '',
          image: finalImageUrl,
          instagramPostUrl: formData.instagramPostUrl?.trim() || '',
          instagramPostId: igPostId,
          verified: true,
          featured: false,
          createdAt: new Date().toISOString()
        };

        // Immediately update React state for instant UI update
        setProfiles((prev) => {
          const next = [newProf, ...prev.filter(p => p.id !== newProf.id)];
          if (onProfilesChange) onProfilesChange(next);
          return next;
        });

        // Save to backend database
        try {
          const res = await fetch(`${API_BASE}/profiles`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newProf)
          });
          const data = await res.json();
          if (data.success && data.profile) {
            setProfiles((prev) => {
              const next = [data.profile, ...prev.filter(p => p.id !== data.profile.id)];
              if (onProfilesChange) onProfilesChange(next);
              return next;
            });
          }
        } catch (serverErr) {
          console.warn('[Admin] Server create notice:', serverErr.message);
        }

        showNotification(`✓ Published new profile ${newProf.id} successfully!`);
        setIsFormOpen(false);
        if (openInstagram) setInstagramModalProfile(newProf);
      }
    } catch (err) {
      console.error('[Admin] Save error:', err);
      showNotification(`Save Error: ${err.message}`);
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
    const errs = {};
    const cleanUser = usernameInput.trim().toLowerCase();
    const cleanPass = passwordInput.trim();

    if (!cleanUser) {
      errs.username = 'Admin username is required.';
    }
    if (!cleanPass) {
      errs.password = 'Admin password is required.';
    }

    if (Object.keys(errs).length > 0) {
      setLoginErrors(errs);
      return;
    }
    setLoginErrors({});

    if (
      (cleanUser === ADMIN_CREDENTIALS.username || cleanUser === ADMIN_CREDENTIALS.altUsername) &&
      cleanPass === ADMIN_CREDENTIALS.password
    ) {
      sessionStorage.setItem('nikah_admin_authenticated', 'true');
      setIsAuthenticated(true);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.5 } });
    } else {
      setLoginError('Invalid username or password. Please verify your credentials.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('nikah_admin_authenticated');
    setIsAuthenticated(false);
    setPasswordInput('');
  };

  const getMergedProfiles = (baseList) => {
    return baseList || [];
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
          setProfiles(profilesData.profiles);
          if (onProfilesChange) onProfilesChange(profilesData.profiles);
          return;
        }
      }
      const deletedSet = new Set((fallbackDeletedIds || []).map(String));
      const cleanList = (fallbackProfiles || []).filter(p => p && p.id && !deletedSet.has(String(p.id)));
      setProfiles(cleanList);
      if (onProfilesChange) onProfilesChange(cleanList);
    } catch (err) {
      console.warn('Admin fetch API fallback used:', err.message);
      const deletedSet = new Set((fallbackDeletedIds || []).map(String));
      const cleanList = (fallbackProfiles || []).filter(p => p && p.id && !deletedSet.has(String(p.id)));
      setProfiles(cleanList);
      if (onProfilesChange) onProfilesChange(cleanList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  // Reset page when section or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeSection, searchQuery]);

  const handleDeleteProfile = async (id) => {
    if (!window.confirm(`Permanently delete profile ${id}?`)) return;

    // Immediately remove from Admin UI state AND notify parent App
    setProfiles((prev) => {
      const next = prev.filter(p => p.id !== id);
      if (onProfilesChange) onProfilesChange(next);
      return next;
    });

    try {
      const res = await fetch(`${API_BASE}/profiles/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showNotification(`✓ Profile ${id} permanently deleted.`);
        fetchData();
      } else {
        showNotification(`Profile ${id} delete error: ${data.message || 'Failed'}`);
      }
    } catch (err) {
      console.warn('[Admin] Server delete failed:', err.message);
      showNotification(`Failed to delete profile ${id}: ${err.message}`);
    }
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

  // Incremental sync — only fetches NEW posts not already in the database
  const handleSyncToInstagram = async () => {
    setSyncingInstagram(true);
    try {
      showNotification('📡 Fetching new posts from @nikah_bahrain via Instagram API…');
      const res = await fetch(`${API_BASE}/sync-instagram?mode=incremental`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        const newCount = data.freshlyFetched || 0;
        const total = data.totalProfiles || data.totalPosts || 0;
        if (newCount > 0) {
          showNotification(`🎉 ${newCount} new profile(s) added from @nikah_bahrain! Total: ${total}`);
          confetti({ particleCount: 80, spread: 70, origin: { y: 0.4 } });
        } else {
          showNotification(`✅ Already up to date. ${total} profiles in database.`);
        }
        await fetchData();
      } else {
        // Real error from the API
        const hint = data.hint ? ` Tip: ${data.hint}` : '';
        showNotification(`⚠️ ${data.message || 'Sync failed.'}${hint}`);
      }
    } catch (err) {
      showNotification(`❌ Network error: ${err.message}`);
    } finally {
      setSyncingInstagram(false);
    }
  };

  // Full replace sync — re-fetches ALL Instagram posts and replaces database profiles
  const handleReplaceAllFromInstagram = async () => {
    const confirmed = window.confirm(
      '⚠️ REPLACE ALL PROFILES?\n\nThis will fetch ALL posts from @nikah_bahrain Instagram and completely replace the current profile data.\n\nManually added profiles will be preserved.\n\nProceed?'
    );
    if (!confirmed) return;

    setSyncingInstagram(true);
    try {
      showNotification('🔄 Fetching ALL posts from @nikah_bahrain… This may take 30–60 seconds.');
      const res = await fetch(`${API_BASE}/sync-instagram?mode=replace&limit=300`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        const total = data.totalProfiles || 0;
        const fetched = data.freshlyFetched || 0;
        showNotification(`✅ Replaced! ${fetched} profiles refreshed from Instagram. Total: ${total}`);
        confetti({ particleCount: 120, spread: 90, origin: { y: 0.3 } });
        await fetchData();
      } else {
        const hint = data.hint ? `\n\nTip: ${data.hint}` : '';
        showNotification(`⚠️ ${data.message || 'Replace failed.'}${hint}`);
      }
    } catch (err) {
      showNotification(`❌ Network error: ${err.message}`);
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
                Admin Username *
              </label>
              <input
                id="admin-username-input"
                type="text"
                value={usernameInput}
                onChange={e => {
                  setUsernameInput(e.target.value);
                  if (loginErrors.username) setLoginErrors(prev => ({ ...prev, username: '' }));
                  if (loginError) setLoginError('');
                }}
                placeholder="admin"
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: loginErrors.username ? '#fef2f2' : '#f8fafc',
                  border: loginErrors.username ? '1.5px solid #ef4444' : '1.5px solid rgba(196, 155, 31, 0.35)',
                  color: '#0f172a',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
              {loginErrors.username && (
                <span style={{ color: '#dc2626', fontSize: '0.74rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                  <AlertCircle size={12} /> {loginErrors.username}
                </span>
              )}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#1e293b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Admin Password *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="admin-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={e => {
                    setPasswordInput(e.target.value);
                    if (loginErrors.password) setLoginErrors(prev => ({ ...prev, password: '' }));
                    if (loginError) setLoginError('');
                  }}
                  placeholder="Enter admin password"
                  style={{
                    width: '100%',
                    padding: '11px 40px 11px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: loginErrors.password ? '#fef2f2' : '#f8fafc',
                    border: loginErrors.password ? '1.5px solid #ef4444' : '1.5px solid rgba(196, 155, 31, 0.35)',
                    color: '#0f172a',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.75rem', padding: '4px' }}>
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {loginErrors.password && (
                <span style={{ color: '#dc2626', fontSize: '0.74rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                  <AlertCircle size={12} /> {loginErrors.password}
                </span>
              )}
            </div>
            {loginError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} color="#dc2626" style={{ flexShrink: 0 }} />
                <span>{loginError}</span>
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
          <button onClick={handleSyncToInstagram} disabled={syncingInstagram} className="btn-gold" style={{ fontSize: '0.8rem', padding: '8px 14px' }} title="Fetch new posts only (incremental)">
            <Instagram size={14} />
            <span>{syncingInstagram ? 'Fetching…' : 'Sync New Posts'}</span>
          </button>
          <button onClick={handleReplaceAllFromInstagram} disabled={syncingInstagram} className="btn-ghost" style={{ fontSize: '0.78rem', padding: '7px 11px', border: '1px solid rgba(212,175,55,0.4)' }} title="Fetch ALL posts from Instagram and replace all profiles">
            <RefreshCw size={13} />
            <span>{syncingInstagram ? '…' : 'Replace All'}</span>
          </button>
          <button onClick={handleExportJson} className="btn-ghost" style={{ fontSize: '0.78rem', padding: '7px 11px', border: '1px solid rgba(212,175,55,0.4)', color: '#d4af37' }} title="Export full profiles.json backup file">
            <Download size={14} />
            <span>Export JSON</span>
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
        <div style={{
          position: 'fixed', top: '70px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 999,
          background: notification.startsWith('❌') ? 'rgba(239,68,68,0.95)' : notification.startsWith('⚠️') ? 'rgba(245,158,11,0.95)' : 'rgba(16,185,129,0.95)',
          border: `1px solid ${notification.startsWith('❌') ? '#ef4444' : notification.startsWith('⚠️') ? '#f59e0b' : '#10b981'}`,
          color: '#fff', padding: '10px 20px', borderRadius: 'var(--radius-full)',
          fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)', whiteSpace: 'nowrap', maxWidth: '90vw'
        }}>
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
                        handleNavSelect(item.id);
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
                            onClick={() => handleNavSelect(child.id)}
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
                    <button
                      onClick={() => { handleNavSelect('all'); handleOpenCreate('form'); }}
                      className="btn-gold"
                      style={{ fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <FileText size={15} /> Fill Profile Form (No Picture)
                    </button>
                    <button
                      onClick={() => { handleNavSelect('all'); handleOpenCreate('picture'); }}
                      className="btn-ghost"
                      style={{ fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Upload size={15} /> Picture & Instagram Link
                    </button>
                    <button onClick={() => handleNavSelect('all')} className="btn-ghost" style={{ fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <Users size={15} /> View All Candidates
                    </button>
                    <button onClick={handleSyncToInstagram} disabled={syncingInstagram} className="btn-ghost" style={{ fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <Instagram size={15} /> {syncingInstagram ? 'Fetching…' : 'Sync New Posts'}
                    </button>
                    <button onClick={handleReplaceAllFromInstagram} disabled={syncingInstagram} className="btn-ghost" style={{ fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px', border: '1px solid rgba(212,175,55,0.35)' }}>
                      <RefreshCw size={15} /> {syncingInstagram ? '…' : 'Replace All from Instagram'}
                    </button>
                  </div>
                </CategorySection>

                {/* ── Recently Uploaded & Managed Candidates (Always visible on Mobile & Desktop) ── */}
                <CategorySection title="Recently Uploaded & Managed Candidates" accent="#3b82f6">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      Latest registered candidate profiles ({profiles.slice(0, 8).length} of {profiles.length})
                    </span>
                    <button
                      onClick={() => handleNavSelect('all')}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-gold)',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      View All in Registry &rarr;
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                    {profiles.slice(0, 8).map((p) => (
                      <div
                        key={p.id}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '12px',
                          padding: '12px 14px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: 800, color: 'var(--text-gold)', fontSize: '0.82rem' }}>{p.id}</span>
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '999px',
                            background: p.gender === 'male' ? '#eff6ff' : '#fdf2f8',
                            color: p.gender === 'male' ? '#1d4ed8' : '#be185d'
                          }}>
                            {p.gender === 'male' ? '👨 Groom' : '👩 Bride'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          {p.image ? (
                            <img src={p.image} alt={p.name} style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'contain', background: '#000', border: '1px solid var(--gold-border)', flexShrink: 0 }} />
                          ) : (
                            <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontWeight: 800, fontSize: '0.8rem', flexShrink: 0 }}>
                              NPF
                            </div>
                          )}
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {p.name}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                              {[p.age ? `${p.age}y` : null, p.maritalStatus, p.nationality].filter(Boolean).join(' • ')}
                            </div>
                          </div>
                        </div>

                        {p.profession && (
                          <div style={{ fontSize: '0.74rem', color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            💼 {p.profession} {p.location ? `• ${p.location}` : ''}
                          </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '8px', marginTop: '2px' }}>
                          <button
                            onClick={() => handleToggleVerified(p)}
                            style={{
                              background: p.verified ? '#ecfdf5' : '#fef2f2',
                              border: `1px solid ${p.verified ? '#a7f3d0' : '#fecaca'}`,
                              color: p.verified ? '#065f46' : '#991b1b',
                              padding: '2px 8px',
                              borderRadius: '999px',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            {p.verified ? '✓ Verified' : 'Pending'}
                          </button>

                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => handleOpenEdit(p)}
                              style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '4px 8px', fontSize: '0.72rem', cursor: 'pointer', color: '#334155', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                            >
                              <Edit size={11} /> Edit
                            </button>
                            {p.image && (
                              <button
                                onClick={() => handleDownloadFlyer(p)}
                                style={{ background: '#fefce8', border: '1px solid #fde047', borderRadius: '6px', padding: '4px 8px', fontSize: '0.72rem', cursor: 'pointer', color: '#854d0e', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                                title="Download flyer"
                              >
                                <Upload size={11} /> Flyer
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteProfile(p.id)}
                              style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '6px', padding: '4px 7px', fontSize: '0.72rem', cursor: 'pointer', color: '#dc2626' }}
                              title="Delete profile"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleOpenCreate('form')}
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
                      <FileText size={14} />
                      Fill Profile Form
                    </button>
                    <button
                      onClick={() => handleOpenCreate('picture')}
                      className="btn-ghost"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        borderRadius: '9999px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <Upload size={14} />
                      Picture & Instagram Link
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

                {/* Desktop Table View */}
                <div className="admin-table-wrapper admin-desktop-table" style={{ borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0', overflow: 'hidden', background: '#ffffff', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
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
                                  <button
                                    onClick={() => setInstagramModalProfile(p)}
                                    className="btn-ghost"
                                    style={{ padding: '5px 9px', color: '#E1306C' }}
                                    title="Post / Share to Instagram (@nikah_bahrain)"
                                  >
                                    <Instagram size={13} color="#E1306C" />
                                  </button>
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

                {/* ── Mobile Cards View for Profiles (< 768px screens) ── */}
                <div className="admin-mobile-cards">
                  {paginatedProfiles.length === 0 ? (
                    <div style={{ padding: '36px 16px', textAlign: 'center', color: '#64748b', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      {searchQuery ? `No results for "${searchQuery}"` : 'No records in this category.'}
                    </div>
                  ) : (
                    paginatedProfiles.map((p) => (
                      <div
                        key={p.id}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '12px',
                          padding: '14px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px'
                        }}
                      >
                        {/* Card Header: ID, Category & Verified Status */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 800, color: 'var(--text-gold)', fontSize: '0.86rem' }}>{p.id}</span>
                            <span style={{
                              background: '#fefce8',
                              border: '1px solid rgba(196, 155, 31, 0.35)',
                              color: 'var(--text-gold)',
                              padding: '2px 8px',
                              borderRadius: '999px',
                              fontSize: '0.7rem',
                              fontWeight: 700
                            }}>
                              {p.maritalStatus || p.category || '—'}
                            </span>
                          </div>

                          <button
                            onClick={() => handleToggleVerified(p)}
                            style={{
                              background: p.verified ? '#ecfdf5' : '#fef2f2',
                              border: `1px solid ${p.verified ? '#a7f3d0' : '#fecaca'}`,
                              color: p.verified ? '#065f46' : '#991b1b',
                              padding: '2px 8px',
                              borderRadius: '999px',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                          >
                            <ShieldCheck size={11} /> {p.verified ? 'Verified' : 'Pending'}
                          </button>
                        </div>

                        {/* Candidate Details Row */}
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          {p.image ? (
                            <img
                              src={p.image}
                              alt={p.name}
                              style={{ width: '56px', height: '56px', borderRadius: '10px', objectFit: 'contain', background: '#000', border: '1px solid var(--gold-border)', flexShrink: 0 }}
                            />
                          ) : (
                            <div style={{ width: '56px', height: '56px', borderRadius: '10px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontWeight: 800, fontSize: '0.85rem', flexShrink: 0 }}>
                              {p.gender === 'male' ? '👨' : '👩'}
                            </div>
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {p.name}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '2px' }}>
                              <span style={{ color: p.gender === 'male' ? '#1d4ed8' : '#be185d', fontWeight: 700, textTransform: 'capitalize' }}>
                                {p.gender}
                              </span>
                              {p.age ? ` • ${p.age} yrs` : ''}
                              {p.nationality ? ` • ${p.nationality}` : ''}
                            </div>
                            {(p.profession || p.location) && (
                              <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {[p.profession, p.location].filter(Boolean).join(' • ')}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '10px', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => handleOpenEdit(p)}
                            style={{
                              flex: 1,
                              minWidth: '70px',
                              padding: '7px 10px',
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1',
                              background: '#f8fafc',
                              color: '#334155',
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px'
                            }}
                          >
                            <Edit size={12} /> Edit
                          </button>

                          {p.image && (
                            <button
                              onClick={() => handleDownloadFlyer(p)}
                              style={{
                                flex: 1,
                                minWidth: '70px',
                                padding: '7px 10px',
                                borderRadius: '8px',
                                border: '1px solid #fde047',
                                background: '#fefce8',
                                color: '#854d0e',
                                fontSize: '0.76rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px'
                              }}
                            >
                              <Upload size={12} /> Flyer
                            </button>
                          )}

                          <button
                            onClick={() => setInstagramModalProfile(p)}
                            style={{
                              padding: '7px 10px',
                              borderRadius: '8px',
                              border: '1px solid #fbcfe8',
                              background: '#fdf2f8',
                              color: '#be185d',
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px'
                            }}
                            title="Instagram"
                          >
                            <Instagram size={12} color="#E1306C" />
                          </button>

                          <a
                            href={`https://wa.me/97337188557?text=${encodeURIComponent(`Admin check: ${p.id} — ${p.name}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              padding: '7px 10px',
                              borderRadius: '8px',
                              border: '1px solid #bbf7d0',
                              background: '#f0fdf4',
                              color: '#15803d',
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px'
                            }}
                            title="WhatsApp"
                          >
                            <MessageCircle size={12} color="#25D366" />
                          </a>

                          <button
                            onClick={() => handleDeleteProfile(p.id)}
                            style={{
                              padding: '7px 10px',
                              borderRadius: '8px',
                              border: '1px solid #fca5a5',
                              background: '#fee2e2',
                              color: '#dc2626',
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title="Delete"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
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
                    <ContactCard title="Female Family Coordinator" phone="+973 3326 4512" waLink="https://wa.me/97333264512" />
                  </div>
                </CategorySection>

                <CategorySection title="Official WhatsApp Community Group" accent="#10b981">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <p style={{ fontSize: '0.84rem', color: '#475569', margin: 0 }}>
                      Official group chat invite for verified members and prospective candidates:
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                      <WhatsAppGroupInvite />
                    </div>
                  </div>
                </CategorySection>

                <CategorySection title="Instagram Feed" accent="#e1306c">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <a href="https://www.instagram.com/nikah_bahrain/" target="_blank" rel="noopener noreferrer" className="btn-gold" style={{ fontSize: '0.85rem' }}>
                      <Instagram size={15} />
                      <span>Open @nikah_bahrain</span>
                    </a>
                    <button onClick={handleSyncToInstagram} disabled={syncingInstagram} className="btn-ghost" style={{ fontSize: '0.85rem' }}>
                      <Instagram size={15} /> {syncingInstagram ? 'Fetching…' : 'Sync New Posts'}
                    </button>
                    <button onClick={handleReplaceAllFromInstagram} disabled={syncingInstagram} className="btn-ghost" style={{ fontSize: '0.85rem', border: '1px solid rgba(212,175,55,0.35)' }}>
                      <RefreshCw size={15} /> {syncingInstagram ? '…' : 'Replace All'}
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px', marginBottom: '16px' }}>
              <div>
                <h3 className="font-cinzel" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  {editingProfile ? `Edit Profile (${editingProfile.id})` : '➕ Add New Groom / Bride Profile'}
                </h3>
                <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
                  Choose either Option 1 to simply upload the flyer picture OR Option 2 to fill out the form
                </span>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="btn-ghost" style={{ padding: '6px', borderRadius: '50%' }}>
                <X size={18} />
              </button>
            </div>

            {/* ── Two Tabs: Tab 1: Form Filling (No Picture) vs Tab 2: Picture & Instagram Link (Optional) ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '18px', background: '#f1f5f9', padding: '5px', borderRadius: '12px' }}>
              <button
                type="button"
                onClick={() => {
                  setCreationMode('form');
                  setFormErrors({});
                }}
                style={{
                  padding: '11px 16px',
                  borderRadius: '8px',
                  border: creationMode === 'form' ? '1.5px solid #3b82f6' : '1.5px solid transparent',
                  background: creationMode === 'form' ? '#ffffff' : 'transparent',
                  color: creationMode === 'form' ? '#1e40af' : '#64748b',
                  fontWeight: creationMode === 'form' ? 800 : 600,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: creationMode === 'form' ? '0 3px 10px rgba(59, 130, 246, 0.2)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <FileText size={16} color={creationMode === 'form' ? '#2563eb' : '#94a3b8'} />
                <span>📝 Tab 1: Form Filling (No Picture)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setCreationMode('picture');
                  setFormErrors({});
                }}
                style={{
                  padding: '11px 16px',
                  borderRadius: '8px',
                  border: creationMode === 'picture' ? '1.5px solid #d4af37' : '1.5px solid transparent',
                  background: creationMode === 'picture' ? '#ffffff' : 'transparent',
                  color: creationMode === 'picture' ? '#92400e' : '#64748b',
                  fontWeight: creationMode === 'picture' ? 800 : 600,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: creationMode === 'picture' ? '0 3px 10px rgba(212, 175, 55, 0.25)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <Upload size={16} color={creationMode === 'picture' ? '#b45309' : '#94a3b8'} />
                <span>📸 Tab 2: Picture & Instagram Link (Optional)</span>
              </button>
            </div>

            <form onSubmit={handleSaveAdminProfile}>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageFileUpload}
              />

              {/* ── Error Summary Banner ── */}
              {Object.keys(formErrors).length > 0 && (
                <div style={{
                  background: '#fef2f2',
                  border: '1.5px solid #f87171',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  animation: 'fadeIn 0.2s ease-in-out'
                }}>
                  <AlertCircle size={20} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ flex: 1 }}>
                    <h5 style={{ margin: '0 0 4px', color: '#991b1b', fontSize: '0.85rem', fontWeight: 800 }}>
                      Please correct the following errors before saving:
                    </h5>
                    <ul style={{ margin: 0, paddingLeft: '18px', color: '#b91c1c', fontSize: '0.78rem', lineHeight: 1.5 }}>
                      {Object.values(formErrors).map((msg, idx) => (
                        <li key={idx}>{msg}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {creationMode === 'form' ? (
                /* ════ TAB 1: FORM FILLING (NO PICTURE) ════ */
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div style={{ gridColumn: 'span 2', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FileText size={20} color="#2563eb" style={{ flexShrink: 0 }} />
                    <div style={{ fontSize: '0.78rem', color: '#1e40af', lineHeight: 1.4 }}>
                      <strong>Form Filling Mode (No Picture):</strong> Fill out candidate bio-data details below for a text-based Typography Profile Card. No picture is uploaded in this mode.
                    </div>
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: formErrors.name ? '#dc2626' : '#475569', display: 'block', marginBottom: '4px' }}>
                      Full Name / Profile Title *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => handleFieldChange('name', e.target.value)}
                      placeholder="e.g. NPF-230 (Groom) or Candidate Name"
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: formErrors.name ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
                        background: formErrors.name ? '#fff5f5' : '#ffffff',
                        fontSize: '0.85rem',
                        transition: 'border-color 0.15s ease'
                      }}
                    />
                    {formErrors.name && (
                      <span style={{ color: '#dc2626', fontSize: '0.74rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                        <AlertCircle size={12} /> {formErrors.name}
                      </span>
                    )}
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: formErrors.gender ? '#dc2626' : '#475569', display: 'block', marginBottom: '4px' }}>
                      Gender *
                    </label>
                    <select
                      value={formData.gender}
                      onChange={e => handleFieldChange('gender', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: formErrors.gender ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
                        background: formErrors.gender ? '#fff5f5' : '#ffffff',
                        fontSize: '0.85rem'
                      }}
                    >
                      <option value="male">Male (Groom)</option>
                      <option value="female">Female (Bride)</option>
                    </select>
                    {formErrors.gender && (
                      <span style={{ color: '#dc2626', fontSize: '0.74rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                        <AlertCircle size={12} /> {formErrors.gender}
                      </span>
                    )}
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: formErrors.maritalStatus ? '#dc2626' : '#475569', display: 'block', marginBottom: '4px' }}>
                      Marital Status *
                    </label>
                    <select
                      value={formData.maritalStatus}
                      onChange={e => handleFieldChange('maritalStatus', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: formErrors.maritalStatus ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
                        background: formErrors.maritalStatus ? '#fff5f5' : '#ffffff',
                        fontSize: '0.85rem'
                      }}
                    >
                      <option value="">Select Marital Status</option>
                      <option value="Never Married">Never Married</option>
                      <option value="Divorced">Divorced</option>
                      <option value="2nd Marriage">2nd Marriage</option>
                      <option value="Widowed">Widowed</option>
                    </select>
                    {formErrors.maritalStatus && (
                      <span style={{ color: '#dc2626', fontSize: '0.74rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                        <AlertCircle size={12} /> {formErrors.maritalStatus}
                      </span>
                    )}
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: formErrors.nationality ? '#dc2626' : '#475569', display: 'block', marginBottom: '4px' }}>
                      Nationality *
                    </label>
                    <select
                      value={formData.nationality}
                      onChange={e => handleFieldChange('nationality', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: formErrors.nationality ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
                        background: formErrors.nationality ? '#fff5f5' : '#ffffff',
                        fontSize: '0.85rem'
                      }}
                    >
                      <option value="">Select Nationality</option>
                      <option value="Pakistani">Pakistani</option>
                      <option value="Indian">Indian</option>
                      <option value="Bahraini">Bahraini</option>
                      <option value="Saudi Arabia">Saudi Arabia</option>
                      <option value="Emirati">Emirati</option>
                      <option value="GCC / Other">GCC / Other</option>
                    </select>
                    {formErrors.nationality && (
                      <span style={{ color: '#dc2626', fontSize: '0.74rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                        <AlertCircle size={12} /> {formErrors.nationality}
                      </span>
                    )}
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: formErrors.age ? '#dc2626' : '#475569', display: 'block', marginBottom: '4px' }}>
                      Age
                    </label>
                    <input
                      type="number"
                      min="18"
                      max="80"
                      value={formData.age}
                      onChange={e => handleFieldChange('age', e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="e.g. 28"
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: formErrors.age ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
                        background: formErrors.age ? '#fff5f5' : '#ffffff',
                        fontSize: '0.85rem'
                      }}
                    />
                    {formErrors.age && (
                      <span style={{ color: '#dc2626', fontSize: '0.74rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                        <AlertCircle size={12} /> {formErrors.age}
                      </span>
                    )}
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Height</label>
                    <input type="text" value={formData.height} onChange={e => handleFieldChange('height', e.target.value)} placeholder="e.g. 5'10&quot;" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Religious Sect</label>
                    <input type="text" value={formData.sect} onChange={e => handleFieldChange('sect', e.target.value)} placeholder="e.g. Sunni / Ahle Sunnat" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Caste / Sub-caste</label>
                    <input type="text" value={formData.caste} onChange={e => handleFieldChange('caste', e.target.value)} placeholder="e.g. Syed, Rajput, Arain, General" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Education</label>
                    <input type="text" value={formData.education} onChange={e => handleFieldChange('education', e.target.value)} placeholder="e.g. MBA, B.Tech, Master Degree" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Profession / Job</label>
                    <input type="text" value={formData.profession} onChange={e => handleFieldChange('profession', e.target.value)} placeholder="e.g. Software Engineer, Business" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Current Location</label>
                    <input type="text" value={formData.location} onChange={e => handleFieldChange('location', e.target.value)} placeholder="e.g. Manama, Bahrain" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Residence Status</label>
                    <input type="text" value={formData.residence} onChange={e => handleFieldChange('residence', e.target.value)} placeholder="e.g. CPR Holder, Resident" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: formErrors.contact ? '#dc2626' : '#475569', display: 'block', marginBottom: '4px' }}>
                      WhatsApp Contact
                    </label>
                    <input
                      type="text"
                      value={formData.contact}
                      onChange={e => handleFieldChange('contact', e.target.value)}
                      placeholder="+973 3718 8557"
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: formErrors.contact ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
                        background: formErrors.contact ? '#fff5f5' : '#ffffff',
                        fontSize: '0.85rem'
                      }}
                    />
                    {formErrors.contact && (
                      <span style={{ color: '#dc2626', fontSize: '0.74rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                        <AlertCircle size={12} /> {formErrors.contact}
                      </span>
                    )}
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>About Candidate / Family Background</label>
                    <textarea rows="3" value={formData.about} onChange={e => handleFieldChange('about', e.target.value)} placeholder="Brief summary of candidate background..." style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Partner Requirements</label>
                    <textarea rows="2" value={formData.requirements} onChange={e => handleFieldChange('requirements', e.target.value)} placeholder="Preferences for partner..." style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                  </div>
                </div>
              ) : (
                /* ════ TAB 2: PICTURE & INSTAGRAM LINK (OPTIONAL) ════ */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ background: '#fefce8', border: '1px solid #fef08a', borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Sparkles size={20} color="#ca8a04" style={{ flexShrink: 0 }} />
                    <div style={{ fontSize: '0.78rem', color: '#854d0e', lineHeight: 1.4 }}>
                      <strong>Picture & Instagram Mode:</strong> Upload the candidate's flyer picture directly and optionally provide the Instagram post link. Candidate details are captured in the flyer image.
                    </div>
                  </div>

                  {/* Candidate Picture Upload Area */}
                  <div style={{
                    background: formErrors.image ? '#fef2f2' : '#f8fafc',
                    border: formErrors.image ? '2px dashed #ef4444' : '2px dashed #cbd5e1',
                    borderRadius: '14px',
                    padding: '20px',
                    textAlign: 'center',
                    transition: 'all 0.2s ease'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 800, color: formErrors.image ? '#dc2626' : '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Image size={18} color={formErrors.image ? '#dc2626' : 'var(--text-gold)'} /> Candidate Picture / Flyer *
                      </label>
                      {formData.image && (
                        <button
                          type="button"
                          onClick={() => handleFieldChange('image', '')}
                          style={{
                            background: '#fee2e2',
                            color: '#dc2626',
                            border: '1px solid #fca5a5',
                            borderRadius: '6px',
                            padding: '4px 10px',
                            fontSize: '0.74rem',
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

                    {formData.image ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                        <div style={{ maxWidth: '320px', maxHeight: '340px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '2px solid var(--gold-border)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
                          <img src={formData.image} alt="Candidate Flyer" style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'contain' }} />
                        </div>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploadingImage}
                            className="btn-gold"
                            style={{ fontSize: '0.78rem', padding: '7px 16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          >
                            <Upload size={14} />
                            <span>{isUploadingImage ? 'Uploading...' : 'Change Picture from Device'}</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: formErrors.image ? '#fee2e2' : '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: formErrors.image ? '#dc2626' : '#d97706' }}>
                          <Upload size={28} />
                        </div>
                        <div>
                          <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: formErrors.image ? '#991b1b' : '#0f172a', margin: '0 0 4px' }}>Upload Candidate Picture / Flyer</h4>
                          <p style={{ fontSize: '0.76rem', color: '#64748b', margin: 0 }}>Click below to choose image from your computer/phone OR paste image URL</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingImage}
                          style={{
                            padding: '11px 24px',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'linear-gradient(135deg, #fae182 0%, #d4af37 50%, #b8860b 100%)',
                            color: '#0d251c',
                            fontWeight: 800,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 14px rgba(212, 175, 55, 0.4)'
                          }}
                        >
                          <Upload size={16} />
                          <span>{isUploadingImage ? 'Uploading...' : 'Upload from Device'}</span>
                        </button>
                        <div style={{ width: '100%', maxWidth: '440px', marginTop: '4px' }}>
                          <input
                            type="url"
                            value={formData.image}
                            onChange={e => handleFieldChange('image', e.target.value)}
                            placeholder="Or paste direct image URL (https://...)"
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              border: formErrors.image ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
                              fontSize: '0.8rem',
                              background: '#ffffff',
                              textAlign: 'center'
                            }}
                          />
                        </div>
                        {formErrors.image && (
                          <div style={{ color: '#dc2626', fontSize: '0.76rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', marginTop: '6px' }}>
                            <AlertCircle size={14} /> {formErrors.image}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Instagram Post Link (Optional) */}
                  <div style={{
                    background: formErrors.instagramPostUrl ? '#fef2f2' : '#fdf2f8',
                    border: formErrors.instagramPostUrl ? '1.5px solid #ef4444' : '1.5px solid #fbcfe8',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    textAlign: 'left'
                  }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#9d174d', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <Instagram size={16} color="#E1306C" /> Instagram Post Link (Optional)
                    </label>
                    <p style={{ fontSize: '0.74rem', color: '#be185d', margin: '0 0 8px' }}>
                      Paste the Instagram post URL for this candidate if already published on @nikah_bahrain (e.g. https://www.instagram.com/p/DdUNcFVIYZJ/)
                    </p>
                    <input
                      type="url"
                      value={formData.instagramPostUrl}
                      onChange={e => handleFieldChange('instagramPostUrl', e.target.value)}
                      placeholder="https://www.instagram.com/p/... (Optional)"
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: formErrors.instagramPostUrl ? '1.5px solid #ef4444' : '1px solid #f472b6',
                        background: formErrors.instagramPostUrl ? '#fff5f5' : '#ffffff',
                        fontSize: '0.84rem'
                      }}
                    />
                    {formErrors.instagramPostUrl && (
                      <span style={{ color: '#dc2626', fontSize: '0.74rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                        <AlertCircle size={12} /> {formErrors.instagramPostUrl}
                      </span>
                    )}
                  </div>

                  {/* Basic Profile Essentials for Picture Mode */}
                  <div style={{ background: '#fefce8', border: '1px solid #fef08a', borderRadius: '10px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left' }}>
                    <ShieldCheck size={18} color="#ca8a04" style={{ flexShrink: 0 }} />
                    <div style={{ fontSize: '0.78rem', color: '#854d0e', lineHeight: 1.4 }}>
                      <strong>Accurate Flyer Data:</strong> Fill in the candidate details that are mentioned on the flyer picture (e.g. Age, Profession, Marital Status). Any field left blank will <em>not</em> be displayed on the candidate profile.
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', textAlign: 'left' }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 700, color: formErrors.gender ? '#dc2626' : '#475569', display: 'block', marginBottom: '4px' }}>
                        Candidate Type / Gender *
                      </label>
                      <select
                        value={formData.gender}
                        onChange={e => {
                          const newGender = e.target.value;
                          let newName = formData.name;
                          if (newName.includes('Groom') && newGender === 'female') {
                            newName = newName.replace('Groom', 'Bride');
                          } else if (newName.includes('Bride') && newGender === 'male') {
                            newName = newName.replace('Bride', 'Groom');
                          }
                          setFormData(prev => ({ ...prev, gender: newGender, name: newName }));
                          if (formErrors.gender) {
                            setFormErrors(prev => {
                              const copy = { ...prev };
                              delete copy.gender;
                              return copy;
                            });
                          }
                        }}
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: '8px',
                          border: formErrors.gender ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
                          background: formErrors.gender ? '#fff5f5' : '#ffffff',
                          fontSize: '0.85rem'
                        }}
                      >
                        <option value="male">Male (Groom)</option>
                        <option value="female">Female (Bride)</option>
                      </select>
                      {formErrors.gender && (
                        <span style={{ color: '#dc2626', fontSize: '0.74rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                          <AlertCircle size={12} /> {formErrors.gender}
                        </span>
                      )}
                    </div>

                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 700, color: formErrors.name ? '#dc2626' : '#475569', display: 'block', marginBottom: '4px' }}>
                        Profile Title / Code *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={e => handleFieldChange('name', e.target.value)}
                        placeholder="e.g. NPF-26 (Groom)"
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: '8px',
                          border: formErrors.name ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
                          background: formErrors.name ? '#fff5f5' : '#ffffff',
                          fontSize: '0.85rem'
                        }}
                      />
                      {formErrors.name && (
                        <span style={{ color: '#dc2626', fontSize: '0.74rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                          <AlertCircle size={12} /> {formErrors.name}
                        </span>
                      )}
                    </div>

                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 700, color: formErrors.age ? '#dc2626' : '#475569', display: 'block', marginBottom: '4px' }}>
                        Age (Years)
                      </label>
                      <input
                        type="number"
                        min="18"
                        max="90"
                        value={formData.age}
                        onChange={e => handleFieldChange('age', e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="e.g. 41 (from flyer)"
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: '8px',
                          border: formErrors.age ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
                          background: formErrors.age ? '#fff5f5' : '#ffffff',
                          fontSize: '0.85rem'
                        }}
                      />
                      {formErrors.age && (
                        <span style={{ color: '#dc2626', fontSize: '0.74rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                          <AlertCircle size={12} /> {formErrors.age}
                        </span>
                      )}
                    </div>

                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Marital Status</label>
                      <select value={formData.maritalStatus} onChange={e => handleFieldChange('maritalStatus', e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}>
                        <option value="">Select Marital Status (Optional)</option>
                        <option value="Never Married">Never Married</option>
                        <option value="Divorced">Divorced</option>
                        <option value="2nd Marriage">2nd Marriage</option>
                        <option value="Widowed">Widowed</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Nationality</label>
                      <select value={formData.nationality} onChange={e => handleFieldChange('nationality', e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}>
                        <option value="">Select Nationality (Optional)</option>
                        <option value="Bahraini">Bahraini</option>
                        <option value="Pakistani">Pakistani</option>
                        <option value="Indian">Indian</option>
                        <option value="Saudi Arabia">Saudi Arabia</option>
                        <option value="Emirati">Emirati</option>
                        <option value="GCC / Other">GCC / Other</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Profession / Job</label>
                      <input
                        type="text"
                        value={formData.profession}
                        onChange={e => handleFieldChange('profession', e.target.value)}
                        placeholder="e.g. Engineer / Businessman (or leave blank)"
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Height</label>
                      <input
                        type="text"
                        value={formData.height}
                        onChange={e => handleFieldChange('height', e.target.value)}
                        placeholder="e.g. 5'8&quot; (or leave blank)"
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Education / Qualification</label>
                      <input
                        type="text"
                        value={formData.education}
                        onChange={e => handleFieldChange('education', e.target.value)}
                        placeholder="e.g. Bachelor Degree (or leave blank)"
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Location / City</label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={e => handleFieldChange('location', e.target.value)}
                        placeholder="e.g. Bahrain / Manama (or leave blank)"
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 700, color: formErrors.contact ? '#dc2626' : '#475569', display: 'block', marginBottom: '4px' }}>
                        WhatsApp Contact
                      </label>
                      <input
                        type="text"
                        value={formData.contact}
                        onChange={e => handleFieldChange('contact', e.target.value)}
                        placeholder="+973 3718 8557"
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: '8px',
                          border: formErrors.contact ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
                          background: formErrors.contact ? '#fff5f5' : '#ffffff',
                          fontSize: '0.85rem'
                        }}
                      />
                      {formErrors.contact && (
                        <span style={{ color: '#dc2626', fontSize: '0.74rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                          <AlertCircle size={12} /> {formErrors.contact}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px', marginTop: '18px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
                <button type="button" onClick={() => setIsFormOpen(false)} style={{ padding: '9px 18px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={(e) => handleSaveAdminProfile(e, true)}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '8px',
                    border: '1px solid #E1306C',
                    background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)',
                    color: '#be185d',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Instagram size={14} color="#E1306C" />
                  <span>Save & Post to Instagram</span>
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  onClick={(e) => handleSaveAdminProfile(e, false)}
                  style={{
                    padding: '9px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #fae182 0%, #d4af37 50%, #b8860b 100%)',
                    color: '#0d251c',
                    fontWeight: 800,
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(212, 175, 55, 0.4)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {isSaving && <RefreshCw size={14} className="animate-spin" />}
                  <span>{isSaving ? 'Saving...' : editingProfile ? 'Update Profile' : creationMode === 'picture' ? 'Save Picture Profile' : 'Save Form Profile'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════ INSTAGRAM PUBLISHER MODAL ════ */}
      {instagramModalProfile && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(8px)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '720px',
            maxHeight: '92vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)',
            border: '1.5px solid var(--gold-border)',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <Instagram size={18} />
                </div>
                <div>
                  <h3 className="font-cinzel" style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Post to Instagram (@nikah_bahrain)
                  </h3>
                  <span style={{ fontSize: '0.74rem', color: '#64748b' }}>Profile ID: {instagramModalProfile.id} ({instagramModalProfile.gender === 'male' ? 'Groom' : 'Bride'})</span>
                </div>
              </div>
              <button onClick={() => setInstagramModalProfile(null)} className="btn-ghost" style={{ padding: '6px', borderRadius: '50%' }}>
                <X size={18} />
              </button>
            </div>

            {/* Step instructions banner */}
            <div style={{ background: '#fdf2f8', border: '1px solid #fbcfe8', borderRadius: '10px', padding: '12px 16px', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Sparkles size={20} color="#db2777" />
              <div style={{ fontSize: '0.78rem', color: '#9d174d' }}>
                <strong>3-Step Instagram Publish:</strong> 1. Click <b>Download Flyer</b> → 2. Click <b>Copy Caption</b> → 3. Click <b>Open Instagram Creator</b> to upload and paste!
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: instagramModalProfile.image ? '180px 1fr' : '1fr', gap: '18px', marginBottom: '20px' }}>
              {instagramModalProfile.image && (
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>Flyer Image</label>
                  <div style={{ width: '100%', height: '220px', borderRadius: '10px', overflow: 'hidden', border: '1.5px solid #e2e8f0', boxShadow: '0 4px 10px rgba(0,0,0,0.06)' }}>
                    <img src={instagramModalProfile.image} alt={instagramModalProfile.id} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <button
                    onClick={() => handleDownloadFlyer(instagramModalProfile)}
                    className="btn-ghost"
                    style={{ width: '100%', marginTop: '8px', fontSize: '0.76rem', padding: '6px 10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                  >
                    <Download size={13} /> Download Flyer
                  </button>
                </div>
              )}

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569' }}>Instagram Caption (Ready to Paste)</label>
                  <button
                    onClick={() => handleCopyInstagramCaption(generateInstagramCaption(instagramModalProfile))}
                    style={{
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: '#0f172a'
                    }}
                  >
                    <Copy size={12} /> Copy Caption
                  </button>
                </div>
                <textarea
                  readOnly
                  rows={8}
                  value={generateInstagramCaption(instagramModalProfile)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.76rem',
                    fontFamily: 'monospace',
                    background: '#f8fafc',
                    color: '#1e293b',
                    lineHeight: '1.4'
                  }}
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleCopyInstagramCaption(generateInstagramCaption(instagramModalProfile))}
                  className="btn-ghost"
                  style={{ fontSize: '0.8rem', padding: '8px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Copy size={14} />
                  <span>Copy Caption</span>
                </button>
                {instagramModalProfile.image && (
                  <button
                    type="button"
                    onClick={() => handleDownloadFlyer(instagramModalProfile)}
                    className="btn-ghost"
                    style={{ fontSize: '0.8rem', padding: '8px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Download size={14} />
                    <span>Download Flyer</span>
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setInstagramModalProfile(null)}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenInstagramToPost(instagramModalProfile)}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                    color: '#ffffff',
                    fontWeight: 800,
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 14px rgba(225, 48, 108, 0.35)'
                  }}
                >
                  <Instagram size={15} />
                  <span>Open Instagram to Post</span>
                </button>
              </div>
            </div>
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
