import { z } from "zod";
import { ObjectId } from "mongodb";

// Define our own ObjectId type to avoid importing from mongodb in client code
class ObjectId {
  constructor(public id: string) {}
  
  static isValid(id: string): boolean {
    return /^[0-9a-fA-F]{24}$/.test(id);
  }
}

// User model schema
export const userSchema = z.object({
  id: z.number().optional(),
  _id: z.instanceof(ObjectId).optional(),
  username: z.string().min(3),
  password: z.string().min(6),
  fullName: z.string(),
  role: z.enum(["user", "admin"]),
  isActive: z.boolean().default(true),
});

export const insertUserSchema = userSchema.omit({
  _id: true,
  id: true,
  isActive: true,
});

// Match model schema
export const matchSchema = z.object({
  id: z.number().optional(),
  _id: z.instanceof(ObjectId).optional(),
  team1: z.string(),
  team2: z.string(),
  venue: z.string(),
  matchDate: z.coerce.date(),
  time: z.string(),
  winner: z.string().nullable().optional(),
});

export const insertMatchSchema = matchSchema.omit({
  _id: true,
  id: true,
});

// Bet model schema
export const betSchema = z.object({
  id: z.number().optional(),
  _id: z.instanceof(ObjectId).optional(),
  userId: z.number(),
  matchId: z.number(),
  selectedTeam: z.string(),
  amount: z.number().positive(),
  createdAt: z.date().default(() => new Date()),
});

export const insertBetSchema = betSchema.omit({
  _id: true,
  id: true,
  createdAt: true,
});

// Leaderboard entry schema
export const leaderboardEntrySchema = z.object({
  userId: z.number(),
  fullName: z.string(),
  totalPoints: z.number(),
  winningBets: z.number(),
  totalBets: z.number(),
});

// Data types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = z.infer<typeof userSchema>;

export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type Match = z.infer<typeof matchSchema>;

export type InsertBet = z.infer<typeof insertBetSchema>;
export type Bet = z.infer<typeof betSchema>;

export type LeaderboardEntry = z.infer<typeof leaderboardEntrySchema>;

// Registration schema with validation
export const registrationSchema = userSchema
  .pick({
    username: true,
    password: true,
    fullName: true,
    role: true,
  })
  .extend({
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// Login schema
export const loginSchema = userSchema.pick({
  username: true,
  password: true,
});

export type LoginData = z.infer<typeof loginSchema>;
