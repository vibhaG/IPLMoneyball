import { Router } from "express";
import { storage } from "../../storage";
import { authenticateToken } from "../middleware/auth";
import { LeaderboardEntry, User, Bet, Score, Match } from "@shared/schema";

const router = Router();

// Get leaderboard
router.get("/", authenticateToken, async (req, res) => {
  try {
    // Get all users
    const users = await storage.getAllUsers() as User[];
    
    // Get all bets to calculate win rate
    const allBets = await Promise.all(
      users.map(user => storage.getUserBets(user.id!))
    );
    
    // Get all matches to check winners
    const allMatches = await storage.getAllMatches() as Match[];

    // Calculate statistics for each user
    const leaderboard: LeaderboardEntry[] = users.map((user, index) => {
      const userBets = allBets[index];
      const winningBets = userBets.filter(bet => {
        const match = allMatches.find(m => m.id === bet.matchId);
        return match && match.winner === bet.selectedTeam;
      });

      // Calculate total points from winning bets
      const totalPoints = winningBets.reduce((sum, bet) => {
        const match = allMatches.find(m => m.id === bet.matchId);
        if (!match || !match.winner) return sum;
        const matchBets = allBets.flat().filter(b => b.matchId === bet.matchId);
        const totalBetPool = matchBets.reduce((pool, b) => pool + b.amount, 0);
        const winningBetsForMatch = matchBets.filter(b => b.selectedTeam === match.winner);
        return sum + (totalBetPool / winningBetsForMatch.length);
      }, 0);

      return {
        userId: user.id!,
        fullName: user.fullName,
        totalPoints,
        winningBets: winningBets.length,
        totalBets: userBets.length
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
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

export default router; 