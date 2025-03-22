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
          await this.createUser({
            username: "admin",
            password: "password", // Will be hashed in auth.ts
            fullName: "Admin User",
            role: "admin"
          });
        }
        
        // Create sample matches if none exist
        const matchCount = await this.matches?.countDocuments();
        if (matchCount === 0) {
          await this.createSampleMatches();
        }
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
    return user ? user as User : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (!this.users) return undefined;
    const user = await this.users.findOne({ 
      username: { $regex: new RegExp(`^${username}$`, 'i') } 
    });
    return user ? user as User : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    if (!this.users) throw new Error("Database connection not established");
    
    const id = ++this.counters.userId;
    const user: User = { 
      ...insertUser, 
      id, 
      isActive: true 
    };
    
    await this.users.insertOne(user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    if (!this.users) return [];
    const usersList = await this.users.find().toArray();
    return usersList as User[];
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
    
    await this.matches.insertOne(match);
    return match;
  }

  async getMatch(id: number): Promise<Match | undefined> {
    if (!this.matches) return undefined;
    const match = await this.matches.findOne({ id });
    return match ? match as Match : undefined;
  }

  async getAllMatches(): Promise<Match[]> {
    if (!this.matches) return [];
    const matchesList = await this.matches.find().toArray();
    return matchesList as Match[];
  }

  async getUpcomingMatches(): Promise<Match[]> {
    if (!this.matches) return [];
    
    const now = new Date();
    const upcomingMatches = await this.matches
      .find({ matchDate: { $gt: now } })
      .sort({ matchDate: 1 })
      .toArray();
    
    return upcomingMatches as Match[];
  }

  async createBet(insertBet: InsertBet): Promise<Bet> {
    if (!this.bets) throw new Error("Database connection not established");
    
    const id = ++this.counters.betId;
    const bet: Bet = { ...insertBet, id, createdAt: new Date() };
    
    await this.bets.insertOne(bet);
    return bet;
  }

  async getUserBets(userId: number): Promise<Bet[]> {
    if (!this.bets) return [];
    const userBets = await this.bets.find({ userId }).toArray();
    return userBets as Bet[];
  }

  async getMatchBets(matchId: number): Promise<Bet[]> {
    if (!this.bets) return [];
    const matchBets = await this.bets.find({ matchId }).toArray();
    return matchBets as Bet[];
  }
}

export const storage = new MongoDBStorage();
