const axios = require("axios")

async function callLLM(data){
    const response = await axios.post("http://127.0.0.1:8000/chat", data);

    return response.data.reply
}

module.exports = {callLLM}