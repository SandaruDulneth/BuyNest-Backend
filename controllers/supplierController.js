import Supplier from "../models/supplier.js";
import Product from "../models/product.js";
import { isAdmin } from "./userController.js";
import sgMail from "@sendgrid/mail";

// initialize once at module load
sgMail.setApiKey(process.env.SENDGRID_API_KEY);


export async function sendMail({ to, subject, html }) {
  const from = process.env.SENDGRID_FROM ; // must be verified sender in SendGrid

  const msg = {
    to,
    from,
    subject,
    html,
    // plain-text fallback → improves deliverability
    text: html.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").trim(),
  };

  const [resp] = await sgMail.send(msg);
  if (resp.statusCode !== 202) {
    throw new Error(`SendGrid failed with status ${resp.statusCode}`);
  }
  return resp;
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
  <div style="
    font-family: 'Segoe UI', Roboto, sans-serif;
    background-color: #f8fafc;
    padding: 20px;
    border-radius: 10px;
    color: #333;
    max-width: 600px;
    margin: auto;
    box-shadow: 0 2px 6px rgba(0,0,0,0.08);
  ">
   
    <div style="text-align: center; margin-bottom: 20px;">
      <h2 style="color: #059669; margin: 0;">BuyNest Inventory Alert</h2>
      <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Automated Supplier Notification</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
    </div>

   
    <p>Dear <strong>${supplier.Name}</strong>,</p>
    <p style="font-size: 15px; line-height: 1.6;">
      This is an automated notice from the <b>BuyNest Inventory System</b>.
      The following product has reached a low stock level:
    </p>

   
    <div style="
      background-color: #ecfdf5;
      border-left: 4px solid #10b981;
      padding: 12px 16px;
      margin: 16px 0;
      border-radius: 6px;
    ">
      <p style="margin: 4px 0;"><b>Product Name:</b> ${product.name}</p>
      <p style="margin: 4px 0;"><b>Product ID:</b> ${product.productId}</p>
      <p style="margin: 4px 0; color: #b91c1c;"><b>Current Stock:</b> ${product.stock}</p>
    </div>

    <p style="font-size: 15px; line-height: 1.6;">
      Please arrange a <b>resupply</b> at the earliest convenience to avoid stock-out situations.
      Timely restocking helps ensure uninterrupted order fulfillment and smooth operations.
    </p>

  
    <div style="margin-top: 24px; text-align: center; font-size: 13px; color: #64748b;">
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin-bottom: 12px;" />
      <p style="margin: 0;">Thank you,</p>
      <p style="font-weight: 600; color: #059669; margin: 4px 0;">BuyNest Inventory Management System</p>
      <p style="margin: 0;">Efficient. Reliable. Connected.</p>
    </div>
  </div>
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
