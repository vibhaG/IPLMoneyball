import { z } from "zod";

// Define our own ObjectId type to avoid importing from mongodb in client code
class ObjectId {
  constructor(public id: string) {}
  
  static isValid(id: string): boolean {
    return /^[0-9a-fA-F]{24}$/.test(id);
  }
}

// User model schema
export const userSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  id: z.number().optional(),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  fullName: z.string().min(1, "Full name is required"),
  role: z.string().default("user"),
  isActive: z.boolean().default(true),
});

export const insertUserSchema = userSchema.omit({
  _id: true,
  id: true,
  isActive: true,
});

// Match model schema
export const matchSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  id: z.number().optional(),
  team1: z.string().min(1, "Team 1 is required"),
  team2: z.string().min(1, "Team 2 is required"),
  venue: z.string().min(1, "Venue is required"),
  matchDate: z.date(),
  time: z.string().min(1, "Time is required"),
});

export const insertMatchSchema = matchSchema.omit({
  _id: true,
  id: true,
});

// Bet model schema
export const betSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  id: z.number().optional(),
  userId: z.number(),
  matchId: z.number(),
  selectedTeam: z.string().min(1, "Selected team is required"),
  amount: z.number().positive("Amount must be positive"),
  createdAt: z.date().default(() => new Date()),
});

export const insertBetSchema = betSchema.omit({
  _id: true,
  id: true,
  createdAt: true,
});

// Data types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = z.infer<typeof userSchema>;

export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type Match = z.infer<typeof matchSchema>;

export type InsertBet = z.infer<typeof insertBetSchema>;
export type Bet = z.infer<typeof betSchema>;

// Registration schema with validation
export const registrationSchema = insertUserSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

// Login schema
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginData = z.infer<typeof loginSchema>;
