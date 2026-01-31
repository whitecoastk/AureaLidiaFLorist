// ===============================
// CATÁLOGO - Aurea Lidia Florist
// ===============================

let products = [];
let currentProducts = [];
let currentPage = 1;
const productsPerPage = 50;

async function loadProducts() {
  const sheetId = '1AYMtAh_G8P3jXRv8aSu3-QT6foWwG8HfGVHRjaa15PU';
  const sheetName = 'Hoja 1';

  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?sheet=${encodeURIComponent(sheetName)}`;

  const resp = await fetch(url);
  const text = await resp.text();

  const json = JSON.parse(text.match(/google\.visualization\.Query\.setResponse\((.*)\)/s)[1]);
  const rows = json.table.rows;

  products = rows.map(r => {
    const img = r.c[3]?.v;
    return {
      id: r.c[0]?.v,
      name: r.c[1]?.v,
      price: Number(r.c[2]?.v),
      image: img?.startsWith('http') ? img : `resources/${img}`,
      description: r.c[4]?.v || '',
      category: r.c[5]?.v,
      popular: r.c[6]?.v === true,
      badge: r.c[7]?.v || ''
    };
  });
  
  shuffleArray(products);
  currentProducts = [...products];
  displayProducts();
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function displayProducts() {
  const grid = document.getElementById('productsGrid');
  const count = document.getElementById('productCount');
  
  if (!grid) return;

  const end = currentPage * productsPerPage;
  const visible = currentProducts.slice(0, end);

  grid.innerHTML = visible.map(p => `
    <div class="card-hover bg-white rounded-2xl shadow-lg overflow-hidden product-card" data-category="${p.category}" data-price="${p.price}">
      <div class="relative">
        <img 
          src="${p.image}" 
          alt="${p.name}"
          data-lazy
          loading="lazy"
          onload="this.classList.add('loaded')"
          class="w-full h-64 object-cover opacity-0 transition-opacity duration-600">
        
        ${p.badge ? `
          <div class="absolute top-4 left-4 z-10">
            <span class="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-md">${p.badge}</span>
          </div>
        ` : ''}
        
        <div class="absolute top-4 right-4 z-10">
          <span class="price-tag shadow-md">$${p.price.toLocaleString()}</span>
        </div>
      </div>
      
      <div class="p-6">
        <h3 class="text-xl font-display font-semibold text-gray-800 mb-2">${p.name}</h3>
        <p class="text-gray-600 mb-4 text-sm line-clamp-2">${p.description || ''}</p>
        
        <div class="flex justify-between items-center">
          <span class="text-xs text-gray-500 flex items-center">
            <svg class="w-4 h-4 mr-1 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            Entrega mismo día
          </span>
          <button onclick="addToCart('${p.id}','${p.name}',${p.price},'${p.image}')"
            class="bg-pink-400 text-white px-4 py-2 rounded-lg hover:bg-pink-500 transition-colors text-sm font-medium shadow-md hover:shadow-lg">
            Agregar
          </button>
        </div>
      </div>
    </div>
  `).join('');

  if (count) count.textContent = currentProducts.length;
  
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  if (loadMoreBtn) {
    loadMoreBtn.style.display = end >= currentProducts.length ? 'none' : 'block';
  }
}

// CATEGORÍAS
function filterProducts(cat) {
  // Pintar botón activo
  document.querySelectorAll('[data-category]').forEach(btn => {
    btn.classList.remove('bg-pink-400', 'text-white');
    btn.classList.add('bg-gray-100');
  });
  const active = document.querySelector(`[data-category="${cat}"]`);
  if (active) {
    active.classList.remove('bg-gray-100');
    active.classList.add('bg-pink-400', 'text-white');
  }

  // Filtrar productos
  currentProducts = cat === 'todos'
    ? [...products]
    : products.filter(p => p.category === cat);
  currentPage = 1;
  displayProducts();
}

// PRECIOS
function filterByPrice(range) {
  // Pintar botón activo
  document.querySelectorAll('[data-price]').forEach(btn => {
    btn.classList.remove('bg-pink-400', 'text-white');
    btn.classList.add('bg-gray-100');
  });
  const active = document.querySelector(`[data-price="${range}"]`);
  if (active) {
    active.classList.remove('bg-gray-100');
    active.classList.add('bg-pink-400', 'text-white');
  }

  // Filtrar productos
  switch (range) {
    case '0-500':
      currentProducts = products.filter(p => p.price <= 500); break;
    case '500-1000':
      currentProducts = products.filter(p => p.price > 500 && p.price <= 1000); break;
    case '1000+':
      currentProducts = products.filter(p => p.price > 1000); break;
    default:
      currentProducts = [...products];
  }
  currentPage = 1;
  displayProducts();
}

// ORDENAMIENTO
function sortProducts(sortBy) {
  switch(sortBy) {
    case 'name':
      currentProducts.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'price-low':
      currentProducts.sort((a, b) => a.price - b.price);
      break;
    case 'price-high':
      currentProducts.sort((a, b) => b.price - a.price);
      break;
    case 'popular':
      currentProducts.sort((a, b) => (b.popular ? 1 : 0) - (a.popular ? 1 : 0));
      break;
  }
  
  currentPage = 1;
  displayProducts();
}

function loadMoreProducts() {
  currentPage++;
  displayProducts();
}


document.addEventListener('DOMContentLoaded', loadProducts);