import express from "express";
import { createOrder, getMyOrders, getOrders, updateOrderStatus } from "../controllers/orderController.js";
const orderRouter = express.Router();

orderRouter.post("/",createOrder)
orderRouter.get("/",getOrders)
orderRouter.put("/:orderId/:status",updateOrderStatus)
orderRouter.get("/my-orders", getMyOrders);


export default orderRouter;