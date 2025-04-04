const fetch = require('node-fetch');
const cheerio = require('cheerio');
const { connectDB } = require('../db'); // Connexion MongoDB

const BASE_URL = 'https://www.dealabs.com/groupe/lego?page=';

/**
 * Récupère dynamiquement le nombre total de pages depuis Dealabs
 * @returns {Number} Nombre total de pages à scraper
 */
const getTotalPages = async () => {
  try {
    const url = `${BASE_URL}1&hide_expired=true`; // On commence par la première page
    console.log(`🔍 Récupération du nombre total de pages depuis ${url}...`);
    
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!response.ok) {
      console.error(`❌ Erreur HTTP ${response.status} sur ${url}`);
      return 1; // On retourne au moins 1 page par défaut
    }

    const body = await response.text();
    const $ = cheerio.load(body);

    // 🔥 Sélectionne le bouton qui contient le dernier numéro de page
    try {
      
  
      console.log(`Nombre total de pages : ${totalPages}`);
  } catch (error) {
      console.error("Erreur lors de la récupération du nombre total de pages :", error);
  }
  

    console.log(`✅ Nombre total de pages trouvé : ${totalPages}`);
    return totalPages;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération du nombre de pages:', error.message);
    return 1; // Si erreur, on scrape au moins 1 page
  }
};

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

          // 📌 On ignore les deals expirés
          if (!thread.isExpired) {
            deals.push({
              threadId: thread.threadId,
              title: thread.titleSlug,
              commentCount: thread.commentCount || 0,
              temperature: thread.temperature || 0,
              publishedAt: new Date(thread.publishedAt * 1000),
              link: thread.link.startsWith('https') ? thread.link : `https://www.dealabs.com${thread.link}`,
              merchantName: thread.merchant ? thread.merchant.merchantName : null,
              price: thread.price || null,
              nextBestPrice: thread.nextBestPrice || null,
            });
          }
        }
      } catch (error) {
        console.error('❌ Erreur de parsing JSON:', error.message);
      }
    }
  });

  return deals;
};

/**
 * Scrape a single page
 * @param {Number} page - Numéro de page
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
 * Scrape toutes les pages dynamiquement et stocke dans MongoDB
 */
const scrapeAllPages = async () => {
  console.log(`🚀 Détection du nombre de pages avant scraping...`);
  const totalPages = await getTotalPages(); // 🔥 Récupère dynamiquement le nombre de pages

  console.log(`🚀 Scraping de ${totalPages} pages...`);
  const db = await connectDB();
  const collection = db.collection('dealabs');

  // 🔥 Étape 1 : Supprime tous les anciens deals
  await collection.deleteMany({});
  console.log('🗑 Anciennes données supprimées !');

  let allDeals = [];

  for (let page = 1; page <= totalPages; page++) {
    const deals = await scrapePage(page);
    allDeals = allDeals.concat(deals);
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Pause pour éviter le blocage IP
  }

  if (allDeals.length > 0) {
    // 🔥 Étape 2 : Insère les nouveaux deals
    await collection.insertMany(allDeals, { ordered: false }).catch((err) => {
      console.error('⚠️ Certains deals existent déjà:', err.message);
    });

    console.log(`✅ ${allDeals.length} nouveaux deals enregistrés dans MongoDB`);
  } else {
    console.log('❌ Aucun deal trouvé');
  }

  return allDeals; // ⬅️ Retourne les deals pour `sandbox.js`
};

/**
 * Permet à `sandbox.js` d'utiliser `scrapeAllPages()`
 */
module.exports = {
  scrape: scrapeAllPages,
};
