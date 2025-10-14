import Delivery from "../models/delivery.js";
import { isAdmin } from "./userController.js";
import Rider from "../models/rider.js";
import Order from "../models/order.js";

/* -------------------- GET ACTIVE RIDERS -------------------- */
export async function getActiveRiders(req, res) {
  try {
    const riders = await Rider.find({ status: true }).lean(); // active riders only
    res.json(riders);
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch active riders",
      error: err.message,
    });
  }
}

/* -------------------- GET DELIVERIES -------------------- */
export async function getDeliveries(req, res) {
  try {
    const deliveries = await Delivery.find().sort({ date: -1 }).lean();
    res.json({
      count: deliveries.length,
      deliveries,
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to get deliveries",
      error: err.message,
    });
  }
}

/* -------------------- CREATE DELIVERY -------------------- */
export async function createDelivery(req, res) {
  try {
    // Generate next delivery ID
    let newDeliveryId = "BYNDEL00001";
    const lastDelivery = await Delivery.find().sort({ deliveryId: -1 }).limit(1);
    if (lastDelivery.length > 0) {
      const lastId = lastDelivery[0].deliveryId;
      const idNumber = parseInt(lastId.replace("BYNDEL", ""), 10);
      const padded = String(idNumber + 1).padStart(5, "0");
      newDeliveryId = "BYNDEL" + padded;
    }

    const { riderId, orderId, phone } = req.body;

  // Prevent duplicate delivery for same order
const existingDelivery = await Delivery.findOne({ orderId });
if (existingDelivery) {
  // ✅ Instead of returning an error, respond as if it’s already OK
  return res.status(200).json({
    message: "Delivery already exists",
    delivery: existingDelivery,
  });
}


    // ✅ Block the assigned rider immediately
    if (riderId) {
      await Rider.updateOne({ riderId }, { status: false });
    }

    const delivery = await Delivery.create({
      deliveryId: newDeliveryId,
      riderId,
      orderId,
      phone,
    });

    res.status(201).json({
      message: "Delivery created successfully",
      delivery,
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to create delivery",
      error: err.message,
    });
  }
}

/* -------------------- DELETE DELIVERY -------------------- */
export async function deleteDelivery(req, res) {
  if (!isAdmin(req)) {
    return res.status(403).json({
      message: "You are not authorized to delete deliveries",
    });
  }

  try {
    const { deliveryId } = req.params;
    const delivery = await Delivery.findOne({ deliveryId });
    if (!delivery) {
      return res.status(404).json({ message: "Delivery not found" });
    }

    // ✅ Unblock the rider when delivery is deleted
    if (delivery.riderId) {
      await Rider.updateOne({ riderId: delivery.riderId }, { status: true });
    }

    await Delivery.deleteOne({ deliveryId });

    res.json({ message: "Delivery deleted successfully" });
  } catch (err) {
    res.status(500).json({
      message: "Failed to delete delivery",
      error: err.message,
    });
  }
}

/* -------------------- UPDATE DELIVERY (Assign Rider) -------------------- */
export async function updateDelivery(req, res) {
  if (!isAdmin(req)) {
    return res.status(403).json({
      message: "You are not authorized to update deliveries",
    });
  }

  try {
    const { deliveryId } = req.params;
    const { riderId, orderId } = req.body;

    const delivery = await Delivery.findOne({ deliveryId });
    if (!delivery) {
      return res.status(404).json({ message: "Delivery not found" });
    }

    // Prevent reassigning an order already assigned to another delivery
    if (orderId && orderId !== delivery.orderId) {
      const existingDelivery = await Delivery.findOne({
        orderId,
        deliveryId: { $ne: deliveryId },
      });
      if (existingDelivery) {
        return res.status(400).json({
          message: "This order is already assigned to another delivery",
        });
      }
    }

    // ✅ Unblock previously assigned rider (if different)
    if (delivery.riderId && delivery.riderId !== riderId) {
      await Rider.updateOne({ riderId: delivery.riderId }, { status: true });
    }

    // ✅ Block the new rider (if assigned)
    if (riderId) {
      await Rider.updateOne({ riderId }, { status: false });
    }

    // Update delivery info
    const updatedDelivery = await Delivery.findOneAndUpdate(
      { deliveryId },
      { riderId, orderId },
      { new: true, runValidators: true }
    );

    res.json({
      message: "Rider assigned successfully",
      delivery: updatedDelivery,
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to update delivery",
      error: err.message,
    });
  }
}

/* -------------------- AUTO-UNBLOCK RIDER ON ORDER DELIVERED -------------------- */
export async function handleOrderDelivered(orderId) {
  try {
    // Find delivery for this order
    const delivery = await Delivery.findOne({ orderId });
    if (!delivery) return;

    // ✅ Mark delivery as completed
    await Delivery.updateOne({ orderId }, { status: "completed" });

    // ✅ Unblock rider (make available again)
    if (delivery.riderId) {
      await Rider.updateOne({ riderId: delivery.riderId }, { status: true });
    }
  } catch (err) {
    console.error("Error unblocking rider after delivery:", err.message);
  }
}
