const fs = require('fs');
const { connectDB } = require('./db'); // adapte le chemin si besoin

(async () => {
  try {
    const db = await connectDB();
    const collection = db.collection('vinted');

    console.log('📦 Fetching Vinted data from MongoDB...');
    const data = await collection.find({}).toArray();

    fs.writeFileSync('vinted.json', JSON.stringify(data, null, 2), 'utf-8');
    console.log(`✅ Exported ${data.length} items to vinted.json`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to export data:', err.message);
    process.exit(1);
  }
})();
