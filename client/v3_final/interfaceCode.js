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

const fetchVintedSales = async (dealId) => {
  try {
    const res = await fetch(`${API_BASE}/sales/search?id=${dealId}`);
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
      <h3>${d.title}</h3>
      <p><strong>Thread ID:</strong> ${d.threadId}</p>
      <p><strong>Merchant:</strong> ${d.merchantName || 'Unknown'}</p>
      <p><strong>Price:</strong> €${d.price || '-'} <small>(Next Best Price: €${d.nextBestPrice || '-'})</small></p>
      <p><strong>Discount:</strong> ${d.discount || 0}%</p>
      <p><strong>Published At:</strong> ${new Date(d.publishedAt).toLocaleString()}</p>
      <p><strong>Comments:</strong> ${d.commentCount}</p>
      <p><strong>Temperature:</strong> ${d.temperature}°</p>
      <a href="${d.link}" target="_blank">🔗 View Deal</a>
    </div>
  `).join('');
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
    ${deals.map(d => `<option value="${d.threadId}">${d.threadId}</option>`).join('')}
  `;
};

// Events
showSelect.addEventListener('change', fetchDeals);
sortSelect.addEventListener('change', fetchDeals);
dealIdSelect.addEventListener('change', async () => {
  const selectedThreadId = dealIdSelect.value;
  if (selectedThreadId === 'all') {
    vintedSalesSection.style.display = 'none';
    fetchDeals();
  } else {
    fetchVintedSales(selectedThreadId);
  }
});

// Initial load
fetchDeals();