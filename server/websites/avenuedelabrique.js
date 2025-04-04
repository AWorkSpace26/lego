const fetch = require('node-fetch');
const cheerio = require('cheerio');
const { connectDB } = require('../db'); // Connexion à MongoDB

/**
 * Parse webpage data response
 * @param {String} data - HTML response
 * @return {Array} deals
 */
const parse = (data) => {
  const $ = cheerio.load(data, { 'xmlMode': true });

  return $('div.prods a')
    .map((i, element) => {
      const price = parseFloat(
        $(element)
          .find('span.prodl-prix span')
          .text()
      );

      const discount = Math.abs(parseInt(
        $(element)
          .find('span.prodl-reduc')
          .text()
      ));

      return {
        title: $(element).attr('title'),
        price: price || null,
        discount: discount || null,
        link: $(element).attr('href') ? `https://www.avenuedelabrique.com${$(element).attr('href')}` : null,
      };
    })
    .get();
};

/**
 * Scrape a given URL page and store in MongoDB
 * ⚠️ Supprime d'abord les anciens deals avant d'ajouter les nouveaux
 * @param {String} url - URL à scraper
 * @returns {Array|null} deals
 */
const scrapePage = async (url) => {
  try {
    console.log(`🔍 Scraping ${url}...`);
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 10000,
    });

    if (!response.ok) {
      console.error(`❌ Erreur HTTP ${response.status} sur ${url}`);
      return [];
    }

    const body = await response.text();
    const deals = parse(body);

    if (deals.length > 0) {
      const db = await connectDB();
      const collection = db.collection('avenuedelabrique');

      // 🔥 Étape 1 : Supprime les anciens deals
      await collection.deleteMany({});
      console.log('🗑 Anciennes données supprimées !');

      // 🔥 Étape 2 : Insère les nouveaux deals
      await collection.insertMany(deals, { ordered: false }).catch((err) => {
        console.error('⚠️ Certains deals existent déjà:', err.message);
      });

      console.log('✅ Nouveaux deals enregistrés dans MongoDB');
    } else {
      console.log('❌ Aucun deal trouvé');
    }

    return deals;
  } catch (error) {
    console.error(`❌ Erreur lors du scraping de ${url}:`, error.message);
    return [];
  }
};

module.exports = { scrape: scrapePage };
