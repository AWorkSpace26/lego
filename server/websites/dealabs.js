const fetch = require('node-fetch');
const cheerio = require('cheerio');
const { connectDB } = require('../db'); // MongoDB connection

const BASE_URL = 'https://www.dealabs.com/groupe/lego?page=';
const MAX_PAGES = 5; // Number of pages to scrape


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

            // 🔍 1. Tenter d'extraire l'ID LEGO du titre
            let legoId = extractLegoId(thread.title);

            // 🔍 2. Sinon, tenter depuis la description HTML
            if (!legoId && thread.descriptionHtml) {
              const descText = cheerio.load(thread.descriptionHtml).text();
              legoId = extractLegoId(descText);
            }

            // ❌ 3. Si aucun ID trouvé, on skip le deal
            if (!legoId) return;

            // 🖼 4. Image (depuis JSON ou fallback DOM)
            let imageUrl = thread.imageUrl || null;
            if (!imageUrl) {
              const imgTag = $(element).find('img.thread-image');
              imageUrl = imgTag.attr('src') || null;
            }

            // 💸 5. Calcul de la réduction
            let discount = null;
            if (price && nextBestPrice) {
              discount = Math.round(((nextBestPrice - price) / nextBestPrice) * 100);
            }

            // ✅ 6. Ajouter le deal à la liste
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
              image: imageUrl,
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


/**
 * Scrape a single page
 * @param {Number} page - Page number
 * @returns {Array} deals
 */
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

/**
 * Scrape the first few pages and store in MongoDB
 */
const scrapeFirstPages = async () => {
  console.log(`🚀 Scraping the first ${MAX_PAGES} pages...`);
  const db = await connectDB();
  const collection = db.collection('dealabs');

  // Step 1: Remove old deals
  await collection.deleteMany({});
  console.log('🗑 Old data removed!');

  let allDeals = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    const deals = await scrapePage(page);
    allDeals = allDeals.concat(deals);

    // Pause to avoid IP blocking
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  if (allDeals.length > 0) {
    // Step 2: Insert new deals
    try {
      await collection.insertMany(allDeals, { ordered: false });
      console.log(`✅ ${allDeals.length} new deals saved to MongoDB`);
    } catch (err) {
      console.error('⚠️ Some deals already exist:', err.message);
    }
  } else {
    console.log('❌ No deals found');
  }

  return allDeals; // Return deals for further use
};

/**
 * Export the scrape function for use in other files
 */
module.exports = {
  scrape: scrapeFirstPages,
};