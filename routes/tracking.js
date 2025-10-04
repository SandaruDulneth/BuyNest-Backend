import express from "express";
import {
  startTracking,
  stopTracking,
  serveTrackerPage,
  pingLocation,
  getLatestLocations,
} from "../controllers/trackingController.js";

const trackingRouter = express.Router();

// Admin actions
trackingRouter.post("/start/:riderId", startTracking);
trackingRouter.post("/stop/:riderId", stopTracking);

// Public rider page + ping
trackingRouter.get("/track/:token", serveTrackerPage);
trackingRouter.post("/ping/:token", pingLocation);

// Admin fetch latest locations
trackingRouter.get("/locations", getLatestLocations);

export default trackingRouter;
