import React, { useState } from 'react';
import { WORLDS } from '../data/worlds';
import { soundEngine } from '../utils/audio';

interface WorldThumbnailNavigationProps {
  currentWorldId: number;
  onSelectWorld: (worldId: number) => void;
}

export const WorldThumbnailNavigation: React.FC<WorldThumbnailNavigationProps> = ({
  currentWorldId,
  onSelectWorld,
}) => {
  const [hoveredWorldId, setHoveredWorldId] = useState<number | null>(null);

  return (
    <div className="bottom-thumbnails-container" role="region" aria-label="World Selector">
      {/* Tooltip Card for Hovered or Current World */}
      {hoveredWorldId && (
        <div className="thumbnail-tooltip" role="tooltip">
          {(() => {
            const w = WORLDS.find((x) => x.id === hoveredWorldId);
            if (!w) return null;
            return (
              <>
                <div className="tooltip-title">
                  {w.headlineTop} {w.headlineBottom}
                </div>
                <div className="tooltip-meta">
                  <span>{w.stats.distance}</span>
                  <span className="tooltip-sep">•</span>
                  <span>{w.stats.terrain}</span>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* 4 Circular World Avatars */}
      <div className="thumbnails-row">
        {WORLDS.map((world) => {
          const isActive = world.id === currentWorldId;

          return (
            <button
              key={world.id}
              className={`world-thumb-btn ${isActive ? 'active' : ''}`}
              onClick={() => {
                soundEngine.playClick();
                onSelectWorld(world.id);
              }}
              onMouseEnter={() => {
                soundEngine.playHover();
                setHoveredWorldId(world.id);
              }}
              onMouseLeave={() => setHoveredWorldId(null)}
              onFocus={() => {
                soundEngine.playHover();
                setHoveredWorldId(world.id);
              }}
              onBlur={() => setHoveredWorldId(null)}
              aria-label={`Switch to World ${world.id}: ${world.headlineTop} ${world.headlineBottom}`}
              aria-current={isActive ? 'true' : 'false'}
            >
              {/* Active Outer Glowing Ring */}
              <div className="thumb-ring" />
              <span className="sr-only">{world.headlineTop} {world.headlineBottom}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
