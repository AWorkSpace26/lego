const { MongoClient } = require('mongodb');
const fs = require('fs');

const MONGODB_URI = 'mongodb+srv://User:PasswordTest@cluster0.lktut.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const MONGODB_DB_NAME = 'lego';

let db; // Stocke la connexion MongoDB

/**
 * Connecte à MongoDB et retourne l'objet db
 */
const connectDB = async () => {
  if (db) return db; // Si déjà connecté, on renvoie la connexion existante

  console.log('🕵️‍♂️ Connexion à MongoDB...');
  const client = await MongoClient.connect(MONGODB_URI);
  db = client.db(MONGODB_DB_NAME);
  console.log('✅ Connexion réussie à MongoDB Atlas');
  return db;
};

/**
 * Insère les données de `data_avenudelabrique.json` dans MongoDB
 */
const saveAvenueDeals = async () => {
  try {
    const db = await connectDB();

    // 🔹 Vérifie si le fichier JSON existe
    if (!fs.existsSync('data_avenudelabrique.json')) {
      console.error('❌ Fichier data_avenudelabrique.json introuvable.');
      return;
    }

    // 🔹 Lit les données du fichier JSON
    const rawData = fs.readFileSync('data_avenudelabrique.json');
    const deals = JSON.parse(rawData);

    if (!Array.isArray(deals) || deals.length === 0) {
      console.error('❌ Fichier JSON vide ou incorrect.');
      return;
    }

    // 🔹 Insère les deals dans MongoDB
    const collection = db.collection('deals');
    await collection.insertMany(deals);
    console.log(`✅ ${deals.length} deals insérés dans MongoDB depuis data_avenudelabrique.json`);
  } catch (error) {
    console.error('❌ Erreur lors de l’insertion des deals:', error);
  }
};

// 🚀 Test automatique si on exécute `node db.js`
if (require.main === module) {
  (async () => {
    await saveAvenueDeals();
    process.exit(0); // Quitte après le test
  })();
}

// 🔄 Exporte la connexion et l'insertion des données
module.exports = { connectDB, saveAvenueDeals };
