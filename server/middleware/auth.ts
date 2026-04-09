/**
 * server/middleware/auth.ts
 *
 * Verifies the JWT and attaches req.user = { userId, orgId, email }.
 * orgId is the tenant key — every data query must filter by it.
 *
 * If orgId is missing from the token (old token from before this fix)
 * the request is rejected so the user must log in again and get a
 * fresh token that includes orgId.
 */

import { RequestHandler } from "express";
import jwt from "jsonwebtoken";

export interface AuthUser {
  userId: string;
  orgId: string;
  email: string;
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user: AuthUser;
    }
  }
}

export const requireAuth: RequestHandler = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ success: false, message: "Not authenticated" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    // CRITICAL: Reject tokens that don't have orgId.
    // Old sessions from before this fix won't have orgId — force re-login.
    if (!decoded.orgId) {
      res.status(401).json({
        success: false,
        message: "Session expired — please log in again",
        code: "NO_ORG_IN_TOKEN",
      });
      return;
    }

    req.user = {
      userId: decoded.userId,
      orgId: decoded.orgId,
      email: decoded.email,
    };

    next();
  } catch {
    res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};