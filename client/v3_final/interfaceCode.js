const API_BASE = 'https://legoapi.vercel.app';

const showSelect = document.getElementById('show-select');
const sortSelect = document.getElementById('sort-select');
const dealIdSelect = document.getElementById('deal-id-select');
const dealList = document.getElementById('deal-list');
const saleList = document.getElementById('sale-list');
const vintedSalesSection = document.getElementById('vinted-sales');
const vintedSalesList = document.getElementById('vinted-sales-list');

const fetchDeals = async () => {
  const limit = showSelect.value;
  const filterBy = sortSelect.value;

  try {
    const res = await fetch(`${API_BASE}/deals/search?limit=${limit}&filterBy=${filterBy}`);
    const data = await res.json();
    renderDeals(data.results || []);
    populateDealIdSelect(data.results || []);
  } catch (error) {
    console.error(error);
    dealList.innerHTML = '<p>Error loading deals.</p>';
  }
};

const fetchDealByLegoId = async (legoId) => {
  try {
    const res = await fetch(`${API_BASE}/deals/lego/${legoId}`);
    const deal = await res.json();
    renderDeals([deal]); // Affiche uniquement le deal correspondant
  } catch (error) {
    console.error(error);
    dealList.innerHTML = '<p>Error loading deal by Lego ID.</p>';
  }
};

const fetchVintedSales = async (legoId) => {
  try {
    const res = await fetch(`${API_BASE}/sales/search?id=${legoId}`);
    const data = await res.json();
    renderVintedSales(data.results || []);
  } catch (error) {
    console.error(error);
    vintedSalesList.innerHTML = '<p>Error loading Vinted sales.</p>';
  }
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

  // Ajoutez des événements pour les boutons favoris
  document.querySelectorAll('.favorite-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const legoId = e.target.dataset.id;
      await toggleFavorite(legoId);
    });
  });
};

const toggleFavorite = async (legoId) => {
  try {
    const res = await fetch(`${API_BASE}/deals/${legoId}/favorite`, { method: 'PATCH' });
    const data = await res.json();

    if (data.success) {
      fetchDeals(); // Recharge les deals pour refléter les changements
    }
  } catch (error) {
    console.error('❌ Error toggling favorite:', error);
  }
};

const renderVintedSales = (sales) => {
  if (sales.length === 0) {
    vintedSalesList.innerHTML = '<p>No sales found.</p>';
    vintedSalesSection.style.display = 'none';
    return;
  }

  vintedSalesSection.style.display = 'block';
  vintedSalesList.innerHTML = sales.map(s => `
    <div>
      <strong>${s.title}</strong><br>
      💵 Price: €${s.price}<br>
      <a href="${s.link}" target="_blank">🔗 View Sale</a>
    </div>
  `).join('');
};

const populateDealIdSelect = (deals) => {
  dealIdSelect.innerHTML = `
    <option value="all" selected>All</option>
    ${deals.map(d => `<option value="${d.legoId}">${d.legoId}</option>`).join('')}
  `;
};

// Events
showSelect.addEventListener('change', fetchDeals);
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
  const selectedLegoId = dealIdSelect.value;
  if (selectedLegoId === 'all') {
    fetchDeals(); 
  } else {
    fetchDealByLegoId(selectedLegoId); 
  }
});

// Initial load
fetchDeals();