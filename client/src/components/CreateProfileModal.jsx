import React, { useState } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { 
  X, 
  ExternalLink, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  Send,
  HelpCircle
} from '../icons';
import confetti from 'canvas-confetti';
import API_BASE from '../api';

export default function CreateProfileModal({ isOpen, onClose, onProfileCreated }) {
  const [activeSubTab, setActiveSubTab] = useState('embed'); // 'embed' or 'direct'
  const [formData, setFormData] = useState({
    name: '',
    gender: 'male',
    maritalStatus: 'Never Married',
    nationality: 'Pakistani',
    age: '28',
    height: "5'9\"",
    sect: 'Sunni / Hanafi',
    caste: '',
    education: '',
    profession: '',
    location: 'Manama, Bahrain',
    residence: 'Bahrain Resident',
    siblings: '',
    father: '',
    mother: '',
    family: '',
    languages: 'English, Urdu',
    image: '',
    about: '',
    requirements: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Spring animation for modal entrance
  const modalSpring = useSpring({
    transform: isOpen ? 'scale(1) translateY(0px)' : 'scale(0.9) translateY(20px)',
    opacity: isOpen ? 1 : 0,
    config: { tension: 340, friction: 24 }
  });

  const backdropSpring = useSpring({
    opacity: isOpen ? 1 : 0,
    config: { duration: 180 }
  });

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDirectSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/profiles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (data.success) {
        setSubmittedSuccess(true);
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
        if (onProfileCreated) {
          onProfileCreated(data.profile);
        }
      }
    } catch (err) {
      console.error('Submission error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <animated.div
      style={{
        ...backdropSpring,
        position: 'fixed',
        inset: 0,
        zIndex: 600,
        backgroundColor: 'rgba(3, 8, 16, 0.88)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <animated.div
        onClick={(e) => e.stopPropagation()}
        style={{
          ...modalSpring,
          width: '100%',
          maxWidth: '900px',
          height: '92vh',
          maxHeight: '900px',
          borderRadius: 'var(--radius-lg)',
          background: 'linear-gradient(145deg, #091a32 0%, #061122 100%)',
          border: '1px solid var(--gold-border)',
          boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.9), 0 0 30px rgba(212, 175, 55, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(5, 12, 22, 0.8)'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 
                className="font-cinzel gold-text-gradient"
                style={{ fontSize: '1.4rem', fontWeight: 800 }}
              >
                Create Matrimonial Profile
              </h3>
              <span className="gold-badge">
                <ShieldCheck size={12} /> Confidential & Halal
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Fill the form below in this window to list your proposal on Qabul Hai & Instagram
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSe8p6bnqIMv7sPlDrYdREZHkpmuVb5c5pWrSVWqr70NhvvRCQ/viewform"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold"
              style={{ fontSize: '0.8rem', padding: '6px 14px' }}
              title="Open Google Form in full tab"
            >
              <ExternalLink size={14} />
              <span>Open in Full Tab</span>
            </a>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '50%',
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#ffffff'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* In-Window Mode Selector Tabs */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(3, 8, 16, 0.6)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            padding: '8px 24px',
            gap: '12px'
          }}
        >
          <button
            onClick={() => setActiveSubTab('embed')}
            style={{
              background: activeSubTab === 'embed' ? 'var(--gold-dim)' : 'transparent',
              border: activeSubTab === 'embed' ? '1px solid var(--gold-border)' : '1px solid transparent',
              color: activeSubTab === 'embed' ? 'var(--gold-light)' : 'var(--text-muted)',
              borderRadius: 'var(--radius-full)',
              padding: '6px 16px',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <FileText size={14} />
            <span>Official Google Form Window</span>
          </button>

          <button
            onClick={() => setActiveSubTab('direct')}
            style={{
              background: activeSubTab === 'direct' ? 'var(--gold-dim)' : 'transparent',
              border: activeSubTab === 'direct' ? '1px solid var(--gold-border)' : '1px solid transparent',
              color: activeSubTab === 'direct' ? 'var(--gold-light)' : 'var(--text-muted)',
              borderRadius: 'var(--radius-full)',
              padding: '6px 16px',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Sparkles size={14} />
            <span>Instant Direct Registration</span>
          </button>
        </div>

        {/* Tab 1: Embedded Google Form In-Window */}
        {activeSubTab === 'embed' && (
          <div style={{ flex: 1, position: 'relative', background: '#ffffff', overflow: 'hidden' }}>
            <iframe
              title="Qabul Hai Matrimonial Application Form"
              src="https://docs.google.com/forms/d/e/1FAIpQLSe8p6bnqIMv7sPlDrYdREZHkpmuVb5c5pWrSVWqr70NhvvRCQ/viewform?embedded=true"
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                display: 'block'
              }}
            />

            {/* Note overlay banner for users */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'rgba(6, 14, 26, 0.95)',
                borderTop: '1px solid var(--gold-border)',
                padding: '10px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: '#e2e8f0',
                fontSize: '0.82rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} color="var(--gold-primary)" />
                <span>
                  Official Google Form Embed. If your browser restricts embedded forms, click <strong>Open in Full Tab</strong> above.
                </span>
              </div>
              <a
                href="https://docs.google.com/forms/d/e/1FAIpQLSe8p6bnqIMv7sPlDrYdREZHkpmuVb5c5pWrSVWqr70NhvvRCQ/viewform"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gold"
                style={{ padding: '6px 16px', fontSize: '0.78rem' }}
              >
                Open Google Form
              </a>
            </div>
          </div>
        )}

        {/* Tab 2: Direct Registration that immediately posts to Node.js backend & categorizes */}
        {activeSubTab === 'direct' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            {submittedSuccess ? (
              <div 
                style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '16px'
                }}
              >
                <div 
                  style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.2)',
                    border: '2px solid #10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#10b981'
                  }}
                >
                  <CheckCircle2 size={36} />
                </div>
                <h3 className="font-cinzel gold-text-gradient" style={{ fontSize: '1.8rem' }}>
                  Profile Submitted Successfully!
                </h3>
                <p style={{ maxWidth: '520px', color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                  Your matrimonial profile has been received, auto-categorized into the appropriate tab ({formData.maritalStatus} {formData.gender === 'male' ? 'Groom' : 'Bride'}), and queued for Instagram publish on <strong>@nikah_bahrain</strong>.
                </p>
                <button
                  onClick={onClose}
                  className="btn-gold"
                  style={{ marginTop: '10px', padding: '10px 30px' }}
                >
                  View Profiles Feed
                </button>
              </div>
            ) : (
              <form onSubmit={handleDirectSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                  {/* Name */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--gold-light)', marginBottom: '6px', fontWeight: 600 }}>
                      Candidate Name / Nickname *
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="e.g. Bilal Ahmed"
                      value={formData.name}
                      onChange={handleInputChange}
                      style={inputStyle}
                    />
                  </div>

                  {/* Gender */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--gold-light)', marginBottom: '6px', fontWeight: 600 }}>
                      Gender / Candidate Type *
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      style={inputStyle}
                    >
                      <option value="male" style={{ background: '#091930' }}>Groom (Male)</option>
                      <option value="female" style={{ background: '#091930' }}>Bride (Female)</option>
                    </select>
                  </div>

                  {/* Marital Status */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--gold-light)', marginBottom: '6px', fontWeight: 600 }}>
                      Marital Status Label *
                    </label>
                    <select
                      name="maritalStatus"
                      value={formData.maritalStatus}
                      onChange={handleInputChange}
                      style={inputStyle}
                    >
                      <option value="Never Married" style={{ background: '#091930' }}>Never Married</option>
                      <option value="Divorced" style={{ background: '#091930' }}>Divorced</option>
                      <option value="Widowed" style={{ background: '#091930' }}>Widowed</option>
                    </select>
                  </div>

                  {/* Nationality */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--gold-light)', marginBottom: '6px', fontWeight: 600 }}>
                      Nationality Label *
                    </label>
                    <select
                      name="nationality"
                      value={formData.nationality}
                      onChange={handleInputChange}
                      style={inputStyle}
                    >
                      <option value="Pakistani" style={{ background: '#091930' }}>🇵🇰 Pakistani</option>
                      <option value="Indian" style={{ background: '#091930' }}>🇮🇳 Indian</option>
                      <option value="Bahraini" style={{ background: '#091930' }}>🇧🇭 Bahraini / GCC</option>
                    </select>
                  </div>

                  {/* Age */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--gold-light)', marginBottom: '6px', fontWeight: 600 }}>
                      Age (Years) *
                    </label>
                    <input
                      type="number"
                      name="age"
                      required
                      min="18"
                      max="75"
                      value={formData.age}
                      onChange={handleInputChange}
                      style={inputStyle}
                    />
                  </div>

                  {/* Height */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--gold-light)', marginBottom: '6px', fontWeight: 600 }}>
                      Height *
                    </label>
                    <input
                      type="text"
                      name="height"
                      placeholder="e.g. 5'10&quot;"
                      value={formData.height}
                      onChange={handleInputChange}
                      style={inputStyle}
                    />
                  </div>

                  {/* Sect */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--gold-light)', marginBottom: '6px', fontWeight: 600 }}>
                      Sect
                    </label>
                    <input
                      type="text"
                      name="sect"
                      placeholder="e.g. Sunni / Hanafi / Ahle Hadith"
                      value={formData.sect}
                      onChange={handleInputChange}
                      style={inputStyle}
                    />
                  </div>

                  {/* Caste */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--gold-light)', marginBottom: '6px', fontWeight: 600 }}>
                      Caste
                    </label>
                    <input
                      type="text"
                      name="caste"
                      placeholder="e.g. Arain / Syed / Sheikh / Malik"
                      value={formData.caste}
                      onChange={handleInputChange}
                      style={inputStyle}
                    />
                  </div>

                  {/* Languages */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--gold-light)', marginBottom: '6px', fontWeight: 600 }}>
                      Languages Spoken
                    </label>
                    <input
                      type="text"
                      name="languages"
                      placeholder="e.g. English, Urdu, Punjabi, Arabic"
                      value={formData.languages}
                      onChange={handleInputChange}
                      style={inputStyle}
                    />
                  </div>

                  {/* Siblings */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--gold-light)', marginBottom: '6px', fontWeight: 600 }}>
                      Siblings Details (Instagram Label) *
                    </label>
                    <input
                      type="text"
                      name="siblings"
                      placeholder="e.g. 2 brothers (1 married), 1 sister"
                      value={formData.siblings}
                      onChange={handleInputChange}
                      style={inputStyle}
                    />
                  </div>

                  {/* Father's Details */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--gold-light)', marginBottom: '6px', fontWeight: 600 }}>
                      Father's Name & Occupation
                    </label>
                    <input
                      type="text"
                      name="father"
                      placeholder="e.g. Businessman in Bahrain / Retired Officer"
                      value={formData.father}
                      onChange={handleInputChange}
                      style={inputStyle}
                    />
                  </div>

                  {/* Mother's Details */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--gold-light)', marginBottom: '6px', fontWeight: 600 }}>
                      Mother's Occupation
                    </label>
                    <input
                      type="text"
                      name="mother"
                      placeholder="e.g. Homemaker / Educator"
                      value={formData.mother}
                      onChange={handleInputChange}
                      style={inputStyle}
                    />
                  </div>

                  {/* Profession */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--gold-light)', marginBottom: '6px', fontWeight: 600 }}>
                      Profession / Job Title *
                    </label>
                    <input
                      type="text"
                      name="profession"
                      required
                      placeholder="e.g. Software Engineer / Accountant"
                      value={formData.profession}
                      onChange={handleInputChange}
                      style={inputStyle}
                    />
                  </div>

                  {/* Education */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--gold-light)', marginBottom: '6px', fontWeight: 600 }}>
                      Education Degree *
                    </label>
                    <input
                      type="text"
                      name="education"
                      required
                      placeholder="e.g. Master's in Computer Science"
                      value={formData.education}
                      onChange={handleInputChange}
                      style={inputStyle}
                    />
                  </div>

                  {/* Location in Bahrain */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--gold-light)', marginBottom: '6px', fontWeight: 600 }}>
                      Current City / Location *
                    </label>
                    <input
                      type="text"
                      name="location"
                      required
                      placeholder="e.g. Juffair, Manama, Bahrain"
                      value={formData.location}
                      onChange={handleInputChange}
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* About Bio */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--gold-light)', marginBottom: '6px', fontWeight: 600 }}>
                    About Candidate & Family Background *
                  </label>
                  <textarea
                    name="about"
                    required
                    rows={3}
                    placeholder="Describe religious values, prayer habits, family setup, and hobbies..."
                    value={formData.about}
                    onChange={handleInputChange}
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>

                {/* Partner Requirements */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--gold-light)', marginBottom: '6px', fontWeight: 600 }}>
                    Partner Preferences & Expectations *
                  </label>
                  <textarea
                    name="requirements"
                    required
                    rows={3}
                    placeholder="State desired qualities, age range, education, and Deen mindset..."
                    value={formData.requirements}
                    onChange={handleInputChange}
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn-ghost"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-gold"
                    style={{ padding: '12px 30px', fontSize: '0.92rem' }}
                  >
                    <Send size={16} />
                    <span>{submitting ? 'Submitting...' : 'Submit Matrimonial Profile'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </animated.div>
    </animated.div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 'var(--radius-md)',
  background: 'rgba(5, 12, 22, 0.7)',
  border: '1px solid var(--gold-border)',
  color: '#ffffff',
  fontSize: '0.85rem',
  fontFamily: 'var(--font-sans)',
  outline: 'none',
  boxSizing: 'border-box'
};
