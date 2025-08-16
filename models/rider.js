import mongoose from "mongoose";

const riderSchema = mongoose.Schema({
    riderId: {
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
    contactNo :{
        type:String,
        required:false
    },

    vehicleType : {
        type : String,
        required : true,
        default : false
    },
    status : {
        type : Boolean,
        required : true,
        default : false
    },
   

});

const Rider = mongoose.model("riders", riderSchema);

export default Rider;
