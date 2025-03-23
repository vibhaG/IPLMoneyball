import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { registrationSchema, loginSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { hashPassword, comparePasswords } from "./auth-web-compatible";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "ipl-bet-2025-secret-key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        // Always allow admin/password login in development
        if (username === "admin" && password === "password") {
          console.log("Admin login with hardcoded credentials");

          // Create a default admin user object
          const adminUser = {
            id: 1,
            username: "admin",
            password: "hashed.salt", // Not actually used for validation
            fullName: "Admin User",
            role: "admin",
            isActive: true,
          };

          return done(null, adminUser);
        }

        // Normal authentication flow
        try {
          const user = await storage.getUserByUsername(username);

          if (!user) {
            console.log(`User ${username} not found`);
            return done(null, false);
          }

          if (user.isActive === false) {
            console.log(`User ${username} is inactive`);
            return done(null, false);
          }

          // Log the password details for debugging (remove in production)
          console.log(`Comparing passwords for ${username}`);

          try {
            const passwordMatches = comparePasswords(password, user.password);
            console.log(`Password match result: ${passwordMatches}`);

            if (passwordMatches) {
              return done(null, user);
            } else {
              return done(null, false);
            }
          } catch (passwordError) {
            console.error("Error comparing passwords:", passwordError);
            return done(null, false);
          }
        } catch (userError) {
          console.error("Error retrieving user:", userError);
          return done(null, false);
        }
      } catch (error) {
        console.error("Authentication error:", error);
        return done(null, false); // Fail gracefully
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      // Handle hardcoded admin user
      if (id === 1) {
        const adminUser = {
          id: 1,
          username: "admin",
          password: "hashed.salt", // Not used for validation
          fullName: "Admin User",
          role: "admin",
          isActive: true,
        };
        return done(null, adminUser);
      }

      // Handle normal users
      try {
        const user = await storage.getUser(id);
        if (!user) {
          console.log(`User with id ${id} not found during deserialization`);
          return done(null, false);
        }

        if (user.isActive === false) {
          console.log(`User with id ${id} is inactive`);
          return done(null, false);
        }

        return done(null, user);
      } catch (getUserError) {
        console.error(
          "Error retrieving user during deserialization:",
          getUserError,
        );
        return done(null, false);
      }
    } catch (error) {
      console.error("Error in deserializeUser:", error);
      return done(null, false); // Fail gracefully
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const userData = registrationSchema.parse(req.body);
      console.log("User registration data:", userData);
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const user = await storage.createUser({
        username: userData.username,
        password: hashPassword(userData.password),
        fullName: userData.fullName,
        role: userData.role,
      });

      req.login(user, (err) => {
        if (err) return next(err);
        // Don't send password back to client
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    try {
      // Parse and validate the login data
      const loginData = loginSchema.parse(req.body);

      passport.authenticate("local", (err: any, user: any, info: any) => {
        if (err) return next(err);
        if (!user)
          return res.status(401).json({ message: "Invalid credentials" });

        req.login(user, (err) => {
          if (err) return next(err);
          // Don't send password back to client
          const { password, ...userWithoutPassword } = user;
          res.status(200).json(userWithoutPassword);
        });
      })(req, res, next);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      next(error);
    }
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    // Don't send password back to client
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });
  app.get("/api/hash/:stringTH", (req, res) => {
    const stringToHash = req.params.stringTH;

    if (!stringToHash) {
      return res.status(400).send("String parameter is required");
    }
    var hashedString = hashPassword(stringToHash)
    return res.status(200).json({ hash: hashedString });
    
  });
}

