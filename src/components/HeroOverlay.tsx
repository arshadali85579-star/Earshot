import React from 'react';
import { WORLDS } from '../data/worlds';
import { soundEngine } from '../utils/audio';

interface HeroOverlayProps {
  currentWorldId: number;
  onOpenModal: (modalType: 'start' | 'kit' | 'route' | 'relay') => void;
}

export const HeroOverlay: React.FC<HeroOverlayProps> = ({
  currentWorldId,
  onOpenModal,
}) => {
  const currentWorld = WORLDS.find((w) => w.id === currentWorldId) || WORLDS[0];

  return (
    <div className="hero-overlay-container" aria-live="polite">
      {/* Accessible semantic heading for screen readers & SEO */}
      <div className="sr-only">
        <h1>{currentWorld.headlineTop} {currentWorld.headlineBottom}</h1>
        <p>{currentWorld.description.join(' ')}</p>
      </div>

      {/* Seamless Interactive Hotspot Pill positioned directly over the video's CTA button */}
      {WORLDS.map((world) => {
        const isCurrent = world.id === currentWorldId;

        return (
          <div
            key={world.id}
            className={`world-cta-anchor world-${world.id} ${
              isCurrent ? 'active-cta' : 'inactive-cta'
            }`}
            style={{ pointerEvents: isCurrent ? 'auto' : 'none' }}
            aria-hidden={!isCurrent}
          >
            <button
              className="hero-cta-hotspot"
              onClick={() => {
                soundEngine.playClick();
                onOpenModal(world.ctaAction);
              }}
              onMouseEnter={() => soundEngine.playHover()}
              aria-label={`${world.ctaText} — ${world.headlineTop} ${world.headlineBottom}`}
              title={`Click to open ${world.ctaText}`}
              tabIndex={isCurrent ? 0 : -1}
            >
              <span className="sr-only">{world.ctaText}</span>
              <span className="cta-hotspot-glow" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
