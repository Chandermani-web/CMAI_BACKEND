import { Annotation } from "@langchain/langgraph";

const interviewState = Annotation.Root({
	action: Annotation,
	type: Annotation,
	role: Annotation,
	useResume: Annotation,
	resume: Annotation,
	questions: Annotation,
	question: Annotation,
	difficulty: Annotation,
	answer: Annotation,
	completed: Annotation,
	feedback: Annotation,
	report: Annotation,
});

export { interviewState };
export default interviewState;
