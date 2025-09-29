import Review from "../models/review.js";
import User from "../models/user.js";
import nodemailer from "nodemailer";

export async function addReview(req, res) {
    try {
        const { comment, rating } = req.body;
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized: No userId in token" });
        }
        if (!comment || !rating) {
            return res.status(400).json({ message: "comment and rating are required" });
        }

        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const lastReview = await Review.findOne().sort({ reviewId: -1 });
        let generatedReviewId = "BYNRE00001";
        if (lastReview && lastReview.reviewId) {
            const lastNumber = parseInt(lastReview.reviewId.replace("BYNRE", ""));
            const newNumber = lastNumber + 1;
            generatedReviewId = "BYNRE" + String(newNumber).padStart(5, "0");
        }

        const review = new Review({
            reviewId: generatedReviewId,
            usersName: `${user.firstName} ${user.lastName}`,
            email: user.email,
            comment,
            rating
        });

        await review.save();
        res.json({ message: "Review added successfully", review });
    } catch (err) {
        console.error("Error adding review:", err);
        res.status(500).json({ message: "Failed to add review", error: err.message });
    }
}

export async function getReviews(req, res) {
    try {
        const reviews = await Review.find();
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch reviews", error: err.message });
    }
}

// 🔹 NEW: send a meaningful email reply for good reviews (rating >=4)
export async function sendReply(req, res) {
    try {
        const { email, usersName, rating } = req.body;
        if (!email || !usersName) {
            return res.status(400).json({ message: "Missing email or name" });
        }

        // Configure transporter (set env vars for real credentials)
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            },
        });

        let subject = "Thank you for your review!";
        let text = `Hi ${usersName},\n\nThank you for sharing your feedback with us.`;

        if (Number(rating) >= 4) {
            text += ` We’re thrilled you enjoyed your experience and truly appreciate your positive review.`;
        } else {
            text += ` We value your input and will work hard to improve based on your suggestions.`;
        }

        text += `\n\nBest regards,\nBuyNest Team`;

        await transporter.sendMail({
            from: process.env.MAIL_USER,
            to: email,
            subject,
            text,
        });

        res.json({ message: "Reply email sent successfully" });
    } catch (err) {
        console.error("Error sending reply:", err);
        res.status(500).json({ message: "Failed to send reply", error: err.message });
    }
}
