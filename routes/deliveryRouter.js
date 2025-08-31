
import express from "express";
import {
    getDeliveries,
    createDelivery,
    updateDelivery,
    deleteDelivery,
} from "../controllers/deliveryController.js";

const deliveryRouter = express.Router();

deliveryRouter.get("/", getDeliveries);
deliveryRouter.post("/", createDelivery);
deliveryRouter.put("/:deliveryId", updateDelivery);
deliveryRouter.delete("/:deliveryId", deleteDelivery);

export default deliveryRouter;