import hrInterviewPrompt from "../../graph/interview/prompts/hrInterviewPrompt.js";
import technicalInterviewPrompt from "../../graph/interview/prompts/technicalInterviewPrompt.js";
import llm from "../../config/llm.js";

export const interviewAgent = async (data) => {
  const prompt =
    data?.type?.toLowerCase() === "hr"
      ? hrInterviewPrompt(data)
      : technicalInterviewPrompt(data);

  const response = await llm.invoke(prompt);

  const cleaned = response.content
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(cleaned);
};