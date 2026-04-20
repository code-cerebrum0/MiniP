const mongoose= require('mongoose')

const patientSchema = new mongoose.Schema({
    userId : {
        type  : String,
        required : true
    },
    constitution : String,
    program : String,
    progress : Number,
    status : String,
    nextSession :  {
        date : Date,
        time : String,
        therapy : String
    }
})


const patientModel = mongoose.model("patients", patientSchema)


module.exports = patientModel