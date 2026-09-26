// Qué versión es esta: la pone vite.config.js al construir (package.json + el
// commit + la hora del build). Sin build (tests en node) sale 'dev'.

/* global __APP_VERSION__, __APP_COMMIT__, __APP_BUILT__ */
export const VERSION = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'dev';
export const COMMIT = typeof __APP_COMMIT__ === 'string' ? __APP_COMMIT__ : '';
export const BUILT = typeof __APP_BUILT__ === 'string' ? __APP_BUILT__ : '';

// "v0.1.18 · 0ab760b", para enseñar en pantalla.
export const versionLabel = () => `v${VERSION}${COMMIT ? ` · ${COMMIT}` : ''}`;

// Texto largo para el tooltip: con la fecha del build.
export const versionTitle = () => (BUILT ? `${versionLabel()} · ${new Date(BUILT).toLocaleString()}` : versionLabel());
