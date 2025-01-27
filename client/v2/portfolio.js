// Invoking strict mode https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode#invoking_strict_mode
'use strict';

/**
Description of the available api
GET https://lego-api-blue.vercel.app/deals

Search for specific deals

This endpoint accepts the following optional query string parameters:

- `page` - page of deals to return
- `size` - number of deals to return

GET https://lego-api-blue.vercel.app/sales

Search for current Vinted sales for a given lego set id

This endpoint accepts the following optional query string parameters:

- `id` - lego set id to return
*/


// -------------------------------------------------------------------------------------------------------------
//Start of the code
// current deals on the page
let currentDeals = [];
let currentPagination = {};

// instantiate the selectors
const selectShow = document.querySelector('#show-select');
const selectPage = document.querySelector('#page-select');
const selectLegoSetIds = document.querySelector('#lego-set-id-select');
const sectionDeals= document.querySelector('#deals');
const selectSort = document.querySelector('#sort-select'); 
const spanNbDeals = document.querySelector('#nbDeals');

/**
 * Fetch deals from api 
 * @param  {Number}  [page=1] - current page to fetch
 * @param  {Number}  [size=6] - size of the page
 * @return {Object}
 */
const fetchDeals = async (page = 1, size = 6) => { //PERMET DE RECUP LES VALEURS GRACE A UNE API
  try {
    const response = await fetch(
      `https://lego-api-blue.vercel.app/deals?page=${page}&size=${size}`
    );
    const body = await response.json();

    if (body.success !== true) {
      console.error(body);
      return {currentDeals, currentPagination};
    }

    return body.data;
  } catch (error) {
    console.error(error);
    return {currentDeals, currentPagination};
  }
};

const fetchVintedSales = async (id) => {
  try {
    const response = await fetch(`https://lego-api-blue.vercel.app/sales?id=${id}`);
    const body = await response.json();

    if (!body.success) {
      console.error(body);
      return {currentDeals, currentPagination};
    }

    return body.data.result;
  } catch (error) {
    console.error(error);
    return {currentDeals, currentPagination};
  }
};

/**
 * Set global value
 * @param {Array} result - deals to display
 * @param {Object} meta - pagination meta info
 */
const setCurrentDeals = ({result, meta}) => { //MET A JOUR LES VARIABLES AVEC LES VALEURS RECUP DE L'API
  currentDeals = result;
  currentPagination = meta;
};

// -------------------------------------------------------------------------------------------------------------
//TOUS LES CHANGE
/**
 * Declaration of all Listeners
 */

document.addEventListener('DOMContentLoaded', async () => { //SE LANCE QUAND ON DOWNLOAD LA PAGE
  const deals = await fetchDeals(); //MET DANS deals LES VALEURS RECUP GRACE A L'API
  
  setCurrentDeals(deals);
  render(currentDeals, currentPagination);
});


/**
 * Select the number of deals to display
 */
selectShow.addEventListener('change', async (event) => {
  const deals = await fetchDeals(1, parseInt(event.target.value)); // MET DANS deals LES VALEURS RECUP GRACE A L'API
  console.log(deals);
  currentPagination.pageSize = parseInt(event.target.value);

  setCurrentDeals(deals);
  render(currentDeals, currentPagination);

   // Réinitialise le sélecteur d'ID sur "All" et déclenche l'événement change
   const legoSetSelector = document.querySelector('#lego-set-id-select');
   legoSetSelector.value = 'All';
   legoSetSelector.dispatchEvent(new Event('change')); // Déclenche le change
});

/**
 * Select the page to display
 */
selectPage.addEventListener('change', async (event) => {
  const realPagination = currentPagination.pageSize;
  const deals = await fetchDeals(parseInt(event.target.value), currentPagination.pageSize);

  setCurrentDeals(deals);
  currentPagination.pageSize = realPagination;
  render(currentDeals, currentPagination);

   // Réinitialise le sélecteur d'ID sur "All" et déclenche l'événement change
   const legoSetSelector = document.querySelector('#lego-set-id-select');
   legoSetSelector.value = 'All';
   legoSetSelector.dispatchEvent(new Event('change')); // Déclenche le change
});


selectLegoSetIds.addEventListener('change', async (event) => {
  const selectedLegoId = event.target.value;

  if (selectedLegoId === 'All') {
    render(currentDeals, currentPagination); 
    document.querySelector('#vinted-sales').style.display = 'none';
    document.querySelector('#indicators').style.display = 'none';
  } else {
    const filteredDeals = currentDeals.filter(deal => deal.id === selectedLegoId);
    const vintedSales = await fetchVintedSales(selectedLegoId);

    render(filteredDeals, currentPagination);
    renderVintedSales(vintedSales);

    // Met à jour les indicateurs avec les données des ventes Vinted
    document.querySelector('#indicators').style.display = 'block';
    document.querySelector('#vinted-sales').style.display = 'block';
    renderIndicators(currentPagination, vintedSales);
  }
});



/**
 * Select the way to display the lego sets
 */
selectSort.addEventListener('change', () => {
  const selectedOption = selectSort.value; // Récupère l'option sélectionnée
  let sortedDeals = [...currentDeals]; // Copie des deals actuels pour les trier

  switch (selectedOption) {
    case 'no-filter':
      sortedDeals = [...currentDeals];
      break;

    case 'favorites':
      const favorites = getFavorites();
      sortedDeals = currentDeals.filter(deal => favorites.includes(deal.uuid));
      break;
      
    case 'best-discount':
        sortedDeals = sortedDeals.sort((a, b) => b.discount - a.discount); 
        break;
    
    case 'most-commented':
        sortedDeals = sortedDeals.sort((a, b) => b.comments - a.comments); 
        break;

    case 'price-asc':
      sortedDeals.sort((a, b) => a.price - b.price);
      break;

    case 'price-desc':
      sortedDeals.sort((a, b) => b.price - a.price);
      break;

    case 'date-asc':
      sortedDeals.sort((a, b) => new Date(b.published) - new Date(a.published));
      break;

    case 'date-desc':
      sortedDeals.sort((a, b) => new Date(a.published) - new Date(b.published));
      break;

    default:
      console.error('Invalid sort option selected:', selectedOption);
      break;
  }

  render(sortedDeals, currentPagination);
});


// -------------------------------------------------------------------------------------------------------------
//RENDER DES ELEMENTS
/**
 * Render list of deals
 * @param  {Array} deals
 */
const renderDeals = (deals) => {
  const section = document.querySelector('#deals');
  const fragment = document.createDocumentFragment();
  const div = document.createElement('div');
  const template = deals
    .map(deal => {
      const isFavorite = checkIfFavorite(deal.uuid); // Vérifie si le deal est favori
      return `
      <div class="deal" id=${deal.uuid}>
        <span>${deal.id}</span>
        <a href="${deal.link}" target="_blank">${deal.title}</a> <!-- Ouvre le lien dans un nouvel onglet -->
        <span>${deal.price}</span>
        <button class="favorite-btn" data-uuid="${deal.uuid}">
          ${isFavorite ? 'Remove from Favorites' : 'Save as Favorite'}
        </button>
      </div>
    `;
    })
    .join('');

  div.innerHTML = template;
  fragment.appendChild(div);
  section.innerHTML = '<h2>Deals</h2>';
  section.appendChild(fragment);

  // Ajout des gestionnaires d'événements pour les boutons "Save as Favorite"
  document.querySelectorAll('.favorite-btn').forEach(button => {
    button.addEventListener('click', (event) => {
      const uuid = event.target.dataset.uuid;
      toggleFavorite(uuid); // Ajoute ou retire des favoris
      renderDeals(deals); // Re-render pour mettre à jour l'état des boutons
    });
  });
};


/**
 * Render page selector
 * @param  {Object} pagination
 */
const renderPagination = pagination => {
  const {currentPage, pageCount} = pagination;
  const options = Array.from(
    {'length': pageCount},
    (value, index) => `<option value="${index + 1}">${index + 1}</option>`
  ).join('');

  selectPage.innerHTML = options;
  selectPage.selectedIndex = currentPage - 1;
};

/**
 * Render lego set ids selector
 * @param  {Array} deals
 */
const renderLegoSetIds = (deals) => {
  const ids = getIdsFromDeals(deals); 
  const uniqueIds = [...new Set(ids)]; 
  
  const currentValue = selectLegoSetIds.value; 
  const options = ['All', ...uniqueIds].map(id => 
    `<option value="${id}">${id}</option>`
  ).join('');

  selectLegoSetIds.innerHTML = options;

  if (currentValue && [...selectLegoSetIds.options].some(opt => opt.value === currentValue)) {
    selectLegoSetIds.value = currentValue;
  }
};


/**
 * Render indicators
 * @param  {Object} pagination - Pagination metadata
 * @param  {Array} [sales=[]] - (Optionnel) Ventes Vinted pour calculer les statistiques
 */
const renderIndicators = (pagination, sales = []) => {
  const { count } = pagination;

  // Met à jour le nombre de deals
  spanNbDeals.innerHTML = count;

  // Si des données sur les ventes sont disponibles, calculez les indicateurs
  if (sales.length > 0) {
    // Feature 8: Total des ventes
    document.querySelector('#nbSales').textContent = sales.length;

    // Feature 9: Statistiques des prix
    const prices = sales.map(sale => parseFloat(sale.price)).sort((a, b) => a - b);
    const average = (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2);
    const p5 = prices[Math.floor(0.05 * prices.length)] || 0;
    const p25 = prices[Math.floor(0.25 * prices.length)] || 0;
    const p50 = prices[Math.floor(0.50 * prices.length)] || 0;

    document.querySelector('#average-price').textContent = `${average} €`;
    document.querySelector('#p5-price').textContent = `${p5} €`;
    document.querySelector('#p25-price').textContent = `${p25} €`;
    document.querySelector('#p50-price').textContent = `${p50} €`;

    // Feature 10: Durée de vie des ventes
    const dates = sales.map(sale => new Date(sale.published));
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    const lifetimeDays = Math.floor((maxDate - minDate) / (1000 * 60 * 60 * 24));

    document.querySelector('#lifetime-value').textContent = `${lifetimeDays} days`;
  } else {
    // Réinitialise les indicateurs liés aux ventes si aucune donnée n'est disponible
    document.querySelector('#nbSales').textContent = '0';
    document.querySelector('#average-price').textContent = '0 €';
    document.querySelector('#p5-price').textContent = '0 €';
    document.querySelector('#p25-price').textContent = '0 €';
    document.querySelector('#p50-price').textContent = '0 €';
    document.querySelector('#lifetime-value').textContent = '0 days';
  }
};

/**
 * Render vinted sales
 * @param  {Array} sales
 */
const renderVintedSales = (sales) => {
  const section = document.querySelector('#vinted-sales');
  const fragment = document.createDocumentFragment();
  const div = document.createElement('div');
  const template = sales
    .map(sale => {
      return `
      <div class="vinted-sale" id=${sale.uuid}>
        <a href="${sale.link}" target="_blank">${sale.title}</a> <!-- Ouvre le lien dans un nouvel onglet -->
        <span>${sale.price} €</span>
      </div>
    `;
    })
    .join('');

  div.innerHTML = template;
  fragment.appendChild(div);

  section.innerHTML = '<h2>Vinted Sales</h2>';
  section.appendChild(fragment);
};

/**
 * Render all
 */
const render = (deals, pagination) => {
  renderDeals(deals);
  renderPagination(pagination);
  renderLegoSetIds(deals)
};


//GESTION DES FAVORIS
const getFavorites = () => {  // Récupère les favoris depuis localStorage
  const favorites = localStorage.getItem('favorites');
  return favorites ? JSON.parse(favorites) : [];
};

const toggleFavorite = (uuid) => { // Ajoute ou supprime un deal des favoris
  const favorites = getFavorites();
  if (favorites.includes(uuid)) { //retire
    const updatedFavorites = favorites.filter(fav => fav !== uuid);
    localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
  } else { //ajoute
    favorites.push(uuid);
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }
};

const checkIfFavorite = (uuid) => { // Vérifie si un deal est favori
  const favorites = getFavorites();
  return favorites.includes(uuid);
};
