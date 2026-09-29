import graph from "../graph/roadmap/roadmap.graph.js";
import Roadmap from "../models/roadmap.model.js";
import redis from "../config/redis.js";

export const generateRoadmap = async (req, res) => {
  try {
    const {
      role,
      targetPackage,
      useResume = false,
      resume,
    } = req.body;

    const userId = req.user.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user ID not found",
      });
    }

    if (!role || !targetPackage) {
      return res.status(400).json({
        success: false,
        message: "Role and target package are required.",
      });
    }

    if (useResume && !resume) {
      return res.status(400).json({
        success: false,
        message: "Resume is required when useResume is true.",
      });
    }

    console.log("Generating roadmap:", {
      userId,
      role,
      targetPackage,
      useResume,
    });

    const result = await graph.invoke({
      role,
      targetPackage,
      useResume,
      resume: useResume ? resume : null,
    });

    console.log(
      "========== GRAPH RESULT =========="
    );

    console.log(
      JSON.stringify(result, null, 2)
    );

    console.log(
      "=================================="
    );

    if (!result?.roadmap) {
      return res.status(500).json({
        success: false,
        message: "Failed to generate roadmap.",
      });
    }

    /*
     * IMPORTANT:
     * The Mongoose model expects the generated
     * roadmap inside the "roadmap" field.
     */

    const roadmap = await Roadmap.create({
      userId,
      role,
      targetPackage,
      useResume,
      resume: useResume ? resume : null,
      roadmap: result.roadmap,
    });

    // Invalidate user's roadmap list cache
    await redis.del(`roadmaps:${userId}`);

    // Cache individual roadmap
    await redis.set(
      `roadmap:${roadmap._id}:${userId}`,
      JSON.stringify(roadmap),
      "EX",
      3600
    );

    return res.status(201).json({
      success: true,
      message: "Roadmap generated successfully.",
      data: roadmap,
    });
  } catch (error) {
    console.error(
      "Generate roadmap error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "An error occurred while generating the roadmap.",
      error: error.message,
    });
  }
};

export const getAllRoadmaps = async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user ID not found",
      });
    }

    const cachedData = await redis.get(
      `roadmaps:${userId}`
    );

    if (cachedData) {
      return res.status(200).json({
        success: true,
        message: "Data retrieved from Redis cache.",
        source: "redis",
        data: JSON.parse(cachedData),
      });
    }

    const roadmaps = await Roadmap.find({ userId })
      .sort({ createdAt: -1 });

    await redis.set(
      `roadmaps:${userId}`,
      JSON.stringify(roadmaps),
      "EX",
      3600
    );

    return res.status(200).json({
      success: true,
      message: "Roadmaps retrieved successfully.",
      source: "database",
      data: roadmaps,
    });
  } catch (error) {
    console.error("Get all roadmaps error:", error);

    return res.status(500).json({
      success: false,
      message: "An error occurred while retrieving the roadmaps.",
      error: error.message,
    });
  }
};

export const getRoadmap = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user ID not found",
      });
    }

    const cachedData = await redis.get(
      `roadmap:${id}:${userId}`
    );

    if (cachedData) {
      return res.status(200).json({
        success: true,
        message: "Data retrieved from Redis cache.",
        source: "redis",
        data: JSON.parse(cachedData),
      });
    }

    const roadmap = await Roadmap.findOne({
      _id: id,
      userId,
    });

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: "Roadmap not found.",
      });
    }

    await redis.set(
      `roadmap:${id}:${userId}`,
      JSON.stringify(roadmap),
      "EX",
      3600
    );

    return res.status(200).json({
      success: true,
      message: "Roadmap retrieved successfully.",
      source: "database",
      data: roadmap,
    });
  } catch (error) {
    console.error("Get roadmap error:", error);

    return res.status(500).json({
      success: false,
      message: "An error occurred while retrieving the roadmap.",
      error: error.message,
    });
  }
};