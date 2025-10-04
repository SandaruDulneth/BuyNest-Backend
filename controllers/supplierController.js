import Supplier from "../models/supplier.js";
import Product from "../models/product.js";
import nodemailer from "nodemailer";
import { isAdmin } from "./userController.js";

// ✅ helper for email
async function sendMail({ to, subject, html }) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  return transporter.sendMail({
    from: process.env.MAIL_USER,
    to,
    subject,
    html,
  });
}

// ✅ Add Supplier
export async function addSupplier(req, res) {
  if (!isAdmin(req)) {
    return res
      .status(403)
      .json({ message: "You are not authorized to add suppliers" });
  }

  try {
    const { supplierId, productId, email, Name, stock, cost, contactNo } =
      req.body;

    if (!supplierId || !productId || !email || !Name) {
      return res.status(400).json({
        message: "supplierId, productId, email and Name are required",
      });
    }

    // Check if product exists
    const product = await Product.findOne({ productId });
    if (!product) {
      return res
        .status(404)
        .json({ message: "Product not found with given productId" });
    }

    const numPart = (req.body.supplierId || "").trim();
    if (String(parseInt(numPart, 10)) !== numPart) {
      return res
        .status(400)
        .json({ message: "supplierId must be digits only" });
    }
    const newsupplierId = "BYNSP" + numPart.padStart(5, "0");

    const existing = await Supplier.findOne({
      supplierId: newsupplierId,
    });
    if (existing) {
      return res.status(400).json({ message: "supplierId already exists" });
    }

    const phone = String(req.body.contactNo || "").trim();
    if (phone && !/^\d{10}$/.test(phone)) {
      return res
        .status(400)
        .json({ message: "Phone number must be exactly 10 digits" });
    }

    // Create supplier
    const supplier = new Supplier({
      supplierId: newsupplierId,
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

// ✅ Get All Suppliers
export async function getSuppliers(req, res) {
  if (!isAdmin(req)) {
    return res
      .status(403)
      .json({ message: "You are not authorized to view suppliers" });
  }

  try {
    const suppliers = await Supplier.find().sort({ date: -1 });
    res.json(suppliers);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch suppliers", error: err.message });
  }
}

// ✅ Update Supplier
export async function updateSupplier(req, res) {
  if (!isAdmin(req)) {
    return res
      .status(403)
      .json({ message: "You are not authorized to update suppliers" });
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
    res
      .status(500)
      .json({ message: "Failed to update supplier", error: err.message });
  }
}

// ✅ Delete Supplier
export async function deleteSupplier(req, res) {
  if (!isAdmin(req)) {
    return res
      .status(403)
      .json({ message: "You are not authorized to delete suppliers" });
  }

  try {
    const supplierId = req.params.supplierId;
    await Supplier.deleteOne({ supplierId });

    res.json({ message: "Supplier deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to delete supplier", error: err.message });
  }
}

// ✅ Notify Supplier via Email
export async function notifySupplier(req, res) {
  try {
    const { productId } = req.body;

    const product = await Product.findOne({ productId });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const supplier = await Supplier.findOne({ productId });
    if (!supplier) {
      return res
        .status(404)
        .json({ message: "No supplier linked to this product" });
    }

    const msg = `
      <p>Dear ${supplier.Name},</p>
      <p>The product <b>${product.name}</b> (ID: ${product.productId}) is running LOW/OUT of stock.</p>
      <p>Current stock: ${product.stock}</p>
      <p>Please arrange resupply at the earliest.</p>
      <br/>
      <p>Thank you,<br/>Inventory Management System</p>
    `;

    await sendMail({
      to: supplier.email,
      subject: `Resupply Request: ${product.name}`,
      html: msg,
    });

    res.json({ message: "Email sent to supplier successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to notify supplier", error: err.message });
  }
}
