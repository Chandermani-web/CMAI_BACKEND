import { Annotation } from '@langchain/langgraph';

export const roadmapState = Annotation.Root({
    role: Annotation,
    targetPackage: Annotation,
    useResume: Annotation,
    resume: Annotation,
    roadmap: Annotation,
})  