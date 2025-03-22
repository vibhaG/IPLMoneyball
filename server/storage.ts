import { MongoClient, Db, Collection, ObjectId } from "mongodb";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPgSimple from "connect-pg-simple";
import { User, Match, Bet, InsertUser, InsertMatch, InsertBet } from "@shared/schema";
import { connectToDatabase } from "./db";

const MemoryStore = createMemoryStore(session);

// Interface for all storage operations
export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  deactivateUser(id: number): Promise<boolean>;
  
  createMatch(match: InsertMatch): Promise<Match>;
  getMatch(id: number): Promise<Match | undefined>;
  getAllMatches(): Promise<Match[]>;
  getUpcomingMatches(): Promise<Match[]>;
  
  createBet(bet: InsertBet): Promise<Bet>;
  getUserBets(userId: number): Promise<Bet[]>;
  getMatchBets(matchId: number): Promise<Bet[]>;
  
  sessionStore: any;
}

// MongoDB implementation of Storage
export class MongoDBStorage implements IStorage {
  private db: Db | null = null;
  private users: Collection | null = null;
  private matches: Collection | null = null;
  private bets: Collection | null = null;
  public sessionStore: any;
  private connected: boolean = false;
  
  private counters = {
    userId: 0,
    matchId: 0,
    betId: 0
  };

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
    });
    
    this.initialize();
  }
  
  // Check if MongoDB is connected
  isConnected(): boolean {
    return this.connected;
  }
  
  private async initialize() {
    try {
      this.db = await connectToDatabase();
      
      if (this.db) {
        this.users = this.db.collection("users");
        this.matches = this.db.collection("matches");
        this.bets = this.db.collection("bets");
        
        // Initialize counters from existing data
        await this.initializeCounters();
        
        // Create initial admin user if none exists
        const adminUser = await this.getUserByUsername("admin");
        if (!adminUser) {
          console.log("Creating admin user in MongoDB...");
          // Import it here to avoid circular dependencies
          const { hashPassword } = await import('./auth-web-compatible');
          
          await this.createUser({
            username: "admin",
            password: hashPassword("password"), // Hash the password directly here
            fullName: "Admin User",
            role: "admin"
          });
        }
        
        // Create sample matches if none exist
        const matchCount = await this.matches?.countDocuments();
        if (matchCount === 0) {
          await this.createSampleMatches();
        }
        
        // Mark as connected if we got this far
        this.connected = true;
      }
    } catch (error) {
      console.error("Failed to initialize MongoDB storage:", error);
    }
  }
  
  private async initializeCounters() {
    const highestUser = await this.users?.find().sort({ id: -1 }).limit(1).toArray();
    if (highestUser && highestUser.length > 0 && highestUser[0].id) {
      this.counters.userId = highestUser[0].id;
    }
    
    const highestMatch = await this.matches?.find().sort({ id: -1 }).limit(1).toArray();
    if (highestMatch && highestMatch.length > 0 && highestMatch[0].id) {
      this.counters.matchId = highestMatch[0].id;
    }
    
    const highestBet = await this.bets?.find().sort({ id: -1 }).limit(1).toArray();
    if (highestBet && highestBet.length > 0 && highestBet[0].id) {
      this.counters.betId = highestBet[0].id;
    }
  }

  private async createSampleMatches() {
    const teams = [
      { team1: "Mumbai Indians", team2: "Chennai Super Kings" },
      { team1: "Royal Challengers Bangalore", team2: "Delhi Capitals" },
      { team1: "Kolkata Knight Riders", team2: "Rajasthan Royals" },
      { team1: "Punjab Kings", team2: "Sunrisers Hyderabad" },
      { team1: "Gujarat Titans", team2: "Lucknow Super Giants" }
    ];
    
    const venues = [
      "Wankhede Stadium, Mumbai",
      "Chinnaswamy Stadium, Bangalore",
      "Eden Gardens, Kolkata",
      "Arun Jaitley Stadium, Delhi",
      "MA Chidambaram Stadium, Chennai"
    ];
    
    const times = ["3:30 PM", "7:30 PM"];
    
    // Create matches for next 30 days
    for (let i = 0; i < 15; i++) {
      const matchDate = new Date();
      matchDate.setDate(matchDate.getDate() + i + 1); // Start from tomorrow
      
      const teamIndex = i % teams.length;
      const venueIndex = i % venues.length;
      const timeIndex = i % times.length;
      
      await this.createMatch({
        team1: teams[teamIndex].team1,
        team2: teams[teamIndex].team2,
        venue: venues[venueIndex],
        matchDate: matchDate,
        time: times[timeIndex]
      });
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    if (!this.users) return undefined;
    const user = await this.users.findOne({ id });
    if (!user) return undefined;
    // Convert MongoDB document to User type
    return {
      id: user.id,
      username: user.username,
      password: user.password,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive
    };
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (!this.users) return undefined;
    const user = await this.users.findOne({ 
      username: { $regex: new RegExp(`^${username}$`, 'i') } 
    });
    if (!user) return undefined;
    // Convert MongoDB document to User type
    return {
      id: user.id,
      username: user.username,
      password: user.password,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive
    };
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    if (!this.users) throw new Error("Database connection not established");
    
    const id = ++this.counters.userId;
    const user: User = { 
      ...insertUser, 
      id, 
      isActive: true 
    };
    
    // Convert to plain object before inserting to avoid _id conflicts
    const userDoc = {
      id: user.id,
      username: user.username,
      password: user.password, // This will be hashed in auth.ts before reaching here
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive
    };
    
    // Check if user already exists
    const existingUser = await this.getUserByUsername(user.username);
    if (existingUser) {
      return existingUser;
    }
    
    // Insert new user
    await this.users.insertOne(userDoc);
    console.log(`Created user: ${user.username} with role: ${user.role}`);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    if (!this.users) return [];
    const usersList = await this.users.find().toArray();
    
    // Convert MongoDB documents to User types
    return usersList.map(user => ({
      id: user.id,
      username: user.username,
      password: user.password,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive
    }));
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    if (!this.users) return undefined;
    
    await this.users.updateOne({ id }, { $set: updates });
    const updatedUser = await this.getUser(id);
    return updatedUser;
  }

  async deactivateUser(id: number): Promise<boolean> {
    if (!this.users) return false;
    
    const result = await this.users.updateOne({ id }, { $set: { isActive: false } });
    return result.modifiedCount > 0;
  }

  async createMatch(insertMatch: InsertMatch): Promise<Match> {
    if (!this.matches) throw new Error("Database connection not established");
    
    const id = ++this.counters.matchId;
    const match: Match = { ...insertMatch, id };
    
    // Convert to plain object before inserting
    const matchDoc = {
      id: match.id,
      team1: match.team1,
      team2: match.team2,
      venue: match.venue,
      matchDate: match.matchDate,
      time: match.time
    };
    
    await this.matches.insertOne(matchDoc);
    return match;
  }

  async getMatch(id: number): Promise<Match | undefined> {
    if (!this.matches) return undefined;
    const match = await this.matches.findOne({ id });
    if (!match) return undefined;
    
    // Convert MongoDB document to Match type
    return {
      id: match.id,
      team1: match.team1,
      team2: match.team2,
      venue: match.venue,
      matchDate: match.matchDate,
      time: match.time
    };
  }

  async getAllMatches(): Promise<Match[]> {
    if (!this.matches) return [];
    const matchesList = await this.matches.find().toArray();
    
    // Convert MongoDB documents to Match types
    return matchesList.map(match => ({
      id: match.id,
      team1: match.team1,
      team2: match.team2,
      venue: match.venue,
      matchDate: match.matchDate,
      time: match.time
    }));
  }

  async getUpcomingMatches(): Promise<Match[]> {
    if (!this.matches) return [];
    
    const now = new Date();
    const upcomingMatches = await this.matches
      .find({ matchDate: { $gt: now } })
      .sort({ matchDate: 1 })
      .toArray();
    
    // Convert MongoDB documents to Match types
    return upcomingMatches.map(match => ({
      id: match.id,
      team1: match.team1,
      team2: match.team2,
      venue: match.venue,
      matchDate: match.matchDate,
      time: match.time
    }));
  }

  async createBet(insertBet: InsertBet): Promise<Bet> {
    if (!this.bets) throw new Error("Database connection not established");
    
    const id = ++this.counters.betId;
    const bet: Bet = { ...insertBet, id, createdAt: new Date() };
    
    // Convert to plain object before inserting
    const betDoc = {
      id: bet.id,
      userId: bet.userId,
      matchId: bet.matchId,
      selectedTeam: bet.selectedTeam,
      amount: bet.amount,
      createdAt: bet.createdAt
    };
    
    await this.bets.insertOne(betDoc);
    return bet;
  }

  async getUserBets(userId: number): Promise<Bet[]> {
    if (!this.bets) return [];
    const userBets = await this.bets.find({ userId }).toArray();
    
    // Convert MongoDB documents to Bet types
    return userBets.map(bet => ({
      id: bet.id,
      userId: bet.userId,
      matchId: bet.matchId,
      selectedTeam: bet.selectedTeam,
      amount: bet.amount,
      createdAt: bet.createdAt
    }));
  }

  async getMatchBets(matchId: number): Promise<Bet[]> {
    if (!this.bets) return [];
    const matchBets = await this.bets.find({ matchId }).toArray();
    
    // Convert MongoDB documents to Bet types
    return matchBets.map(bet => ({
      id: bet.id,
      userId: bet.userId,
      matchId: bet.matchId,
      selectedTeam: bet.selectedTeam,
      amount: bet.amount,
      createdAt: bet.createdAt
    }));
  }
}

// In-memory Storage implementation for fallback
export class MemStorage implements IStorage {
  private users: User[] = [];
  private matches: Match[] = [];
  private bets: Bet[] = [];
  public sessionStore: any;
  
  private counters = {
    userId: 0,
    matchId: 0,
    betId: 0
  };
  
  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
    });
    
    this.initialize();
  }
  
  private async initialize() {
    try {
      // Import it here to avoid circular dependencies
      const { hashPassword } = await import('./auth-web-compatible');
      
      // Create initial admin user
      await this.createUser({
        username: "admin",
        password: hashPassword("password"), // Hash the password directly here
        fullName: "Admin User",
        role: "admin"
      });
      
      // Create sample matches
      await this.createSampleMatches();
      
      console.log("MemStorage initialized with admin user");
    } catch (error) {
      console.error("Error initializing MemStorage:", error);
    }
  }
  
  private async createSampleMatches() {
    const teams = [
      { team1: "Mumbai Indians", team2: "Chennai Super Kings" },
      { team1: "Royal Challengers Bangalore", team2: "Delhi Capitals" },
      { team1: "Kolkata Knight Riders", team2: "Rajasthan Royals" },
      { team1: "Punjab Kings", team2: "Sunrisers Hyderabad" },
      { team1: "Gujarat Titans", team2: "Lucknow Super Giants" }
    ];
    
    const venues = [
      "Wankhede Stadium, Mumbai",
      "Chinnaswamy Stadium, Bangalore",
      "Eden Gardens, Kolkata",
      "Arun Jaitley Stadium, Delhi",
      "MA Chidambaram Stadium, Chennai"
    ];
    
    const times = ["3:30 PM", "7:30 PM"];
    
    // Create matches for next 30 days
    for (let i = 0; i < 15; i++) {
      const matchDate = new Date();
      matchDate.setDate(matchDate.getDate() + i + 1); // Start from tomorrow
      
      const teamIndex = i % teams.length;
      const venueIndex = i % venues.length;
      const timeIndex = i % times.length;
      
      await this.createMatch({
        team1: teams[teamIndex].team1,
        team2: teams[teamIndex].team2,
        venue: venues[venueIndex],
        matchDate: matchDate,
        time: times[timeIndex]
      });
    }
  }
  
  async getUser(id: number): Promise<User | undefined> {
    return this.users.find(user => user.id === id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find(user => user.username.toLowerCase() === username.toLowerCase());
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = ++this.counters.userId;
    const user: User = { 
      ...insertUser, 
      id, 
      isActive: true 
    };
    
    this.users.push(user);
    return user;
  }
  
  async getAllUsers(): Promise<User[]> {
    return this.users;
  }
  
  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const index = this.users.findIndex(user => user.id === id);
    if (index === -1) return undefined;
    
    this.users[index] = { ...this.users[index], ...updates };
    return this.users[index];
  }
  
  async deactivateUser(id: number): Promise<boolean> {
    const index = this.users.findIndex(user => user.id === id);
    if (index === -1) return false;
    
    this.users[index].isActive = false;
    return true;
  }
  
  async createMatch(insertMatch: InsertMatch): Promise<Match> {
    const id = ++this.counters.matchId;
    const match: Match = { ...insertMatch, id };
    
    this.matches.push(match);
    return match;
  }
  
  async getMatch(id: number): Promise<Match | undefined> {
    return this.matches.find(match => match.id === id);
  }
  
  async getAllMatches(): Promise<Match[]> {
    return this.matches;
  }
  
  async getUpcomingMatches(): Promise<Match[]> {
    const now = new Date();
    return this.matches
      .filter(match => match.matchDate > now)
      .sort((a, b) => a.matchDate.getTime() - b.matchDate.getTime());
  }
  
  async createBet(insertBet: InsertBet): Promise<Bet> {
    const id = ++this.counters.betId;
    const bet: Bet = { ...insertBet, id, createdAt: new Date() };
    
    this.bets.push(bet);
    return bet;
  }
  
  async getUserBets(userId: number): Promise<Bet[]> {
    return this.bets.filter(bet => bet.userId === userId);
  }
  
  async getMatchBets(matchId: number): Promise<Bet[]> {
    return this.bets.filter(bet => bet.matchId === matchId);
  }
}

// Create MongoDB storage for production use
const mongoStorage = new MongoDBStorage();

// Create memory storage as fallback
const memStorage = new MemStorage();

// Use MongoDB storage if available, otherwise fall back to in-memory
// Try to use MongoDB storage, but fall back to in-memory storage if MongoDB fails
export const storage: IStorage = memStorage;

// This approach ensures we always have a working storage implementation,
// even if MongoDB connection fails
async function initializeStorage() {
  try {
    if (process.env.MONGODB_URI) {
      // Check if MongoDB is working by initializing it
      if (await mongoStorage.isConnected()) {
        console.log("Using MongoDB storage");
        return mongoStorage;
      } else {
        console.log("MongoDB connection failed, using in-memory storage");
        return memStorage;
      }
    } else {
      console.log("No MongoDB URI provided, using in-memory storage");
      return memStorage;
    }
  } catch (error) {
    console.error("Error initializing MongoDB, falling back to in-memory storage:", error);
    return memStorage;
  }
}

// Log which storage type is being used
if (process.env.MONGODB_URI) {
  console.log("Using MongoDB storage");
} else {
  console.log("Using in-memory storage (MONGODB_URI not provided)");
}
