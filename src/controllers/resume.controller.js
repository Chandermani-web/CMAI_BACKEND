import { resumeAgent } from "../agents/resume/resume.agent.js";
import extractText from "../config/pdf.js";
import Resume from "../models/resume.model.js";
import redis from "../config/redis.js";
import fs from "fs/promises";

const deleteUploadedFile = async (filePath) => {
  if (!filePath) return;

  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error("Error deleting uploaded file:", error);
    }
  }
};

export const uploadResume = async (req, res) => {
  const file = req.file;

  try {
    if (!file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    // Unified backend: user comes from isAuth middleware
    const userId = req.user.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user ID not found",
      });
    }

    const resumeText = await extractText(file.path);

    const resumeData = await resumeAgent(resumeText);

    let resume = await Resume.findOne({ userId });

    if (!resume) {
      resume = await Resume.create({
        userId,
        ...resumeData,
        extractText: resumeText,
      });
    } else {
      resume = await Resume.findByIdAndUpdate(
        resume._id,
        {
          ...resumeData,
          extractText: resumeText,
        },
        {
          new: true,
        }
      );
    }

    await redis.set(
      `resume:${userId}`,
      JSON.stringify(resume)
    );

    await deleteUploadedFile(file.path);

    return res.status(200).json({
      success: true,
      message: "Resume analyzed successfully",
      data: resume,
    });
  } catch (error) {
    await deleteUploadedFile(file?.path);

    console.error("Resume upload error:", error);

    return res.status(500).json({
      success: false,
      message: "Error analyzing resume",
      error: error.message,
    });
  }
};

export const getResume = async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user ID not found",
      });
    }

    const cachedResume = await redis.get(
      `resume:${userId}`
    );

    if (cachedResume) {
      return res.status(200).json({
        success: true,
        message: "Resume fetched successfully",
        count: 1,
        source: "redis",
        data: JSON.parse(cachedResume),
      });
    }

    const resume = await Resume.findOne({ userId });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    }

    await redis.set(
      `resume:${userId}`,
      JSON.stringify(resume)
    );

    return res.status(200).json({
      success: true,
      message: "Resume fetched successfully",
      count: 1,
      source: "database",
      data: resume,
    });
  } catch (error) {
    console.error("Get resume error:", error);

    return res.status(500).json({
      success: false,
      message: "Error fetching resume",
      error: error.message,
    });
  }
};