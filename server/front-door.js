// The research site is the front door: it is served at / (Spanish) and /en/
// (English) with no redirect, so its own folder never shows in the address
// bar. Its old addresses under /investigacion/ send the reader to the root.
// The game is at /jugar (any path that is neither a file nor these).
// Used by the server (server/app.js) and by Vite in dev and preview.

const PAGES = {
  '/': 'investigacion/index.html',
  '/en': 'investigacion/en/index.html',
  '/en/': 'investigacion/en/index.html',
};

const OLD = {
  '/investigacion': '/',
  '/investigacion/': '/',
  '/investigacion/index.html': '/',
  '/investigacion/en': '/en/',
  '/investigacion/en/': '/en/',
  '/investigacion/en/index.html': '/en/',
};

// { page: file to serve, relative to the site's root } or { redirect: path } or null.
export function frontDoor(url) {
  const [path, query] = url.split('?');
  if (PAGES[path]) return { page: PAGES[path] };
  if (OLD[path]) return { redirect: OLD[path] + (query ? `?${query}` : '') };
  return null;
}
