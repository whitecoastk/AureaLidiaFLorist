document.addEventListener('DOMContentLoaded', () => {
  const featured = document.getElementById('featuredProducts');

  if (featured) {
    new Splide('#featuredProducts', {
      type: 'loop',
      perPage: 3,
      gap: '1rem',
      autoplay: true,
      pauseOnHover: true,
      breakpoints: {
        1024: { perPage: 2 },
        640: { perPage: 1 }
      }
    }).mount();
  }
});
