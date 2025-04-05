// Remplace bien cette URL par celle générée par ton déploiement Vercel
const API_BASE = 'https://legoapi.vercel.app'; 

const showSelect = document.getElementById('show-select');
const sortSelect = document.getElementById('sort-select');
const dealList = document.getElementById('deal-list');
const saleList = document.getElementById('sale-list');

const fetchDeals = async () => {
  const limit = showSelect.value;
  const filterBy = sortSelect.value;

  try {
    const res = await fetch(`${API_BASE}/deals/search?limit=${limit}&filterBy=${filterBy}`);
    const data = await res.json();
    renderDeals(data.results || []);
  } catch (error) {
    console.error(error);
    dealList.innerHTML = '<p>Error loading deals.</p>';
  }
};

const fetchSales = async () => {
  try {
    const res = await fetch(`${API_BASE}/sales/search`);
    const data = await res.json();
    renderSales(data.results || []);
  } catch (error) {
    console.error(error);
    saleList.innerHTML = '<p>Error loading sales.</p>';
  }
};

const renderDeals = (deals) => {
  if (deals.length === 0) {
    dealList.innerHTML = '<p>No deals found.</p>';
    return;
  }

  dealList.innerHTML = deals.map(d => `
    <div>
      <strong>${d.title}</strong><br>
      💰 Price: €${d.price || '-'} | 🔥 Discount: ${d.discount || 0}%<br>
      <a href="${d.link}" target="_blank">🔗 View Deal</a>
    </div>
  `).join('');
};

const renderSales = (sales) => {
  if (sales.length === 0) {
    saleList.innerHTML = '<p>No sales found.</p>';
    return;
  }

  saleList.innerHTML = sales.map(s => `
    <div>
      <strong>${s.title}</strong><br>
      💵 Price: €${s.price}<br>
      <a href="${s.link}" target="_blank">🔗 View Sale</a>
    </div>
  `).join('');
};

// Events
showSelect.addEventListener('change', fetchDeals);
sortSelect.addEventListener('change', fetchDeals);

// Initial load
fetchDeals();
fetchSales();
