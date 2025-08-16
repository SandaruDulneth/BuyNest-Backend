import mongoose from "mongoose";

const deliverySchema = mongoose.Schema({
    deliveryId: {
        type: String,
        require: true,
        unique : true
    },
    riderId: {
        type: String,
        require: true,
        unique : true
    },
    orderId: {
        type: String,
        require: true,
        unique : true
    },
    date : {
        type : Date,
        default : Date.now
    }

});

const Delivery = mongoose.model("deliveries", deliverySchema);

export default Delivery;
