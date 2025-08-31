import Review from "../models/review.js";
import User from "../models/user.js";

export async function addReview(req, res) {
    try {
        const { comment, rating } = req.body;
        const userId = req.user?.userId; 

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized: No userId in token" });
        }

        if (!comment || !rating) {
            return res.status(400).json({
                message: "comment and rating are required"
            });
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
        res.json({
            message: "Review added successfully",
            review
        });

    } catch (err) {
        console.error("Error adding review:", err);
        res.status(500).json({
            message: "Failed to add review",
            error: err.message
        });
    }
}

export async function getReviews(req, res) {
    try {
        const reviews = await Review.find();
        res.json(reviews);
    } catch (err) {
        res.status(500).json({
            message: "Failed to fetch reviews",
            error: err.message
        });
    }
}
