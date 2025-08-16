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
        unique : true
    },
    email: {
        type: String,
        required: true,
        unique : true
    },
    Name : {
        type : String,
        required : true
    },
    stock : {
        type : int,
        required : true,
    },
    cost :{
        type : double,
        required : true,
    },
    contactNo :{
        type:String,
        required:false
    },
});

const Supplier = mongoose.model("suppliers", supplierSchema);

export default Supplier;
