import mongoose from "mongoose";

const userSchema = mongoose.Schema({
    userId: {
        type: String,
        require: true,
        unique : true
    },

    email: {
        type: String,
        required: true,
        unique : true
    },
    firstName : {
        type : String,
        required : true
    },
    lastName : {
        type : String,
        required : true
    },
    password : {
        type : String,
        required : true
    },
    role : {
        type : String,
        required : true,
        default : "customer"
    },
    address : {
        type:String,
        required:false,
    },

    postCode :{
        type:String,
        required:false
    },

    contactNo :{
        type:String,
        required:false
    },

    isBlocked : {
        type : Boolean,
        required : true,
        default : false
    },
    img : {
        type : String,
        required : false,
        default : "https://avatar.iran.liara.run/public/boy?username=Ash"
    },
    
    date : {
        type : Date,
        default : Date.now
    }


});

const User = mongoose.model("users", userSchema);

export default User;
