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
 * Store only the latest location per rider:
 * We’ll upsert on (riderId) with the most recent ping.
 */
riderLocationSchema.index({ riderId: 1 }, { unique: true });

const RiderLocation = mongoose.model("rider_locations", riderLocationSchema);
export default RiderLocation;
