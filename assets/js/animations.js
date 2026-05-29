function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getGsap() {
  return prefersReducedMotion() ? null : window.gsap;
}

export function runInitialAnimations() {
  const gsap = getGsap();
  if (!gsap) return;

  gsap.from("[data-animate='fade-up']", {
    y: 22,
    opacity: 0,
    duration: 0.72,
    ease: "power3.out",
    stagger: 0.08,
  });
}

export function animateCards(selector) {
  const gsap = getGsap();
  if (!gsap) return;

  gsap.from(selector, {
    y: 18,
    opacity: 0,
    duration: 0.45,
    ease: "power2.out",
    stagger: 0.04,
  });
}

export function animateModalOpen(panel) {
  const gsap = getGsap();
  if (!gsap) return;

  gsap.fromTo(
    panel,
    { y: 24, opacity: 0, scale: 0.98 },
    { y: 0, opacity: 1, scale: 1, duration: 0.24, ease: "power2.out" },
  );
}

export function animateModalClose(panel, onComplete) {
  const gsap = getGsap();
  if (!gsap) {
    onComplete();
    return;
  }

  gsap.to(panel, {
    y: 18,
    opacity: 0,
    scale: 0.98,
    duration: 0.18,
    ease: "power2.in",
    onComplete,
  });
}
