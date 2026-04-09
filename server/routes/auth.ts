/**
 * server/routes/auth.ts
 *
 * KEY FIXES:
 * 1. login() now reads user.orgId and puts it in the JWT
 * 2. register() creates org → user → seeds Cash account (all linked to orgId)
 * 3. me() returns orgId so frontend can store it
 *
 * This is the single most important fix for multi-tenancy.
 * Without orgId in the JWT, every request has no idea which tenant it is.
 */

import "dotenv/config";
import { RequestHandler } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../db";

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES = "7d";

function signToken(userId: string, orgId: string, email: string) {
  return jwt.sign({ userId, orgId, email }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

// ── POST /api/auth/register ───────────────────────────────────
export const register: RequestHandler = async (req, res) => {
  const { name, email, password, companyName, plan } = req.body;

  if (!name || !email || !password || !companyName) {
    res.status(400).json({ success: false, message: "All fields are required" });
    return;
  }

  try {
    const existing = await (prisma as any).user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ success: false, message: "Email already registered" });
      return;
    }

    const hashed = await bcrypt.hash(password, 12);

    // Single transaction: org → user → fix ownerId → seed Cash account
    const result = await (prisma as any).$transaction(async (tx: any) => {
      const org = await tx.organisation.create({
        data: { name: companyName, plan: plan || "free", status: "active", ownerId: "temp" },
      });

      const user = await tx.user.create({
        data: { name, email, password: hashed, role: "owner", orgId: org.id },
      });

      await tx.organisation.update({
        where: { id: org.id },
        data: { ownerId: user.id },
      });

      // Seed a default Cash account for this org
      await tx.account.create({
        data: { orgId: org.id, name: "Cash", type: "cash", balance: 0, currency: "NPR" },
      });

      return { user, org };
    });

    const token = signToken(result.user.id, result.org.id, result.user.email);

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      token,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        orgId: result.org.id,
        orgName: result.org.name,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

// ── POST /api/auth/login ──────────────────────────────────────
// THE CRITICAL FIX: orgId is now included in the JWT
export const login: RequestHandler = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ success: false, message: "Email and password are required" });
    return;
  }

  try {
    const user = await (prisma as any).user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ success: false, message: "Invalid email or password" });
      return;
    }

    if (user.status === "suspended") {
      res.status(403).json({ success: false, message: "Account is suspended" });
      return;
    }

    if (!user.orgId) {
      res.status(403).json({
        success: false,
        message: "No organisation linked to this account. Please contact support.",
      });
      return;
    }

    // Fetch org name to return to client
    const org = await (prisma as any).organisation.findUnique({
      where: { id: user.orgId },
      select: { id: true, name: true, plan: true },
    });

    // ✅ orgId is in the token — this is the fix
    const token = signToken(user.id, user.orgId, user.email);

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        orgId: user.orgId,
        orgName: org?.name ?? "",
        plan: org?.plan ?? "free",
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

// ── POST /api/auth/logout ─────────────────────────────────────
export const logout: RequestHandler = (_req, res) => {
  res.json({ success: true, message: "Logged out successfully" });
};

// ── GET /api/auth/me ──────────────────────────────────────────
export const me: RequestHandler = async (req: any, res) => {
  try {
    const user = await (prisma as any).user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, email: true, name: true, role: true, orgId: true },
    });

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    const org = user.orgId
      ? await (prisma as any).organisation.findUnique({
          where: { id: user.orgId },
          select: { name: true, plan: true },
        })
      : null;

    res.json({
      success: true,
      message: "Success",
      data: { ...user, orgName: org?.name ?? "", plan: org?.plan ?? "free" },
    });
  } catch {
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
};