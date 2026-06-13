// Pixel button effects
document.querySelectorAll('.btn-primary, .btn-danger').forEach(btn => {
  btn.addEventListener('mouseenter', function() {
    this.classList.add('pixel-active');
  });

  btn.addEventListener('mouseleave', function() {
    this.classList.remove('pixel-active');
  });
});
