import { MongoClient } from 'mongodb';

// Your MongoDB connection string
// It will automatically use the DBURL from your .env file 

let db ; 

async function connectToDb() {
  try { 
    const uri = process.env.DBURL || "mongodb://localhost:27017"; 
    console.log(uri ) 
    const dbName = "etlPipelineDb"; // You can name your database

    const client = new MongoClient(uri);

    console.log(uri) 
    await client.connect(); 
    db = client.db(dbName);
    console.log(`Successfully connected to MongoDB at ${uri}`);
  } catch (error) {
    console.error("Could not connect to MongoDB", error);
    process.exit(1); // Exit the application if DB connection fails
  }
}

/**
 * Gets the database instance.
 * Other files will use this to interact with the database.
 * @returns {Db} The connected MongoDB database instance.
 */
function getDb() {
  if (!db) {
    throw new Error("Database not initialized! Call connectToDb first.");
  }
  return db;
}

export { connectToDb, getDb }; 