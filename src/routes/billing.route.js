import express from 'express';
import { createOrder, verifyPayment } from '../controllers/billing.controller.js';
import { isAuth } from "../middleware/isAuth.js";

const billingRouter = express.Router();

billingRouter.post('/create-order', isAuth, createOrder);
billingRouter.post('/verify-payment', isAuth, verifyPayment);

export default billingRouter;