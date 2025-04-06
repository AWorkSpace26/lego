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
 * Trouve un deal spécifique par son ID
 * @param {String} dealId - ID du deal à rechercher
 */
const findDealById = async (dealId) => {
  try {
    const db = await connectDB();
    const collection = db.collection('dealabs'); // Utilisation de la collection dealabs

    const deal = await collection.findOne({ _id: new ObjectId(dealId) });
    console.log(`✅ Deal trouvé avec l'ID: ${dealId}`);
    return deal;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération du deal par ID:', error);
    throw error;
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
const findDealByLegoId = async (legoId) => {
  try {
    const db = await connectDB();
    const collection = db.collection('dealabs'); // Assurez-vous que 'dealabs' est la bonne collection

    const deal = await collection.findOne({ legoId: legoId }); // Recherchez par legoId
    console.log(`✅ Deal trouvé avec Lego ID: ${legoId}`);
    return deal;
  } catch (error) {
    console.error('❌ Error in findDealByLegoId:', error);
    throw error;
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


const findSalesForLegoSetId = async (legoId) => {
  const db = await connectDB();
  const collection = db.collection('vinted');
  return collection.find({ legoId }).toArray();
};

const getVintedStatsForLegoId = async (legoId) => {
  const db = await connectDB();
  const collection = db.collection('vinted');
  const sales = await collection.find({ legoId, price: { $ne: null } }).sort({ createdAt: 1 }).toArray();

  if (!sales.length) return {};

  const prices = sales.map(s => s.price).sort((a, b) => a - b);
  const avg = prices.reduce((sum, val) => sum + val, 0) / prices.length;
  const p = p => prices[Math.floor((p / 100) * prices.length)];

  const first = new Date(sales[0].createdAt);
  const last = new Date(sales[sales.length - 1].createdAt);
  const lifetime = Math.max(1, Math.ceil((last - first) / (1000 * 60 * 60 * 24)));

  return {
    count: sales.length,
    avg,
    p5: p(5),
    p25: p(25),
    p50: p(50),
    lifetime
  };
};


// 🔄 Exporte les fonctions pour les utiliser ailleurs
module.exports = {
  connectDB,
  findBestDiscountDeals,
  findMostCommentedDeals,
  findDealsSortedByPrice,
  findDealsSortedByDate,
  findDealById,
  findDealByLegoId,
  findRecentDeals,
  findSalesForLegoSetId,
  getVintedStatsForLegoId
};