

const axios = require("axios")


async function callLLM(message){
    const response = await axios.post("http://127.0.0.1:8000/chat", {
        message : {
            "user_name" : "Mangesh",
            "prakriti" : "Vata"
        }
        
    });


    return response.data.reply
}

callLLM("I have severe back pain").then(console.log);