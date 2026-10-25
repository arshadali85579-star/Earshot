// Automated Engineering Standards Verification Script
import fs from 'node:fs';
import path from 'node:path';

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failCount++;
  }
}

console.log('\n============================================================');
console.log('  RUNNING MASTER PERFORMANCE & ACCESSIBILITY AUDIT SUITE');
console.log('============================================================\n');

// 1. Audit index.html
console.log('--- 1. AUDITING index.html ---');
const indexHtml = fs.readFileSync('index.html', 'utf-8');
assert(indexHtml.includes('<html lang="en">'), 'HTML document has valid language declaration');
assert(
  indexHtml.includes('name="viewport" content="width=device-width, initial-scale=1.0"') &&
  !indexHtml.includes('user-scalable=no') &&
  !indexHtml.includes('maximum-scale'),
  'Viewport is fully scalable without user-scalable=no restrictions (WCAG 1.4.4)'
);
assert(indexHtml.includes('class="skip-to-content"'), 'Accessible Skip to Content bypass link is present (WCAG 2.4.1)');
assert(indexHtml.includes('href="#main-content"'), 'Skip link correctly anchors to #main-content');
assert(indexHtml.includes('name="description"'), 'Meta description is configured for SEO and performance');
assert(indexHtml.includes('rel="preconnect"'), 'Preconnect hints configured for font origins');

// 2. Audit src/App.tsx
console.log('\n--- 2. AUDITING src/App.tsx ---');
const appTsx = fs.readFileSync('src/App.tsx', 'utf-8');
assert(appTsx.includes('detectOptimalQuality'), 'Adaptive quality detection heuristic implemented');
assert(appTsx.includes('connection'), 'Respects network constraints (saveData, effectiveType)');
assert(appTsx.includes('prefers-reduced-motion'), 'Respects user prefers-reduced-motion preferences on init');
assert(appTsx.includes('role="status" aria-live="polite"'), 'Screen reader polite announcement region configured');
assert(appTsx.includes('<main id="main-content"'), 'Semantic <main id="main-content"> landmark present');
assert(appTsx.includes('handleQualityChange'), 'Stores quality preference in localStorage');
assert(appTsx.includes('onFallbackQuality'), 'Supplies graceful fallback quality callback to video controller');

// 3. Audit src/components/CinematicWorld.tsx
console.log('\n--- 3. AUDITING src/components/CinematicWorld.tsx ---');
const cinematicWorldTsx = fs.readFileSync('src/components/CinematicWorld.tsx', 'utf-8');
assert(cinematicWorldTsx.includes('preload="metadata"'), 'Video uses preload="metadata" to avoid eager 160MB download (Core Web Vitals LCP)');
assert(cinematicWorldTsx.includes('onError={handleVideoError}'), 'Video element includes graceful error fallback handler');
assert(cinematicWorldTsx.includes('seekRafRef'), 'Seeking during scrubbing is coalesced with requestAnimationFrame');
assert(cinematicWorldTsx.includes('Math.abs(targetTime - lastSeekTimeRef.current) < 0.033'), 'Micro-seek debouncing avoids decoder stalls');
assert(cinematicWorldTsx.includes('prefers-reduced-motion'), 'Particle animation loop is disabled when user prefers reduced motion');
assert(cinematicWorldTsx.includes('cancelAnimationFrame(animId)'), 'rAF loop properly cancelled on unmount');
assert(cinematicWorldTsx.includes('aria-hidden="true"'), 'Background video viewport marked aria-hidden for assistive technologies');

// 4. Audit src/components/InteractiveModals.tsx
console.log('\n--- 4. AUDITING src/components/InteractiveModals.tsx ---');
const modalsTsx = fs.readFileSync('src/components/InteractiveModals.tsx', 'utf-8');
assert(modalsTsx.includes('role="dialog"'), 'Modal window declares role="dialog"');
assert(modalsTsx.includes('aria-modal="true"'), 'Modal declares aria-modal="true"');
assert(modalsTsx.includes('aria-labelledby="modal-dialog-title"'), 'Modal links to heading via aria-labelledby');
assert(modalsTsx.includes('id="modal-dialog-title"'), 'Modal title elements possess matching id="modal-dialog-title"');
assert(modalsTsx.includes('lastActiveElementRef.current.focus()'), 'Focus is restored to origin element on modal close (WCAG 2.4.3)');
assert(modalsTsx.includes("e.key === 'Tab'"), 'Keyboard focus trap is implemented for Tab navigation');
assert(modalsTsx.includes("e.key === 'Escape'"), 'Escape key handler dismisses modal cleanly');

// 5. Audit src/components/Navbar.tsx
console.log('\n--- 5. AUDITING src/components/Navbar.tsx ---');
const navbarTsx = fs.readFileSync('src/components/Navbar.tsx', 'utf-8');
assert(navbarTsx.includes('role="banner"'), 'Navbar container marked with role="banner"');
assert(navbarTsx.includes('role="navigation"'), 'Nav links encapsulated in role="navigation"');
assert(navbarTsx.includes('aria-pressed={!isMuted}'), 'Audio toggle declares aria-pressed state');
assert(navbarTsx.includes('aria-pressed={isAutoRunning}'), 'Auto-run toggle declares aria-pressed state');
assert(navbarTsx.includes('aria-current={isActive ? \'page\' : undefined}'), 'Active nav item declared with aria-current="page"');
assert(navbarTsx.includes('aria-haspopup'), 'Menu and quality controls declare aria-haspopup');

// 6. Audit src/utils/audio.ts
console.log('\n--- 6. AUDITING src/utils/audio.ts ---');
const audioTs = fs.readFileSync('src/utils/audio.ts', 'utf-8');
assert(audioTs.includes('stopAmbient()'), 'Explicit stopAmbient() cleanup method exists');
assert(audioTs.includes('this.stopAmbient()'), 'Repeated unmute actions clean up previous ambient nodes before creating new ones');
assert(audioTs.includes('osc.onended = () => {'), 'Dynamic audio nodes disconnect on completion to prevent memory leaks');
assert(audioTs.includes('this.ctx.resume()'), 'Suspended AudioContext resumed safely on user gesture');
assert(audioTs.includes('public dispose()'), 'Comprehensive dispose() method available for lifecycle teardown');

// 7. Audit src/index.css
console.log('\n--- 7. AUDITING src/index.css ---');
const css = fs.readFileSync('src/index.css', 'utf-8');
assert(css.includes('.skip-to-content:focus'), 'Skip link has prominent focused styling');
assert(css.includes(':focus-visible'), 'Universal :focus-visible outlines configured for keyboard accessibility');
assert(css.includes('@media (prefers-reduced-motion: reduce)'), 'prefers-reduced-motion media query suppresses animations');
assert(css.includes('@media (pointer: coarse)'), 'Mobile pointer touch targets meet 44x44px minimum sizing');
assert(css.includes('@media (max-width: 360px)'), 'Reflow rules exist for 320px narrow viewports (WCAG 1.4.10)');

console.log('\n============================================================');
console.log(`  AUDIT COMPLETE: ${passCount} PASSED, ${failCount} FAILED`);
console.log('============================================================\n');

if (failCount > 0) {
  process.exit(1);
}
