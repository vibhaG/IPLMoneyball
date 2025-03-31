import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MongoDBStorage } from './storage';
import { Match, Bet, Score } from '@shared/schema';

describe('MongoDBStorage', () => {
  let storage: MongoDBStorage;
  let mockMatch: Match;
  let mockBets: Bet[];
  let mockScores: Score[];

  beforeEach(() => {
    // Reset mocks and create test data
    vi.clearAllMocks();

    mockMatch = {
      id: 1,
      team1: 'Team A',
      team2: 'Team B',
      matchDate: new Date(),
      winner: null,
      isAbandoned: false
    };

    mockBets = [
      {
        id: 1,
        userId: 1,
        matchId: 1,
        selectedTeam: 'Team A',
        amount: 100
      },
      {
        id: 2,
        userId: 2,
        matchId: 1,
        selectedTeam: 'Team A',
        amount: 200
      },
      {
        id: 3,
        userId: 3,
        matchId: 1,
        selectedTeam: 'Team B',
        amount: 150
      }
    ];

    mockScores = [
      {
        userId: 1,
        points: 1000
      },
      {
        userId: 2,
        points: 2000
      },
      {
        userId: 3,
        points: 1500
      }
    ];

    // Mock MongoDB collections
    storage = new MongoDBStorage();
    storage.matches = {
      findOne: vi.fn(),
      updateOne: vi.fn(),
      find: vi.fn(),
      insertOne: vi.fn()
    } as any;

    storage.bets = {
      find: vi.fn(),
      insertOne: vi.fn(),
      updateOne: vi.fn()
    } as any;

    storage.scores = {
      find: vi.fn(),
      updateOne: vi.fn()
    } as any;
  });

  describe('updateMatchResult', () => {
    it('should distribute points correctly when setting a new winner', async () => {
      // Setup
      storage.matches.findOne.mockResolvedValue(mockMatch);
      storage.bets.find.mockResolvedValue(mockBets);
      storage.scores.find.mockResolvedValue(mockScores);

      // Execute
      await storage.updateMatchResult(1, 'Team A', false);

      // Verify
      expect(storage.matches.updateOne).toHaveBeenCalledWith(
        { id: 1 },
        { $set: { winner: 'Team A', isAbandoned: false } }
      );

      // Verify points distribution
      const totalPool = 450; // 100 + 200 + 150
      const winningBets = mockBets.filter(bet => bet.selectedTeam === 'Team A');
      const winningTotal = 300; // 100 + 200

      // First winner (bet 100)
      expect(storage.scores.updateOne).toHaveBeenCalledWith(
        { userId: 1 },
        { $inc: { points: (100 / winningTotal) * totalPool } },
        { upsert: true }
      );

      // Second winner (bet 200)
      expect(storage.scores.updateOne).toHaveBeenCalledWith(
        { userId: 2 },
        { $inc: { points: (200 / winningTotal) * totalPool } },
        { upsert: true }
      );

      // Loser (bet 150)
      expect(storage.scores.updateOne).toHaveBeenCalledWith(
        { userId: 3 },
        { $inc: { points: -150 } },
        { upsert: true }
      );
    });

    it('should handle resetting winner to null correctly', async () => {
      // Setup
      const matchWithWinner = { ...mockMatch, winner: 'Team A' };
      storage.matches.findOne.mockResolvedValue(matchWithWinner);
      storage.bets.find.mockResolvedValue(mockBets);
      storage.scores.find.mockResolvedValue(mockScores);

      // Execute
      await storage.updateMatchResult(1, null, false);

      // Verify
      expect(storage.matches.updateOne).toHaveBeenCalledWith(
        { id: 1 },
        { $set: { winner: null, isAbandoned: false } }
      );

      // Verify points refund
      const previousWinningBets = mockBets.filter(bet => bet.selectedTeam === 'Team A');
      const previousTotalPool = 450; // 100 + 200 + 150

      // Refund to previous winners
      expect(storage.scores.updateOne).toHaveBeenCalledWith(
        { userId: 1 },
        { $inc: { points: -(100 / 300) * previousTotalPool } },
        { upsert: true }
      );

      expect(storage.scores.updateOne).toHaveBeenCalledWith(
        { userId: 2 },
        { $inc: { points: -(200 / 300) * previousTotalPool } },
        { upsert: true }
      );

      // Refund to previous losers
      expect(storage.scores.updateOne).toHaveBeenCalledWith(
        { userId: 3 },
        { $inc: { points: 150 } },
        { upsert: true }
      );
    });

    it('should handle changing winner from one team to another', async () => {
      // Setup
      const matchWithWinner = { ...mockMatch, winner: 'Team A' };
      storage.matches.findOne.mockResolvedValue(matchWithWinner);
      storage.bets.find.mockResolvedValue(mockBets);
      storage.scores.find.mockResolvedValue(mockScores);

      // Execute
      await storage.updateMatchResult(1, 'Team B', false);

      // Verify
      expect(storage.matches.updateOne).toHaveBeenCalledWith(
        { id: 1 },
        { $set: { winner: 'Team B', isAbandoned: false } }
      );

      // Verify points distribution
      const totalPool = 450;
      const previousWinningBets = mockBets.filter(bet => bet.selectedTeam === 'Team A');
      const previousTotalPool = 450;

      // Deduct from previous winners
      expect(storage.scores.updateOne).toHaveBeenCalledWith(
        { userId: 1 },
        { $inc: { points: -(100 / 300) * previousTotalPool } },
        { upsert: true }
      );

      expect(storage.scores.updateOne).toHaveBeenCalledWith(
        { userId: 2 },
        { $inc: { points: -(200 / 300) * previousTotalPool } },
        { upsert: true }
      );

      // Award to new winner
      expect(storage.scores.updateOne).toHaveBeenCalledWith(
        { userId: 3 },
        { $inc: { points: totalPool } },
        { upsert: true }
      );
    });

    it('should handle case with no bets', async () => {
      // Setup
      storage.matches.findOne.mockResolvedValue(mockMatch);
      storage.bets.find.mockResolvedValue([]);
      storage.scores.find.mockResolvedValue([]);

      // Execute
      await storage.updateMatchResult(1, 'Team A', false);

      // Verify
      expect(storage.matches.updateOne).toHaveBeenCalledWith(
        { id: 1 },
        { $set: { winner: 'Team A', isAbandoned: false } }
      );

      // Verify no score updates
      expect(storage.scores.updateOne).not.toHaveBeenCalled();
    });
  });
}); 