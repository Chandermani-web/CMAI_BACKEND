import express from 'express';
import { uploadResume, getResume } from '../controllers/resume.controller.js';
import upload from '../middleware/multer.js';
import { isAuth } from "../middleware/isAuth.js";

const resumeRouter = express.Router();


resumeRouter.post('/upload', isAuth, upload.single('resume'), uploadResume);
resumeRouter.get('/get-resume', isAuth, getResume);

export default resumeRouter;