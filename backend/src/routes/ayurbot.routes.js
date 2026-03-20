const express = require("express");
const ayurbotController = require("../controllers/ayurbot.controller")


const router = express.Router()

router.post("/chat", ayurbotController.chatWithLLM)


module.exports = router