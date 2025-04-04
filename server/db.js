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
 * Trouve les deals avec la meilleure réduction (discount > 50%)
 */
const findBestDiscountDeals = async () => {
  try {
    const db = await connectDB();
    const collection = db.collection('deals');

    const deals = await collection.find({ discount: { $gt: 50 } }).toArray();
    console.log(`✅ ${deals.length} deals trouvés avec un discount > 50%`);
    return deals;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des meilleurs discounts:', error);
  }
};

/**
 * Trouve les deals les plus commentés (comments > 15)
 */
const findMostCommentedDeals = async () => {
  try {
    const db = await connectDB();
    const collection = db.collection('deals');

    const deals = await collection.find({ comments: { $gt: 15 } }).toArray();
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
    const collection = db.collection('deals');

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
    const collection = db.collection('deals');

    const sortOrder = order === "asc" ? 1 : -1;
    const deals = await collection.find().sort({ published: sortOrder }).toArray();

    console.log(`✅ Deals triés par date (${order})`);
    return deals;
  } catch (error) {
    console.error('❌ Erreur lors du tri des deals par date:', error);
  }
};

/**
 * Trouve toutes les ventes pour un LEGO donné
 * @param {String} legoSetId - L'ID du set LEGO à rechercher
 */
const findSalesForLegoSetId = async (legoSetId) => {
  try {
    const db = await connectDB();
    const collection = db.collection('sales');

    const sales = await collection.find({ legoSetId }).toArray();
    console.log(`✅ ${sales.length} ventes trouvées pour le LEGO Set ID ${legoSetId}`);
    return sales;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des ventes pour un LEGO Set ID:', error);
  }
};

const findDealById = async (dealId) => {
  try {
    const db = await connectDB();
    const collection = db.collection('deals');

    // 🔹 Convertir en ObjectId uniquement si l'ID est valide
    let query = { _id: dealId };
    if (ObjectId.isValid(dealId)) {
      query = { _id: ObjectId.createFromHexString(dealId) };
    }
    console.log(dealId)
    console.log(query)
    const deal = await collection.findOne(query);
    console.log(deal)
    if (!deal) {
      console.log(`❌ Aucun deal trouvé avec l'ID ${dealId}`);
      return null;
    }

    console.log(`✅ Deal trouvé avec l'ID ${dealId}`);
    return deal;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération du deal par ID:', error);
    return 1;
  }
};






/**
 * Trouve toutes les ventes effectuées au cours des 3 dernières semaines
 */
const findRecentSales = async () => {
  try {
    const db = await connectDB();
    const collection = db.collection('sales');

    const threeWeeksAgo = new Date();
    threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);

    const sales = await collection.find({ published: { $gte: threeWeeksAgo } }).toArray();
    console.log(`✅ ${sales.length} ventes trouvées datant de moins de 3 semaines`);
    return sales;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des ventes récentes:', error);
  }
};

// 🚀 Test automatique si on exécute `node db.js`
if (require.main === module) {
  (async () => {
    await findBestDiscountDeals();
    await findMostCommentedDeals();
    await findDealsSortedByPrice("asc");
    await findDealsSortedByDate("desc");
    await findSalesForLegoSetId("42156");
    await findRecentSales();
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
  findSalesForLegoSetId,
  findRecentSales,
  findDealById
};
