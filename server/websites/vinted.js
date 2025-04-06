const fs = require('fs');
const fetch = require('node-fetch');
const { connectDB } = require('../db'); 

const LEGO_IDS_FILE = './data.json';
const OUTPUT_FILE = './vinted_results.json';
const BASE_URL = 'https://www.vinted.fr/api/v2/catalog/items?page=1&per_page=96&search_text=';



const HEADERS = {
  'accept': 'application/json, text/plain, */*',
  'accept-language': 'fr',
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36 Edg/134.0.0.0',
  'x-anon-id': 'eb482041-876a-4c84-a88c-4d7f1a49c172',
  'x-csrf-token': '75f6c9fa-dc8e-4e52-a000-e09dd4084b3e',
  'x-money-object': 'true',
  'cookie': 'v_udt=ZjVUWk5YWjZCcnlyMGczRm1rRllOZ3pNM0U4Ti0tV0h4a29VZVliRFpNM2FuUC0tWlo2ZUJ6Uzd4UTB2Z2QrUWtNdzkrZz09; anon_id=eb482041-876a-4c84-a88c-4d7f1a49c172; access_token_web=eyJraWQiOiJFNTdZZHJ1SHBsQWp1MmNObzFEb3JIM2oyN0J1NS1zX09QNVB3UGlobjVNIiwiYWxnIjoiUFMyNTYifQ.eyJhcHBfaWQiOjQsImNsaWVudF9pZCI6IndlYiIsImF1ZCI6ImZyLmNvcmUuYXBpIiwiaXNzIjoidmludGVkLWlhbS1zZXJ2aWNlIiwiaWF0IjoxNzQzOTY0MzI4LCJzaWQiOiIwZDkzY2Y3ZC0xNzQzOTY0MzI4Iiwic2NvcGUiOiJwdWJsaWMiLCJleHAiOjE3NDM5NzE1MjgsInB1cnBvc2UiOiJhY2Nlc3MifQ.FJUUV0d6zojMzR8VSgOq2o2oTlSD4Ii5Srs1B1xiY1b3r1T1JPYO2tiNV3pazl8nFGqyWEIqPB9s7y0CdT5LC24LO9lZTWu9vQfbt1JCB8Wm-u2YhFKMq04wmnXnjatpNIUra56XlfVIYGs1Xe-NeA5vHovCJvB3U38JteTpdl7ttAtNZ60qnTjy5vm16UrXa7kvcbJbpeE5iG5kRYxlWvbkr-JbOaSq0sUE6l492tZpI5UgUF9IN2eq7dPZSOuyaVb8D3QtmETvotW-M8gKMt5tBbb-EdFdWx5kTx1igE6-pFYBU_KUhs10ztCuZoZ_mWm-EpO3B833bp4jB5O5Gg; refresh_token_web=eyJraWQiOiJFNTdZZHJ1SHBsQWp1MmNObzFEb3JIM2oyN0J1NS1zX09QNVB3UGlobjVNIiwiYWxnIjoiUFMyNTYifQ.eyJhcHBfaWQiOjQsImNsaWVudF9pZCI6IndlYiIsImF1ZCI6ImZyLmNvcmUuYXBpIiwiaXNzIjoidmludGVkLWlhbS1zZXJ2aWNlIiwiaWF0IjoxNzQzOTY0MzI4LCJzaWQiOiIwZDkzY2Y3ZC0xNzQzOTY0MzI4Iiwic2NvcGUiOiJwdWJsaWMiLCJleHAiOjE3NDQ1NjkxMjgsInB1cnBvc2UiOiJyZWZyZXNoIn0.QUE2qA9undaykukOGb16dNRQiy-lDLIGv6H_OZJTNbR8QrbxcOrbcM3EoNsT2Ys9Wll6PYCkuRv4f4rwr-6-mnapJ3ZjaefY9xnvrVaPIUeOjr_CqnyYgA7w73MtsmQ6r-v5nNtVd28mp0d0Wc4A9cyKADv2qMuxb7erjf7CPltNf3UZ5R4HGjq2E6vcLxgPHjaFK5iKzt2yOrF9Ywc3YFzbX4lWdkRAQECDuV4FqxqnP-xfymXEC3Qg8l8q6C2DC4kNo4etgGUVJvJsehk3GvIs2KL5wseRqvRpZDajJdYDGZVVCEegjgiDaFjNcajc4vVx5dCBvkhhSAcK5izgkA; anon_id=eb482041-876a-4c84-a88c-4d7f1a49c172; v_sid=d93ba76cd42317d83fadece6f5c33c7a; OptanonAlertBoxClosed=2025-04-06T18:32:10.741Z; eupubconsent-v2=CQPcI7AQPcI7AAcABBENBkFgAAAAAAAAAChQAAAAAAFhIIAACAAFwAUABUADgAHgAQQAyADUAHgATAAqgBvAD0AH4AQkAhgCJAEcAJYATQArQBhwDKAMsAbIA74B7AHxAPsA_QCAAEUgIuAjEBGgEcAKCAVAAq4BcwDFAGiANoAbgA4gCHQEiAJ2AUOAo8BSICmwFsALkAXeAvMBhoDJAGTgMuAZzA1gDWQGxgNvAbqA5MBy4DxwHtAQhAheEAOAAOABIAOcAg4BPwEegJFASsAm0BT4CwgF5AMQAYtAyEDIwGjANTAbQA24BugD5AH7gQEAgZBBEEEwIMAQrAhcOAXAAIgAcAB4AFwASAA_ADQAOcAdwBAICDgIQAT8AqABegDpAIQAR6AkUBKwCYgEygJtAUgApMBXYC1AGIAMWAZCAyYBowDTQGpgNeAbQA2wBtwDj4HOgc-A-IB9sD9gP3AgeBBECDAEGwIVjoJYAC4AKAAqABwAEAALoAZABqADwAJgAVYAuAC6AGIAN4AegA_QCGAIkARwAlgBNACjAFaAMMAZQA0QBsgDvAHtAPsA_YCKAIwARwAoIBVwCxAFzALyAYoA2gBuADiAHUAQ6Ai8BIgCZAE7AKHAUfApoCmwFWALFAWwAuABcgC7QF3gLzAX0Aw0BjwDJAGTgMqgZYBlwDOQGqgNYAbeA3UBxYDkwHLgPHAe0A-sCAIELSABIABAAaABzgFiAR6Am0BSYC8gGpgNsAbcA58B8QD9gIHgQYAg2BCshAcAAWABQAFwAVQAuABiADeAHoAd4BFACOAEpAKCAVcAuYBigDaAHUgU0BTYCxQFogLgAXIAycBnIDVQHjgQtJQIwAEAALAAoABwAHgATAAqgBcADFAIYAiQBHACjAFaANkAd4A_ACOAFXAMUAdQBDoCLwEiAKPAU2AsUBbAC8wGTgMsAZyA1gBt4D2gIHkgBwAFwB3AEAAKgAj0BIoCVgE2gKTAYsA3IB-4EEQIMFIGwAC4AKAAqABwAEEAMgA0AB4AEwAKoAYgA_QCGAIkAUYArQBlADRAGyAO-AfYB-gEWAIwARwAoIBVwC5gF5AMUAbQA3ACHQEXgJEATsAocBTYCxQFsALgAXIAu0BeYC-gGGgMkAZPAywDLgGcwNYA1kBt4DdQHJgPHAe0BCECFpQA-ABcAEgAjgBzgDuAIAASIAsQBrwDtgH_AR6AkUBMQCbQFIAKfAV2AvIBiwDJgGpgNeAfFA_YD9wIGAQPAgmBBgCDYEKy0AEBTYAA.YAAAAAAAAAAA; OTAdditionalConsentString=1~; domain_selected=true; __cf_bm=3y2biDRk.ZadIvLEEE0PU_zIpk9.F6vK8Xq72YxTQLc-1743968181-1.0.1.1-X_FTDKWZMmhgG_iGEuMYd6nqSawq0mwRU5t5uL9OGAmkSACbRzwKcQVigGLeOsl3bo4fd0OHLDyblxGcx6AsKJGElXTMwU0rip2EaidmViav2qaf23BCnhIvCtKAWy87; cf_clearance=No64rNMABpA1ZhJhPpHzHr7dVZnNo8A5ivAEPx9dhVQ-1743968181-1.2.1.1-I1FdCNZkUqzkxDzse7SfBvsJOo1eh4WhMLCALRPeNy7XcuvsReG9MdU4PaUIO32YIRISmQU7enYFLiyXe7grW8zmgAOeGW5UCPQ8mRoI22DZ8g0gpZoa.1XzLdHIGfkD5YvQK.d1P6cK104qWpwEVqsS.GpZe68uvF1tWukktucRpHl8ChaEGyzkoj6OXXuiJjsWdJGdAK6XzAAQxCNqHC7bIirJoB4T7fWBjdGZZliHXyP6Z7Mco64KF9bYKrCXsPYt_y9VBVZ3NwcI8x99rbwM.nS8Lr06yqP8GI26zOxz_2ncwkoAkQKuTaNq0qLmVqzqqTRB6x7fSbZ00Q8Ywd0bcsbmU905lH9ReuXAn0o; viewport_size=356; OptanonConsent=isGpcEnabled=0&datestamp=Sun+Apr+06+2025+21%3A37%3A33+GMT%2B0200+(heure+d%E2%80%99%C3%A9t%C3%A9+d%E2%80%99Europe+centrale)&version=202312.1.0&browserGpcFlag=0&isIABGlobal=false&consentId=eb482041-876a-4c84-a88c-4d7f1a49c172&interactionCount=12&hosts=&landingPath=NotLandingPage&groups=C0001%3A1%2CC0002%3A0%2CC0003%3A0%2CC0004%3A0%2CC0005%3A0%2CV2STACK42%3A0%2CC0015%3A0%2CC0035%3A0&genVendors=V2%3A0%2CV1%3A0%2C&geolocation=FR%3BIDF&AwaitingReconsent=false; datadome=5aVd2PoJuR~ADwDhH9vfPfdQTGA6bQPB2~QFM9~wHkjCa1uqXuqKxFfWGV1qmO3mFs2IIQec2G0AUwX~zy4pQ~Fa1kc30czxX2s3_7_CpDTlppBMi0FQ140DU~xV8iGa; _vinted_fr_session=OWF6N1M4UmQrODE0WDRyK0xoMjZ0YjQ4WnpYU05DZklnTnMvNjVxQXU2bDB5RTExYUxtMlZ6OE5LQmdWdWF2VEIxSjJWRnlrcC9OWG5zZ3ZHbG1qRWhWbEhXSmliVTYyS0NVRjBzQVd4NzlaZ0V3YW9aVjMzREx3eTYwT3RJbGVOWW4yVlRkNnN4K0Y0cUdRTGNuMkdhUXVtOXJXSE5kTGtGVlIzbzliUmMvSkVnempkbEl4NWFWc2N5Yk0yenhJVE9vTDhWUzdEU0dLUUlzbC9Oc1QwMzF3bzIyeVg5dVNWeGltTnVZVFdFRG16Uy9wbVZzRlhqdUpZVzVlWllwbS0tWjBxUzg1Q1RnNnBTS0hWbGppbksyQT09--67e3ee09c9ca1858b29505be662c59d7368cb887; banners_ui_state=PENDING', // <-- copie ici exactement ce que tu as récupéré
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36 Edg/134.0.0.0',
  'referer': 'https://www.vinted.fr/catalog?search_text=42151'
};

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

const getLegoIds = () => {
  const raw = fs.readFileSync(LEGO_IDS_FILE, 'utf8');
  return [...new Set(JSON.parse(raw))]; // remove duplicates
};

const fetchVintedResults = async (legoId) => {
  const url = `${BASE_URL}${legoId}`;
  try {
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) {
      console.error(`❌ Failed to fetch ${legoId} (HTTP ${res.status})`);
      return [];
    }

    const json = await res.json();
    const items = json.items || [];

    return items.map(item => ({
      legoId,
      vintedId: item.id,
      title: item.title,
      url: `https://www.vinted.fr${item.path}`,
      price: parseFloat(item.price.amount),
      currency: item.price.currency_code,
      totalPrice: item.total_item_price?.amount || null,
      condition: item.status,
      size: item.size_title,
      image: item.photo?.url || null,
      seller: {
        id: item.user.id,
        login: item.user.login,
        profile: item.user.profile_url
      },
      createdAt: new Date() // timestamp pour suivi
    }));
  } catch (err) {
    console.error(`❌ Error fetching ${legoId}:`, err.message);
    return [];
  }
};

const scrapeVinted = async () => {
  console.log('🚀 Scraping Vinted for LEGO sets...');
  const legoIds = getLegoIds();
  const db = await connectDB();
  const collection = db.collection('vinted'); // Assurez-vous que 'vinted' est la bonne collection

  await collection.deleteMany({});
  console.log(`🗑 Old Vinted data in "${'vinted'}" removed.`);

  let allItems = [];

  for (const id of legoIds) {
    console.log(`🔍 Searching LEGO ID: ${id}`);
    const results = await fetchVintedResults(id);
    allItems.push(...results);
    await delay(1000); // éviter throttling
  }

  if (allItems.length > 0) {
    try {
      await collection.insertMany(allItems, { ordered: false });
      console.log(`✅ ${allItems.length} items saved in MongoDB under "${'vinted'}"`);
    } catch (e) {
      console.error('⚠️ Some insert errors:', e.message);
    }
  } else {
    console.log('❌ No items to save');
  }

  return allItems;
};

module.exports = {
  scrape: scrapeVinted  // ou juste `scrape` si tu l'as nommé comme ça
};
