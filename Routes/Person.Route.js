const express = require('express');
const PersonRouter = express.Router();
const {upload} = require('../Middleware/Person.middleware');
const {PersonRegister,UploadProfile,Login,EmployeeList,GetSpecificEmployee,UpdateStatus} = require('../Controller/PersonController.js');




/** SignUp Route */
PersonRouter.post('/SignUp',PersonRegister);

/** Upload Profile Route during SignUp */
PersonRouter.post('/UploadProfileImg',upload.single('Profile'),UploadProfile);

/** Router to Login */
PersonRouter.post('/Login',Login);

/**Router to Get Employees List */
PersonRouter.get('/GetList',EmployeeList);

/**Router to Get Specific Employee */
PersonRouter.post('/GetSpecificEmployee',GetSpecificEmployee);

/**Router to Update Status of Employee */
PersonRouter.post('/DeleteEmployee',UpdateStatus);








module.exports = {PersonRouter}