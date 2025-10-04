import express from "express";
import {
    getDeliveries,
    createDelivery,
    updateDelivery,
    deleteDelivery,
    getActiveRiders,   // ✅ import new controller
} from "../controllers/deliveryController.js";

const deliveryRouter = express.Router();

// ✅ Deliveries CRUD
deliveryRouter.get("/", getDeliveries);
deliveryRouter.post("/", createDelivery);
deliveryRouter.put("/:deliveryId", updateDelivery);
deliveryRouter.delete("/:deliveryId", deleteDelivery);

// ✅ New route: fetch only active riders
deliveryRouter.get("/active-riders", getActiveRiders);

export default deliveryRouter;
