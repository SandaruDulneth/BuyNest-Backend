import Review from "../models/review.js";
import User from "../models/user.js";
import sgMail from "@sendgrid/mail";

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



sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function sendReply(req, res) {
  try {
    
    const { email, usersName, rating, replyMessage, message } = req.body;
    const finalMessage = replyMessage || message;

    if (!email || !usersName) {
      return res.status(400).json({ message: "Missing email or name" });
    }
    if (!finalMessage) {
      return res.status(400).json({ message: "Reply message is required" });
    }

   
    let subject = "Thank you for your review!";
    let text = `Hi ${usersName},\n\n${finalMessage}\n\n`;

    if (Number(rating) >= 4) {
      text += `We're thrilled you enjoyed your experience — thank you for your positive review!\n\n`;
    } else {
      text += `We value your feedback and will work hard to improve based on your suggestions.\n\n`;
    }

    text += `Best regards,\nBuyNest Team`;

   
    const html = `
      <div style="font-family: Arial, sans-serif; color: #333; background: #f9f9f9; padding: 16px; border-radius: 8px;">
        <h2 style="color: #059669; margin-top: 0;">BuyNest</h2>
        <p>Hi <b>${usersName}</b>,</p>
        <p>${finalMessage}</p>
        ${
          Number(rating) >= 4
            ? `<p style="color:#16a34a;">We're thrilled you enjoyed your experience — thank you for your positive review!</p>`
            : `<p style="color:#ca8a04;">We value your feedback and will work hard to improve based on your suggestions.</p>`
        }
        <br/>
        <p>Best regards,<br/><b>BuyNest Team</b></p>
      </div>
    `;

    
    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM,
      subject,
      text,
      html,
    };

    const [response] = await sgMail.send(msg);

    if (response.statusCode === 202) {
      console.log("Reply email sent successfully to:", email);
      res.json({ message: "Reply email sent successfully" });
    } else {
      console.error("SendGrid response code:", response.statusCode);
      res.status(500).json({ message: "Failed to send reply email" });
    }
  } catch (err) {
    console.error("Error sending reply:", err);
    res.status(500).json({
      message: "Failed to send reply",
      error: err.message,
    });
  }
}
