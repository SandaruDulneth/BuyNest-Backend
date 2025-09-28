import Order from "../models/order.js";
import Product from "../models/product.js";
import { isAdmin } from "./userController.js";

export async function createOrder(req, res) {
    if (req.user == null) {
        res.status(403).json({
            message: "Please login and try again",
        });
        return;
    }
    const orderInfo = req.body;

    if (orderInfo.name == null) {
        orderInfo.name = req.user.firstName + " " + req.user.lastName;
    }


    let orderId = "BYOD00001";

    const lastOrder = await Order.find().sort({ date: -1 }).limit(1);

    if (lastOrder.length > 0) {
        const lastOrderId = lastOrder[0].orderId; 

        const lastOrderNumberString = lastOrderId.replace("BYNOD", "");
        const lastOrderNumber = parseInt(lastOrderNumberString);
        const newOrderNumber = lastOrderNumber + 1;
        const newOrderNumberString = String(newOrderNumber).padStart(5, "0");
        orderId = "BYNOD" + newOrderNumberString;
    }
    try {
        let total = 0;
        let labelledTotal = 0;
        const products = [];

        for (let i = 0; i < orderInfo.products.length; i++) {
            const item = await Product.findOne({
                productId: orderInfo.products[i].productId,
            });
            if (item == null) {
                res.status(404).json({
                    message:
                        "Product with productId " +
                        orderInfo.products[i].productId +
                        " not found",
                });
                return;
            }
            if (item.isAvailable === false) {
                res.status(404).json({
                    message:
                        "Product with productId " +
                        orderInfo.products[i].productId +
                        " is not available right now!",
                });
                return;
            }
            products[i] = {
                productInfo: {
                    productId: item.productId,
                    name: item.name,
                    altNames: item.altNames,
                    description: item.description,
                    images: item.images,
                    labelledPrice: item.labelledPrice,
                    price: item.price,
                },
                quantity: orderInfo.products[i].qty,
            };

            total += item.price * orderInfo.products[i].qty;
            labelledTotal += item.labelledPrice * orderInfo.products[i].qty;
        }

 // inside createOrder
const order = new Order({
    orderId: orderId,
    email: req.user.email,
    name: orderInfo.name,
    address: orderInfo.address,
    phone: orderInfo.phone,
    products: products,
    deliveryMethod: orderInfo.deliveryMethod,
    labelledTotal: labelledTotal,
    // ✅ use total from client if provided (includes delivery fee)
    total: orderInfo.total ?? total,
});

        const createdOrder = await order.save();
        res.json({
            message: "Order created successfully",
            order: createdOrder,
            orderId:orderId,
            phone : orderInfo.phone
        });
    } catch (err) {
        res.status(500).json({
            message: "Failed to create order",
            error: err,

        });
    }
}
export async function getOrders(req, res) {
    if (req.user == null) {
        res.status(403).json({
            message: "Please login and try again",
        });
        return;
    }
    try {
        if (req.user.role == "admin") {
            const orders = await Order.find();
            res.json(orders);
        }else{
            const orders = await Order.find({ email: req.user.email });
            res.json(orders);
        }
    } catch (err) {
        res.status(500).json({
            message: "Failed to fetch orders",
            error: err,
        });
    }
}

export async function getMyOrders(req, res) {
    try {
        const orders = await Order.find({ email: req.user.email });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch orders", error: err });
    }
}



export async function updateOrderStatus(req,res){
    if (!isAdmin(req)) {
        res.status(403).json({
            message: "You are not authorized to update order status",
        });
        return;
    }
    try{
        const orderId = req.params.orderId;
        const status = req.params.status;

        await Order.updateOne(
            {
                orderId: orderId
            },
            {
                status : status
            }
        );
         // ✅ If order delivered/completed, mark its delivery as completed
       if (status === "delivered" || status === "completed") {
          const Delivery = (await import("../models/delivery.js")).default;
           await Delivery.updateOne(
               { orderId: orderId },
               { status: "completed" }
           );
       }


        res.json({
            message: "Order status updated successfully",
        });

    }catch(e){
        res.status(500).json({
            message: "Failed to update order status",
            error: e,
        });
        return;
    }

}

