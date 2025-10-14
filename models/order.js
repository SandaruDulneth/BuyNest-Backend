import mongoose from "mongoose";

const orderSchema = mongoose.Schema({
    orderId: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },
    address: {
        type: String,
    },
    status: {
        type: String,
        required: true,
        default: "pending", // new orders default to pending
    },
    deliveryMethod: {
        type: String,
        required: true, // "pickup" or "home"
    },
    paymentStatus: {
        type: String,
        enum: ["unpaid", "paid", "COD"],
        default: "unpaid",
    },
    total: {
        type: Number,
        required: true,
    },
    products: [
        {
            productInfo: {
                productId: { type: String, required: true },
                name: { type: String, required: true },
                altNames: [{ type: String }],
                description: { type: String, required: true },
                images: [{ type: String }],
                labelledPrice: { type: Number, required: true },
                price: { type: Number, required: true },
            },
            quantity: {
                type: Number,
                required: true,
            },
        },
    ],
    date: {
        type: Date,
        default: Date.now,
    },
    // ✅ QR Code stored only for pickup orders
    qrCodeData: {
        type: String,
        required: false, // optional field
    },
});

const Order = mongoose.model("orders", orderSchema);
export default Order;
