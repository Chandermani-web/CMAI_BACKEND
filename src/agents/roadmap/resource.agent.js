import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import llm from "../../config/llm.js";
import searchVideo from "../../config/youtube.js";
import parseJsonResponse from "../../utils/jsonParser.js";

const resourceAgent = async (state) => {
  try {
    const roadmap = state.roadmap;

    if (!roadmap || !Array.isArray(roadmap.modules)) {
      throw new Error("Roadmap or roadmap modules are missing.");
    }

    const modulesTitle = roadmap.modules
      .map((module) => module.title)
      .filter(Boolean)
      .join("\n");

    let docs = [];

    if (modulesTitle) {
      const docsResponse = await llm.invoke([
        new SystemMessage(`
You are an expert software engineer.

For every module below, provide the official documentation URL.

Rules:
1. Prefer official documentation.
2. If official documentation does not exist, return the best learning article.
3. Return ONLY valid JSON.
4. Do not explain anything.
5. Keep the exact same module title.

Return format:

[
  {
    "title": "",
    "article": ""
  }
]
        `),

        new HumanMessage(`
Modules:

${modulesTitle}
        `),
      ]);

      console.log("========== RESOURCE AI RESPONSE ==========");
      console.log(docsResponse.content);
      console.log("==========================================");

      try {
        docs = parseJsonResponse(docsResponse.content);

        if (!Array.isArray(docs)) {
          docs = [];
        }
      } catch (error) {
        console.error("Error parsing docs response:", error);
        docs = [];
      }
    }

    const docsMap = new Map();

    docs.forEach((doc) => {
      if (doc?.title) {
        docsMap.set(
          doc.title.toLowerCase().trim(),
          doc.article || ""
        );
      }
    });

    const modules = await Promise.all(
      roadmap.modules.map(async (module) => {
        let video = null;

        try {
          video = await searchVideo(module.title);
        } catch (error) {
          console.error(
            `Error fetching video for module ${module.title}:`,
            error
          );
        }

        return {
          ...module,

          youtube: video?.[0]?.url || "",

          article:
            docsMap.get(
              module.title.toLowerCase().trim()
            ) || "",
        };
      })
    );

    return {
      ...state,

      roadmap: {
        ...roadmap,
        modules,
      },
    };
  } catch (error) {
    console.error("Error in resourceAgent:", error);

    throw error;
  }
};

export default resourceAgent;