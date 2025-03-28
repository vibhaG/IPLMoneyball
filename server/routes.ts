import { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { InsertMatch, insertMatchSchema, Match, insertBetSchema, InsertBet, Bet, LeaderboardEntry } from "@shared/schema";
import { Parentheses } from "lucide-react";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup auth routes (/api/register, /api/login, /api/logout, /api/user)
  setupAuth(app);

  // Get all users (admin only)
  app.get("/api/users", async (req, res) => {
    console.log("GET /api/users called");
    if (!req.isAuthenticated() || req.user?.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }
    
    try {
      const users = await storage.getAllUsers();
      console.log("GET /api/users" + users);
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
      
      // Hash the password before creating the user
      const { hashPassword } = await import("./auth-web-compatible");
      const userData = {
        ...req.body,
        password: hashPassword(req.body.password)
      };
      
      const user = await storage.createUser(userData);
      // Don't send password back to client
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Get matches (all or upcoming)
  app.get("/api/matches", async (req, res) => {
    console.log(" In GET /api/matches");
    console.log(req);
    console.log("req.isAuthenticated()", req.isAuthenticated());
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const showAll = req.query.all === 'true';
      const matches = showAll ? await storage.getAllMatches() : await storage.getUpcomingMatches();
      console.log(" In GET /api/matches" + matches);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
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
        return res.status(400).json({ message: fromZodError(error).message });
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
        userId: req.user?.id
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
        return res.status(400).json({ message: fromZodError(error).message });
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
      if (!req.user?.id) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      const bets = await storage.getUserBets(req.user.id);
      res.json(bets);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bets" });
    }
  });

  // Get user's bet for a specific match
  app.get("/api/bets/match/:matchId", async (req, res) => {
    console.log("GET /api/bets/match/:matchId called");
    console.log("User:", req.user);
    console.log("Match ID:", req.params.matchId);
    
    if (!req.isAuthenticated()) {
      console.log("User not authenticated");
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      if (!req.user?.id) {
        console.log("No user ID found");
        return res.status(400).json({ message: "Invalid user ID" });
      }
      const matchId = parseInt(req.params.matchId);
      console.log("Fetching bet for user:", req.user.id, "match:", matchId);
      const bet = await storage.getUserBetsForMatch(req.user.id, matchId);
      console.log("Found bet:", bet);
      res.json(bet || null);
    } catch (error) {
      console.error("Error fetching bet:", error);
      res.status(500).json({ message: "Failed to fetch bet" });
    }
  });

  // Get all bets for a specific match
  app.get("/api/bets/match/:matchId/all", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const matchId = parseInt(req.params.matchId);
      const bets = await storage.getMatchBets(matchId);
      res.json(bets);
    } catch (error) {
      console.error("Error fetching match bets:", error);
      res.status(500).json({ message: "Failed to fetch match bets" });
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

  // Reset user password
  app.put("/api/users/reset-password", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }

      // Get user and verify current password
      const user = await storage.getUser(req.user!.id!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { comparePasswords, hashPassword } = await import("./auth-web-compatible");
      if (!comparePasswords(currentPassword, user.password)) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      // Hash new password and update
      const hashedPassword = hashPassword(newPassword);
      const success = await storage.updateUserPassword(req.user!.id!, hashedPassword);
      
      if (!success) {
        return res.status(500).json({ message: "Failed to update password" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  //update match winner
  app.put("/api/matches/:id/winner", async (req, res) => {
    console.log("PUT /api/matches/:id/winner called");
    console.log("User:", req.user);
    console.log("Match ID:", req.params.id);
    console.log("Request body:", req.body);
    if (!req.isAuthenticated() || req.user?.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }
    const matchId = parseInt(req.params.id);
    const { winner, isAbandoned } = req.body;
    const updatedMatch = await storage.updateMatchResult(matchId, winner, isAbandoned);
    if (!updatedMatch) {
      return res.status(404).json({ message: "Match not found" });
    }
    res.json(updatedMatch);
  }); 

  // Update existing bet
  app.put("/api/bets/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const betId = parseInt(req.params.id);
      
      // Verify the match is still upcoming
      const match = await storage.getMatch(req.body.matchId);
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }
      
      if (match.matchDate <= new Date() || match.winner || match.isAbandoned) {
        return res.status(400).json({ message: "Cannot update bet for past or completed match" });
      }

      // Validate that selected team matches one of the teams in the match
      if (req.body.selectedTeam !== match.team1 && req.body.selectedTeam !== match.team2) {
        return res.status(400).json({ 
          message: "Selected team must be one of the teams playing in the match",
          validTeams: [match.team1, match.team2]
        });
      }

      const betData = insertBetSchema.parse({
        ...req.body,
        userId: req.user?.id
      });

      // Verify the bet exists and belongs to the user
      const existingBet = await storage.getUserBetsForMatch(req.user!.id!, betData.matchId);
      if (!existingBet || existingBet.id !== betId) {
        return res.status(404).json({ message: "Bet not found or unauthorized" });
      }

      const updatedBet = await storage.updateBet(betId, betData);
      if (!updatedBet) {
        return res.status(500).json({ message: "Failed to update bet" });
      }

      res.json(updatedBet);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(500).json({ message: "Failed to update bet" });
    }
  });

  // Get leaderboard
  app.get("/api/leaderboard", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const users = await storage.getAllUsers();
      const scores = await storage.getAllScores();
      const allBets = await Promise.all(users.map(user => storage.getUserBets(user.id!)));
      const allMatches = await storage.getAllMatches();

      const leaderboard = users.map((user, index) => {
        const userScores = scores.filter(score => score.userId === user.id);
        const userBets = allBets[index];
        const totalPoints = userScores.reduce((sum, score) => sum + score.points, 0);
        
        // Calculate winning bets by checking match results
        const winningBets = userBets.filter(bet => {
          const match = allMatches.find(m => m.id === bet.matchId);
          return match?.winner === bet.selectedTeam;
        }).length;
        
        const totalBets = userBets.length;
        const winRate = totalBets > 0 ? (winningBets / totalBets) * 100 : 0;

        return {
          userId: user.id,
          fullName: user.fullName,
          totalPoints,
          winningBets,
          totalBets,
          winRate
        };
      });

      // Sort by points in descending order
      leaderboard.sort((a, b) => b.totalPoints - a.totalPoints);

      // Add rank to each entry
      const leaderboardWithRank = leaderboard.map((entry, index) => ({
        ...entry,
        rank: index + 1
      }));

      res.json(leaderboardWithRank);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ success: false, message: "Failed to fetch leaderboard" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

