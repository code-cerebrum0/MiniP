const app = require("./src/app");
const connectDB = require("./src/db/db");
require("dotenv").config()


connectDB();

app.listen(3000, ()=>{
    console.log("Swerver is running on port (dhundho to jaanu)")

})