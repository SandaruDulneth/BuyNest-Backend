import mongoose from "mongoose";

const locationSessionSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  riderId: { type: String, required: true, index: true },
  active: { type: Boolean, default: true },
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date },
});

const LocationSession = mongoose.model("location_sessions", locationSessionSchema);
export default LocationSession;


