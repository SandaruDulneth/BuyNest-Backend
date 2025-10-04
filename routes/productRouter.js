import express from "express";
import { deleteProduct, getProducts, getProductById,getProductsByCategory, saveProduct, updateProduct, searchProducts } from "../controllers/productController.js";

const productRouter = express.Router();

productRouter.get("/search", searchProducts);
productRouter.post("/",saveProduct);
productRouter.get("/",getProducts);
productRouter.get("/:productId", getProductById); // 👈 add this line
productRouter.delete("/:productId",deleteProduct);
productRouter.put("/:productId",updateProduct);
productRouter.post("/category", getProductsByCategory);

export default productRouter;