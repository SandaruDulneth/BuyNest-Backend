import Order from "../models/order.js";
import Product from "../models/product.js";
import { isAdmin } from "./userController.js";
import QRCode from "qrcode";  // ✅ QR code generator

/* -------------------- CREATE ORDER -------------------- */
export async function createOrder(req, res) {
    if (!req.user) {
        return res.status(403).json({ message: "Please login and try again" });
    }

    const orderInfo = req.body;

    if (!orderInfo.name) {
        orderInfo.name = req.user.firstName + " " + req.user.lastName;
    }

    // ✅ Order ID generation
    let orderId = "BYNOD00001";
    const lastOrder = await Order.find().sort({ date: -1 }).limit(1);
    if (lastOrder.length > 0) {
        const lastOrderId = lastOrder[0].orderId;
        const lastOrderNumberString = lastOrderId.replace("BYNOD", "");
        const lastOrderNumber = parseInt(lastOrderNumberString);
        const newOrderNumber = lastOrderNumber + 1;
        const newOrderNumberString = String(newOrderNumber).padStart(5, "0");
        orderId = "BYNOD" + newOrderNumberString;
    }

    try {
        let total = 0;
        let labelledTotal = 0;
        const products = [];

        for (let i = 0; i < orderInfo.products.length; i++) {
            const item = await Product.findOne({
                productId: orderInfo.products[i].productId,
            });

            if (!item) {
                return res.status(404).json({
                    message: `Product with productId ${orderInfo.products[i].productId} not found`,
                });
            }
            if (item.isAvailable === false) {
                return res.status(404).json({
                    message: `Product ${orderInfo.products[i].productId} is not available right now!`,
                });
            }
            if (item.stock < orderInfo.products[i].qty) {
                return res.status(400).json({
                    message: `Not enough stock for productId ${orderInfo.products[i].productId}`,
                });
            }

            products[i] = {
                productInfo: {
                    productId: item.productId,
                    name: item.name,
                    altNames: item.altNames,
                    description: item.description,
                    images: item.images,
                    labelledPrice: item.labelledPrice,
                    price: item.price,
                },
                quantity: orderInfo.products[i].qty,
            };

            total += item.price * orderInfo.products[i].qty;
            labelledTotal += item.labelledPrice * orderInfo.products[i].qty;
        }

        // ✅ Generate QR code ONLY for store pickup
        let qrCodeData = null;
        if ((orderInfo.deliveryMethod || "").toLowerCase() === "pickup") {
            const qrUrl = `http://localhost:5000/api/orders/verify/${orderId}`;
            qrCodeData = await QRCode.toDataURL(qrUrl);
        }

        const order = new Order({
            orderId,
            email: req.user.email,
            name: orderInfo.name,
            address: orderInfo.address,
            phone: orderInfo.phone,
            products,
            deliveryMethod: orderInfo.deliveryMethod,
            labelledTotal,
            total: orderInfo.total ?? total,
            qrCodeData,
        });

        const createdOrder = await order.save();

        // ✅ decrement stock
        for (const p of orderInfo.products) {
            await Product.updateOne(
                { productId: p.productId },
                { $inc: { stock: -p.qty } }
            );
        }

        res.json({
            message: "Order created successfully",
            order: createdOrder,
            orderId,
            phone: orderInfo.phone,
        });
    } catch (err) {
        res.status(500).json({
            message: "Failed to create order",
            error: err.message,
        });
    }
}

/* -------------------- GET ORDERS -------------------- */
export async function getOrders(req, res) {
    if (!req.user) {
        return res.status(403).json({ message: "Please login and try again" });
    }
    try {
        if (req.user.role === "admin") {
            const orders = await Order.find();
            res.json(orders);
        } else {
            const orders = await Order.find({ email: req.user.email });
            res.json(orders);
        }
    } catch (err) {
        res.status(500).json({
            message: "Failed to fetch orders",
            error: err.message,
        });
    }
}

/* -------------------- GET MY ORDERS -------------------- */
export async function getMyOrders(req, res) {
    try {
        const orders = await Order.find({ email: req.user.email });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch orders", error: err.message });
    }
}

/* -------------------- UPDATE ORDER STATUS (Admin only) -------------------- */
export async function updateOrderStatus(req, res) {
    if (!isAdmin(req)) {
        return res.status(403).json({
            message: "You are not authorized to update order status",
        });
    }
    try {
        const { orderId, status } = req.params;

        await Order.updateOne({ orderId }, { status });

        if (status === "delivered" || status === "completed") {
            const Delivery = (await import("../models/delivery.js")).default;
            await Delivery.updateOne({ orderId }, { status: "completed" });
        }

        // ✅ emit socket update
        const io = req.app.get("io");
        io.emit("orderUpdated", { orderId, status });

        res.json({ message: "Order status updated successfully" });
    } catch (e) {
        res.status(500).json({
            message: "Failed to update order status",
            error: e.message,
        });
    }
}

/* -------------------- VERIFY ORDER PAGE -------------------- */
export async function verifyOrderPage(req, res) {
    try {
        const { orderId } = req.params;
        const order = await Order.findOne({ orderId });

        if (!order) {
            return res.status(404).send("<h2>❌ Order not found</h2>");
        }

        res.send(`
            <html>
                <head><title>Verify Order</title></head>
                <body style="font-family: Arial; text-align:center; margin-top:50px;">
                    <h2>Order: ${orderId}</h2>
                    <p>Name: ${order.name}</p>
                    <p>Phone: ${order.phone}</p>
                    <p>Status: ${order.status}</p>
                    <form method="POST" action="/api/orders/verify/${orderId}/accept">
                        <button type="submit" style="padding:10px 20px; background:green; color:white; border:none; border-radius:5px; font-size:16px;">
                            ✅ Accept & Complete
                        </button>
                    </form>
                </body>
            </html>
        `);
    } catch (err) {
        res.status(500).send("Error loading verification page");
    }
}

/* -------------------- VERIFY ORDER ACCEPT -------------------- */
export async function verifyOrderAccept(req, res) {
    try {
        const { orderId } = req.params;
        const order = await Order.findOne({ orderId });

        if (!order) {
            return res.status(404).send("<h2>❌ Order not found</h2>");
        }

        order.status = "completed";
        await order.save();

        // ✅ emit socket update for real-time dashboard refresh
        const io = req.app.get("io");
        io.emit("orderUpdated", { orderId, status: "completed" });

        res.send(`
            <html>
                <head><title>Order Completed</title></head>
                <body style="font-family: Arial; text-align:center; margin-top:50px;">
                    <h2>✅ Order ${orderId} has been marked as Completed</h2>
                    <p>Thank you, ${order.name}!</p>
                </body>
            </html>
        `);
    } catch (err) {
        res.status(500).send("Error verifying order");
    }
}
