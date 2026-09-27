// Which version this is: vite.config.js sets it at build time (package.json +
// the commit + the build time). Without a build (tests in node) it's 'dev'.

/* global __APP_VERSION__, __APP_COMMIT__, __APP_BUILT__ */
export const VERSION = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'dev';
export const COMMIT = typeof __APP_COMMIT__ === 'string' ? __APP_COMMIT__ : '';
export const BUILT = typeof __APP_BUILT__ === 'string' ? __APP_BUILT__ : '';

// "v0.1.18 · 0ab760b", to show on screen.
export const versionLabel = () => `v${VERSION}${COMMIT ? ` · ${COMMIT}` : ''}`;

// Long text for the tooltip: with the build date.
export const versionTitle = () => (BUILT ? `${versionLabel()} · ${new Date(BUILT).toLocaleString()}` : versionLabel());
