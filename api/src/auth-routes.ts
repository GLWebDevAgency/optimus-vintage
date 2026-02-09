/**
 * 🔐 AUTH ROUTES — Registration, Login, Token Refresh
 *
 * Enterprise-grade JWT authentication with:
 * - Email/password registration & login
 * - Access tokens (15min) + Refresh tokens (30 days)
 * - Password hashing with bcrypt
 * - Rate limiting on sensitive endpoints
 * - Input validation with Zod
 */

import bcrypt from "bcryptjs";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import { z } from "zod";

import {
    PLAN_QUOTAS,
    refreshTokens,
    subscriptions,
    TRIAL_CONFIG,
    users,
    type PlanName,
} from "./auth-schema";
import { db } from "./db";
import { ApiError, asyncHandler, validateBody } from "./middleware";

// ═══════════════════════════════════════════════════════════════════════════════
// 🔧 CONFIG
// ═══════════════════════════════════════════════════════════════════════════════

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "dev-refresh-secret-change-in-production";
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY_DAYS = 30;

if (
  process.env.NODE_ENV === "production" &&
  JWT_SECRET === "dev-secret-change-in-production"
) {
  console.error("❌ CRITICAL: JWT_SECRET must be set in production!");
  process.exit(1);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 VALIDATION SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════════

const registerSchema = z.object({
  email: z.string().email("Email invalide").max(255),
  password: z.string().min(8, "8 caractères minimum").max(128),
  displayName: z.string().min(1).max(100).optional(),
});

const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Token requis"),
});

// ═══════════════════════════════════════════════════════════════════════════════
// 🛠 HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function generateAccessToken(
  userId: number,
  email: string,
  plan: PlanName,
): string {
  return jwt.sign({ userId, email, plan }, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
}

function generateRefreshToken(userId: number): string {
  return jwt.sign(
    { userId, type: "refresh", jti: crypto.randomUUID() },
    JWT_REFRESH_SECRET,
    { expiresIn: `${REFRESH_TOKEN_EXPIRY_DAYS}d` },
  );
}

async function storeRefreshToken(userId: number, token: string): Promise<void> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  await db
    .insert(refreshTokens)
    .values({ userId, token, expiresAt })
    .onConflictDoUpdate({
      target: refreshTokens.token,
      set: { expiresAt, userId },
    });
}

function sanitizeUser(user: typeof users.$inferSelect) {
  const { passwordHash, ...safe } = user;
  return safe;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔒 AUTH MIDDLEWARE (Exported for use in other routes)
// ═══════════════════════════════════════════════════════════════════════════════

export interface AuthenticatedRequest extends Express.Request {
  user?: {
    userId: number;
    email: string;
    plan: PlanName;
  };
}

export function requireAuth(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({
      error: { message: "Token requis", code: "UNAUTHORIZED" },
    });
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as {
      userId: number;
      email: string;
      plan: PlanName;
    };
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({
      error: { message: "Token invalide ou expiré", code: "TOKEN_EXPIRED" },
    });
  }
}

/**
 * Optional auth — attaches user if token present, but doesn't block
 */
export function optionalAuth(req: any, _res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const payload = jwt.verify(token, JWT_SECRET) as {
        userId: number;
        email: string;
        plan: PlanName;
      };
      req.user = payload;
    } catch {
      // Token invalid — proceed without auth
    }
  }
  next();
}

/**
 * Quota enforcement middleware
 */
export function requirePlan(minPlan: PlanName) {
  const planOrder: PlanName[] = ["starter", "premium", "pro", "business"];
  return (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({
        error: { message: "Authentification requise", code: "UNAUTHORIZED" },
      });
    }
    const userPlanIndex = planOrder.indexOf(req.user.plan);
    const requiredPlanIndex = planOrder.indexOf(minPlan);

    if (userPlanIndex < requiredPlanIndex) {
      return res.status(403).json({
        error: {
          message: `Plan ${minPlan} requis. Vous êtes sur le plan ${req.user.plan}.`,
          code: "PLAN_REQUIRED",
          requiredPlan: minPlan,
          currentPlan: req.user.plan,
        },
      });
    }
    next();
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🚦 RATE LIMITING
// ═══════════════════════════════════════════════════════════════════════════════

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per 15 min
  message: {
    error: {
      message: "Trop de tentatives. Réessayez dans 15 minutes.",
      code: "RATE_LIMITED",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ═══════════════════════════════════════════════════════════════════════════════
// 🛣 ROUTER
// ═══════════════════════════════════════════════════════════════════════════════

export const authRouter = Router();

// ─── REGISTER ─────────────────────────────────────────────────────────────────

authRouter.post(
  "/register",
  authLimiter,
  validateBody(registerSchema),
  asyncHandler(async (req, res) => {
    const { email, password, displayName } = req.body;

    // Check if user exists
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);
    if (existing.length > 0) {
      throw ApiError.badRequest(
        "Un compte existe déjà avec cet email",
        "EMAIL_EXISTS",
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user with trial plan
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + TRIAL_CONFIG.durationDays);

    const [user] = await db
      .insert(users)
      .values({
        email: email.toLowerCase(),
        passwordHash,
        displayName: displayName || email.split("@")[0],
        authProvider: "email",
        plan: TRIAL_CONFIG.trialPlan,
      })
      .returning();

    // Create subscription record for the trial
    await db.insert(subscriptions).values({
      userId: user.id,
      plan: TRIAL_CONFIG.trialPlan,
      status: "trialing",
      currentPeriodStart: new Date(),
      currentPeriodEnd: trialEnd,
      trialEnd,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Generate tokens
    const accessToken = generateAccessToken(
      user.id,
      user.email,
      user.plan as PlanName,
    );
    const refreshToken = generateRefreshToken(user.id);
    await storeRefreshToken(user.id, refreshToken);

    // Update last login
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));

    res.status(201).json({
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
      quotas: PLAN_QUOTAS[user.plan as PlanName],
      trial: {
        isTrialing: true,
        trialEnd: trialEnd.toISOString(),
        daysRemaining: TRIAL_CONFIG.durationDays,
        trialPlan: TRIAL_CONFIG.trialPlan,
      },
    });
  }),
);

// ─── LOGIN ────────────────────────────────────────────────────────────────────

authRouter.post(
  "/login",
  authLimiter,
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Find user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (!user || !user.passwordHash) {
      throw ApiError.badRequest(
        "Email ou mot de passe incorrect",
        "INVALID_CREDENTIALS",
      );
    }

    if (!user.isActive) {
      throw ApiError.badRequest("Compte désactivé", "ACCOUNT_DISABLED");
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw ApiError.badRequest(
        "Email ou mot de passe incorrect",
        "INVALID_CREDENTIALS",
      );
    }

    // Generate tokens
    const accessToken = generateAccessToken(
      user.id,
      user.email,
      user.plan as PlanName,
    );
    const refreshToken = generateRefreshToken(user.id);
    await storeRefreshToken(user.id, refreshToken);

    // Update last login
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));

    // Check trial status
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, user.id))
      .limit(1);

    let trial = null;
    if (subscription?.status === "trialing" && subscription.trialEnd) {
      const now = new Date();
      const trialEnd = new Date(subscription.trialEnd);

      if (now >= trialEnd) {
        // Trial expired — downgrade
        await db
          .update(users)
          .set({ plan: TRIAL_CONFIG.fallbackPlan, updatedAt: new Date() })
          .where(eq(users.id, user.id));
        await db
          .update(subscriptions)
          .set({
            status: "expired",
            plan: TRIAL_CONFIG.fallbackPlan,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.userId, user.id));
        user.plan = TRIAL_CONFIG.fallbackPlan;
        trial = { isTrialing: false, expired: true };
      } else {
        const daysRemaining = Math.ceil(
          (trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );
        trial = {
          isTrialing: true,
          trialEnd: trialEnd.toISOString(),
          daysRemaining,
          trialPlan: TRIAL_CONFIG.trialPlan,
        };
      }
    }

    res.json({
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
      quotas: PLAN_QUOTAS[user.plan as PlanName],
      trial,
    });
  }),
);

// ─── REFRESH TOKEN ────────────────────────────────────────────────────────────

authRouter.post(
  "/refresh",
  validateBody(refreshSchema),
  asyncHandler(async (req, res) => {
    const { refreshToken: token } = req.body;

    // Verify JWT
    let payload: { userId: number };
    try {
      payload = jwt.verify(token, JWT_REFRESH_SECRET) as { userId: number };
    } catch {
      throw ApiError.badRequest(
        "Token de rafraîchissement invalide",
        "INVALID_REFRESH_TOKEN",
      );
    }

    // Check if token exists in DB
    const [stored] = await db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.token, token))
      .limit(1);

    if (!stored || stored.expiresAt < new Date()) {
      // Clean expired tokens
      if (stored) {
        await db.delete(refreshTokens).where(eq(refreshTokens.id, stored.id));
      }
      throw ApiError.badRequest(
        "Token de rafraîchissement expiré",
        "REFRESH_TOKEN_EXPIRED",
      );
    }

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    if (!user || !user.isActive) {
      throw ApiError.badRequest("Utilisateur introuvable", "USER_NOT_FOUND");
    }

    // Rotate tokens — delete old, create new
    await db.delete(refreshTokens).where(eq(refreshTokens.id, stored.id));

    const newAccessToken = generateAccessToken(
      user.id,
      user.email,
      user.plan as PlanName,
    );
    const newRefreshToken = generateRefreshToken(user.id);
    await storeRefreshToken(user.id, newRefreshToken);

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      quotas: PLAN_QUOTAS[user.plan as PlanName],
    });
  }),
);

// ─── GET CURRENT USER ─────────────────────────────────────────────────────────

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req: any, res) => {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, req.user.userId))
      .limit(1);

    if (!user) {
      throw ApiError.notFound("Utilisateur introuvable");
    }

    // Check trial status
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, user.id))
      .limit(1);

    let trial = null;
    if (subscription?.status === "trialing" && subscription.trialEnd) {
      const now = new Date();
      const trialEnd = new Date(subscription.trialEnd);

      if (now >= trialEnd) {
        // Trial expired — downgrade to starter
        await db
          .update(users)
          .set({ plan: TRIAL_CONFIG.fallbackPlan, updatedAt: new Date() })
          .where(eq(users.id, user.id));
        await db
          .update(subscriptions)
          .set({
            status: "expired",
            plan: TRIAL_CONFIG.fallbackPlan,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.userId, user.id));

        user.plan = TRIAL_CONFIG.fallbackPlan;
        trial = { isTrialing: false, expired: true };
      } else {
        const daysRemaining = Math.ceil(
          (trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );
        trial = {
          isTrialing: true,
          trialEnd: trialEnd.toISOString(),
          daysRemaining,
          trialPlan: TRIAL_CONFIG.trialPlan,
        };
      }
    }

    res.json({
      user: sanitizeUser(user),
      quotas: PLAN_QUOTAS[user.plan as PlanName],
      trial,
    });
  }),
);

// ─── LOGOUT ───────────────────────────────────────────────────────────────────

authRouter.post(
  "/logout",
  requireAuth,
  asyncHandler(async (req: any, res) => {
    // Delete all refresh tokens for user
    await db
      .delete(refreshTokens)
      .where(eq(refreshTokens.userId, req.user.userId));

    res.json({ message: "Déconnexion réussie" });
  }),
);

// ─── DELETE ACCOUNT ───────────────────────────────────────────────────────────

authRouter.delete(
  "/account",
  requireAuth,
  asyncHandler(async (req: any, res) => {
    await db.delete(users).where(eq(users.id, req.user.userId));

    res.json({ message: "Compte supprimé" });
  }),
);
