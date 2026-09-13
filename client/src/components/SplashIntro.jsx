import React, { useState } from 'react';
import { useSpring, animated, config } from '@react-spring/web';
import { Sparkles, ArrowDown, Heart, ShieldCheck } from '../icons';
import logoImg from '../assets/logo.jpg';

export default function SplashIntro({ onEnter, isVisible = true }) {
  const [isExiting, setIsExiting] = useState(false);

  // Auto-slide into portal after 2.8s preview or immediate click
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
    }, 2800);
    return () => clearTimeout(timer);
  }, []);

  // Logo spring animation: dramatic 3D pop, subtle float and glow
  const logoSpring = useSpring({
    from: { opacity: 0, transform: 'scale(0.7) rotate(-6deg)', filter: 'drop-shadow(0 0 0px rgba(212,175,55,0))' },
    to: { 
      opacity: 1, 
      transform: isExiting ? 'scale(1.2) translateY(-80px)' : 'scale(1) rotate(0deg)',
      filter: 'drop-shadow(0 20px 40px rgba(212,175,55,0.45))'
    },
    config: { tension: 140, friction: 18 }
  });

  // Content fade in and spring trail
  const textSpring = useSpring({
    from: { opacity: 0, transform: 'translateY(30px)' },
    to: { 
      opacity: isExiting ? 0 : 1, 
      transform: isExiting ? 'translateY(-40px)' : 'translateY(0px)' 
    },
    delay: 300,
    config: config.gentle
  });

  // Screen sliding spring: smooth curtain reveal sliding upward
  const screenSlide = useSpring({
    transform: isExiting ? 'translateY(-100%)' : 'translateY(0%)',
    opacity: isExiting ? 0.4 : 1,
    config: { tension: 160, friction: 24 },
    onRest: () => {
      if (isExiting && onEnter) {
        onEnter();
      }
    }
  });

  const handleSlideEnter = () => {
    setIsExiting(true);
  };

  if (!isVisible && !isExiting) return null;

  return (
    <animated.div
      style={{
        ...screenSlide,
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'radial-gradient(circle at 50% 30%, #0d213e 0%, #061122 55%, #030812 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        overflow: 'hidden'
      }}
    >
      {/* Background ambient lighting effects */}
      <div 
        style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '550px',
          height: '550px',
          background: 'radial-gradient(circle, rgba(212, 175, 55, 0.18) 0%, rgba(27, 75, 138, 0.12) 40%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(50px)',
          pointerEvents: 'none'
        }}
      />

      {/* Islamic Calligraphy Top Note */}
      <animated.div 
        style={{
          ...textSpring,
          textAlign: 'center',
          marginBottom: '16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <p 
          className="font-arabic"
          style={{
            fontSize: '1.75rem',
            color: 'var(--gold-light)',
            letterSpacing: '1px',
            textShadow: '0 0 16px rgba(212, 175, 55, 0.5)'
          }}
        >
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </p>
        <span 
          style={{
            fontSize: '0.75rem',
            letterSpacing: '3px',
            textTransform: 'uppercase',
            color: 'var(--gold-light)',
            opacity: 0.85,
            marginTop: '4px',
            fontWeight: 700
          }}
        >
          In the Name of Allah, the Most Gracious, the Most Merciful
        </span>
      </animated.div>

      {/* Uploaded 3D Gold & Sapphire Medallion Logo */}
      <animated.div
        style={{
          ...logoSpring,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          cursor: 'pointer'
        }}
        onClick={handleSlideEnter}
      >
        <div 
          style={{
            position: 'relative',
            width: '240px',
            height: '240px',
            borderRadius: '50%',
            padding: '6px',
            background: 'linear-gradient(135deg, #fae182 0%, #d4af37 40%, #b8860b 80%, #fae182 100%)',
            boxShadow: '0 0 45px rgba(212, 175, 55, 0.5), inset 0 0 20px rgba(0,0,0,0.5)',
            animation: 'pulseGlow 4s infinite ease-in-out'
          }}
        >
          <img
            src={logoImg}
            alt="Qabul Hai Logo"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '50%',
              display: 'block'
            }}
          />
        </div>
      </animated.div>

      {/* Quranic Matrimony Verse & Title */}
      <animated.div 
        style={{
          ...textSpring,
          textAlign: 'center',
          maxWidth: '680px',
          marginTop: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        <h1 
          className="font-cinzel gold-text-gradient"
          style={{
            fontSize: '2.5rem',
            fontWeight: 800,
            letterSpacing: '1px',
            lineHeight: 1.2
          }}
        >
          QABUL HAI
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="gold-badge">
            <ShieldCheck size={14} /> 100% Verified Matrimonial Services
          </span>
          <span className="gold-badge" style={{ background: 'rgba(59, 130, 246, 0.2)', borderColor: 'rgba(59, 130, 246, 0.4)', color: '#93c5fd' }}>
            <Heart size={13} fill="#93c5fd" /> Bahrain • GCC • Expats
          </span>
        </div>

        <p 
          className="font-arabic"
          style={{
            fontSize: '1.25rem',
            color: 'var(--gold-light)',
            marginTop: '8px',
            lineHeight: 1.7,
            opacity: 0.95
          }}
        >
          وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا لِّتَسْكُنُوا إِلَيْهَا وَجَعَلَ بَيْنَكُم مَّوَدَّةً وَرَحْمَةً
        </p>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', maxWidth: '560px', fontStyle: 'italic' }}>
          "And among His signs is that He created for you mates from among yourselves, that you may dwell in tranquility with them, and He has put love and mercy between your hearts."
        </p>
      </animated.div>

      {/* Slide / Enter Action with React-Spring */}
      <animated.div 
        style={{
          ...textSpring,
          marginTop: '28px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        <button
          onClick={handleSlideEnter}
          className="btn-gold"
          style={{
            padding: '14px 38px',
            fontSize: '1.05rem',
            letterSpacing: '1px',
            boxShadow: '0 8px 30px rgba(212, 175, 55, 0.45)'
          }}
        >
          <Sparkles size={18} />
          <span>ENTER MATRIMONIAL PORTAL</span>
          <ArrowDown size={18} style={{ transform: 'rotate(-90deg)' }} />
        </button>

        <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', letterSpacing: '0.5px' }}>
          Click to slide into verified proposals feed
        </span>
      </animated.div>
    </animated.div>
  );
}
