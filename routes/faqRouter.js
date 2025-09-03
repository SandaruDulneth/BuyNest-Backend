import express from "express";
import {getFaqs, createFaq, updateFaq, deleteFaq} from "../controllers/faqController.js";

const faqRouter = express.Router();

faqRouter.get("/", getFaqs);
faqRouter.post("/", createFaq);
faqRouter.put("/:faqId", updateFaq);
faqRouter.delete("/:faqId", deleteFaq);

export default faqRouter;