// ===============================
// Aurea Lidia Florist - MAIN JS
// Global y reutilizable
// ===============================

// ---------- CART ----------
let cart = JSON.parse(localStorage.getItem('cart')) || [];

function addToCart(id, name, price, image) {
  const item = cart.find(p => p.id === id);
  if (item) item.quantity++;
  else cart.push({ id, name, price, image, quantity: 1 });

  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartDisplay();
  showCartNotification(name);
}

function removeFromCart(id) {
  cart = cart.filter(p => p.id !== id);
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartDisplay();
}

function updateQuantity(id, qty) {
  const item = cart.find(p => p.id === id);
  if (!item) return;

  item.quantity = qty;
  if (item.quantity <= 0) removeFromCart(id);
  else {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartDisplay();
  }
}

function updateCartDisplay() {
  const count = document.getElementById('cartCount');
  const items = document.getElementById('cartItems');
  const totalEl = document.getElementById('cartTotal');
  const footer = document.getElementById('cartFooter');

  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);
  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  if (count) {
    count.textContent = totalItems;
    count.style.display = totalItems ? 'flex' : 'none';
  }

  if (!items) return;

  if (!cart.length) {
    items.innerHTML = '<p class="text-gray-500 text-center py-8">Tu carrito está vacío</p>';
    footer && (footer.style.display = 'none');
    return;
  }

  items.innerHTML = cart.map(i => `
    <div class="flex gap-4 py-4 border-b">
      <img src="${i.image}" class="w-16 h-16 rounded object-cover">
      <div class="flex-1">
        <p class="font-semibold">${i.name}</p>
        <p class="text-pink-400">$${i.price}</p>
        <div class="flex items-center gap-2 mt-2">
          <button onclick="updateQuantity('${i.id}', ${i.quantity - 1})">-</button>
          <span>${i.quantity}</span>
          <button onclick="updateQuantity('${i.id}', ${i.quantity + 1})">+</button>
        </div>
      </div>
      <button onclick="removeFromCart('${i.id}')">✕</button>
    </div>
  `).join('');

  footer && (footer.style.display = 'block');
  totalEl && (totalEl.textContent = `$${total.toLocaleString()} MXN`);
}

// ---------- UI ----------
function toggleCart() {
  document.getElementById('cartSidebar')?.classList.toggle('open');
  document.getElementById('overlay')?.classList.toggle('active');
}

function closeCart() {
  document.getElementById('cartSidebar')?.classList.remove('open');
  document.getElementById('overlay')?.classList.remove('active');
}

function showCartNotification(name) {
  const n = document.createElement('div');
  n.className = 'fixed top-20 right-4 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 transform translate-x-full opacity-0 transition-all duration-300 ease-out';
  
  n.innerHTML = `
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
    </svg>
    <span class="font-medium">Agregado: ${name}</span>
  `;
  
  document.body.appendChild(n);
  
  // Animación de entrada
  requestAnimationFrame(() => {
    n.classList.remove('translate-x-full', 'opacity-0');
  });
  
  // Animación de salida
  setTimeout(() => {
    n.classList.add('translate-x-full', 'opacity-0');
    setTimeout(() => n.remove(), 300);
  }, 2200);
}

// ---------- WHATSAPP ----------
function proceedToWhatsApp() {
  if (!cart.length) return alert('Tu carrito está vacío');
  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const items = cart.map(i => `• ${i.quantity}× ${i.name}`).join('%0A');
  window.open(`https://wa.me/525618689260?text=Pedido:%0A${items}%0ATotal: $${total}`, '_blank');
}

// ---------- INIT ----------
document.addEventListener('DOMContentLoaded', updateCartDisplay);
