const express = require("express");
const authRoutes = require("./routes/auth.routes")
const ayurbotRoutes = require("./routes/ayurbot.routes");


const app =  express()


app.use(express.json())





app.use("/api/auth", authRoutes)
app.use("/ayurbot", ayurbotRoutes)


module.exports = app