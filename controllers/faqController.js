import Faq from "../models/faq.js";
import { isAdmin } from "./userController.js";


export async function getFaqs(req, res) {
    try {
        const faqs = await Faq.find().sort({ faqId: 1 }).lean();
        res.json({
            faqs
        });
    } catch (err) {
        res.status(500).json({
            message: "Failed to get FAQs",
            error: err.message,
        });
    }
}

export async function createFaq(req, res) {
    if (!isAdmin(req)) {
        return res.status(403).json({
            message: "You are not authorized to create FAQs"
        });
    }

    try {

        let newFaqId = "BYNFAQ00001";
        const lastFaq = await Faq.find().sort({ faqId: -1 }).limit(1);

        if (lastFaq.length > 0) {
            const lastId = lastFaq[0].faqId;
            const idNumber = parseInt(lastId.replace("BYNFAQ", ""), 10);
            const padded = String(idNumber + 1).padStart(5, "0");
            newFaqId = "BYNFAQ" + padded;
        }

        const { question, answer } = req.body;

        const faq = await Faq.create({
            faqId: newFaqId,
            question,
            answer,
        });

        res.status(201).json({
            message: "FAQ created successfully",
            faq
        });
    } catch (err) {
        res.status(500).json({
            message: "Failed to create FAQ",
            error: err.message
        });
    }
}


export async function updateFaq(req, res) {
    if (!isAdmin(req)) {
        return res.status(403).json({
            message: "You are not authorized to update FAQs"
        });
    }

    try {
        const { faqId } = req.params;
        const { question, answer } = req.body;

        const faq = await Faq.findOne({ faqId });
        if (!faq) {
            return res.status(404).json({ message: "FAQ not found" });
        }

        const updatedFaq = await Faq.findOneAndUpdate(
            { faqId },
            { question, answer },
            { new: true, runValidators: true }
        );

        res.json({
            message: "FAQ updated successfully",
            faq: updatedFaq
        });
    } catch (err) {
        res.status(500).json({
            message: "Failed to update FAQ",
            error: err.message
        });
    }
}


export async function deleteFaq(req, res) {
    if (!isAdmin(req)) {
        return res.status(403).json({
            message: "You are not authorized to delete FAQs"
        });
    }

    try {
        const { faqId } = req.params;

        const faq = await Faq.findOne({ faqId });
        if (!faq) {
            return res.status(404).json({ message: "FAQ not found" });
        }

        await Faq.deleteOne({ faqId });

        res.json({ message: "FAQ deleted successfully" });
    } catch (err) {
        res.status(500).json({
            message: "Failed to delete FAQ",
            error: err.message
        });
    }
}