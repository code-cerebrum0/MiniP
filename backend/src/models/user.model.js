const mongoose = require("mongoose")
// name,
//         email,
//         password,
//         age,
//         gender

const userScheme =  new mongoose.Schema({
    fullName:{
        type : String
    },
    email:{
        type : String
    },
    password:{
        type : String
    },
    dob:{
        type : Date
    },
    gender:{
        type :String,
        enum:['Male', 'Female']
    },
    role:{
        type:String,
        enum:['patient', 'doctor']
,
        default : 'patient'
    }
})

const userModel = mongoose.model("users", userScheme)



module.exports = userModel