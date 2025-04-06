const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');

const {
  connectDB, // Importation de connectDB
  findBestDiscountDeals,
  findMostCommentedDeals,
  findDealsSortedByPrice,
  findDealsSortedByDate,
  findSalesForLegoSetId,
  findRecentSales,
  findDealByLegoId
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

// ✔️ Recherche de deals
app.get('/deals/search', async (req, res) => {
  const { limit = 12, price, date, filterBy, isFavorite } = req.query;

  try {
    let deals = [];

    // Choix du filtre
    if (filterBy === 'best-discount') {
      deals = await findBestDiscountDeals();
      deals = deals.sort((a, b) => {
        if (a.discount === null) return 1;
        if (b.discount === null) return -1;
        return b.discount - a.discount;
      });
    } else if (filterBy === 'most-commented') {
      deals = await findMostCommentedDeals();
      deals = deals.sort((a, b) => (b.commentCount || 0) - (a.commentCount || 0));
    } else if (date) {
      deals = await findDealsSortedByDate("desc");
    } else {
      deals = await findDealsSortedByPrice("asc");
    }

    // Filtrer uniquement les favoris si demandé
    if (isFavorite === 'true') {
      deals = deals.filter(d => d.isFavorite === true);
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

// ✔️ Récupérer un deal par Lego ID
app.get('/deals/lego/:legoId', async (req, res) => {
  const legoId = req.params.legoId;

  try {
    const deal = await findDealByLegoId(legoId);
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

// ✔️ Basculer le statut des favoris
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