const fetch = require('node-fetch');
const cheerio = require('cheerio');

/**
 * Parse webpage data response from Dealabs
 * @param  {String} data - HTML response
 * @return {Array} deals - list of Lego deals
 */
const parse = data => {
  const $ = cheerio.load(data);

  return $('article.thread')
    .map((i, element) => {
      // Extraire le titre
      const title = $(element).find('a.thread-link').text().trim();

      // Extraire le lien du deal
      let link = $(element).find('a.thread-link').attr('href');
      if (link && !link.startsWith('https')) {
        link = `https://www.dealabs.com${link}`;
      }

      // Extraire le prix (parfois mal formaté)
      let priceText = $(element).find('.thread-price').first().text().trim();
      let price = priceText ? parseFloat(priceText.replace(/[^\d,.]/g, '').replace(',', '.')) : null;
      if (isNaN(price)) price = null;

      // Extraire la réduction (parfois absente)
      let discountText = $(element).find('.space--ml-1').first().text().trim();
      let discount = discountText ? parseInt(discountText.replace(/[^\d]/g, '')) : null;
      if (isNaN(discount)) discount = null;

      return {
        title,
        price,
        discount,
        link
      };
    })
    .get();
};

/**
 * Scrape a given Dealabs page
 * @param {String} url - URL of the deals page
 * @returns {Array} deals - list of scraped deals
 */
module.exports.scrape = async url => {
  try {
    console.log(`🕵️‍♀️ Scraping Dealabs: ${url}`);

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.google.com/",
        "DNT": "1",
        "Upgrade-Insecure-Requests": "1"
      }
    });

    if (!response.ok) {
      console.error(`❌ Failed to fetch ${url}: ${response.status}`);
      return null;
    }

    const body = await response.text();
    return parse(body);

  } catch (error) {
    console.error(`❌ Error while scraping Dealabs: ${error.message}`);
    return null;
  }
};

