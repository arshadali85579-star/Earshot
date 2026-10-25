import React, { useState } from 'react';
import { Volume2, VolumeX, Play, Pause, Sparkles } from 'lucide-react';
import { soundEngine } from '../utils/audio';
import type { VideoQuality } from '../types';

interface NavbarProps {
  currentWorldId: number;
  videoQuality?: VideoQuality;
  onChangeVideoQuality?: (quality: VideoQuality) => void;
  onNavigateToWorld: (worldId: number) => void;
  isAutoRunning: boolean;
  onToggleAutoRun: () => void;
  onOpenModal: (modalType: 'start' | 'kit' | 'route' | 'relay' | 'play' | 'menu') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentWorldId,
  videoQuality = '4k',
  onChangeVideoQuality,
  onNavigateToWorld,
  isAutoRunning,
  onToggleAutoRun,
  onOpenModal,
}) => {
  const [isMuted, setIsMuted] = useState(true);

  const handleToggleSound = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  const handleCycleQuality = () => {
    soundEngine.playClick();
    if (!onChangeVideoQuality) return;
    if (videoQuality === '4k') onChangeVideoQuality('qhd');
    else if (videoQuality === 'qhd') onChangeVideoQuality('fhd');
    else onChangeVideoQuality('4k');
  };

  const navItems = [
    { label: 'Home', worldId: 1 },
    { label: 'Worlds', worldId: 1, action: () => onOpenModal('route') },
    { label: 'Kit', worldId: 2 },
    { label: 'Routes', worldId: 3 },
    { label: 'League', worldId: 4 },
    { label: 'Contact', action: () => onOpenModal('menu') },
  ];

  return (
    <header className="navbar-container" role="banner">
      {/* Brand Logo Hotspot over video's EARSHOT */}
      <button
        className="brand-logo-hotspot"
        onClick={() => {
          soundEngine.playClick();
          onNavigateToWorld(1);
        }}
        aria-label="Earshot Home — Mirage Miles"
        title="Earshot Home"
      >
        <span className="sr-only">EARSHOT Home</span>
      </button>

      {/* Floating Center Capsule Nav Hotspot */}
      <nav className="nav-capsule-hotspot" role="navigation" aria-label="World Biomes Navigation">
        {navItems.map((item) => {
          const isActive = item.worldId !== undefined && item.worldId === currentWorldId;
          return (
            <button
              key={item.label}
              className="nav-link-hotspot"
              onClick={() => {
                soundEngine.playClick();
                if (item.action) {
                  item.action();
                } else if (item.worldId) {
                  onNavigateToWorld(item.worldId);
                }
              }}
              onMouseEnter={() => soundEngine.playHover()}
              title={`Navigate to ${item.label}`}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="sr-only">{item.label}</span>
              <span className="link-hover-pill" />
            </button>
          );
        })}
      </nav>

      {/* Right Controls: Audio, Auto-Run, 4K Quality, Play Hotspot, Menu Hotspot */}
      <div className="nav-actions">
        {/* Procedural Audio Ambient Toggle */}
        <button
          className={`nav-icon-pill ${!isMuted ? 'active-audio' : ''}`}
          onClick={handleToggleSound}
          title={isMuted ? 'Unmute runner ambience & footsteps' : 'Mute sound'}
          aria-label={isMuted ? 'Unmute runner ambience & footsteps' : 'Mute sound'}
          aria-pressed={!isMuted}
        >
          {isMuted ? <VolumeX size={15} aria-hidden="true" /> : <Volume2 size={15} className="pulse-icon" aria-hidden="true" />}
        </button>

        {/* Auto-Run Toggle */}
        <button
          className={`nav-icon-pill ${isAutoRunning ? 'active-autorun' : ''}`}
          onClick={() => {
            soundEngine.playClick();
            onToggleAutoRun();
          }}
          title={isAutoRunning ? 'Pause auto-run sequence' : 'Start auto-run cinematic'}
          aria-label={isAutoRunning ? 'Pause cinematic auto-run' : 'Start cinematic auto-run'}
          aria-pressed={isAutoRunning}
        >
          {isAutoRunning ? <Pause size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}
        </button>

        {/* 4K Ultra HD Quality Switcher Badge */}
        <button
          className="nav-quality-pill"
          onClick={handleCycleQuality}
          title={`Active Video Stream: ${videoQuality.toUpperCase()} (Click to toggle 4K UHD / 1440p / 1080p)`}
          aria-label={`Toggle video resolution. Current: ${videoQuality.toUpperCase()}`}
          aria-haspopup="listbox"
        >
          <Sparkles size={12} className="quality-icon" aria-hidden="true" />
          <span className="quality-text">
            {videoQuality === '4k' ? '4K UHD' : videoQuality === 'qhd' ? '1440p' : '1080p'}
          </span>
        </button>

        {/* Play Hotspot over video's Play button */}
        <button
          className="play-hotspot-btn"
          onClick={() => {
            soundEngine.playClick();
            onOpenModal('play');
          }}
          onMouseEnter={() => soundEngine.playHover()}
          title="Play Game Demo"
          aria-label="Open Game Demo Controls dialog"
        >
          <span className="sr-only">Play</span>
          <span className="hotspot-glow-ring" />
        </button>

        {/* Circular Hamburger Menu Hotspot over video's Menu icon */}
        <button
          className="menu-hotspot-btn"
          onClick={() => {
            soundEngine.playClick();
            onOpenModal('menu');
          }}
          onMouseEnter={() => soundEngine.playHover()}
          title="Open Navigation Menu"
          aria-label="Open Navigation Menu"
          aria-haspopup="dialog"
        >
          <span className="sr-only">Menu</span>
          <span className="hotspot-glow-ring circle" />
        </button>
      </div>
    </header>
  );
};
