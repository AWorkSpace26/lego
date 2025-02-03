/* eslint-disable no-console, no-process-exit */
const avenuedelabrique = require('./websites/avenuedelabrique');
const dealabs = require('./websites/dealabs');

async function sandbox(website = 'https://www.dealabs.com/groupe/lego') {
  try {
    console.log(`🕵️‍♀️  Browsing ${website} website`);

    let deals;
    if (website.includes('dealabs.com')) {
      deals = await dealabs.scrape(website);
    } else {
      deals = await avenuedelabrique.scrape(website);
    }

    console.log(deals);
    console.log('✅ Done');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

const [, , eshop] = process.argv;
sandbox(eshop);
