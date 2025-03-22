import { MongoClient } from "mongodb";

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
      // Add MongoDB connection options for handling SSL
      const options = {
        ssl: true,
        tls: true,
        tlsAllowInvalidCertificates: true,
        tlsAllowInvalidHostnames: true,
        retryWrites: true
      };
      
      client = new MongoClient(connectionString, options);
      await client.connect();
      console.log("Connected to MongoDB cluster successfully");
    } catch (error) {
      console.error("Error connecting to MongoDB:", error);
      return null;
    }
  }
  
  // Extract database name from connection string or use default
  const dbName = "ipl-betting";
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
