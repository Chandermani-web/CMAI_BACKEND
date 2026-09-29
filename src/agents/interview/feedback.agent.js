import feedbackPrompt from "../../graph/interview/prompts/feedbackPrompt.js";
import llm from "../../config/llm.js";

export const feedbackAgent = async (data) => {
    try {
        const prompt = feedbackPrompt(data);

        const response = await llm.invoke(prompt);

        const content =
            typeof response.content === "string"
                ? response.content
                : JSON.stringify(response.content);

        const cleaned = content
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        const feedback = JSON.parse(cleaned);

        return {
            score: Number(feedback.score) || 0,
            correctness: Number(feedback.correctness) || 0,
            clarity: Number(feedback.clarity) || 0,
            relevance: Number(feedback.relevance) || 0,
            detail: Number(feedback.detail) || 0,
            efficiency: Number(feedback.efficiency) || 0,
            problemSolving: Number(feedback.problemSolving) || 0,
            communication: Number(feedback.communication) || 0,
            creativity: Number(feedback.creativity) || 0,

            feedback: feedback.feedback || "",

            // IMPORTANT:
            // AI may return "improvements"
            improvement: Array.isArray(feedback.improvements)
                ? feedback.improvements
                : Array.isArray(feedback.improvement)
                    ? feedback.improvement
                    : [],
        };
    } catch (error) {
        console.error("❌ Feedback agent error:", error);

        // DO NOT use res here
        throw error;
    }
};