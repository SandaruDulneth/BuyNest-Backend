import Rider from "../models/rider.js";
import { isAdmin } from "./userController.js";

export async function addRider(req, res) {
    if (!isAdmin(req)) {
        return res.status(403).json({ message: "You are not authorized to add riders" });
    }

         if (!req.body.riderId) {
            return res.status(400).json({ message: "RiderId is required" });
        }

           const numPart = (req.body.riderId || "").trim();

         if (String(parseInt(numPart, 10)) !== numPart) {
          return res.status(400).json({ message: "RiderId must be digits only" });
        }
        const newRiderId = "BYNRD" + numPart.padStart(5, "0");

        const existing = await Rider.findOne({ riderId: req.body.rideriD });
        if (existing) {
            return res.status(400).json({ message: "Rider Id already exists" });
        }

        const phone = String(req.body.contactNo || '').trim();
        if (!/^\d{10}$/.test(phone)) {
         return res.status(400).json({ message: "Phone number must be exactly 10 digits" });
        }

    try {

        const rider = new Rider({
            riderId: newRiderId,
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
    
     const phone = String(req.body.contactNo || '').trim();
        if (!/^\d{10}$/.test(phone)) {
         return res.status(400).json({ message: "Phone number must be exactly 10 digits" });
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
