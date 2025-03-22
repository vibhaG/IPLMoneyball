import { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { InsertMatch, insertMatchSchema, Match, insertBetSchema, InsertBet } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup auth routes (/api/register, /api/login, /api/logout, /api/user)
  setupAuth(app);

  // Get all users (admin only)
  app.get("/api/users", async (req, res) => {
    if (!req.isAuthenticated() || req.user?.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }
    
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Create new user (admin only)
  app.post("/api/users", async (req, res) => {
    if (!req.isAuthenticated() || req.user?.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }
    
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const user = await storage.createUser(req.body);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: formatError(error).message });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Get upcoming matches
  app.get("/api/matches", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const matches = await storage.getUpcomingMatches();
      res.json(matches);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch matches" });
    }
  });

  // Create a new match (admin only)
  app.post("/api/matches", async (req, res) => {
    if (!req.isAuthenticated() || req.user?.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }
    
    try {
      const matchData = insertMatchSchema.parse(req.body);
      const match = await storage.createMatch(matchData);
      res.status(201).json(match);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: formatError(error).message });
      }
      res.status(500).json({ message: "Failed to create match" });
    }
  });

  // Place a bet
  app.post("/api/bets", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      // Parse and validate the bet data
      const betData = insertBetSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      // Verify the match exists
      const match = await storage.getMatch(betData.matchId);
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }
      
      // Create the bet
      const bet = await storage.createBet(betData);
      res.status(201).json(bet);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: formatError(error).message });
      }
      res.status(500).json({ message: "Failed to place bet" });
    }
  });

  // Get user's bets
  app.get("/api/bets", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const bets = await storage.getUserBets(req.user.id);
      res.json(bets);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bets" });
    }
  });

  // Deactivate user (admin only)
  app.put("/api/users/:id/deactivate", async (req, res) => {
    if (!req.isAuthenticated() || req.user?.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }
    
    const userId = parseInt(req.params.id);
    
    try {
      const success = await storage.deactivateUser(userId);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to deactivate user" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
