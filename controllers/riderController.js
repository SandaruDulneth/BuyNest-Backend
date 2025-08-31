import Rider from "../models/rider.js";
import { isAdmin } from "./userController.js";

export async function addRider(req, res) {
    if (!isAdmin(req)) {
        return res.status(403).json({ message: "You are not authorized to add riders" });
    }

    try {

        const lastRider = await Rider.findOne().sort({ riderId: -1 });
        let generatedRiderId = "BYNRD00001";

        if (lastRider && lastRider.riderId) {
            const lastNumber = parseInt(lastRider.riderId.replace("BYNRD", ""));
            const newNumber = lastNumber + 1;
            generatedRiderId = "BYNRD" + String(newNumber).padStart(5, "0");
        }

        const rider = new Rider({
            riderId: generatedRiderId,
            email: req.body.email,
            Name: req.body.Name,
            contactNo: req.body.contactNo,
            vehicleType: req.body.vehicleType,
            status: req.body.status
        });

        await rider.save();
        res.json({ message: "Rider added successfully", rider });
    } catch (err) {
        res.status(500).json({ message: "Failed to add rider", error: err.message });
    }
}

export async function getRiders(req, res) {
    if (!isAdmin(req)) {
        return res.status(403).json({ message: "You are not authorized to view riders" });
    }

    try {
        const riders = await Rider.find();
        res.json(riders);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch riders", error: err.message });
    }
}

export async function updateRider(req, res) {
    if (!isAdmin(req)) {
        return res.status(403).json({ message: "You are not authorized to update riders" });
    }

    try {
        const riderId = req.params.riderId;
        await Rider.updateOne({ riderId }, req.body);

        res.json({ message: "Rider updated successfully" });
    } catch (err) {
        res.status(500).json({ message: "Failed to update rider", error: err.message });
    }
}

export async function deleteRider(req, res) {
    if (!isAdmin(req)) {
        return res.status(403).json({ message: "You are not authorized to delete riders" });
    }

    try {
        const riderId = req.params.riderId;
        await Rider.deleteOne({ riderId });

        res.json({ message: "Rider deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Failed to delete rider", error: err.message });
    }
}
