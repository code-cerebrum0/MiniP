const express = require('express');
const patientController = require('../controllers/patient.controller')

const router = express.Router()

router.get("/", patientController.getAllPatients)
router.get("/:user_id", patientController.fetchPatientById)




module.exports = router