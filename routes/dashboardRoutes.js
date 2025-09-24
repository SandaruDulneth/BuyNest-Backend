import express from "express";
import { getOverview, getTopProducts } from "../controllers/dashboardController.js";

const router = express.Router();


router.get("/overview", getOverview);


router.get("/top-products", getTopProducts);

export default router;
