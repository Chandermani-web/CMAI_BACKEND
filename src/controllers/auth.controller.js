import { getAuth } from "firebase-admin/auth";
import crypto from "crypto";
import User from "../models/user.model.js";
import { firebaseApp } from "../config/firebase.js";
import redis from "../config/redis.js";

const SESSION_TTL = 7 * 24 * 60 * 60;

export const googleAuth = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Firebase token is required",
      });
    }

    const decodedToken =
      await getAuth(firebaseApp).verifyIdToken(token);

    const {
      uid,
      email,
      name,
    } = decodedToken;

    let user = await User.findOne({
      firebaseUid: uid,
    });

    if (!user) {
      user = await User.create({
        firebaseUid: uid,
        username: name || email?.split("@")[0],
        email,
      });
    }

    const sessionId = crypto.randomUUID();

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

    res.cookie("session", sessionId, {
      httpOnly: true,

      // IMPORTANT for localhost development
      secure: false,
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

export const logout = async (req, res) => {
  try {
    const sessionId = req.cookies?.session;

    if (sessionId) {
      await redis.del(`session:${sessionId}`);
    }

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

export const useCoin = async (req, res) => {
  try {
    const userId = req.user.userId;

    const {
      coins,
      action,
    } = req.body;

    const coinAmount = Number(coins);

    if (!coinAmount || coinAmount <= 0) {
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

    user.interviewCoin -= coinAmount;

    await user.save();

    // Update current Redis session
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

export const addCoin = async (req, res) => {
  try {
    const userId = req.user.userId;
    const coinAmount = Number(req.body.coins);

    if (!coinAmount || coinAmount <= 0) {
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

    user.interviewCoin += coinAmount;

    await user.save();

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

export const getCurrentUser = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
};