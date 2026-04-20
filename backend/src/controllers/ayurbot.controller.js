const {callLLM} = require("../services/ayurbot.service")


async function chatWithLLM (req, res){
    try {
        const {message, user_name} = req.body;


        const reply = await callLLM(req.body);

        res.json({
            reply : reply
        })
        // res.status(200).json({
        // //    message: "AAPKA request aaya tha"

        // })
    }
    catch(error){
        console.log("This errpr:",error)
        res.status(500).json({
            error: error
        })
    }
}


module.exports = {chatWithLLM}