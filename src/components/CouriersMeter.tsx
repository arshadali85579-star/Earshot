import React, { useEffect, useState } from 'react';
import { soundEngine } from '../utils/audio';

export const CouriersMeter: React.FC = () => {
  const [couriersCount, setCouriersCount] = useState(2418520);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    // Random live runner fluctuation
    const interval = setInterval(() => {
      setCouriersCount((prev) => prev + Math.floor(Math.random() * 7) + 1);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const formattedCount = (couriersCount / 1000000).toFixed(1) + 'M';

  return (
    <div
      className="couriers-meter-container"
      tabIndex={0}
      role="button"
      aria-haspopup="dialog"
      aria-expanded={showStats}
      aria-label={`${formattedCount} couriers currently running worldwide. Press Enter or Space to view breakdown.`}
      onMouseEnter={() => {
        soundEngine.playHover();
        setShowStats(true);
      }}
      onMouseLeave={() => setShowStats(false)}
      onFocus={() => {
        soundEngine.playHover();
        setShowStats(true);
      }}
      onBlur={() => setShowStats(false)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          soundEngine.playClick();
          setShowStats((prev) => !prev);
        }
      }}
    >
      {/* Live Breakdown Popover */}
      {showStats && (
        <div className="couriers-popover">
          <div className="popover-heading">LIVE RUNNERS</div>
          <div className="popover-row">
            <span>Mirage Miles</span>
            <strong>612,410</strong>
          </div>
          <div className="popover-row">
            <span>Pack Light</span>
            <strong>794,220</strong>
          </div>
          <div className="popover-row">
            <span>Tide Runs</span>
            <strong>548,190</strong>
          </div>
          <div className="popover-row">
            <span>Aurora Relay</span>
            <strong>463,700</strong>
          </div>
          <div className="popover-total">
            <span>Total Active</span>
            <span className="live-dot" />
            <strong>{couriersCount.toLocaleString()}</strong>
          </div>
        </div>
      )}

      {/* Interactive Speedometer Hotspot over video's 2.4M dial */}
      <div className="meter-dial-wrapper hotspot-dial">
        <span className="meter-hotspot-glow" />
      </div>
    </div>
  );
};
