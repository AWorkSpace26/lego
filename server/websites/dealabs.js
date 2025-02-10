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
      // 🔹 1. Extraire le titre du deal
      const title = $(element).find('a.cept-tt.thread-link').text().trim();

      // 🔹 2. Extraire le lien du deal (corrigé pour éviter la duplication)
      let link = $(element).find('a.cept-tt.thread-link').attr('href');
      if (link && !link.startsWith('https')) {
        link = `https://www.dealabs.com${link}`;
      }

      // 🔹 3. Extraire le prix (nouvelle méthode plus robuste)
      let priceText = $(element).find('.thread-price').text().trim();
      let price = priceText.match(/(\d+[\.,]?\d*)/);
      price = price ? parseFloat(price[0].replace(',', '.')) : null;

      // 🔹 4. Extraire la réduction (nouvelle méthode)
      let discountText = $(element).find('.textBadge--green').text().trim();
      let discount = discountText.match(/-?(\d+)%/);
      discount = discount ? parseInt(discount[1]) : null;

      // 🔹 5. Extraire le nombre de commentaires (nouvelle méthode)
      let commentsText = $(element).find('a[title="Commentaires"]').text().trim();
      let comments = commentsText.match(/(\d+)/);
      comments = comments ? parseInt(comments[0]) : 0;

      return {
        title,
        price,
        discount,
        comments,
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


