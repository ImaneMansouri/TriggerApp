export function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Cross-fades between routes using the View Transitions API where the browser
// supports it (Chromium-based). Falls back to a plain navigate() everywhere
// else — Safari/Firefox just get an instant cut, no error, no missing nav.
export function navigateWithTransition(navigate, to, options) {
  if (prefersReducedMotion() || !document.startViewTransition) {
    navigate(to, options);
    return;
  }
  document.startViewTransition(() => navigate(to, options));
}
