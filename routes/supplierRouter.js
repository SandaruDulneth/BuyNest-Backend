import express from "express";
import {
  addSupplier,
  getSuppliers,
  updateSupplier,
  deleteSupplier,
  notifySupplier,
} from "../controllers/supplierController.js";

const supplierRouter = express.Router();

supplierRouter.post("/", addSupplier);
supplierRouter.get("/", getSuppliers);
supplierRouter.put("/:supplierId", updateSupplier);
supplierRouter.delete("/:supplierId", deleteSupplier);

// ✅ notify supplier
supplierRouter.post("/notify", notifySupplier);

export default supplierRouter;
