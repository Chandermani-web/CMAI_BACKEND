import { feedbackAgent } from "../../agents/interview/feedback.agent.js";
import { interviewAgent } from "../../agents/interview/interview.agent.js";
import { summaryAgent } from "../../agents/interview/summary.agent.js";

export async function interviewNode(state) {
    try {
        const result = await interviewAgent({
            action: state.action,
            type: state.type,
            role: state.role,
            useResume: state.useResume,
            resume: state.resume,
        });

        console.log("🤖 interviewAgent result:", result);

        if (!Array.isArray(result)) {
            throw new Error("Interview agent must return an array");
        }

        const questions = result.map((item) => ({
            question: item.question,
            difficulty: item.difficulty || "easy",
            timer: item.timer || 60,
            userAnswer: "",
        }));

        return {
            questions,
            question: questions[0]?.question || "",
            difficulty: questions[0]?.difficulty || "easy",
        };

    } catch (error) {
        console.error("❌ Interview node error:", error);
        throw error;
    }
}

export async function feedbackNode(state) {
    try {
        console.log("🔥 FEEDBACK NODE HIT");

        const feedback = await feedbackAgent({
            question: state.question,
            answer: state.answer,
            difficulty: state.difficulty,
        });

        console.log("🤖 feedbackAgent result:", feedback);

        return {
            feedback,

            // VERY IMPORTANT
            // Last question → go to summaryAgent
            action: state.completed ? "summary" : "feedback",
        };

    } catch (error) {
        console.error("❌ Feedback node error:", error);

        // DO NOT use res
        throw error;
    }
}


export async function summaryNode(state) {
    try {
        console.log("🔥 SUMMARY NODE HIT");

        const summary = await summaryAgent({
            role: state.role,
            type: state.type,
            questions: state.questions,
        });

        console.log("🤖 summaryAgent result:", summary);

        return {
            report: summary,
        };

    } catch (error) {
        console.error("❌ Summary node error:", error);

        // DO NOT use res
        throw error;
    }
}