import express from "express";
import { addRider, getRiders, updateRider, deleteRider } from "../controllers/riderController.js";

const riderRouter = express.Router();

// Only Admin can access
riderRouter.post("/", addRider);
riderRouter.get("/", getRiders);
riderRouter.put("/:riderId", updateRider);
riderRouter.delete("/:riderId", deleteRider);

export default riderRouter;
