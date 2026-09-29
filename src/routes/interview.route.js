import express from "express";
import { startInterview, submitAnswer, getInterview, getAllInterviews } from "../controllers/interview.controller.js";
import { isAuth } from "../middleware/isAuth.js";

const interviewRouter = express.Router();

interviewRouter.post("/start", isAuth, startInterview);
interviewRouter.post("/answer", isAuth, submitAnswer);
interviewRouter.get("/all-interview", isAuth, getAllInterviews);
interviewRouter.get("/:id", isAuth, getInterview);

export default interviewRouter;     