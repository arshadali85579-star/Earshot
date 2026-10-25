import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { CinematicWorld } from './components/CinematicWorld';
import { HeroOverlay } from './components/HeroOverlay';
import { WorldThumbnailNavigation } from './components/WorldThumbnailNavigation';
import { CouriersMeter } from './components/CouriersMeter';
import { InteractiveModals } from './components/InteractiveModals';
import { soundEngine } from './utils/audio';
import { WORLDS } from './data/worlds';
import type { VideoQuality } from './types';

// Adaptive initial quality detection based on device capability, network hints, and preferences
const detectOptimalQuality = (): VideoQuality => {
  if (typeof window === 'undefined') return 'qhd';

  try {
    const saved = localStorage.getItem('earshot_video_quality') as VideoQuality;
    if (saved && ['4k', 'qhd', 'fhd'].includes(saved)) {
      return saved;
    }
  } catch {
    // Storage access restricted
  }

  // Check network constraints (optional browser API)
  const nav = navigator as unknown as {
    connection?: { saveData?: boolean; effectiveType?: string };
  };
  if (nav.connection?.saveData) {
    return 'fhd';
  }
  if (nav.connection?.effectiveType && ['slow-2g', '2g', '3g'].includes(nav.connection.effectiveType)) {
    return 'fhd';
  }

  // Screen resolution inspection
  const pixelWidth = window.innerWidth * (window.devicePixelRatio || 1);
  if (pixelWidth > 2560 && (!nav.connection?.effectiveType || nav.connection.effectiveType === '4g')) {
    return '4k';
  }
  if (pixelWidth > 1400) {
    return 'qhd';
  }
  return 'fhd';
};

export const App: React.FC = () => {
  const [currentWorldId, setCurrentWorldId] = useState<number>(1);
  const [scrollProgress, setScrollProgress] = useState<number>(0);

  // Check prefers-reduced-motion for initial auto-run state
  const [isAutoRunning, setIsAutoRunning] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return false;
    }
    return true;
  });

  const [isUserScrubbing, setIsUserScrubbing] = useState<boolean>(false);
  const [videoQuality, setVideoQuality] = useState<VideoQuality>(detectOptimalQuality);
  const [activeModal, setActiveModal] = useState<'start' | 'kit' | 'route' | 'relay' | 'play' | 'menu' | null>(null);

  const scrubTimeoutRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const activeWorldConfig = WORLDS.find((w) => w.id === currentWorldId) || WORLDS[0];

  // Save quality preference
  const handleQualityChange = useCallback((newQuality: VideoQuality) => {
    setVideoQuality(newQuality);
    try {
      localStorage.setItem('earshot_video_quality', newQuality);
    } catch {
      // Storage access restricted
    }
  }, []);

  // Jump to specific world
  const navigateToWorld = useCallback((worldId: number) => {
    setIsUserScrubbing(true);
    let targetRatio = 0.05;
    if (worldId === 2) targetRatio = 0.38;
    if (worldId === 3) targetRatio = 0.68;
    if (worldId === 4) targetRatio = 0.95;

    setScrollProgress(targetRatio);
    setCurrentWorldId(worldId);
    soundEngine.setWorld(worldId);

    if (scrubTimeoutRef.current !== null) {
      window.clearTimeout(scrubTimeoutRef.current);
    }
    scrubTimeoutRef.current = window.setTimeout(() => {
      setIsUserScrubbing(false);
    }, 400);
  }, []);

  // Wheel listener for scrubbing
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (activeModal) return;

      setIsUserScrubbing(true);

      setScrollProgress((prev) => {
        const delta = e.deltaY * 0.00045;
        const next = Math.max(0, Math.min(1, prev + delta));

        let activeId = 1;
        if (next < 0.25) activeId = 1;
        else if (next < 0.55) activeId = 2;
        else if (next < 0.8) activeId = 3;
        else activeId = 4;

        if (activeId !== currentWorldId) {
          setCurrentWorldId(activeId);
          soundEngine.setWorld(activeId);
        }
        return next;
      });

      if (scrubTimeoutRef.current !== null) {
        window.clearTimeout(scrubTimeoutRef.current);
      }
      scrubTimeoutRef.current = window.setTimeout(() => {
        setIsUserScrubbing(false);
      }, 500);
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => {
      window.removeEventListener('wheel', handleWheel);
      if (scrubTimeoutRef.current !== null) {
        window.clearTimeout(scrubTimeoutRef.current);
      }
    };
  }, [activeModal, currentWorldId]);

  // Touch gesture support for mobile swiping
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        touchStartYRef.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (activeModal || touchStartYRef.current === null || e.touches.length === 0) return;
      const currentY = e.touches[0].clientY;
      const diffY = touchStartYRef.current - currentY;
      touchStartYRef.current = currentY;

      setIsUserScrubbing(true);
      setScrollProgress((prev) => {
        const delta = diffY * 0.0015;
        const next = Math.max(0, Math.min(1, prev + delta));

        let activeId = 1;
        if (next < 0.25) activeId = 1;
        else if (next < 0.55) activeId = 2;
        else if (next < 0.8) activeId = 3;
        else activeId = 4;

        if (activeId !== currentWorldId) {
          setCurrentWorldId(activeId);
          soundEngine.setWorld(activeId);
        }
        return next;
      });

      if (scrubTimeoutRef.current !== null) {
        window.clearTimeout(scrubTimeoutRef.current);
      }
      scrubTimeoutRef.current = window.setTimeout(() => {
        setIsUserScrubbing(false);
      }, 500);
    };

    const handleTouchEnd = () => {
      touchStartYRef.current = null;
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [activeModal, currentWorldId]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeModal && e.key === 'Escape') {
        setActiveModal(null);
        return;
      }
      if (['1', '2', '3', '4'].includes(e.key)) {
        navigateToWorld(parseInt(e.key, 10));
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        const next = Math.min(4, currentWorldId + 1);
        navigateToWorld(next);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        const prevId = Math.max(1, currentWorldId - 1);
        navigateToWorld(prevId);
      } else if (e.code === 'Space' && !activeModal) {
        // Prevent default only when target is not a button
        if (!(e.target instanceof HTMLButtonElement)) {
          e.preventDefault();
          setIsAutoRunning((prev) => !prev);
        }
      } else if (e.key === 'm' || e.key === 'M') {
        soundEngine.toggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModal, currentWorldId, navigateToWorld]);

  return (
    <div className="earshot-app-root">
      {/* Screen Reader Live Region for World Changes */}
      <div className="sr-only" role="status" aria-live="polite">
        Current World: {activeWorldConfig.headlineTop} {activeWorldConfig.headlineBottom}
      </div>

      {/* Main Landmark Container */}
      <main id="main-content" className="fullscreen-viewport" tabIndex={-1}>
        {/* Background Cinematic Fox Runner & Environments */}
        <CinematicWorld
          currentWorldId={currentWorldId}
          scrollProgress={scrollProgress}
          isAutoRunning={isAutoRunning}
          isUserScrubbing={isUserScrubbing}
          videoQuality={videoQuality}
          onWorldChange={(id) => {
            setCurrentWorldId(id);
            soundEngine.setWorld(id);
          }}
          onFallbackQuality={(q) => handleQualityChange(q)}
        />

        {/* Floating Top Navigation */}
        <Navbar
          currentWorldId={currentWorldId}
          videoQuality={videoQuality}
          onChangeVideoQuality={handleQualityChange}
          onNavigateToWorld={navigateToWorld}
          isAutoRunning={isAutoRunning}
          onToggleAutoRun={() => setIsAutoRunning((prev) => !prev)}
          onOpenModal={(type) => setActiveModal(type)}
        />

        {/* Hero Editorial Headlines & CTAs */}
        <HeroOverlay
          currentWorldId={currentWorldId}
          onOpenModal={(type) => setActiveModal(type)}
        />

        {/* Bottom Floating World Thumbnails */}
        <WorldThumbnailNavigation
          currentWorldId={currentWorldId}
          onSelectWorld={navigateToWorld}
        />

        {/* Bottom Right Live Couriers Meter */}
        <CouriersMeter />
      </main>

      {/* Interactive Feature Modals & Drawers */}
      <InteractiveModals
        modalType={activeModal}
        currentWorldId={currentWorldId}
        onClose={() => setActiveModal(null)}
        onSelectWorld={navigateToWorld}
      />
    </div>
  );
};

export default App;
