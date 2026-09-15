import React, { useState, useEffect, useRef } from 'react';
import { useSpring, animated, config } from '@react-spring/web';
import { Heart, ShieldCheck } from '../icons';
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
        padding: '20px 16px',
        overflowY: 'auto',
        overflowX: 'hidden',
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
          top: '14px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '5px',
          opacity: 0.8,
          pointerEvents: 'none'
        }}
      >
        <div style={{
          width: '36px',
          height: '4px',
          borderRadius: '2px',
          background: 'var(--gold-primary)'
        }} />
        <span style={{ fontSize: '0.68rem', color: 'var(--text-gold)', letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 700 }}>
          Swipe up or click to enter
        </span>
      </div>

      {/* Background ambient glow */}
      <div
        style={{
          position: 'absolute',
          top: '25%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(450px, 90vw)',
          height: 'min(450px, 90vw)',
          background: 'radial-gradient(circle, rgba(196, 155, 31, 0.12) 0%, rgba(35, 93, 70, 0.05) 50%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(40px)',
          pointerEvents: 'none'
        }}
      />

      {/* Islamic Calligraphy */}
      <animated.div
        style={{
          ...textSpring,
          textAlign: 'center',
          marginBottom: '12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          maxWidth: '560px',
          padding: '0 8px'
        }}
      >
        <p
          className="font-arabic"
          style={{
            fontSize: 'clamp(1.25rem, 5vw, 1.85rem)',
            color: 'var(--gold-primary)',
            letterSpacing: '0.5px',
            lineHeight: 1.4,
            wordBreak: 'break-word',
            width: '100%'
          }}
        >
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </p>
        <span
          style={{
            fontSize: 'clamp(0.65rem, 2.2vw, 0.78rem)',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            color: 'var(--text-gold)',
            marginTop: '3px',
            fontWeight: 700,
            textAlign: 'center',
            wordBreak: 'break-word',
            width: '100%',
            lineHeight: 1.3
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
          cursor: 'pointer',
          margin: '4px 0'
        }}
        onClick={handleSlideEnter}
      >
        <div
          style={{
            position: 'relative',
            width: 'clamp(110px, 26vw, 170px)',
            height: 'clamp(110px, 26vw, 170px)',
            borderRadius: '50%',
            padding: '4px',
            background: 'linear-gradient(135deg, #fae182 0%, #c49b1f 45%, #a07810 85%, #fae182 100%)',
            boxShadow: '0 8px 30px rgba(196, 155, 31, 0.35)',
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
          maxWidth: '600px',
          width: '100%',
          marginTop: '12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          padding: '0 12px'
        }}
      >
        <h1
          className="font-cinzel gold-text-gradient"
          style={{
            fontSize: 'clamp(1.5rem, 6vw, 2.2rem)',
            fontWeight: 800,
            letterSpacing: '1px',
            lineHeight: 1.2
          }}
        >
          Welcome to Qabul Hai
        </h1>


      </animated.div>

      {/* Enter Button & Progress */}
      
    </animated.div>
  );
}
