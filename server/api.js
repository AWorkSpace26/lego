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
} = require('./db'); // Import database functions

const PORT = 8092;
const app = express();
module.exports = app;

// Middleware
app.use(cors());
app.use(helmet());
app.use(bodyParser.json());
app.options('*', cors());

// ✔️ Basic Test Route
app.get('/', (req, res) => {
  res.send({ ack: true });
});

// ✔️ Search Deals
app.get('/deals/search', async (req, res) => {
  const { limit = 12, price, date, filterBy, id } = req.query;

  try {
    // 🎯 If ID is provided → Direct search by ID
    if (id) {
      const deal = await findDealById(id);
      if (!deal) {
        return res.status(404).json({ error: 'Deal not found' });
      }

      return res.json({
        limit: 1,
        total: 1,
        results: [deal]
      });
    }

    // 🔄 Otherwise, continue with other filters
    let deals = [];

    if (filterBy === 'best-discount') {
      deals = await findBestDiscountDeals();
    } else if (filterBy === 'most-commented') {
      deals = await findMostCommentedDeals();
    } else if (date) {
      deals = await findDealsSortedByDate("desc");
    } else {
      deals = await findDealsSortedByPrice("asc");
    }

    // 🧠 Dynamic Filtering
    if (price) {
      const maxPrice = parseFloat(price);
      if (isNaN(maxPrice)) {
        return res.status(400).json({ error: 'Invalid price value' });
      }
      deals = deals.filter(d => d.price !== null && d.price <= maxPrice);
    }

    if (date) {
      const dateLimit = new Date(date);
      if (isNaN(dateLimit.getTime())) {
        return res.status(400).json({ error: 'Invalid date value' });
      }
      deals = deals.filter(d =>
        new Date(d.publishedAt || d.published) >= dateLimit
      );
    }

    const limited = deals.slice(0, parseInt(limit));

    res.json({
      limit: parseInt(limit),
      total: limited.length,
      results: limited
    });
  } catch (error) {
    console.error('❌ Error GET /deals/search:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ✔️ Search Sales
app.get('/sales/search', async (req, res) => {
  const { legoSetId, limit = 12 } = req.query;

  try {
    let sales = [];

    if (legoSetId) {
      sales = await findSalesForLegoSetId(legoSetId);
    } else {
      sales = await findRecentSales();
    }

    // Sort by descending date
    sales = sales.sort((a, b) => new Date(b.published) - new Date(a.published));

    res.json({
      limit: parseInt(limit),
      total: sales.length,
      results: sales.slice(0, parseInt(limit))
    });
  } catch (error) {
    console.error('❌ Error GET /sales/search:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`📡 API server running at http://localhost:${PORT}`);
});