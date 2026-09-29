import express from "express";

import {
  googleAuth,
  logout,
  useCoin,
  addCoin,
} from "../controllers/auth.controller.js";

import { isAuth } from "../middleware/isAuth.js";

const authRouter = express.Router();

// Public
authRouter.post("/login", googleAuth);

// Protected
authRouter.post("/logout", isAuth, logout);
authRouter.post("/use-coins", isAuth, useCoin);
authRouter.post("/add-coins", isAuth, addCoin);

export default authRouter;