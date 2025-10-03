import express from "express";
import { addReview, getReviews, sendReply } from "../controllers/reviewController.js";

const reviewRouter = express.Router();

reviewRouter.post("/", addReview);
reviewRouter.get("/", getReviews);
// 🔹 New endpoint to send reply email
reviewRouter.post("/reply", sendReply);

export default reviewRouter;
