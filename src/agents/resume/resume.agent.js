import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import llm from "../../config/llm.js";
import parseJsonResponse from "../../utils/jsonParser.js";

export const resumeAgent = async (resumeText) => {
  try {
    const response = await llm.invoke([
      new SystemMessage(`
You are an expert ATS resume analyzer.

Analyze the resume text and return ONLY valid JSON.

IMPORTANT:
- Every field below MUST exist.
- Never omit a field.
- If information is not available, use an empty string "".
- For arrays, use [].
- score MUST be a number from 0 to 100.
- Do NOT return markdown.
- Do NOT wrap JSON in triple backticks.
- Do NOT add explanations before or after JSON.

Required JSON structure:

{
  "name": "",
  "email": "",
  "phone": "",
  "summary": "",
  "skills": [],
  "projects": [],
  "education": [],
  "experience": [],
  "strengths": [],
  "weaknesses": [],
  "missingSkills": [],
  "suggestedRole": "",
  "score": 0,
  "recommendations": []
}

Resume:
      `),
      new HumanMessage(resumeText),
    ]);

    console.log("RAW AI RESPONSE:");
    console.log(response.content);

    const parsed = parseJsonResponse(response.content);

    // Guarantee required fields exist
    const resumeData = {
      name: parsed.name ?? "",
      email: parsed.email ?? "",
      phone: parsed.phone ?? "",
      summary: parsed.summary ?? "",
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      projects: Array.isArray(parsed.projects) ? parsed.projects : [],
      education: Array.isArray(parsed.education) ? parsed.education : [],
      experience: Array.isArray(parsed.experience) ? parsed.experience : [],
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      weaknesses: Array.isArray(parsed.weaknesses)
        ? parsed.weaknesses
        : [],
      missingSkills: Array.isArray(parsed.missingSkills)
        ? parsed.missingSkills
        : [],
      suggestedRole: parsed.suggestedRole ?? "",
      score: Number(parsed.score ?? 0),
      recommendations: Array.isArray(parsed.recommendations)
        ? parsed.recommendations
        : [],
    };

    console.log(
      "FINAL RESUME DATA:",
      JSON.stringify(resumeData, null, 2)
    );

    return resumeData;
  } catch (error) {
    console.error("Resume Agent Error:", error);
    throw error;
  }
};