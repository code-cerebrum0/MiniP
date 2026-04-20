const userModel = require("../models/user.model")

async function getAllPatients (req, res){
    try {
        const patients = await userModel.find({
            role : 'patient'
        });

        res.status (200).json({
            data  :patients
        })
        

    } catch  (error){
        res.status(500).json({
            message : error.message
        });
    }
}



async function fetchPatientById (req,res)  {
    const { user_id } = req.params;

    try {
        const patient = await userModel.findOne({
            user_id : user_id,
            role : "patient",
        })

        if (!patient) {
            return res.status(400).json({
                mesasge : "Patient not found!"
            })
        }
        res.status(200).json({
            data : patient
        })

    }
    catch (error){
        res,status(500).json({
            message : error.message
        })
    }
        
    
    
}

module.exports = { getAllPatients ,fetchPatientById }