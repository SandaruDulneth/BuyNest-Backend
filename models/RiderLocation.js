import mongoose from "mongoose";


const riderLocationSchema = new mongoose.Schema({
  riderId: { type: String, required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  accuracy: { type: Number },
  heading: { type: Number },
  speed: { type: Number },
  timestamp: { type: Date, default: Date.now },
}, { timestamps: true });


/**
 * ✅ Ensure only the latest location per rider is stored.
 * Uses a unique index on `riderId` for upserts.
 */
riderLocationSchema.index({ riderId: 1 }, { unique: true });

// Create or reuse the model to avoid overwrite errors in Next.js / hot reloads
const RiderLocation =
  mongoose.models.RiderLocation ||
  mongoose.model("RiderLocation", riderLocationSchema);

export default RiderLocation;

