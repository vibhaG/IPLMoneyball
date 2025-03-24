import { Router } from "express";
import { db } from "../db";
import { authenticateToken } from "../middleware/auth";
import { LeaderboardEntry } from "@shared/schema";

const router = Router();

// Get leaderboard
router.get("/", authenticateToken, async (req, res) => {
  try {
    const users = await db.users.find({}, {
      projection: {
        id: 1,
        fullName: 1,
        totalPoints: 1,
        winningBets: 1,
        totalBets: 1
      }
    }).toArray();

    // Sort users by points in descending order
    const leaderboard: LeaderboardEntry[] = users
      .map(user => ({
        userId: user.id,
        fullName: user.fullName,
        totalPoints: user.totalPoints || 0,
        winningBets: user.winningBets || 0,
        totalBets: user.totalBets || 0
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints);

    res.json(leaderboard);
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

export default router; 