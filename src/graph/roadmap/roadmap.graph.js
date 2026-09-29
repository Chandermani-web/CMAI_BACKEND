import { StateGraph } from '@langchain/langgraph';
import { roadmapState } from './roadmap.state.js';
import roadmapAgent from '../../agents/roadmap/roadmap.agent.js';
import resourceAgent from '../../agents/roadmap/resource.agent.js';

const graph = new StateGraph(roadmapState)
.addNode("roadmapAgent", roadmapAgent)
.addNode("resourceAgent", resourceAgent)
.addEdge("__start__", "roadmapAgent")
.addEdge("roadmapAgent", "resourceAgent")
.addEdge("resourceAgent", "__end__")
.compile();

export default graph;