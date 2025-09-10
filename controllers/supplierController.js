import Supplier from "../models/supplier.js";
import Product from "../models/product.js";
import { isAdmin } from "./userController.js";

// Add Supplier
export async function addSupplier(req, res) {
  if (!isAdmin(req)) {
    return res.status(403).json({ message: "You are not authorized to add suppliers" });
  }

  try {
    const { supplierId, productId, email, Name, stock, cost, contactNo } = req.body;

    if (!supplierId || !productId || !email || !Name) {
      return res
        .status(400)
        .json({ message: "supplierId, productId, email and Name are required" });
    }

    // Check if product exists
    const product = await Product.findOne({ productId });
    if (!product) {
      return res
        .status(404)
        .json({ message: "Product not found with given productId" });
    }

    // Create supplier with the user-provided supplierId
    const supplier = new Supplier({
      supplierId: supplierId.trim(),
      productId,
      email,
      Name,
      stock: Number(stock),
      cost: Number(cost),
      contactNo,
    });

    // Update product stock
    product.stock = (product.stock || 0) + Number(stock);
    await product.save();

    await supplier.save();
    res.json({
      message: "Supplier added successfully and product stock updated",
      supplier,
      updatedProduct: product,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to add supplier", error: err.message });
  }
}


// Get All Suppliers
export async function getSuppliers(req, res) {
    if (!isAdmin(req)) {
        return res.status(403).json({ message: "You are not authorized to view suppliers" });
    }

    try {
        const suppliers = await Supplier.find().sort({ date: -1 }); // newest first
        res.json(suppliers);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch suppliers", error: err.message });
    }
}

// Update Supplier
export async function updateSupplier(req, res) {
    if (!isAdmin(req)) {
        return res.status(403).json({ message: "You are not authorized to update suppliers" });
    }

    try {
        const supplierId = req.params.supplierId;

        const updatedData = {
            ...req.body,
            stock: req.body.stock ? Number(req.body.stock) : undefined,
            cost: req.body.cost ? Number(req.body.cost) : undefined,
        };

        await Supplier.updateOne({ supplierId }, updatedData);

        res.json({ message: "Supplier updated successfully" });
    } catch (err) {
        res.status(500).json({ message: "Failed to update supplier", error: err.message });
    }
}

// Delete Supplier
export async function deleteSupplier(req, res) {
    if (!isAdmin(req)) {
        return res.status(403).json({ message: "You are not authorized to delete suppliers" });
    }

    try {
        const supplierId = req.params.supplierId;
        await Supplier.deleteOne({ supplierId });

        res.json({ message: "Supplier deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Failed to delete supplier", error: err.message });
    }
}
