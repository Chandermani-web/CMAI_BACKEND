import express from 'express';
import { generateRoadmap, getAllRoadmaps, getRoadmap } from '../controllers/roadmap.controller.js';
import { isAuth } from "../middleware/isAuth.js";

const roadmapRouter = express.Router();

roadmapRouter.post('/', isAuth, generateRoadmap);
roadmapRouter.get('/all', isAuth, getAllRoadmaps);
roadmapRouter.get('/:id', isAuth, getRoadmap);

export default roadmapRouter;