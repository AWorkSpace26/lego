const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');

const {
  findDealById,
  findBestDiscountDeals,
  findMostCommentedDeals,
  findDealsSortedByPrice,
  findDealsSortedByDate,
  findSalesForLegoSetId,
  findRecentSales
} = require('./db'); // Toutes les fonctions de db.js

const PORT = 8092;
const app = express();
module.exports = app;

// Middleware
app.use(cors());
app.use(helmet());
app.use(bodyParser.json());
app.options('*', cors());

// ✔️ Test de base
app.get('/', (req, res) => {
  res.send({ ack: true });
});



// ✔️ Recherche avancée de deals
app.get('/deals/search', async (req, res) => {
  const { limit = 12, price, date, filterBy } = req.query;

  try {
    let deals = [];

    // Choix du filtre
    if (filterBy === 'best-discount') {
      deals = await findBestDiscountDeals();
    } else if (filterBy === 'most-commented') {
      deals = await findMostCommentedDeals();
    } else if (date) {
      deals = await findDealsSortedByDate("desc");
    } else {
      deals = await findDealsSortedByPrice("asc");
    }

    // Filtres supplémentaires
    if (price) deals = deals.filter(d => d.price && d.price <= parseFloat(price));
    if (date) {
      const dateLimit = new Date(date);
      deals = deals.filter(d => new Date(d.publishedAt || d.published) >= dateLimit);
    }

    res.json({
      limit: parseInt(limit),
      total: deals.length,
      results: deals.slice(0, limit)
    });
  } catch (error) {
    console.error('❌ Error GET /deals/search', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ✔️ Recherche de ventes
app.get('/sales/search', async (req, res) => {
  const { legoSetId, limit = 12 } = req.query;

  try {
    let sales = [];

    if (legoSetId) {
      sales = await findSalesForLegoSetId(legoSetId);
    } else {
      sales = await findRecentSales();
    }

    // Tri par date descendante
    sales = sales.sort((a, b) => new Date(b.published) - new Date(a.published));

    res.json({
      limit: parseInt(limit),
      total: sales.length,
      results: sales.slice(0, limit)
    });
  } catch (error) {
    console.error('❌ Error GET /sales/search', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ✔️ Récupérer un deal par son ID
app.get('/deals/:id', async (req, res) => {
    const dealId = req.params.id;
  
    try {
      const deal = await findDealById(dealId);
      if (!deal) return res.status(404).json({ error: 'Deal not found' });
      res.json(deal);
    } catch (error) {
      console.error('❌ Error GET /deals/:id', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

app.listen(PORT, () => {
  console.log(`📡 API server running at http://localhost:${PORT}`);
});
