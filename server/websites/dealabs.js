const fetch = require('node-fetch');
const cheerio = require('cheerio');
const fs = require('fs');
const { connectDB } = require('../db'); // MongoDB connection

const BASE_URL = 'https://www.dealabs.com/groupe/lego?page=';
const MAX_PAGES = 5;

const extractLegoId = (text) => {
  const match = text.match(/\b\d{5}\b/);
  return match ? match[0] : null;
};

const parse = (data) => {
  const $ = cheerio.load(data);
  const deals = [];

  $('div.js-vue2').each((i, element) => {
    const jsonData = $(element).attr('data-vue2');

    if (jsonData) {
      try {
        const deal = JSON.parse(jsonData);
        if (deal.props && deal.props.thread) {
          const thread = deal.props.thread;

          if (!thread.isExpired) {
            const price = thread.price || null;
            const nextBestPrice = thread.nextBestPrice || null;

            // 1. Extraire le LEGO ID
            let legoId = extractLegoId(thread.title);
            if (!legoId && thread.descriptionHtml) {
              const descText = cheerio.load(thread.descriptionHtml).text();
              legoId = extractLegoId(descText);
            }
            if (!legoId) return;

            // 2. Calcul de la réduction
            let discount = null;
            if (price && nextBestPrice) {
              discount = Math.round(((nextBestPrice - price) / nextBestPrice) * 100);
            }

            // 3. Ajouter à la liste (sans image)
            deals.push({
              legoId: legoId,
              title: thread.titleSlug,
              commentCount: thread.commentCount || 0,
              temperature: thread.temperature || 0,
              publishedAt: new Date(thread.publishedAt * 1000),
              link: thread.link.startsWith('https') ? thread.link : `https://www.dealabs.com${thread.link}`,
              merchantName: thread.merchant ? thread.merchant.merchantName : null,
              price: price,
              nextBestPrice: nextBestPrice,
              discount: discount,
              isFavorite: false
            });
          }
        }
      } catch (error) {
        console.error('❌ Error parsing JSON:', error.message);
      }
    }
  });

  return deals;
};

const scrapePage = async (page) => {
  const url = `${BASE_URL}${page}&hide_expired=true`;
  console.log(`🔍 Scraping ${url}...`);

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 10000,
    });

    if (!response.ok) {
      console.error(`❌ HTTP Error ${response.status} on ${url}`);
      return [];
    }

    const body = await response.text();
    return parse(body);
  } catch (error) {
    console.error(`❌ Error scraping ${url}:`, error.message);
    return [];
  }
};

// ✅ Nouvelle fonction : sauvegarder les LEGO IDs dans un fichier JSON
const saveLegoIdsToFile = (deals) => {
  const legoIds = deals.map((deal) => deal.legoId);
  fs.writeFileSync('data.json', JSON.stringify(legoIds, null, 2), 'utf-8');
  console.log(`💾 ${legoIds.length} LEGO IDs saved to data.json`);
};

const scrapeFirstPages = async () => {
  console.log(`🚀 Scraping the first ${MAX_PAGES} pages...`);
  const db = await connectDB();
  const collection = db.collection('dealabs');

  await collection.deleteMany({});
  console.log('🗑 Old data removed!');

  let allDeals = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    const deals = await scrapePage(page);
    allDeals = allDeals.concat(deals);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  if (allDeals.length > 0) {
    try {
      await collection.insertMany(allDeals, { ordered: false });
      console.log(`✅ ${allDeals.length} new deals saved to MongoDB`);
    } catch (err) {
      console.error('⚠️ Some deals already exist:', err.message);
    }

    // 📦 Sauvegarde des LEGO IDs
    saveLegoIdsToFile(allDeals);
  } else {
    console.log('❌ No deals found');
  }

  return allDeals;
};

module.exports = {
  scrape: scrapeFirstPages,
};
