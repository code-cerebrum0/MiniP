const mongoose = require("mongoose");

async function connectDB(){
    try{
        await mongoose.connect(process.env.MONGOOSE_URI);
        console.log("Connected to DB")

    }
    catch(err){
        console.log("Databasse onnection error", err)
    }
}

module.exports = connectDB;