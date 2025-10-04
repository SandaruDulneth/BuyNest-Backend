import express from "express";
import { getOverview, getTopCustomers, getTopProducts, getUserRegistrations } from "../controllers/dashboardController.js";


const router = express.Router();


router.get("/overview", getOverview);
router.get("/top-products", getTopProducts);
router.get("/user-enrollment",getUserRegistrations)
router.get("/top-customers",getTopCustomers)
export default router;
