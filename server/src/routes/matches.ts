import { Router } from "express";
import { db } from "../db";
import { matchSchema } from "@shared/schema";
import { authenticateToken, requireAdmin } from "../middleware/auth";

const router = Router();

// Get all matches
router.get("/", authenticateToken, async (req, res) => {
  try {
    const matches = await db.matches.find().toArray();
    res.json(matches);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch matches" });
  }
});

// Set match winner and distribute points
router.put("/:id/winner", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const matchId = parseInt(req.params.id);
    const { winner } = req.body;

    // Update match with winner
    const result = await db.matches.updateOne(
      { id: matchId },
      { $set: { winner } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: "Match not found" });
    }

    // Get all bets for this match
    const bets = await db.bets.find({ matchId }).toArray();
    const totalBetAmount = bets.reduce((sum, bet) => sum + bet.amount, 0);
    const winningBets = bets.filter(bet => bet.selectedTeam === winner);
    const totalWinningAmount = winningBets.reduce((sum, bet) => sum + bet.amount, 0);

    // Calculate and distribute points
    if (winningBets.length > 0) {
      const pointsPromises = winningBets.map(async (bet) => {
        // Points = (bet amount / total winning amount) * total bet amount
        const points = Math.floor((bet.amount / totalWinningAmount) * totalBetAmount);
        
        // Update user's points
        await db.users.updateOne(
          { id: bet.userId },
          { 
            $inc: { 
              totalPoints: points,
              winningBets: 1,
              totalBets: 1
            } 
          }
        );
      });

      // Update losing bets
      const losingBets = bets.filter(bet => bet.selectedTeam !== winner);
      const losingPromises = losingBets.map(bet =>
        db.users.updateOne(
          { id: bet.userId },
          { $inc: { totalBets: 1 } }
        )
      );

      await Promise.all([...pointsPromises, ...losingPromises]);
    }

    res.json({ message: "Match winner set and points distributed" });
  } catch (error) {
    console.error("Error setting match winner:", error);
    res.status(500).json({ error: "Failed to set match winner" });
  }
});

export default router; 