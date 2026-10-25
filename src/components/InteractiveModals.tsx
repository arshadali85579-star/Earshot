import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Zap,
  ChevronRight,
  CheckCircle2,
  Gamepad2,
  Keyboard,
} from 'lucide-react';
import { WORLDS } from '../data/worlds';
import { soundEngine } from '../utils/audio';

interface InteractiveModalsProps {
  modalType: 'start' | 'kit' | 'route' | 'relay' | 'play' | 'menu' | null;
  currentWorldId: number;
  onClose: () => void;
  onSelectWorld: (worldId: number) => void;
}

export const InteractiveModals: React.FC<InteractiveModalsProps> = ({
  modalType,
  currentWorldId,
  onClose,
  onSelectWorld,
}) => {
  const [selectedKitIndex, setSelectedKitIndex] = useState(0);
  const [hasStartedSprint, setHasStartedSprint] = useState(false);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const lastActiveElementRef = useRef<HTMLElement | null>(null);

  // Focus trap and accessibility management
  useEffect(() => {
    if (!modalType) return;

    lastActiveElementRef.current = document.activeElement as HTMLElement;

    // Focus the first focusable element or close button
    const timer = setTimeout(() => {
      if (modalRef.current) {
        const focusables = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length > 0) {
          focusables[0].focus();
        }
      }
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        soundEngine.playClick();
        onClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = Array.from(
          modalRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        );

        if (focusableElements.length === 0) return;

        const firstEl = focusableElements[0];
        const lastEl = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstEl) {
            e.preventDefault();
            lastEl.focus();
          }
        } else {
          if (document.activeElement === lastEl) {
            e.preventDefault();
            firstEl.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
      // Restore focus to trigger element
      if (lastActiveElementRef.current && typeof lastActiveElementRef.current.focus === 'function') {
        lastActiveElementRef.current.focus();
      }
    };
  }, [modalType, onClose]);

  if (!modalType) return null;

  const currentWorld = WORLDS.find((w) => w.id === currentWorldId) || WORLDS[0];

  const handleClose = () => {
    soundEngine.playClick();
    onClose();
  };

  return (
    <div
      className="modal-backdrop"
      onClick={handleClose}
      role="presentation"
    >
      <div
        ref={modalRef}
        className={`modal-window modal-${modalType}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-dialog-title"
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-header-badge">
            <span className="modal-badge-dot" />
            <span>EARSHOT PROTOCOL</span>
          </div>
          <button className="modal-close-btn" onClick={handleClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        {/* 1. START RUNNING MODAL */}
        {modalType === 'start' && (
          <div className="modal-body start-modal-body">
            <div className="modal-hero-icon" aria-hidden="true">
              <Zap size={32} />
            </div>
            <h2 id="modal-dialog-title" className="modal-title">LAUNCH COURIER SPRINT</h2>
            <p className="modal-subtitle">
              Ready to sprint across <strong>{currentWorld.headlineTop} {currentWorld.headlineBottom}</strong>?
              Sync your stride pace with 2.4M runners worldwide.
            </p>

            <div className="world-telemetry-grid">
              <div className="telemetry-card">
                <span className="telemetry-label">ROUTE DISTANCE</span>
                <span className="telemetry-val">{currentWorld.stats.distance}</span>
              </div>
              <div className="telemetry-card">
                <span className="telemetry-label">ELEVATION</span>
                <span className="telemetry-val">{currentWorld.stats.elevation}</span>
              </div>
              <div className="telemetry-card">
                <span className="telemetry-label">SURFACE TEMP</span>
                <span className="telemetry-val">{currentWorld.stats.temperature}</span>
              </div>
              <div className="telemetry-card">
                <span className="telemetry-label">SURFACE TYPE</span>
                <span className="telemetry-val">{currentWorld.stats.terrain}</span>
              </div>
            </div>

            {hasStartedSprint ? (
              <div className="sprint-active-banner">
                <CheckCircle2 size={24} className="banner-icon" />
                <div>
                  <strong>COURIER DISPATCHED</strong>
                  <p>Cadence locked at 168 SPM. Tail aerodynamics optimal.</p>
                </div>
              </div>
            ) : (
              <button
                className="modal-action-btn primary"
                onClick={() => {
                  soundEngine.playWhoosh();
                  setHasStartedSprint(true);
                }}
              >
                Initiate Run (168 SPM)
              </button>
            )}
          </div>
        )}

        {/* 2. COURIER KIT DRAWER */}
        {modalType === 'kit' && (
          <div className="modal-body kit-modal-body">
            <h2 id="modal-dialog-title" className="modal-title">COURIER LOADOUT & KIT</h2>
            <p className="modal-subtitle">
              Equip season gear calibrated for maximum endurance across changing terrains.
            </p>

            {/* Gear Selector Tabs */}
            <div className="kit-item-tabs">
              {[
                { name: 'Aero Satchel', weight: '340g', perk: '+14% Tail Stability' },
                { name: 'Puffer Vest', weight: '210g', perk: 'Thermal Insulation -10°C' },
                { name: 'Dust-Proof Soles', weight: '180g', perk: '+28% Traction on Salt/Ice' },
                { name: 'Horizon Goggles', weight: '65g', perk: 'UV-Glaze Polarization' },
              ].map((item, idx) => (
                <button
                  key={item.name}
                  className={`kit-tab ${selectedKitIndex === idx ? 'active' : ''}`}
                  onClick={() => {
                    soundEngine.playClick();
                    setSelectedKitIndex(idx);
                  }}
                >
                  <div className="tab-name">{item.name}</div>
                  <div className="tab-perk">{item.perk}</div>
                </button>
              ))}
            </div>

            <div className="kit-preview-box">
              <div className="kit-stat-row">
                <span>Gear Weight</span>
                <strong>{[ '340g', '210g', '180g', '65g' ][selectedKitIndex]}</strong>
              </div>
              <div className="kit-stat-row">
                <span>Durability</span>
                <strong>Grade AAA Reinforced Nylon</strong>
              </div>
              <div className="kit-stat-row">
                <span>Status</span>
                <span className="kit-equipped-badge">EQUIPPED ON RUNNER</span>
              </div>
            </div>

            <button className="modal-action-btn" onClick={handleClose}>
              Confirm Loadout
            </button>
          </div>
        )}

        {/* 3. DAILY ROUTE MODAL */}
        {modalType === 'route' && (
          <div className="modal-body route-modal-body">
            <h2 id="modal-dialog-title" className="modal-title">DAILY ROUTE: CAUSEWAY RUN</h2>
            <p className="modal-subtitle">
              Low tide window is open for the next <strong>3 Hours 42 Mins</strong>.
            </p>

            <div className="route-stages-list">
              <div className="route-stage active">
                <div className="stage-num">01</div>
                <div className="stage-info">
                  <strong>Salt Lagoon Crossing</strong>
                  <span>Mile 0.0 - 4.2 • Mirrored Flats</span>
                </div>
                <span className="stage-status">CLEARED</span>
              </div>
              <div className="route-stage active">
                <div className="stage-num">02</div>
                <div className="stage-info">
                  <strong>Village Cobblestone Pass</strong>
                  <span>Mile 4.2 - 10.5 • Sunlit Incline</span>
                </div>
                <span className="stage-status">ACTIVE</span>
              </div>
              <div className="route-stage">
                <div className="stage-num">03</div>
                <div className="stage-info">
                  <strong>Ocean Causeway Gateway</strong>
                  <span>Mile 10.5 - 18.0 • High Wave Risk</span>
                </div>
                <span className="stage-status">UPCOMING</span>
              </div>
              <div className="route-stage">
                <div className="stage-num">04</div>
                <div className="stage-info">
                  <strong>Aurora Glacier Sprint</strong>
                  <span>Mile 18.0 - 26.8 • Sub-Zero Finale</span>
                </div>
                <span className="stage-status">LOCKED</span>
              </div>
            </div>

            <button className="modal-action-btn" onClick={handleClose}>
              View Live Checkpoints
            </button>
          </div>
        )}

        {/* 4. NIGHT LEAGUE MODAL */}
        {modalType === 'relay' && (
          <div className="modal-body relay-modal-body">
            <h2 id="modal-dialog-title" className="modal-title">AURORA NIGHT LEAGUE</h2>
            <p className="modal-subtitle">
              Pass the baton across worlds under the celestial glow. 4-courier squads compete for fastest transit.
            </p>

            <div className="league-standings">
              <div className="standing-row header">
                <span>RANK</span>
                <span>SQUAD</span>
                <span>SPLIT TIME</span>
                <span>STATUS</span>
              </div>
              <div className="standing-row gold">
                <span>#01</span>
                <span>Fen-Squad Alpha</span>
                <span>42:19.4</span>
                <span className="status-tag live">LIVE</span>
              </div>
              <div className="standing-row silver">
                <span>#02</span>
                <span>Salt Strider 9</span>
                <span>43:08.1</span>
                <span className="status-tag live">LIVE</span>
              </div>
              <div className="standing-row bronze">
                <span>#03</span>
                <span>Tide Breakers</span>
                <span>44:31.9</span>
                <span className="status-tag">FINISHED</span>
              </div>
            </div>

            <button
              className="modal-action-btn primary"
              onClick={() => {
                soundEngine.playWhoosh();
                handleClose();
              }}
            >
              Join Night Queue
            </button>
          </div>
        )}

        {/* 5. PLAY RUNNER DEMO */}
        {modalType === 'play' && (
          <div className="modal-body play-modal-body">
            <div className="modal-hero-icon" aria-hidden="true">
              <Gamepad2 size={36} />
            </div>
            <h2 id="modal-dialog-title" className="modal-title">COURIER RUNNER MODE</h2>
            <p className="modal-subtitle">
              Take the reins! Use the arrow keys or scroll wheel to steer through all 4 biomes.
            </p>

            <div className="game-controls-helper">
              <div className="control-item">
                <kbd>Scroll Down</kbd> <span>Sprint forward through worlds</span>
              </div>
              <div className="control-item">
                <kbd>Scroll Up</kbd> <span>Rewind route</span>
              </div>
              <div className="control-item">
                <kbd>1 - 4 Keys</kbd> <span>Instant warp to World 1 - 4</span>
              </div>
              <div className="control-item">
                <kbd>Spacebar</kbd> <span>Toggle Cinematic Auto-Run</span>
              </div>
            </div>

            <button
              className="modal-action-btn primary"
              onClick={handleClose}
            >
              Start Sprint Now
            </button>
          </div>
        )}

        {/* 6. FULL MENU DRAWER */}
        {modalType === 'menu' && (
          <div className="modal-body menu-modal-body">
            <h2 id="modal-dialog-title" className="modal-title">EXPLORE EARSHOT</h2>
            <div className="drawer-worlds-grid">
              {WORLDS.map((w) => (
                <button
                  key={w.id}
                  className={`drawer-world-card ${currentWorldId === w.id ? 'active' : ''}`}
                  onClick={() => {
                    soundEngine.playClick();
                    onSelectWorld(w.id);
                    onClose();
                  }}
                >
                  <img src={w.thumbnail} alt={w.headlineTop} />
                  <div className="card-info">
                    <strong>{w.headlineTop} {w.headlineBottom}</strong>
                    <span>{w.stats.terrain}</span>
                  </div>
                  <ChevronRight size={16} />
                </button>
              ))}
            </div>

            <div className="keyboard-shortcuts-drawer">
              <div className="shortcuts-title">
                <Keyboard size={14} /> <span>KEYBOARD NAVIGATION</span>
              </div>
              <p>Press <strong>1, 2, 3, 4</strong> to jump directly to any world. Press <strong>Space</strong> to toggle auto-run.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
