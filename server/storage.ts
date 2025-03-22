import { MongoClient, Db, Collection, ObjectId } from "mongodb";
import session from "express-session";
import createMemoryStore from "memorystore";
import { User, Match, Bet, InsertUser, InsertMatch, InsertBet } from "@shared/schema";

const MemoryStore = createMemoryStore(session);

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
  
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private matches: Map<number, Match>;
  private bets: Map<number, Bet>;
  public sessionStore: session.SessionStore;
  private currentUserId: number;
  private currentMatchId: number;
  private currentBetId: number;

  constructor() {
    this.users = new Map();
    this.matches = new Map();
    this.bets = new Map();
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
    });
    this.currentUserId = 1;
    this.currentMatchId = 1;
    this.currentBetId = 1;
    
    // Create initial admin user
    this.createUser({
      username: "admin",
      password: "password", // Will be hashed in auth.ts
      fullName: "Admin User",
      role: "admin"
    });
    
    // Create sample matches
    this.createSampleMatches();
  }

  private createSampleMatches() {
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
      
      this.createMatch({
        team1: teams[teamIndex].team1,
        team2: teams[teamIndex].team2,
        venue: venues[venueIndex],
        matchDate: matchDate,
        time: times[timeIndex]
      });
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id, isActive: true };
    this.users.set(id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deactivateUser(id: number): Promise<boolean> {
    const user = await this.getUser(id);
    if (!user) return false;
    
    user.isActive = false;
    this.users.set(id, user);
    return true;
  }

  async createMatch(insertMatch: InsertMatch): Promise<Match> {
    const id = this.currentMatchId++;
    const match: Match = { ...insertMatch, id };
    this.matches.set(id, match);
    return match;
  }

  async getMatch(id: number): Promise<Match | undefined> {
    return this.matches.get(id);
  }

  async getAllMatches(): Promise<Match[]> {
    return Array.from(this.matches.values());
  }

  async getUpcomingMatches(): Promise<Match[]> {
    const now = new Date();
    return Array.from(this.matches.values())
      .filter(match => new Date(match.matchDate) > now)
      .sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime());
  }

  async createBet(insertBet: InsertBet): Promise<Bet> {
    const id = this.currentBetId++;
    const bet: Bet = { ...insertBet, id, createdAt: new Date() };
    this.bets.set(id, bet);
    return bet;
  }

  async getUserBets(userId: number): Promise<Bet[]> {
    return Array.from(this.bets.values()).filter(bet => bet.userId === userId);
  }

  async getMatchBets(matchId: number): Promise<Bet[]> {
    return Array.from(this.bets.values()).filter(bet => bet.matchId === matchId);
  }
}

export const storage = new MemStorage();
