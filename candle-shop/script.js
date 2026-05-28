async function loadProducts() {
  const productGrid = document.querySelector('#productGrid');
  if (!productGrid) return;

  productGrid.innerHTML = '<p class="loading">Loading products…</p>';

  try {
    const response = await fetch('/api/products');
    const products = await response.json();

    if (!Array.isArray(products) || products.length === 0) {
      productGrid.innerHTML = '<p class="loading">No products available right now.</p>';
      return;
    }

    productGrid.innerHTML = products
      .map((product) => {
        const imageMarkup = product.image
          ? `<img src="${product.image}" alt="${product.name}" class="product-thumb" />`
          : `<div class="product-thumb placeholder"></div>`;

        const sizeMarkup = Array.isArray(product.sizes) && product.sizes.length
          ? `<p class="product-meta">${product.sizes.join(' • ')}</p>`
          : '';

        const originMarkup = product.origin
          ? `<p class="product-meta">${product.origin}</p>`
          : '';

        return `
          <article class="product-card-lg">
            <div class="product-thumb-wrap">
              ${imageMarkup}
            </div>
            <div class="product-card-copy">
              <p class="product-kicker">Beeswax candle • Hand poured</p>
              <h2>${product.name}</h2>
              <p>${product.description}</p>
              ${sizeMarkup}
              ${originMarkup}
              <div class="product-footer">
                <p class="price">$${Number(product.price).toFixed(2)} AUD</p>
                <a class="btn btn-primary" href="contact.html">Order now</a>
              </div>
            </div>
          </article>
        `;
      })
      .join('');
  } catch (error) {
    console.error('Product load failed:', error);
    productGrid.innerHTML = '<p class="loading">Unable to load products. Please try again later.</p>';
  }
}

async function handleContactForm() {
  const form = document.querySelector('#contactForm');
  if (!form) return;

  const status = document.querySelector('#contactStatus');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const data = {
      name: formData.get('name')?.toString().trim(),
      email: formData.get('email')?.toString().trim(),
      message: formData.get('message')?.toString().trim(),
    };

    if (!data.name || !data.email || !data.message) {
      status.textContent = 'Please fill in every field before sending.';
      status.className = 'form-status error';
      return;
    }

    status.textContent = 'Sending…';
    status.className = 'form-status';

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to submit form.');

      status.textContent = 'Your message has been sent successfully.';
      status.className = 'form-status success';
      form.reset();
    } catch (error) {
      console.error('Contact form submission failed:', error);
      status.textContent = 'Something went wrong. Please try again later.';
      status.className = 'form-status error';
    }
  });
}

window.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  handleContactForm();
});
