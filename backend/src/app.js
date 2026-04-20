const express = require("express");
const authRoutes = require("./routes/auth.routes")
const ayurbotRoutes = require("./routes/ayurbot.routes");
const patientRoutes = require("./routes/patient.routes")


const cors = require('cors');
const app =  express()
app.use(cors({
    origin:"http://127.0.0.1:5500",
    credentials:true
}))


app.use(express.json())





app.use("/api/auth", authRoutes)
app.use("/ayurbot", ayurbotRoutes)
app.use("/api/patients", patientRoutes)



module.exports = app