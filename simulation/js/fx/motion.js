// Screen transitions. GSAP is optional: without it (or with reduced motion)
// the screen simply appears.

// The in-game setting (html[data-motion]) wins over the OS preference.
export function prefersReducedMotion() {
  const pref = document.documentElement.dataset.motion;
  if (pref) return pref === 'reduce';
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

export function animateStepIn(root) {
  const gsap = window.gsap;
  if (!gsap || prefersReducedMotion()) return;
  const targets = root.querySelectorAll('.step-header, .step-main > *, .step-rail > *');
  if (targets.length === 0) return;
  gsap.fromTo(targets, { y: 14, opacity: 0.001 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out', stagger: 0.04, clearProps: 'transform,opacity' });
}

// Small pulse used when something is added (evidence, a rating).
export function pulse(el) {
  const gsap = window.gsap;
  if (!gsap || !el || prefersReducedMotion()) return;
  gsap.fromTo(el, { scale: 0.97 }, { scale: 1, duration: 0.35, ease: 'back.out(3)', clearProps: 'transform' });
}
