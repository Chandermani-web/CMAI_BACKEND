import summaryPrompt from "../../graph/interview/prompts/summaryPrompt.js";
import llm from "../../config/llm.js";

export const summaryAgent = async (data) => {
    try {
        const prompt = summaryPrompt(data);

        const response = await llm.invoke(prompt);

        const content =
            typeof response.content === "string"
                ? response.content
                : JSON.stringify(response.content);

        const cleaned = content
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        const summary = JSON.parse(cleaned);

        return summary;

    } catch (error) {
        console.error("❌ Summary agent error:", error);

        // DO NOT use res.status()
        throw error;
    }
};