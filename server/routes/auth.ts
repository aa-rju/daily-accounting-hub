/**
 * server/routes/auth.ts
 * POST /api/auth/register
 * POST /api/auth/login
 * POST /api/auth/logout
 * GET  /api/auth/me
 *
 * KEY FIX: JWT now contains { userId, orgId } so every downstream
 * route can read req.user.orgId for multi-tenancy isolation.
 */

import "dotenv/config";
import { RequestHandler } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../db";

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES = "7d";

// ─────────────────────────────────────────────
//  REGISTER
// ─────────────────────────────────────────────
export const register: RequestHandler = async (req, res) => {
  const { name, email, password, companyName, plan } = req.body;

  if (!name || !email || !password || !companyName) {
    res.status(400).json({ success: false, message: "All fields are required" });
    return;
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ success: false, message: "Email already registered" });
      return;
    }

    const hashed = await bcrypt.hash(password, 12);

    // ── Transaction: create org → user → link → seed settings + cash account ──
    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Create org with temp ownerId
      const org = await prisma.organisation.create({
  data: {
    name: companyName,
    email:email,
    plan: plan || "free",
    status: "active",
    ownerId: "temp",
  },
});

      // 2. Create the owner user linked to the org
      const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role: "owner",
        status: "active",
        orgId: org.id,
      },
      });

      // 3. Update org.ownerId now that we have the user id
      await tx.organisation.update({
        where: { id: org.id },
        data: { ownerId: user.id },
      });

      // 4. Seed default Settings
      await tx.settings.create({
        data: { orgId: org.id },
      });

      // 5. Seed a Cash account
      await tx.account.create({
        data: { orgId: org.id, name: "Cash", type: "cash", balance: 0, openingBalance: 0 },
      });

      return { user, org };
    });

    const token = jwt.sign(
      { userId: result.user.id, orgId: result.org.id, email: result.user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      token,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        orgId: result.org.id,
      },
      org: { id: result.org.id, name: result.org.name, plan: result.org.plan },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

// ─────────────────────────────────────────────
//  LOGIN
// ─────────────────────────────────────────────
export const login: RequestHandler = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ success: false, message: "Email and password are required" });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { org: true },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ success: false, message: "Invalid email or password" });
      return;
    }

    // if (user.status !== "active") {
    //   res.status(403).json({ success: false, message: "Account is suspended" });
    //   return;
    // }
    if (user.status !== "active" || user.org?.status !== "active") {
  return res.status(403).json({ success: false, message: "Account is suspended" });
}

    const orgId = user.orgId ?? "default";

    // ── Ensure Settings row exists (safety net for old accounts) ──
    const settingsExist = await prisma.settings.findUnique({ where: { orgId } });
    if (!settingsExist && orgId !== "default") {
      await prisma.settings.create({ data: { orgId } });
    }

    const token = jwt.sign(
      { userId: user.id, orgId, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        orgId,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

// ─────────────────────────────────────────────
//  LOGOUT  (stateless JWT — client drops the token)
// ─────────────────────────────────────────────
export const logout: RequestHandler = (_req, res) => {
  res.json({ success: true, message: "Logged out successfully" });
};

// ─────────────────────────────────────────────
//  ME
// ─────────────────────────────────────────────
export const me: RequestHandler = async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, email: true, name: true, role: true, orgId: true },
    });
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }
    res.json({ success: true, message: "Success", data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
};