import { MongoClient } from "mongodb";

let client: MongoClient | null = null;

export async function connectToDatabase() {
  if (!client) {
    // Create a default MongoDB connection string using localhost if none is provided
    // This works well for development environments
    const connectionString = process.env.DATABASE_URL || "mongodb://localhost:27017";
    
    try {
      // For non-MongoDB connection strings (like Postgres), create a MongoDB URL
      let mongoUrl = connectionString;
      if (!mongoUrl.startsWith("mongodb://") && !mongoUrl.startsWith("mongodb+srv://")) {
        console.log("Converting database URL to MongoDB format");
        mongoUrl = "mongodb://localhost:27017/ipl-betting";
      }
      
      client = new MongoClient(mongoUrl);
      await client.connect();
      console.log("Connected to MongoDB");
    } catch (error) {
      console.error("Error connecting to MongoDB:", error);
      
      // Fallback to in-memory mode (simulated MongoDB)
      console.log("Falling back to in-memory database mode");
      return null;
    }
  }
  
  return client.db("ipl-betting");
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
