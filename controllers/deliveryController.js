import Delivery from "../models/delivery.js";
import {isAdmin} from "./userController.js";

export async function getDeliveries(req, res) {
    try {
        const deliveries = await Delivery.find().sort({ date: -1 }).lean();
        res.json({
            count: deliveries.length,
            deliveries
        });
    } catch (err) {
        res.status(500).json({
            message: "Failed to get deliveries",
            error: err.message,
        });
    }
}

export async function createDelivery(req, res) {
    try {

        let newDeliveryId = "BYNDEL00001";
        const lastDelivery = await Delivery.find().sort({ deliveryId: -1 }).limit(1);

        if (lastDelivery.length > 0) {
            const lastId = lastDelivery[0].deliveryId;
            const idNumber = parseInt(lastId.replace("BYNDEL", ""), 10);
            const padded = String(idNumber + 1).padStart(5, "0");
            newDeliveryId = "BYNDEL" + padded;
        }

           const { riderId, orderId, phone } = req.body;


        const existingDelivery = await Delivery.findOne({ orderId });
        if (existingDelivery) {
            return res.status(400).json({
                message: "This order already has a delivery progress"
            });
        }

        const delivery = await Delivery.create({
            deliveryId: newDeliveryId,
            riderId,
            orderId,
            phone     
        });

        res.status(201).json({
            message: "Delivery created successfully",
            delivery
        });
    } catch (err) {
        res.status(500).json({
            message: "Failed to create delivery",
            error: err.message
        });
    }
}


export async function deleteDelivery(req, res) {
    if (!isAdmin(req)) {
        return res.status(403).json({
            message: "You are not authorized to delete deliveries"
        });
    }

    try {
        const { deliveryId } = req.params;

        const delivery = await Delivery.findOne({ deliveryId });
        if (!delivery) {
            return res.status(404).json({ message: "Delivery not found" });
        }

        await Delivery.deleteOne({ deliveryId });

        res.json({ message: "Delivery deleted successfully" });
    } catch (err) {
        res.status(500).json({
            message: "Failed to delete delivery",
            error: err.message
        });
    }
}

export async function updateDelivery(req, res) {
    if (!isAdmin(req)) {
        return res.status(403).json({
            message: "You are not authorized to update deliveries"
        });
    }

    try {
        const { deliveryId } = req.params;
        const { riderId, orderId } = req.body;

        const delivery = await Delivery.findOne({ deliveryId });
        if (!delivery) {
            return res.status(404).json({ message: "Delivery not found" });
        }

        // Check if the new orderId is already assigned to another delivery
        if (orderId && orderId !== delivery.orderId) {
            const existingDelivery = await Delivery.findOne({
                orderId,
                deliveryId: { $ne: deliveryId }
            });

            if (existingDelivery) {
                return res.status(400).json({
                    message: "This order is already assigned to another delivery"
                });
            }
        }

        const updatedDelivery = await Delivery.findOneAndUpdate(
            { deliveryId },
            { riderId, orderId },
            { new: true, runValidators: true }
        );

        res.json({
            message: "Rider assign successfully",
            delivery: updatedDelivery
        });
    } catch (err) {
        res.status(500).json({
            message: "Failed to update delivery",
            error: err.message
        });
    }
}
