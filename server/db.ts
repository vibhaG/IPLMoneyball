import { MongoClient } from "mongodb";

let client: MongoClient | null = null;

export async function connectToDatabase() {
  if (!client) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    
    client = new MongoClient(process.env.DATABASE_URL);
    await client.connect();
    console.log("Connected to MongoDB");
  }
  
  return client.db("ipl-betting");
}

export async function closeDatabaseConnection() {
  if (client) {
    await client.close();
    client = null;
    console.log("MongoDB connection closed");
  }
}
