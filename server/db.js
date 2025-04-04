const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');

const MONGODB_URI = 'mongodb+srv://User:PasswordTest@cluster0.lktut.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const MONGODB_DB_NAME = 'lego';

let db;

/**
 * Connexion à MongoDB
 */
const connectDB = async () => {
  if (db) return db;

  console.log('🕵️‍♂️ Connexion à MongoDB...');
  const client = await MongoClient.connect(MONGODB_URI);
  db = client.db(MONGODB_DB_NAME);
  console.log('✅ Connexion réussie à MongoDB Atlas');
  return db;
};

/**
 * Trouve les deals avec une température > 50
 */
const findBestDiscountDeals = async () => {
  try {
    const db = await connectDB();
    const collection = db.collection('dealabs'); // Utilisation de la collection dealabs

    const deals = await collection.find({ temperature: { $gt: 50 } }).toArray();
    console.log(`✅ ${deals.length} deals trouvés avec une température > 50`);
    return deals;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des meilleurs discounts:', error);
  }
};

/**
 * Trouve les deals les plus commentés (commentCount > 15)
 */
const findMostCommentedDeals = async () => {
  try {
    const db = await connectDB();
    const collection = db.collection('dealabs'); // Utilisation de la collection dealabs

    const deals = await collection.find({ commentCount: { $gt: 15 } }).toArray();
    console.log(`✅ ${deals.length} deals trouvés avec plus de 15 commentaires`);
    return deals;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des deals les plus commentés:', error);
  }
};

/**
 * Trie les deals par prix (ascendant ou descendant)
 * @param {String} order - "asc" pour ascendant, "desc" pour descendant
 */
const findDealsSortedByPrice = async (order = "asc") => {
  try {
    const db = await connectDB();
    const collection = db.collection('dealabs'); // Utilisation de la collection dealabs

    const sortOrder = order === "asc" ? 1 : -1;
    const deals = await collection.find().sort({ price: sortOrder }).toArray();

    console.log(`✅ Deals triés par prix (${order})`);
    return deals;
  } catch (error) {
    console.error('❌ Erreur lors du tri des deals par prix:', error);
  }
};

/**
 * Trie les deals par date (ascendant ou descendant)
 * @param {String} order - "asc" pour ascendant, "desc" pour descendant
 */
const findDealsSortedByDate = async (order = "asc") => {
  try {
    const db = await connectDB();
    const collection = db.collection('dealabs'); // Utilisation de la collection dealabs

    const sortOrder = order === "asc" ? 1 : -1;
    const deals = await collection.find().sort({ publishedAt: sortOrder }).toArray();

    console.log(`✅ Deals triés par date (${order})`);
    return deals;
  } catch (error) {
    console.error('❌ Erreur lors du tri des deals par date:', error);
  }
};

/**
 * Trouve un deal spécifique par ID
 * @param {String} dealId - ID du deal à rechercher
 */
const findDealById = async (dealId) => {
  try {
    const db = await connectDB();
    const collection = db.collection('dealabs'); // Utilisation de la collection dealabs

    // 🔹 Convertir en ObjectId uniquement si l'ID est valide
    let query = { _id: dealId };
    if (ObjectId.isValid(dealId)) {
      query = { _id: ObjectId.createFromHexString(dealId) };
    }

    const deal = await collection.findOne(query);
    if (!deal) {
      console.log(`❌ Aucun deal trouvé avec l'ID ${dealId}`);
      return null;
    }

    console.log(`✅ Deal trouvé avec l'ID ${dealId}`);
    return deal;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération du deal par ID:', error);
  }
};

/**
 * Trouve les deals publiés au cours des 3 dernières semaines
 */
const findRecentDeals = async () => {
  try {
    const db = await connectDB();
    const collection = db.collection('dealabs'); // Utilisation de la collection dealabs

    const threeWeeksAgo = new Date();
    threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);

    const deals = await collection.find({ publishedAt: { $gte: threeWeeksAgo } }).toArray();
    console.log(`✅ ${deals.length} deals trouvés datant de moins de 3 semaines`);
    return deals;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des deals récents:', error);
  }
};

// 🚀 Test automatique si on exécute `node db.js`
if (require.main === module) {
  (async () => {
    await findBestDiscountDeals();
    await findMostCommentedDeals();
    await findDealsSortedByPrice("asc");
    await findDealsSortedByDate("desc");
    await findDealById("67f0168e3cf40a3b845e96ad");
    await findRecentDeals();
    process.exit(0);
  })();
}

// 🔄 Exporte les fonctions pour les utiliser ailleurs
module.exports = {
  connectDB,
  findBestDiscountDeals,
  findMostCommentedDeals,
  findDealsSortedByPrice,
  findDealsSortedByDate,
  findDealById,
  findRecentDeals,
};