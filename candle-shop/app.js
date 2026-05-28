const nav = document.getElementById('site-header');

// ── PARALLAX ──
const orbs = document.querySelectorAll('[data-speed]');
window.addEventListener('scroll', () => {
  const sy = window.scrollY;
  orbs.forEach(orb => {
    orb.style.transform = `translateY(${sy * parseFloat(orb.dataset.speed)}px)`;
  });

  // nav becomes light-mode once user scrolls past hero
  if (document.body.dataset.hero === 'dark') {
    const heroH = document.getElementById('hero')?.offsetHeight ?? 0;
    nav.classList.toggle('light-mode', sy > heroH - 80);
  }
}, { passive: true });

// ── FADE-IN ON SCROLL ──
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

// ── FILTER CHIPS (shop page) ──
document.querySelectorAll('.filter-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
  });
});
