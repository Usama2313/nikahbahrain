import React, { useState, useEffect, useRef } from 'react';
import { useSpring, animated, config } from '@react-spring/web';
import { Sparkles, ArrowDown, Heart, ShieldCheck } from '../icons';
import logoImg from '../assets/logo.jpg';

const READING_DURATION_MS = 14000; // 14 seconds for comfortable reading

export default function SplashIntro({ onEnter, isVisible = true }) {
  const [isExiting, setIsExiting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [btnHovered, setBtnHovered] = useState(false);
  const [dragStartY, setDragStartY] = useState(null);
  const [dragDelta, setDragDelta] = useState(0);
  const startTimeRef = useRef(Date.now());
  const elapsedRef = useRef(0);

  // Comfortable reading timer with progress tracking and pause on hover
  useEffect(() => {
    if (!isVisible || isExiting) return;
    startTimeRef.current = Date.now() - elapsedRef.current;
    const interval = setInterval(() => {
      if (!isPaused) {
        const elapsed = Date.now() - startTimeRef.current;
        elapsedRef.current = elapsed;
        const pct = Math.min(100, (elapsed / READING_DURATION_MS) * 100);
        setProgress(pct);
        if (elapsed >= READING_DURATION_MS) {
          clearInterval(interval);
          setIsExiting(true);
        }
      } else {
        startTimeRef.current = Date.now() - elapsedRef.current;
      }
    }, 50);
    return () => clearInterval(interval);
  }, [isVisible, isExiting, isPaused]);

  // Logo spring
  const logoSpring = useSpring({
    from: { opacity: 0, transform: 'scale(0.7) rotate(-6deg)', filter: 'drop-shadow(0 0 0px rgba(212,175,55,0))' },
    to: {
      opacity: 1,
      transform: isExiting ? 'scale(1.2) translateY(-80px)' : 'scale(1) rotate(0deg)',
      filter: 'drop-shadow(0 20px 40px rgba(212,175,55,0.45))'
    },
    config: { tension: 140, friction: 18 }
  });

  // Content fade
  const textSpring = useSpring({
    from: { opacity: 0, transform: 'translateY(30px)' },
    to: {
      opacity: isExiting ? 0 : 1,
      transform: isExiting ? 'translateY(-40px)' : 'translateY(0px)'
    },
    delay: 300,
    config: config.gentle
  });

  // Screen sliding curtain — swipe up on drag OR instant on click
  const screenSlide = useSpring({
    transform: isExiting
      ? `translateY(-100%)`
      : dragDelta < 0
      ? `translateY(${dragDelta}px)`
      : 'translateY(0%)',
    opacity: isExiting ? 0.4 : 1,
    config: isExiting ? { tension: 180, friction: 22 } : { tension: 500, friction: 30 },
    onRest: () => {
      if (isExiting && onEnter) onEnter();
    }
  });

  // Button spring
  const enterBtnSpring = useSpring({
    transform: btnHovered ? 'translateY(-3px) scale(1.03)' : 'translateY(0px) scale(1)',
    boxShadow: btnHovered
      ? '0 12px 36px rgba(212, 175, 55, 0.65), 0 0 20px rgba(250, 225, 130, 0.4)'
      : '0 8px 30px rgba(212, 175, 55, 0.45)',
    config: { tension: 350, friction: 20 }
  });

  const handleSlideEnter = () => {
    if (!isExiting) setIsExiting(true);
  };

  // Touch / pointer drag-to-slide-up gesture
  const handlePointerDown = (e) => {
    setDragStartY(e.touches ? e.touches[0].clientY : e.clientY);
    setIsPaused(true);
  };

  const handlePointerMove = (e) => {
    if (dragStartY === null) return;
    const currentY = e.touches ? e.touches[0].clientY : e.clientY;
    const delta = currentY - dragStartY;
    if (delta < 0) setDragDelta(delta); // only allow dragging UP
  };

  const handlePointerUp = (e) => {
    if (dragStartY === null) return;
    const currentY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
    const totalDelta = currentY - dragStartY;
    if (totalDelta < -60) {
      // Swiped up far enough → trigger exit
      setIsExiting(true);
    } else {
      // Snap back
      setDragDelta(0);
      setIsPaused(false);
    }
    setDragStartY(null);
  };

  if (!isVisible && !isExiting) return null;

  const secondsRemaining = Math.max(0, Math.ceil((READING_DURATION_MS - elapsedRef.current) / 1000));

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
        overflow: 'hidden',
        touchAction: 'none',
        cursor: 'grab'
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handlePointerDown}
      onTouchMove={handlePointerMove}
      onTouchEnd={handlePointerUp}
      onMouseDown={handlePointerDown}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerUp}
    >
      {/* Swipe up hint bar at the top */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '6px',
          opacity: 0.6,
          pointerEvents: 'none'
        }}
      >
        <div style={{
          width: '40px',
          height: '4px',
          borderRadius: '2px',
          background: 'rgba(250, 225, 130, 0.5)'
        }} />
        <span style={{ fontSize: '0.7rem', color: 'var(--gold-light)', letterSpacing: '2px', textTransform: 'uppercase' }}>
          Swipe up or click to enter
        </span>
      </div>

      {/* Background ambient glow */}
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

      {/* Islamic Calligraphy */}
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
            fontSize: 'clamp(1.2rem, 4vw, 1.85rem)',
            color: 'var(--gold-light)',
            letterSpacing: '1px',
            textShadow: '0 0 18px rgba(212, 175, 55, 0.5)'
          }}
        >
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </p>
        <span
          style={{
            fontSize: 'clamp(0.6rem, 1.8vw, 0.75rem)',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            color: 'var(--gold-light)',
            opacity: 0.85,
            marginTop: '4px',
            fontWeight: 700,
            textAlign: 'center'
          }}
        >
          In the Name of Allah, the Most Gracious, the Most Merciful
        </span>
      </animated.div>

      {/* Logo — click fires slide */}
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
            width: 'clamp(140px, 30vw, 220px)',
            height: 'clamp(140px, 30vw, 220px)',
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

      {/* Title & Verse */}
      <animated.div
        style={{
          ...textSpring,
          textAlign: 'center',
          maxWidth: '680px',
          width: '100%',
          marginTop: '22px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px',
          padding: '0 12px'
        }}
      >
        <h1
          className="font-cinzel gold-text-gradient"
          style={{
            fontSize: 'clamp(1.6rem, 5vw, 2.4rem)',
            fontWeight: 800,
            letterSpacing: '1px',
            lineHeight: 1.2
          }}
        >
          QABUL HAI
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
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
            fontSize: 'clamp(0.95rem, 2.5vw, 1.25rem)',
            color: 'var(--gold-light)',
            marginTop: '6px',
            lineHeight: 1.7,
            opacity: 0.95
          }}
        >
          وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا لِّتَسْكُنُوا إِلَيْهَا وَجَعَلَ بَيْنَكُم مَّوَدَّةً وَرَحْمَةً
        </p>

        <p style={{ color: 'var(--text-muted)', fontSize: 'clamp(0.78rem, 2vw, 0.92rem)', maxWidth: '560px', fontStyle: 'italic', lineHeight: 1.6 }}>
          "And among His signs is that He created for you mates from among yourselves, that you may dwell in tranquility with them, and He has put love and mercy between your hearts."
        </p>
      </animated.div>

      {/* Enter Button & Progress */}
      <animated.div
        style={{
          ...textSpring,
          marginTop: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          width: '100%',
          maxWidth: '340px',
          padding: '0 16px'
        }}
      >
        <animated.button
          onClick={handleSlideEnter}
          className="btn-gold"
          style={{
            ...enterBtnSpring,
            padding: '14px 40px',
            fontSize: 'clamp(0.88rem, 2.5vw, 1.05rem)',
            letterSpacing: '1px',
            borderRadius: '9999px',
            cursor: 'pointer',
            width: '100%'
          }}
          onMouseEnter={() => setBtnHovered(true)}
          onMouseLeave={() => setBtnHovered(false)}
        >
          <Sparkles size={18} />
          <span>ENTER MATRIMONIAL PORTAL</span>
          <ArrowDown size={18} style={{ transform: 'rotate(-90deg)', transition: 'transform 0.2s ease' }} />
        </animated.button>

        {/* Progress Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', width: '100%', marginTop: '4px' }}>
          <div
            style={{
              width: '100%',
              height: '4px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '2px',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #d4af37, #fae182)',
                transition: 'width 0.1s linear',
                boxShadow: '0 0 8px rgba(250, 225, 130, 0.6)'
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', fontSize: '0.74rem', color: 'var(--text-dim)' }}>
            <span>
              {isPaused ? '⏸️ Reading paused' : `Auto-entering in ${secondsRemaining}s`}
            </span>
            <span style={{ color: 'var(--gold-light)', cursor: 'pointer' }} onClick={handleSlideEnter}>
              Tap to enter ➔
            </span>
          </div>
        </div>
      </animated.div>
    </animated.div>
  );
}
