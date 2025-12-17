// ===============================
// CATÁLOGO - Aurea Lidia Florist
// ===============================

let products = [];
let currentProducts = [];
let currentPage = 1;
const productsPerPage = 9;

async function loadProducts() {
  const sheetId = '1AYMtAh_G8P3jXRv8aSu3-QT6foWwG8HfGVHRjaa15PU';
  const sheetName = 'Hoja 1'; // cambia si tu hoja tiene otro nombre

  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?sheet=${encodeURIComponent(sheetName)}`;

  const resp = await fetch(url);
  const text = await resp.text();

  // Extrae el JSON real que Google envía envuelto
  const json = JSON.parse(text.match(/google\.visualization\.Query\.setResponse\((.*)\)/s)[1]);
  const rows = json.table.rows;

  products = rows.map(r => ({
    id: r.c[0]?.v,
    name: r.c[1]?.v,
    price: Number(r.c[2]?.v),
    image: `resources/${r.c[3]?.v}`,
    description: r.c[4]?.v || '',
    category: r.c[5]?.v,
    popular: r.c[6]?.v === true,
    badge: r.c[7]?.v || ''
  }));

  currentProducts = [...products];
  displayProducts();
}

function displayProducts() {
  const grid = document.getElementById('productsGrid');
  const count = document.getElementById('productCount');

  const end = currentPage * productsPerPage;
  const visible = currentProducts.slice(0, end);

  grid.innerHTML = visible.map(p => `
    <div class="bg-white rounded-xl shadow">
      <img src="${p.image}" class="w-full h-56 object-cover">
      <div class="p-4">
        <h3 class="font-semibold">${p.name}</h3>
        <p class="text-sm text-gray-500">${p.description}</p>
        <p class="font-bold mt-2">$${p.price}</p>
        <button onclick="addToCart('${p.id}','${p.name}',${p.price},'${p.image}')"
          class="mt-3 bg-pink-400 text-white px-4 py-2 rounded">
          Agregar
        </button>
      </div>
    </div>
  `).join('');

  count.textContent = currentProducts.length;
}

function filterProducts(cat) {
  currentProducts = cat === 'todos'
    ? [...products]
    : products.filter(p => p.category === cat);

  currentPage = 1;
  displayProducts();
}

function loadMoreProducts() {
  currentPage++;
  displayProducts();
}

document.addEventListener('DOMContentLoaded', loadProducts);
console.log(products);