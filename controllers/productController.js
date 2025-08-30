import Product from "../models/product.js";
import { isAdmin } from "./userController.js";

export async function saveProduct(req, res) {
    if (!isAdmin(req)) {
        return res.status(403).json({ message: "Unauthorized" });
    }

    try {
        if (!req.body.productId) {
            return res.status(400).json({ message: "productId is required" });
        }

        const existing = await Product.findOne({ productId: req.body.productId });
        if (existing) {
            return res.status(400).json({ message: "productId already exists" });
        }

        const product = new Product({
            productId: req.body.productId,   // 👈 now admin provides manually
            name: req.body.name,
            categories: req.body.categories,
            description: req.body.description,
            images: req.body.images,
            labelledPrice: req.body.labelledPrice,
            price: req.body.price,
            stock: req.body.stock,
            isAvailable: req.body.isAvailable
        });

        await product.save();
        res.json({ message: "Product added successfully" });

    } catch (err) {
        console.error("Save error:", err);
        res.status(500).json({
            message: "Failed to add product",
            error: err.message
        });
    }
}

export async function getProducts(req, res) {
    try {
        if (isAdmin(req)) {
            const products = await Product.find();
            res.json(products);
        } else {
            const products = await Product.find({ isAvailable: true });
            res.json(products);
        }
    } catch (err) {
        res.json({
            message: "Failed to get products",
            error: err
        });
    }
}

export async function deleteProduct(req, res) {
    if (!isAdmin(req)) {
        res.status(403).json({
            message: "You are not authorized to delete a product"
        });
        return;
    }

    try {
        await Product.deleteOne({ productId: req.params.productId });
        res.json({
            message: "Product deleted successfully"
        });
    } catch (err) {
        res.status(500).json({
            message: "Failed to delete product",
            error: err
        });
    }
}

export async function updateProduct(req, res) {
    if (!isAdmin(req)) {
        res.status(403).json({
            message: "You are not authorized to update a product"
        });
        return;
    }

    const productId = req.params.productId;
    const updatingData = req.body;

    try {
        await Product.updateOne({ productId }, updatingData);
        res.json({ message: "Product updated successfully" });
    } catch (err) {
        res.status(500).json({
            message: "Internal server error",
            error: err
        });
    }
}
