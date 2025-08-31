import Supplier from "../models/supplier.js";
import Product from "../models/product.js";
import { isAdmin } from "./userController.js";

export async function addSupplier(req, res) {
    if (!isAdmin(req)) {
        return res.status(403).json({ message: "You are not authorized to add suppliers" });
    }

    try {
        const { productId, email, Name, stock, cost, contactNo } = req.body;

        if (!productId) {
            return res.status(400).json({ message: "productId is required" });
        }

        const product = await Product.findOne({ productId });
        if (!product) {
            return res.status(404).json({ message: "Product not found with given productId" });
        }

        const lastSupplier = await Supplier.findOne().sort({ supplierId: -1 });
        let generatedSupplierId = "BYNSP00001";

        if (lastSupplier && lastSupplier.supplierId) {
            const lastNumber = parseInt(lastSupplier.supplierId.replace("BYNSP", ""));
            const newNumber = lastNumber + 1;
            generatedSupplierId = "BYNSP" + String(newNumber).padStart(5, "0");
        }

        const supplier = new Supplier({
            supplierId: generatedSupplierId,
            productId,
            email,
            Name,
            stock: Number(stock),
            cost: Number(cost),
            contactNo
        });

        product.stock = (product.stock || 0) + Number(stock);
        await product.save();

        await supplier.save();
        res.json({ message: "Supplier added successfully and product stock updated", supplier, updatedProduct: product });

    } catch (err) {
        res.status(500).json({ message: "Failed to add supplier", error: err.message });
    }
}

export async function getSuppliers(req, res) {
    if (!isAdmin(req)) {
        return res.status(403).json({ message: "You are not authorized to view suppliers" });
    }

    try {
        const suppliers = await Supplier.find();
        res.json(suppliers);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch suppliers", error: err.message });
    }
}

export async function updateSupplier(req, res) {
    if (!isAdmin(req)) {
        return res.status(403).json({ message: "You are not authorized to update suppliers" });
    }

    try {
        const supplierId = req.params.supplierId;

        const updatedData = {
            ...req.body,
            stock: req.body.stock ? Number(req.body.stock) : undefined,
            cost: req.body.cost ? Number(req.body.cost) : undefined
        };

        await Supplier.updateOne({ supplierId }, updatedData);

        res.json({ message: "Supplier updated successfully" });
    } catch (err) {
        res.status(500).json({ message: "Failed to update supplier", error: err.message });
    }
}

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
