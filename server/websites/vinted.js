const fetch = require('node-fetch');
const fs = require('fs').promises;

/**
 * Parse the Vinted API response
 * @param {Object} data - JSON response from the Vinted API
 * @return {Array} extracted deals
 */
const parse = (data) => {
  const items = data.items || [];
  return items.map(item => ({
    id: item.id,
    title: item.title,
    price: item.price,
    discount: item.discount || 0,
    url: `https://www.vinted.fr/items/${item.id}`,
    photo: item.photos?.[0]?.url || null,
    total_item_price: item.total_item_price,
    status: item.status,
    user: {
      id: item.user?.id,
      login: item.user?.login,
      profile_url: item.user?.profile_url,
      photo: item.user?.photo?.url || null
    }
  }));
};

const productCode1 = '42151';  // Exemple de code produit LEGO
const userAgent1 = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 Edg/132.0.0.0';  
const cookie1 = "v_udt=b2E1Y0hEUlFDNjJEcGNWSThCNnNSaSsxRzN5OC0tNjAyc20zenlnSi91NTdTaC0tWEtFMzZNZzJBODBpZWRHZnkwai9GZz09; anonymous-locale=fr; anon_id=1acdd525-965e-458d-bf55-a7c90d80aa83; OptanonAlertBoxClosed=2025-01-27T12:04:57.501Z; eupubconsent-v2=CQL43BgQL43BgAcABBENBaFgAAAAAAAAAChQAAAAAAFBIIQACAAFwAUABUADgAHgAQQAyADUAHgARAAmABVADeAHoAPwAhIBDAESAI4ASwAmgBWgDDgGUAZYA2QB3wD2APiAfYB-gEAAIpARcBGACNAFBAKgAVcAuYBigDRAG0ANwAcQBDoCRAE7AKHAUeApEBTYC2AFyALvAXmAw0BkgDJwGXAM5gawBrIDYwG3gN1AcEA5MBy4DxwHtAQhAheEAOgAOABIAOcAg4BPwEegJFASsAm0BT4CwgF5AMQAYtAyEDIwGjANTAbQA24BugDygHyAP3AgIBAyCCIIJgQYAhWBC4cAwAARAA4ADwALgAkAB-AGgAc4A7gCAQEHAQgAn4BUAC9AHSAQgAj0BIoCVgExAJlATaApABSYCuwFqALoAYgAxYBkIDJgGjANNAamA14BtADbAG3AOPgc6Bz4DygHxAPtgfsB-4EDwIIgQYAg2BCsdBLAAXABQAFQAOAAgABdADIANQAeABEACYAFWALgAugBiADeAHoAP0AhgCJAEsAJoAUYArQBhgDKAGiANkAd4A9oB9gH6AP-AigCMAFBAKuAWIAuYBeQDFAG0ANwAcQA6gCHQEXgJEATIAnYBQ4Cj4FNAU2AqwBYoC2AFwALkAXaAu8BeYC-gGGgMeAZIAycBlUDLAMuAZyA1UBrADbwG6gOLAcmA5cB44D2gH1gQBAhaQAJgAIADQAOcAsQCPQE2gKTAXkA1MBtgDbgHPgPKAfEA_YCB4EGAINgQrIQHQAFgAUABcAFUALgAYgA3gB6AEcAO8Af4BFACUgFBAKuAXMAxQBtADqQKaApsBYoC0QFwALkAZOAzkBqoDxwIWkoEQACAAFgAUAA4ADwAIgATAAqgBcADFAIYAiQBHACjAFaANkAd4A_ACrgGKAOoAh0BF4CRAFHgLFAWwAvMBk4DLAGcgNYAbeA9oCB5IAeABcAdwBAACoAI9ASKAlYBNoCkwGLANyAeUA_cCCIEGCkDgABcAFAAVAA4ACCAGQAaAA8ACIAEwAKQAVQAxAB-gEMARIAowBWgDKAGiANkAd8A-wD9AIsARgAoIBVwC5gF5AMUAbQA3ACHQEXgJEATsAocBTYCxQFsALgAXIAu0BeYC-gGGgMkAZPAywDLgGcwNYA1kBt4DdQHBAOTAeOA9oCEIELSgCEAC4AJABHADnAHcAQAAkQBYgDXgHbAP-Aj0BIoCYgE2gKQAU-ArsBdAC8gGLAMmAamA14B5QD4oH7AfuBAwCB4EEwIMAQbAhW.YAAAAAAAAAAA; OTAdditionalConsentString=1~; access_token_web=eyJraWQiOiJFNTdZZHJ1SHBsQWp1MmNObzFEb3JIM2oyN0J1NS1zX09QNVB3UGlobjVNIiwiYWxnIjoiUFMyNTYifQ.eyJhcHBfaWQiOjQsImNsaWVudF9pZCI6IndlYiIsImF1ZCI6ImZyLmNvcmUuYXBpIiwiaWF0IjoxNzM5MjAxNDAxLCJzaWQiOiIzZTU4ZTVhYS0xNzM5MjAxNDAxIiwic2NvcGUiOiJwdWJsaWMiLCJleHAiOjE3MzkyMDg2MDEsInB1cnBvc2UiOiJhY2Nlc3MifQ.WhsE5O4cfP9oLjaODLR0GMHW06lqEqezJawnWzEsWAGerGJ_RNEu9sweh_lt_LtS7yHK_8vPOWn2MAbBUmL4nqh3Mc0OtbeFC0eOdczNAiTmR_bn2EriK6cEs5-2V_2XnXUFObDljmtekEEZi6V4wr69nPN_0kinVK57lR-5nxtJgTKlWn8MFUhid_wAkPZ84OHnDZWvjvaFmuTmZMng1qvSL22Cnr18_aYcuQ_LQXOH64CpcAZzGeO8OFEZ_YWAxXm-QxCfnXdnmuibm0AC4KG4XeriIyf3gj4L6kc9P14SExe3NJkfUcdLx0VuAZE7g92kyy8ECRMiAHjfYl4VAg; refresh_token_web=eyJraWQiOiJFNTdZZHJ1SHBsQWp1MmNObzFEb3JIM2oyN0J1NS1zX09QNVB3UGlobjVNIiwiYWxnIjoiUFMyNTYifQ.eyJhcHBfaWQiOjQsImNsaWVudF9pZCI6IndlYiIsImF1ZCI6ImZyLmNvcmUuYXBpIiwiaWF0IjoxNzM5MjAxNDAxLCJzaWQiOiIzZTU4ZTVhYS0xNzM5MjAxNDAxIiwic2NvcGUiOiJwdWJsaWMiLCJleHAiOjE3Mzk4MDYyMDEsInB1cnBvc2UiOiJyZWZyZXNoIn0.fYQKnsSeMyy_u18jiHtVfDtB8FrwpyiXY-rjeI3vs8q4-zyHLYMsp7myuqrN-k_mRzx41id4VHahDLwUs58mQKAqv4iZKSrC8DV2lXqdiU0WH4sMlmGa-MpRO676hbnsoqElRqbpRtjeZRXkKksuQGR3ohWHTMFe0FP0R3RmR8lqTNbZDfNI6h_RE40OzadE_O6gpxEdO41R6Fzq0YLxTEBylzE_r3uECFKoePYiB0qR9WvNmYZY033o2iiRPoZrnTjhNiERa8MDj_k7PdqBF2tn5jtzBqcOAcvwtfuVTG-7ZlIxoOKsZaI5MZ6VpX2VadBHEheo3i_z8eWegFrWbg; v_sid=d1f74ff8ac866d1e2fc23a98a7a08fbb; __cf_bm=Buxq2e2MUIkoIcDnY1y7U15ffmxHlJxKfuNyh_fYRCs-1739201401-1.0.1.1-tAQnEUQjFv6h5Q6U.3_islJdhY5PPeg1v_LQXIB4tVVhCTiMuH_I9y0Lv68N0A78ImN.4NiIJhVnRfC2VL8ZnVXX.AbBVQglqIvOreDmxp0; cf_clearance=qpyALwjvMYdJH0NVGRIHMjrcfyrVA3bOJZSmc3aXsQA-1739201406-1.2.1.1-Lmpslx34PiBBUlxKxT2jgy8ie3ZYJMDVMSUT4VoL3q1HE7hCFeb5x4CHAjz2NcuBfj56ks8mrbfm0dDMnQUI3ds5zyzr51MnY7yapBmgNY_0EnPs6orKi2Ho6_BigWio0f0u86XsNYX_DWDxbvsQe6stk84lTBWHh8m3Y1PkUSDCs0vFKOg.rvUjjIBc7bWqvYlqCYCzoK6FMqnO1ki8kFDSLQidWzP9thAHfLzxayZ9roRc6G91KHi08pWoDf4t2A9prA4nnOZP4ZLeYfIgV.eEyZ2LRCxL4iZyGbwML8s; v_sid=6ef23e75f93b52aeaf82e093bb991d62; viewport_size=730; datadome=ZcH3BeIsD7kpdciMrD9HeiehdE5LK8RbcIAx4Gk77lsEwzTYFDkowmTBNjHN8dDPgGQwNs4nq6xioIvyWDoPA~cGpU9RzDLzJkCGcVJ7SbeTahgSo0tMRtudHXZVgHeR; OptanonConsent=isGpcEnabled=0&datestamp=Mon+Feb+10+2025+16%3A30%3A35+GMT%2B0100+(heure+normale+d%E2%80%99Europe+centrale)&version=202312.1.0&browserGpcFlag=0&isIABGlobal=false&consentId=1acdd525-965e-458d-bf55-a7c90d80aa83&interactionCount=5&hosts=&landingPath=NotLandingPage&groups=C0001%3A1%2CC0002%3A0%2CC0003%3A0%2CC0004%3A0%2CC0005%3A0%2CV2STACK42%3A0%2CC0015%3A0%2CC0035%3A0&genVendors=V2%3A0%2CV1%3A0%2C&geolocation=FR%3BIDF&AwaitingReconsent=false; _vinted_fr_session=REVzTmI0WkQ3bHJrcGc2TG1pVUVlYzRvRXRIU3JLbE1Ic1RJWDFTVFlDU3FWeW16dlM4V0lFU3ZnTm1DTVk1bDN6MEZNcGF6dzA3YUxFSEk2a0VZODEweVdCL2xJaDlKSVJBZ09aMUFscEFaVGJQWXZsVWFEYVBqNVdzMVpoUjN4RW5Hc0oxZktsWGFUc09lTVBkUTVIanA1U0pIT0pTZ2IzTW52K0VweU8rbG52UXZiZ1lJUFp4NFVYakRTWTJGK1o3TGVXYlF2djhrTE9PVE1JcU90SFdoRkN5b09rUXAwQ2RodmtKOVJZYWkrTCtRRlg3RldFd1B5d0ZOV3ExKy0tY2d1ZWViWEdZQzI4Q2RzR09XN2ltdz09--24fc141ee8ee3fcfc90cb61c66cf55191289c3ba; banners_ui_state=PENDING";


/**
 * Scrape Vinted API for a given product
 * @param {String} productCode - Product code to search
 * @param {String} userAgent - User-Agent header
 * @param {String} cookie - Cookie header for authentication
 * @returns {Array|null} Extracted product data
 */
const scrape = async (productCode=productCode1, userAgent =userAgent1, cookie =cookie1) => {
  const url = `https://www.vinted.fr/api/v2/catalog/items?page=1&per_page=48&search_text=${productCode}`;
  console.log(productCode)
  const headers = {
    'User-Agent': userAgent,
    'Cookie': cookie
  };

  try {
    console.log(`🕵️‍♂️ Scraping Vinted for product: ${productCode}`);

    const response = await fetch(url, { headers });

    if (!response.ok) {
      console.error(`❌ HTTP Error ${response.status} - ${response.statusText}`);
      console.log(`🔍 Vérifie ton cookie et ton User-Agent`);
      return null;
    }

    const data = await response.json();
    return parse(data);

  } catch (error) {
    console.error(`❌ Error fetching data from Vinted:`, error.message);
    return null;
  }
};

/**
 * Scrape and save the product data to a file
 * @param {String} productCode - Product code
 * @param {String} userAgent - User-Agent header
 * @param {String} cookie - Cookie header
 */
const scrapeAndSave = async (productCode, userAgent, cookie) => {
  const deals = await scrape(productCode, userAgent, cookie);

  if (deals && deals.length > 0) {
    const fileName = `vinted_data_${productCode}.json`;
    await fs.writeFile(fileName, JSON.stringify(deals, null, 2), 'utf-8');
    console.log(`✅ Data saved in ${fileName}`);
  } else {
    console.log('❌ No data found or an error occurred.');
  }
};



// ✅ Export des fonctions pour une utilisation externe
module.exports = {
  scrape,
};
