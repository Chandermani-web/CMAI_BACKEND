export const parseJsonResponse = (content) => {
  if (!content) {
    throw new Error("Empty JSON response received.");
  }

  let cleaned = content.trim();

  // Remove markdown code fences
  cleaned = cleaned
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  // Remove accidental leading/trailing text around JSON
  const firstObject = cleaned.indexOf("{");
  const firstArray = cleaned.indexOf("[");

  let start = -1;

  if (firstObject === -1) {
    start = firstArray;
  } else if (firstArray === -1) {
    start = firstObject;
  } else {
    start = Math.min(firstObject, firstArray);
  }

  if (start > 0) {
    cleaned = cleaned.substring(start);
  }

  const lastObject = cleaned.lastIndexOf("}");
  const lastArray = cleaned.lastIndexOf("]");

  const end = Math.max(lastObject, lastArray);

  if (end !== -1 && end < cleaned.length - 1) {
    cleaned = cleaned.substring(0, end + 1);
  }

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("Failed to parse JSON response:");
    console.error(cleaned);

    throw new Error(
      `Invalid JSON response from AI: ${error.message}`
    );
  }
};

export default parseJsonResponse;