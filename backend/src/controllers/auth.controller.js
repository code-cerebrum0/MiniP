const userModel = require("../models/user.model")
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require('uuid');


// has to implement hashing of passwords

async function registerUser (req, res) { 
    const {fullName, email, password, dob, gender, role = "patient"} = req.body;

    const isUserAlreadyExists= await userModel.findOne({email})

    if (isUserAlreadyExists){
        return res.status(409).json({
            message : "User already exists."
        })
    }
    

    const hash = await bcrypt.hash(password, 7);


    const user  = await userModel.create({
        fullName,
        email,
        password  : hash,
        dob,
        gender,
        role
    })

    const token = jwt.sign({
        id : user._id,
        email : user.email,
        role : user.role
    }, process.env.JWT_SECRET_KEY)
    res.cookie("token", token)


    res.status(201).json({
        message:"User created successfully...",
        user:{
            name: user.fullName,
            email: user.email,
        }
    })

}

async function loginUser (req ,res){
    //login by email and pass and role

    const {email, password, role = "patient"}= req.body;
    
    const user = await userModel.findOne({
        
        email
    })
    if (!user) {
        return res.status(401).json({
            message : "Invalid credentials"
        })
    }
    const isPasswordValid = await bcrypt.compare(password, user.password)
    
    if (!isPasswordValid){
        return res.status(401).json({
            message:"INvalid password"
        })
    }

    const token = jwt.sign({
        id : user._id,
        email : user.email,
        role : user.role
    }, process.env.JWT_SECRET_KEY)


    res.cookie("token", token);

    res.status(200).json({
        message: "User logged in successfully."
    })


}

module.exports = { registerUser, loginUser }