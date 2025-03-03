const fetch = require('node-fetch');
const cheerio = require('cheerio');
const fs = require('fs');

/**
 * Parse webpage data response
 * @param  {String} data - html response
 * @return {Object} deal
 */
const parse = data => {
  const $ = cheerio.load(data, {'xmlMode': true});

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
        discount,
        price,
        'title': $(element).attr('title'),
      };
    })
    .get();
};

/**
 * Scrape a given url page
 * @param {String} url - url to parse
 * @returns 
 */
module.exports.scrape = async url => {
  const response = await fetch(url);
  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`❌ Erreur lors du scraping: ${response.statusText}`);
      return null;
    }

    const body = await response.text();
    const deals = parse(body);

    fs.writeFileSync('data_avenudelabrique.json', JSON.stringify(deals, null, 2));
    console.log('✅ Données scrappées et enregistrées dans data.json');

    return deals;
  } catch (error) {
    console.error('❌ Erreur lors du scraping:', error);
    return null;
  } 
};