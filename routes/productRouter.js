import express from "express";
import { deleteProduct, getProducts, saveProduct, updateProduct } from "../controllers/productController.js";

const productRouter = express.Router();

productRouter.post("/",saveProduct);
productRouter.get("/",getProducts);
productRouter.delete("/:productId",deleteProduct);
productRouter.put("/:productId",updateProduct);

export default productRouter;