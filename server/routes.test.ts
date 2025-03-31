import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from './routes';
import { storage } from './storage';
import { Match, Bet, User } from '@shared/schema';

// Mock storage
vi.mock('./storage', () => ({
  storage: {
    getAllUsers: vi.fn(),
    getUserByUsername: vi.fn(),
    createUser: vi.fn(),
    deactivateUser: vi.fn(),
    updateUserPassword: vi.fn(),
    getAllMatches: vi.fn(),
    getUpcomingMatches: vi.fn(),
    createMatch: vi.fn(),
    getMatch: vi.fn(),
    updateMatchResult: vi.fn(),
    getAllBets: vi.fn(),
    getUserBets: vi.fn(),
    createBet: vi.fn(),
    updateBet: vi.fn(),
    getMatchBets: vi.fn(),
    getAllScores: vi.fn()
  }
}));

describe('API Routes', () => {
  let app: express.Application;
  const mockUser = {
    id: 1,
    username: 'testuser',
    fullName: 'Test User',
    role: 'user',
    isActive: true
  };

  const mockAdmin = {
    ...mockUser,
    role: 'admin'
  };

  beforeEach(() => {
    app = express();
    registerRoutes(app);
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should require authentication for protected routes', async () => {
      const response = await request(app)
        .get('/api/matches')
        .expect(401);
      
      expect(response.body.message).toBe('Not authenticated');
    });
  });

  describe('User Management', () => {
    it('should allow admin to get all users', async () => {
      const mockUsers = [mockUser, mockAdmin];
      (storage.getAllUsers as any).mockResolvedValue(mockUsers);

      const response = await request(app)
        .get('/api/users')
        .set('Cookie', ['user=admin'])
        .expect(200);

      expect(response.body).toEqual(mockUsers);
    });

    it('should prevent non-admin from accessing user management', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Cookie', ['user=user'])
        .expect(403);

      expect(response.body.message).toBe('Access denied');
    });

    it('should allow admin to create new users', async () => {
      const newUser = { ...mockUser, id: 2 };
      (storage.createUser as any).mockResolvedValue(newUser);

      const response = await request(app)
        .post('/api/users')
        .set('Cookie', ['user=admin'])
        .send({
          username: 'newuser',
          password: 'password123',
          fullName: 'New User',
          role: 'user'
        })
        .expect(201);

      expect(response.body).toEqual(expect.objectContaining({
        username: 'newuser',
        fullName: 'New User',
        role: 'user'
      }));
    });

    it('should allow admin to deactivate users', async () => {
      (storage.deactivateUser as any).mockResolvedValue(true);

      const response = await request(app)
        .put('/api/users/1/deactivate')
        .set('Cookie', ['user=admin'])
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Match Management', () => {
    const mockMatch: Match = {
      id: 1,
      team1: 'Team A',
      team2: 'Team B',
      matchDate: new Date(),
      winner: null,
      isAbandoned: false
    };

    it('should get all matches when all=true', async () => {
      const mockMatches = [mockMatch];
      (storage.getAllMatches as any).mockResolvedValue(mockMatches);

      const response = await request(app)
        .get('/api/matches?all=true')
        .set('Cookie', ['user=user'])
        .expect(200);

      expect(response.body).toEqual(mockMatches);
    });

    it('should get only upcoming matches by default', async () => {
      const mockMatches = [mockMatch];
      (storage.getUpcomingMatches as any).mockResolvedValue(mockMatches);

      const response = await request(app)
        .get('/api/matches')
        .set('Cookie', ['user=user'])
        .expect(200);

      expect(response.body).toEqual(mockMatches);
    });

    it('should allow admin to create matches', async () => {
      (storage.createMatch as any).mockResolvedValue(mockMatch);

      const response = await request(app)
        .post('/api/matches')
        .set('Cookie', ['user=admin'])
        .send({
          team1: 'Team A',
          team2: 'Team B',
          matchDate: new Date().toISOString()
        })
        .expect(201);

      expect(response.body).toEqual(mockMatch);
    });

    it('should allow admin to update match results', async () => {
      const updatedMatch = { ...mockMatch, winner: 'Team A' };
      (storage.updateMatchResult as any).mockResolvedValue(updatedMatch);

      const response = await request(app)
        .put('/api/matches/1/winner')
        .set('Cookie', ['user=admin'])
        .send({ winner: 'Team A', isAbandoned: false })
        .expect(200);

      expect(response.body).toEqual(updatedMatch);
    });
  });

  describe('Betting', () => {
    const mockBet: Bet = {
      id: 1,
      userId: 1,
      matchId: 1,
      selectedTeam: 'Team A',
      amount: 100
    };

    it('should get user bets', async () => {
      const mockBets = [mockBet];
      (storage.getUserBets as any).mockResolvedValue(mockBets);

      const response = await request(app)
        .get('/api/bets')
        .set('Cookie', ['user=user'])
        .expect(200);

      expect(response.body).toEqual(mockBets);
    });

    it('should get user bet for specific match', async () => {
      (storage.getUserBetsForMatch as any).mockResolvedValue(mockBet);

      const response = await request(app)
        .get('/api/bets/match/1')
        .set('Cookie', ['user=user'])
        .expect(200);

      expect(response.body).toEqual(mockBet);
    });

    it('should get all bets for a match', async () => {
      const mockBets = [mockBet];
      (storage.getMatchBets as any).mockResolvedValue(mockBets);

      const response = await request(app)
        .get('/api/bets/match/1/all')
        .set('Cookie', ['user=user'])
        .expect(200);

      expect(response.body).toEqual(mockBets);
    });

    it('should allow users to place bets', async () => {
      (storage.createBet as any).mockResolvedValue(mockBet);

      const response = await request(app)
        .post('/api/bets')
        .set('Cookie', ['user=user'])
        .send({
          matchId: 1,
          selectedTeam: 'Team A',
          amount: 100
        })
        .expect(201);

      expect(response.body).toEqual(mockBet);
    });

    it('should allow users to update their bets', async () => {
      const updatedBet = { ...mockBet, selectedTeam: 'Team B' };
      (storage.updateBet as any).mockResolvedValue(updatedBet);

      const response = await request(app)
        .put('/api/bets/1')
        .set('Cookie', ['user=user'])
        .send({
          matchId: 1,
          selectedTeam: 'Team B',
          amount: 100
        })
        .expect(200);

      expect(response.body).toEqual(updatedBet);
    });
  });

  describe('Leaderboard', () => {
    it('should get leaderboard data', async () => {
      const mockScores = [
        { userId: 1, points: 1000 },
        { userId: 2, points: 800 }
      ];
      const mockUsers = [
        { id: 1, fullName: 'User 1' },
        { id: 2, fullName: 'User 2' }
      ];
      const mockBets = [
        [{ id: 1, matchId: 1, selectedTeam: 'Team A' }],
        [{ id: 2, matchId: 1, selectedTeam: 'Team B' }]
      ];
      const mockMatches = [
        { id: 1, winner: 'Team A' }
      ];

      (storage.getAllUsers as any).mockResolvedValue(mockUsers);
      (storage.getAllScores as any).mockResolvedValue(mockScores);
      (storage.getUserBets as any).mockImplementation((userId) => 
        Promise.resolve(mockBets[userId - 1])
      );
      (storage.getAllMatches as any).mockResolvedValue(mockMatches);

      const response = await request(app)
        .get('/api/leaderboard')
        .set('Cookie', ['user=user'])
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('userId');
      expect(response.body[0]).toHaveProperty('fullName');
      expect(response.body[0]).toHaveProperty('totalPoints');
      expect(response.body[0]).toHaveProperty('winningBets');
      expect(response.body[0]).toHaveProperty('totalBets');
      expect(response.body[0]).toHaveProperty('winRate');
    });
  });
}); 