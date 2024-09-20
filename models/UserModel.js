var mongoose= require("mongoose");

const UserSchema=new mongoose.Schema({
    firstName:{
        type:String,
        required:true
    },
    lastName:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    isConfirm:{
        type:Boolean,
        required:false,
        default:0
    },
    confirmOTP:{
        type:String,
        required:false,
        default:0
    },
    otpTries:{
        type:Number,
        required:false,
        default:0
    },
    status:{
        type:Number,
        required:true,
        default:1
    },
    date:{
        type:Date,
        Default:Date.now()
    },
})

module.exports=mongoose.model('User',UserSchema)