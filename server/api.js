const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');

const {
  findBestDiscountDeals,
  findMostCommentedDeals,
  findDealsSortedByPrice,
  findDealsSortedByDate,
  findSalesForLegoSetId,
  findRecentSales,
  findDealByLegoId,
  connectDB
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



app.get('/deals/search', async (req, res) => {
  const { limit = 12, filterBy, page = 1, price, date } = req.query; // Ajout de `price` et `date`
  try {
    let deals = [];

    // Choix du filtre
    if (filterBy === 'best-discount') {
      deals = await findBestDiscountDeals();
    } else if (filterBy === 'most-commented') {
      deals = await findMostCommentedDeals();
    } else if (filterBy === 'price-asc' || filterBy === 'price-desc') {
      deals = await findDealsSortedByPrice();

      // Tri par prix
      deals = deals.sort((a, b) => {
        if (a.price == null) return 1; // Place les `null` ou `N/A` en dernier
        if (b.price == null) return -1;
        return filterBy === 'price-asc' ? a.price - b.price : b.price - a.price;
      });
    } else if (filterBy === 'date-asc' || filterBy === 'date-desc') {
      deals = await findDealsSortedByDate();

      // Tri par date
      deals = deals.sort((a, b) => {
        const dateA = new Date(a.publishedAt || a.published);
        const dateB = new Date(b.publishedAt || b.published);

        if (!a.publishedAt) return 1; // Place les `null` ou `N/A` en dernier
        if (!b.publishedAt) return -1;
        return filterBy === 'date-asc' ? dateA - dateB : dateB - dateA;
      });
    }

    // Filtres supplémentaires
    if (price) deals = deals.filter(d => d.price && d.price <= parseFloat(price)); // Vérification de `price`
    if (date) {
      const dateLimit = new Date(date);
      deals = deals.filter(d => new Date(d.publishedAt || d.published) >= dateLimit);
    }

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);

    const paginatedDeals = deals.slice(startIndex, endIndex);

    res.json({
      pagination: {
        currentPage: deals.length > 0 ? parseInt(page) : 1,
        totalPages: Math.max(1, Math.ceil(deals.length / limit)),
        totalResults: deals.length,
      },
      results: paginatedDeals,
    });
  } catch (error) {
    console.error('❌ Error GET /deals/search', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

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


app.get('/deals/lego/:legoId', async (req, res) => {
  const legoId = req.params.legoId;

  try {
    const deal = await findDealByLegoId(legoId); // Fonction dans db.js
    if (!deal) {
      console.error(`❌ Deal not found for Lego ID: ${legoId}`);
      return res.status(404).json({ error: 'Deal not found' });
    }
    res.json(deal);
  } catch (error) {
    console.error('❌ Error in /deals/lego/:legoId:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.patch('/deals/:id/favorite', async (req, res) => {
  const { id } = req.params;

  try {
    const db = await connectDB();
    const collection = db.collection('dealabs');

    const deal = await collection.findOne({ legoId: id });
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    const updatedDeal = await collection.updateOne(
      { legoId: id },
      { $set: { isFavorite: !deal.isFavorite } }
    );

    res.json({ success: true, isFavorite: !deal.isFavorite });
  } catch (error) {
    console.error('❌ Error PATCH /deals/:id/favorite', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`📡 API server running at http://localhost:${PORT}`);
});
