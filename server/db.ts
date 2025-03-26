import { MongoClient } from "mongodb";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

let client: MongoClient | null = null;

export async function connectToDatabase() {
  if (!client) {
    // Use the provided MongoDB URI from environment variables
    const connectionString = process.env.MONGODB_URI;
    
    if (!connectionString) {
      console.error("MONGODB_URI environment variable is not set");
      return null;
    }
    
    try {
      // Simpler options that work around SSL issues
      const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      };
      
      client = new MongoClient(connectionString);
      await client.connect();
      console.log("Connected to MongoDB cluster successfully");
    } catch (error) {
      console.error("Error connecting to MongoDB:", error);
      return null;
    }
  }
  
  // Extract database name from connection string or use default
  const dbName = "moneyball";
  return client.db(dbName);
}

export async function closeDatabaseConnection() {
  if (client) {
    try {
      await client.close();
      client = null;
      console.log("MongoDB connection closed");
    } catch (error) {
      console.error("Error closing MongoDB connection:", error);
    }
  }
}
