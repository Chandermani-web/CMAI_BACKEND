import crypto from "crypto";
import User from "../models/user.model.js";
import { getAuth } from "firebase-admin/auth";
import firebaseApp from "../config/firebase.js";
import redis from "../config/redis.js";

const SESSION_TTL = 7 * 24 * 60 * 60;

// ======================================================
// GOOGLE / FIREBASE LOGIN
// ======================================================

export const googleAuth = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Firebase token is required",
      });
    }

    // Verify Firebase ID token
    const decodedToken = await getAuth(firebaseApp).verifyIdToken(token);

    const {
      uid,
      email,
      name,
    } = decodedToken;

    if (!uid) {
      return res.status(401).json({
        success: false,
        message: "Invalid Firebase token",
      });
    }

    // Find existing user
    let user = await User.findOne({
      firebaseUid: uid,
    });

    // Create new user
    if (!user) {
      user = await User.create({
        firebaseUid: uid,
        username: name || email?.split("@")[0] || "User",
        email: email || "",
      });
    }

    // Create session ID
    const sessionId = crypto.randomUUID();

    // Store session data in Redis
    const sessionData = {
      userId: user._id.toString(),
      username: user.username,
      email: user.email,
      interviewCoin: user.interviewCoin,
    };

    await redis.set(
      `session:${sessionId}`,
      JSON.stringify(sessionData),
      "EX",
      SESSION_TTL
    );

    // Store session cookie
    res.cookie("session", sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",

      maxAge: SESSION_TTL * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Google login successful",
      user,
    });
  } catch (error) {
    console.error("Google authentication error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// ======================================================
// LOGOUT
// ======================================================

export const logout = async (req, res) => {
  try {
    const sessionId = req.cookies?.session;

    // Remove Redis session
    if (sessionId) {
      await redis.del(`session:${sessionId}`);
    }

    // Remove browser cookie
    res.clearCookie("session", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// ======================================================
// USE INTERVIEW COINS
// ======================================================

export const useCoin = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user ID not found",
      });
    }

    const {
      coins,
      action,
    } = req.body;

    const coinAmount = Number(coins);

    if (!Number.isFinite(coinAmount) || coinAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid coin amount",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.interviewCoin < coinAmount) {
      return res.status(403).json({
        success: false,
        message: "Insufficient coins",
        interviewCoin: user.interviewCoin,
      });
    }

    // Deduct coins
    user.interviewCoin -= coinAmount;

    await user.save();

    // Update Redis session
    const sessionId = req.cookies?.session;

    if (sessionId) {
      const sessionData = {
        ...req.user,
        interviewCoin: user.interviewCoin,
      };

      await redis.set(
        `session:${sessionId}`,
        JSON.stringify(sessionData),
        "EX",
        SESSION_TTL
      );
    }

    return res.status(200).json({
      success: true,
      message: "Coin updated successfully",
      interviewCoin: user.interviewCoin,
      action,
    });
  } catch (error) {
    console.error("Use coin error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// ======================================================
// ADD INTERVIEW COINS
// ======================================================

export const addCoin = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user ID not found",
      });
    }

    const coinAmount = Number(req.body?.coins);

    if (!Number.isFinite(coinAmount) || coinAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid coin amount",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Add coins
    user.interviewCoin += coinAmount;

    await user.save();

    // Update Redis session
    const sessionId = req.cookies?.session;

    if (sessionId) {
      const sessionData = {
        ...req.user,
        interviewCoin: user.interviewCoin,
      };

      await redis.set(
        `session:${sessionId}`,
        JSON.stringify(sessionData),
        "EX",
        SESSION_TTL
      );
    }

    return res.status(200).json({
      success: true,
      message: "Coin added successfully",
      interviewCoin: user.interviewCoin,
    });
  } catch (error) {
    console.error("Add coin error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// ======================================================
// GET CURRENT USER
// ======================================================

export const getCurrentUser = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    return res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    console.error("Get current user error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
