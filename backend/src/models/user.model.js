const mongoose = require("mongoose")
const {v4 : uuidv4} = require("uuid");
// name,
//         email,
//         password,
//         age,
//         gender

const userSchema =  new mongoose.Schema({
    user_id : {
        type : String,
        unique: true,
        index: true,
    },
    name:{
        type : String,
        required : true
    },
    email:{
        type : String,
        unique : true,
        required : true

    },
    dob:{
        type : Date,
    },
    gender:{
        type :String,
        enum:['Male', 'Female', "others"],
    },
    password:{
        type : String,
        required : true
    },
    phone : {
        type : String,
        default : null
    },
    role:{
        type:String,
        enum:['patient', 'doctor']
,
        default : 'patient'
    },
    
    doctor_info : {
        specialization : {
            type : String,
        },
        experience : {
            type : Number
        },
    }
})


// # Should add this as middleware function later
userSchema.pre("save", async function(){
    if (!this.user_id) {
        this.user_id = uuidv4();
    }
})


const userModel = mongoose.model("users", userSchema)



module.exports = userModel