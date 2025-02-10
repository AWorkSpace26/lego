const fetch = require('node-fetch');
const cheerio = require('cheerio');
const fs = require('fs').promises;

const concurrencyLimit = 5; // Nombre max de requêtes simultanées
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Parse webpage data response
 * @param {String} data - HTML response
 * @return {Array} deals
 */
const parse = (data) => {
  const $ = cheerio.load(data);
  let deals = [];

  $('div.js-vue2').each((i, element) => {
    const jsonData = $(element).attr('data-vue2');

    if (jsonData) {
      try {
        const deal = JSON.parse(jsonData);
        if (deal.props && deal.props.thread) {
          const thread = deal.props.thread;
          deals.push({
            threadId: thread.threadId,
            titleSlug: thread.titleSlug,
            commentCount: thread.commentCount,
            isExpired: thread.isExpired,
            temperature: thread.temperature,
            publishedAt: thread.publishedAt,
            link: thread.link,
            merchantName: thread.merchant ? thread.merchant.merchantName : null,
            price: thread.price,
            nextBestPrice: thread.nextBestPrice,
          });
        }
      } catch (error) {
        console.error('❌ Erreur de parsing JSON:', error.message);
      }
    }
  });

  return deals;
};

/**
 * Scrape a given URL page
 * @param {String} url - URL to parse
 * @returns {Array|null} deals
 */
const scrapePage = async (url) => {
  try {
    console.log(`🔍 Scraping ${url}...`);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      timeout: 10000, // Timeout de 10 secondes
    });

    if (!response.ok) {
      console.error(`❌ Erreur HTTP ${response.status} sur ${url}`);
      return [];
    }

    const body = await response.text();
    return parse(body);
  } catch (error) {
    console.error(`❌ Erreur lors du scraping de ${url}:`, error.message);
    return [];
  }
};

/**
 * Scrape multiple pages with concurrency control
 * @param {String} baseUrl - Base URL with pagination
 * @param {Number} totalPages - Number of pages to scrape
 * @returns {Array} allDeals
 */
const scrapeAllPages = async (baseUrl, totalPages) => {
  let allDeals = [];
  let pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  // Fonction pour traiter les pages avec une limite de concurrence
  const processPages = async () => {
    while (pages.length) {
      const page = pages.shift();
      const url = `${baseUrl}${page}`;
      const deals = await scrapePage(url);
      allDeals = allDeals.concat(deals);
      await delay(1000); // Pause de 1s entre les requêtes
    }
  };

  // Exécuter les tâches avec une concurrence limitée
  const workers = Array.from({ length: concurrencyLimit }, processPages);
  await Promise.all(workers);

  // Sauvegarde des résultats dans un fichier JSON
  try {
    await fs.writeFile('deals.json', JSON.stringify(allDeals, null, 2));
    console.log('✅ Scraping terminé, données enregistrées dans deals.json');
  } catch (error) {
    console.error('❌ Erreur lors de l\'enregistrement du fichier:', error.message);
  }
};

module.exports = {
  scrape: scrapePage,  
  scrapeAllPages
};

