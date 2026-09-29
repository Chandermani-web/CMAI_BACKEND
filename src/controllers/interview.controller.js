import graph from "../graph/interview/interview.graph.js";
import Interview from "../models/interview.model.js";

export const startInterview = async (req, res) => {
  try {
    const userId = req.user.userId;

    const {
      type,
      role,
      useResume = false,
      resume = {},
    } = req.body;

    if (!userId || !type || !role) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: type and role are required",
      });
    }

    const interviewType = type.toLowerCase();

    if (!["technical", "hr"].includes(interviewType)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid interview type. Must be technical or hr",
      });
    }

    const result = await graph.invoke({
      action: "start",
      role,
      type: interviewType,
      useResume,
      resume,
    });

    const questions = result?.questions;

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(500).json({
        success: false,
        message: "Failed to generate interview questions",
      });
    }

    const formattedQuestions = questions.map((q) => ({
      question: q.question,
      userAnswer: q.userAnswer || "",
      difficulty: q.difficulty || "easy",
      timer: q.timer || 60,
      feedback: q.feedback || {},
    }));

    const interview = await Interview.create({
      userId,
      type: interviewType,
      role,
      useResume,
      questions: formattedQuestions,
      currentQuestion: 0,
      status: "in-progress",
    });

    return res.status(200).json({
      success: true,
      interviewId: interview._id,
      currentQuestion: 0,
      totalQuestions: interview.questions.length,
      question: interview.questions[0],
    });
  } catch (error) {
    console.error("Start interview error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const submitAnswer = async (req, res) => {
  try {
    const userId = req.user.userId;

    const {
      interviewId,
      answer,
    } = req.body;

    if (!interviewId || !answer) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: interviewId and answer are required",
      });
    }

    const interview = await Interview.findOne({
      _id: interviewId,
      userId,
    });

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found",
      });
    }

    if (interview.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Interview has already been completed",
      });
    }

    const currentQuestionIndex = interview.currentQuestion;

    const currentQuestion =
      interview.questions[currentQuestionIndex];

    if (!currentQuestion) {
      return res.status(400).json({
        success: false,
        message: "No current question found",
      });
    }

    currentQuestion.userAnswer = answer;

    const completed =
      interview.currentQuestion + 1 >=
      interview.questions.length;

    const result = await graph.invoke({
      action: "feedback",
      question: currentQuestion.question,
      questions: interview.questions,
      difficulty: currentQuestion.difficulty,
      completed,
      answer,
      role: interview.role,
      type: interview.type,
    });

    currentQuestion.feedback = result?.feedback || {};

    if (!completed) {
      interview.currentQuestion += 1;
    }

    if (completed) {
      if (!result?.report) {
        throw new Error(
          "Summary report was not generated"
        );
      }

      interview.status = "completed";

      interview.overallScore =
        Number(result.report.overallScore) || 0;

      interview.summary =
        result.report.summary || "";

      interview.recommendations =
        Array.isArray(result.report.recommendations)
          ? result.report.recommendations
          : [];

      interview.strengths =
        Array.isArray(result.report.strengths)
          ? result.report.strengths
          : [];

      interview.weaknesses =
        Array.isArray(result.report.weaknesses)
          ? result.report.weaknesses
          : [];
    }

    await interview.save();

    return res.status(200).json({
      success: true,
      completed,
      currentQuestion: interview.currentQuestion,
      totalQuestions: interview.questions.length,
      question: !completed
        ? interview.questions[interview.currentQuestion]
        : null,
      feedback: currentQuestion.feedback,
    });
  } catch (error) {
    console.error("Submit answer error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const getInterview = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const interview = await Interview.findOne({
      _id: id,
      userId,
    });

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found",
      });
    }

    return res.status(200).json({
      success: true,
      interview,
    });
  } catch (error) {
    console.error("Get interview error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const getAllInterviews = async (req, res) => {
  try {
    const userId = req.user.userId;

    const interviews = await Interview.find({
      userId,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      interviews,
    });
  } catch (error) {
    console.error("Get all interviews error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};