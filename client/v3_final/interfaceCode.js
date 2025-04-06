const API_BASE = 'https://legoapi.vercel.app';

const showSelect = document.getElementById('show-select');
const sortSelect = document.getElementById('sort-select');
const dealIdSelect = document.getElementById('deal-id-select');
const dealList = document.getElementById('deal-list');
const saleList = document.getElementById('sale-list');
const vintedSalesSection = document.getElementById('vinted-sales');
const vintedSalesList = document.getElementById('vinted-sales-list');

let currentPage = 1;
let totalPages = 1;

const fetchDeals = async (page = 1) => {
  const limit = showSelect.value;
  const filterBy = sortSelect.value;

  try {
    const res = await fetch(`${API_BASE}/deals/search?limit=${limit}&filterBy=${filterBy}&page=${page}`);
    const data = await res.json();
    if (data.results.length === 0 && currentPage > 1) {
      currentPage = 1;
      return fetchDeals(currentPage);
    }

    renderDeals(data.results || []);
    populateDealIdSelect(data.results || []);
    updatePagination(data.pagination || {});
  } catch (error) {
    console.error(error);
    dealList.innerHTML = '<p>Error loading deals.</p>';
  }
};

const fetchVintedSales = async (legoId) => {
  try {
    const res = await fetch(`${API_BASE}/sales/search?id=${legoId}`);
    const data = await res.json();
    renderVintedSales(data.results || []);
  } catch (e) {
    console.error('❌ Vinted sales fetch error:', e);
  }
};

const fetchVintedIndicators = async (legoId) => {
  try {
    const res = await fetch(`${API_BASE}/sales/stats?id=${legoId}`);
    const stats = await res.json();
    if (!stats.count) {
      document.getElementById('vinted-indicators').style.display = 'none';
      return;
    }

    const indicators = {
      'Number of sales': stats.count,
      'Average Price': `${stats.avg.toFixed(2)} €`,
      'P5 sales price value': `${stats.p5.toFixed(2)} €`,
      'P25 sales price value': `${stats.p25.toFixed(2)} €`,
      'P50 sales price value': `${stats.p50.toFixed(2)} €`,
    };

    const ul = document.getElementById('indicator-list');
    ul.innerHTML = '';
    for (const [key, value] of Object.entries(indicators)) {
      const li = document.createElement('li');
      li.textContent = `${key}: ${value}`;
      ul.appendChild(li);
    }

    document.getElementById('vinted-indicators').style.display = 'block';
  } catch (e) {
    console.error('❌ Indicator fetch error:', e);
    document.getElementById('vinted-indicators').style.display = 'none';
  }
};

const pageSelect = document.getElementById('page-select');
pageSelect.addEventListener('change', (event) => {
  const selectedPage = parseInt(event.target.value, 10);
  fetchDeals(selectedPage);
});

const updatePagination = (pagination) => {
  currentPage = pagination.currentPage || 1;
  totalPages = pagination.totalPages || 1;

  if (currentPage > totalPages) {
    currentPage = 1;
  }

  pageSelect.innerHTML = Array.from({ length: totalPages }, (_, i) => `
    <option value="${i + 1}" ${i + 1 === currentPage ? 'selected' : ''}>Page ${i + 1}</option>
  `).join('');
};

const fetchDealByLegoId = async (legoId) => {
  try {
    const res = await fetch(`${API_BASE}/deals/lego/${legoId}`);
    const deal = await res.json();
    renderDeals([deal]);
  } catch (error) {
    console.error(error);
    dealList.innerHTML = '<p>Error loading deal by Lego ID.</p>';
  }
};

const renderVintedSales = (sales) => {
  const section = document.getElementById('vinted-sales');
  const list = document.getElementById('vinted-sales-list');

  if (!sales.length) {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'block';
  list.innerHTML = sales.map(s => `
    <div class="sale-card">
      <a href="${s.url}" target="_blank">${s.title}</a>
      <p>💶 ${s.price} €</p>
    </div>
  `).join('');
};

const renderDeals = (deals) => {
  if (deals.length === 0) {
    dealList.innerHTML = '<p>No deals found.</p>';
    return;
  }

  dealList.innerHTML = deals.map(d => `
    <div class="deal-card">
      <button class="favorite-btn" data-id="${d.legoId}">
        ${d.isFavorite ? '❤️' : '🤍'}
      </button>
      <h3>${d.title.replace(/-/g, ' ')}</h3>
      <p><strong>Lego ID:</strong> ${d.legoId}</p>
      <p><strong>Merchant:</strong> ${d.merchantName || 'Unknown'}</p>
      <p><strong>Price:</strong> €${d.price || '-'} <small>(Next Best Price: €${d.nextBestPrice || '-'})</small></p>
      <p><strong>Discount:</strong> ${d.discount !== null ? `${d.discount}%` : 'N/A'}</p>
      <p><strong>Published At:</strong> ${d.publishedAt ? new Date(d.publishedAt).toLocaleString() : 'N/A'}</p>
      <p><strong>Comments:</strong> ${d.commentCount || 0}</p>
      <p><strong>Temperature:</strong> ${d.temperature || 0}°</p>
      <a href="${d.link}" target="_blank">🔗 View Deal</a>
    </div>
  `).join('');

  document.querySelectorAll('.favorite-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const legoId = e.target.dataset.id;
      const updated = await toggleFavorite(legoId);

      if (updated !== null) {
        // Met à jour uniquement ce bouton sans recharger la page
        btn.textContent = updated ? '❤️' : '🤍';
      }
    });
  });
};

const toggleFavorite = async (legoId) => {
  try {
    const res = await fetch(`${API_BASE}/deals/${legoId}/favorite`, { method: 'PATCH' });
    const data = await res.json();
    if (data.success) {
      return data.isFavorite; // retourne le nouvel état
    } else {
      return null;
    }
  } catch (error) {
    console.error('❌ Error toggling favorite:', error);
    return null;
  }
};

const populateDealIdSelect = (deals) => {
  dealIdSelect.innerHTML = `
    <option value="all" selected>All</option>
    ${deals.map(d => `<option value="${d.legoId}">${d.legoId}</option>`).join('')}
  `;
};

// Events
showSelect.addEventListener('change', () => {
  currentPage = 1;

  if (sortSelect.value === 'favorites') {
    sortSelect.value = 'price-asc'; 
  }

  fetchDeals(currentPage);
});
sortSelect.addEventListener('change', async () => {
  const filterBy = sortSelect.value;

  if (filterBy === 'favorites') {
    const res = await fetch(`${API_BASE}/deals/search?isFavorite=true`);
    const data = await res.json();
    renderDeals(data.results || []);
  } else {
    fetchDeals();
  }
});
dealIdSelect.addEventListener('change', async () => {
  const legoId = dealIdSelect.value;
  if (legoId === 'all') {
    fetchDeals();
    document.getElementById('vinted-indicators').style.display = 'none';
    document.getElementById('vinted-sales').style.display = 'none';
  } else {
    fetchDealByLegoId(legoId);
    fetchVintedSales(legoId);
    fetchVintedIndicators(legoId);
  }
});

// Initial load
fetchDeals();
