import mongoose from "mongoose";

const supplierSchema = mongoose.Schema({
    supplierId: {
        type: String,
        require: true,
        unique : true
    },
    productId: {
        type: String,
        require: true,
    },
    email: {
        type: String,
        required: true,
        require: true
    },
    email: {
        type: String,
        required: true

    },
    Name : {
        type : String,
        required : true
    },
    stock : {
        type : Number,
        required : true,
    },
    cost :{
        type : Number,
        required : true,
    },
    contactNo :{
        type:String,
        required:false
    },
    date : {
        type : Date,
        default : Date.now
    }
});

const Supplier = mongoose.model("suppliers", supplierSchema);

export default Supplier;
