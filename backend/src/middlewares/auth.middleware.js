const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");


async function authPatient(req, res, next){
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({
            message:"Unauthorized, pleease login."
        })
    }
    try{

        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY)
    
        if (decoded.role !== "patient"){
            return res.status(401).json({
                message:"This feature is for patients only."
            })
        }
        req.user = decoded;
    
        next()
    }
    catch (err){
        console.log(err);
        return res.status(409).json({
            message: "Authorization error."
        })
    }
}

module.exports = { authPatient }