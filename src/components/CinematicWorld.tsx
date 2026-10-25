import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { VideoQuality } from '../types';

interface CinematicWorldProps {
  currentWorldId: number;
  scrollProgress: number;
  isAutoRunning: boolean;
  isUserScrubbing: boolean;
  videoQuality?: VideoQuality;
  onWorldChange: (worldId: number) => void;
  onFallbackQuality?: (newQuality: VideoQuality) => void;
}

export const CinematicWorld: React.FC<CinematicWorldProps> = ({
  currentWorldId,
  scrollProgress,
  isAutoRunning,
  isUserScrubbing,
  videoQuality = '4k',
  onWorldChange,
  onFallbackQuality,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const prevQualityRef = useRef<VideoQuality>(videoQuality);
  const lastSeekTimeRef = useRef<number>(-1);
  const seekRafRef = useRef<number | null>(null);
  const currentWorldIdRef = useRef<number>(currentWorldId);
  useEffect(() => {
    currentWorldIdRef.current = currentWorldId;
  }, [currentWorldId]);

  const DURATION = 10.9;

  const getVideoSource = useCallback((quality: VideoQuality) => {
    switch (quality) {
      case '4k':
        return '/assets/earshot_4k.mp4';
      case 'qhd':
        return '/assets/earshot_qhd.mp4';
      case 'fhd':
      default:
        return '/assets/earshot_hero.mp4';
    }
  }, []);

  // Graceful fallback if video fails to load or decode
  const handleVideoError = () => {
    console.warn(`[CinematicWorld] Video failed to load for quality: ${videoQuality}. Falling back.`);
    if (videoQuality === '4k') {
      onFallbackQuality?.('qhd');
    } else if (videoQuality === 'qhd') {
      onFallbackQuality?.('fhd');
    }
  };

  // Initial autoplay with polite browser policy handling
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay policy prevented playback until user gesture
      });
    }
  }, []);

  // Dynamic quality switching with position preservation
  useEffect(() => {
    const video = videoRef.current;
    if (!video || prevQualityRef.current === videoQuality) return;
    prevQualityRef.current = videoQuality;

    const savedTime = video.currentTime;
    const wasPlaying = !video.paused;

    video.src = getVideoSource(videoQuality);
    video.load();

    const onLoadedMetadata = () => {
      video.currentTime = savedTime;
      if (wasPlaying || isAutoRunning) {
        video.play().catch(() => {});
      }
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
    };

    video.addEventListener('loadedmetadata', onLoadedMetadata, { once: true });
  }, [videoQuality, isAutoRunning, getVideoSource]);

  // Coalesced seeking during user scrubbing (prevents frame drops and layout thrashing)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isUserScrubbing) {
      if (!video.paused) video.pause();
      const targetTime = Math.max(0, Math.min(DURATION, scrollProgress * DURATION));

      // Skip seek if within ~1 frame duration (33ms)
      if (Math.abs(targetTime - lastSeekTimeRef.current) < 0.033) {
        return;
      }

      if (seekRafRef.current) cancelAnimationFrame(seekRafRef.current);
      seekRafRef.current = requestAnimationFrame(() => {
        lastSeekTimeRef.current = targetTime;
        if ('fastSeek' in video && typeof (video as unknown as { fastSeek: (t: number) => void }).fastSeek === 'function') {
          (video as unknown as { fastSeek: (t: number) => void }).fastSeek(targetTime);
        } else {
          video.currentTime = targetTime;
        }
      });
    } else {
      if (seekRafRef.current) {
        cancelAnimationFrame(seekRafRef.current);
        seekRafRef.current = null;
      }
      if (video.paused && isAutoRunning) {
        video.play().catch(() => {});
      }
    }

    return () => {
      if (seekRafRef.current) {
        cancelAnimationFrame(seekRafRef.current);
        seekRafRef.current = null;
      }
    };
  }, [scrollProgress, isUserScrubbing, isAutoRunning]);

  // Video timeupdate: only update React state when active world ACTUALLY changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let lastActiveWorld = currentWorldIdRef.current;

    const onTimeUpdate = () => {
      if (isUserScrubbing) return;
      const t = video.currentTime;

      let activeId = 1;
      if (t < 2.6) activeId = 1;
      else if (t < 5.8) activeId = 2;
      else if (t < 8.6) activeId = 3;
      else activeId = 4;

      if (activeId !== lastActiveWorld) {
        lastActiveWorld = activeId;
        onWorldChange(activeId);
      }
    };

    const onEnded = () => {
      video.currentTime = 0;
      video.play().catch(() => {});
      onWorldChange(1);
    };

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('ended', onEnded);

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('ended', onEnded);
    };
  }, [isUserScrubbing, onWorldChange]);

  // Ambient Particles with prefers-reduced-motion check
  useEffect(() => {
    const prefersReducedMotion = typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const canvas = canvasRef.current;
    if (!canvas || prefersReducedMotion) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let isMounted = true;

    const resizeCanvas = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas, { passive: true });

    interface Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
      glow: boolean;
    }

    const count = 24;
    const particles: Particle[] = [];

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 2 + 1,
        speedX: (Math.random() - 0.5) * 0.8,
        speedY: Math.random() * 0.8 + 0.3,
        opacity: Math.random() * 0.5 + 0.15,
        glow: Math.random() > 0.7,
      });
    }

    const render = () => {
      if (!isMounted) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let primaryColor = 'rgba(255, 235, 245, ';
      let windSpeed = 1.0;

      if (currentWorldId === 2) {
        primaryColor = 'rgba(255, 220, 150, ';
        windSpeed = 1.3;
      } else if (currentWorldId === 3) {
        primaryColor = 'rgba(170, 245, 255, ';
        windSpeed = 1.6;
      } else if (currentWorldId === 4) {
        primaryColor = 'rgba(190, 225, 255, ';
        windSpeed = 0.8;
      }

      particles.forEach((p) => {
        p.x += p.speedX * windSpeed;
        p.y -= p.speedY;

        if (p.y < 0) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = primaryColor + p.opacity + ')';
        ctx.fill();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      isMounted = false;
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [currentWorldId]);

  return (
    <div className="cinematic-world-viewport" aria-hidden="true">
      {/* Edge-to-edge cinematic video with adaptive loading */}
      <video
        ref={videoRef}
        className={`hero-video-media ${isVideoReady ? 'loaded' : ''}`}
        autoPlay
        playsInline
        muted
        loop
        preload="metadata"
        poster="/assets/poster_1.jpg"
        src={getVideoSource(videoQuality)}
        onCanPlay={() => setIsVideoReady(true)}
        onError={handleVideoError}
      />

      {/* Ambient Particle Canvas Overlay */}
      <canvas ref={canvasRef} className="ambient-particles-canvas" />
    </div>
  );
};
