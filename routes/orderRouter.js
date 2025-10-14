import express from "express";
import { 
    createOrder, 
    getMyOrders, 
    getOrders, 
    updateOrderStatus, 
    verifyOrderPage, 
    verifyOrderAccept,
    updateOrderPaymentStatus
} from "../controllers/orderController.js";

const orderRouter = express.Router();

/* ---------------- ORDER ROUTES ---------------- */

// Create a new order
orderRouter.post("/", createOrder);

// Get all orders (admin) or current user's orders
orderRouter.get("/", getOrders);

// Get logged-in user's own orders
orderRouter.get("/my-orders", getMyOrders);

// Admin updates order status (e.g., pending → delivered/completed)
orderRouter.put("/:orderId/:status", updateOrderStatus);

// ✅ Update payment status (e.g., unpaid → paid or COD)
orderRouter.put("/:orderId/payment/:paymentStatus", updateOrderPaymentStatus);
/* ---------------- QR CODE VERIFICATION ROUTES ---------------- */

// Show verification page when user scans QR
orderRouter.get("/verify/:orderId", verifyOrderPage);

// After user clicks "Accept", mark order as completed
orderRouter.post("/verify/:orderId/accept", verifyOrderAccept);

export default orderRouter;
