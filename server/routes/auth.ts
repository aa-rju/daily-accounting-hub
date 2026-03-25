import "dotenv/config";
import { RequestHandler } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../db";

export const login: RequestHandler = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ success: false, message: "Email and password are required" });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ success: false, message: "Invalid email or password" });
      return;
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

export const logout: RequestHandler = (_req, res) => {
  res.json({ success: true, message: "Logged out successfully" });
};
export const register: RequestHandler = async (req, res) => {
  const { name, email, password, companyName, plan } = req.body;

  if (!name || !email || !password || !companyName) {
    res.status(400).json({ success: false, message: "All fields are required" });
    return;
  }

  try {
    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ success: false, message: "Email already registered" });
      return;
    }

    const hashed = await bcrypt.hash(password, 10);

    // Create org and owner user together
    const org = await prisma.organisation.create({
      data: {
        name: companyName,
        plan: plan || "free",
        status: "active",
        ownerId: "temp", // updated below
        users: {
          create: {
            name,
            email,
            password: hashed,
            role: "owner",
          },
        },
      },
      include: { users: true },
    });

    // Set ownerId to the created user's id
    const owner = org.users[0];
    await prisma.organisation.update({
      where: { id: org.id },
      data: { ownerId: owner.id },
    });

    const token = jwt.sign(
      { userId: owner.id, email: owner.email, orgId: org.id },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      token,
      user: { id: owner.id, email: owner.email, name: owner.name },
      org: { id: org.id, name: org.name, plan: org.plan },
    });

  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
};
