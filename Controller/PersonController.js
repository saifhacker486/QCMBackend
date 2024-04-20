const { dbConn } = require('../db.config/db.config')
const { generatePassword, s3, AWS, transport, getCurrentDateTime } = require('../Utilis/Person.utilis')
const bcrypt = require('bcrypt')
const JWT = require('jsonwebtoken')
require('dotenv').config()


/** Controller to Register Employee */
const PersonRegister = async (req, res) => {
  const { personid, currentuser, employeeid, loginid, joblocation, fullname, department, designation } = req.body
  const PlainPassword = `${fullname.split(' ')[0]}@${generatePassword()}`
  if (!personid) {
    try {
      /** Hashed the Password */
      //const HashedPassword = await bcrypt.hash(PlainPassword,8)

      /**query to register a Employee */

      const IsActiveQuery = `SELECT Status FROM Person WHERE LoginID = '${loginid}'`;

      const IsActive = await new Promise((resolve, reject) => {
        dbConn.query(IsActiveQuery, (err, result) => {
          if (err) {
            reject(err)
          } else {

            resolve(result)
          }
        })
      })
      const Status = IsActive[0]['Status'];

      if (Status!=='Active') { 
      const query = `CALL PersonRegister('${personid}','${employeeid}','${fullname}','${loginid}','${PlainPassword}', '${joblocation}','krishukumar7827@gmail.com','${department}','','${designation}','${getCurrentDateTime()}','${currentuser}' )`

      const data = await new Promise((resolve, reject) => {
        dbConn.query(query, (err, result) => {
          if (err) {
            reject(err)
          } else {

            resolve(result)
          }
        })
      })
      //    /** to Find Designation */
      //     const DesignationQuery = `SELECT Designation FROM Designation WHERE DesignationID = '${designation}'`
      //     const DesignationName = await new Promise((resolve,reject)=>{
      //       dbConn.query(DesignationQuery,(err,result)=>{
      //          if(err){
      //             reject(err)
      //          }else{

      //            resolve(result)
      //          }
      //       })
      //  })


      /** to Find Department */
      const DepartmentQuery = `SELECT Department FROM Department WHERE DepartmentID = '${department}'`
      const DepartmentName = await new Promise((resolve, reject) => {
        dbConn.query(DepartmentQuery, (err, result) => {
          if (err) {
            reject(err)
          } else {

            resolve(result)
          }
        })
      })
      /** Sending A Email to Admin */
      await transport.sendMail({
        from: 'bhanu.galo@gmail.com',
        cc: 'bhanu.galo@gmail.com',
        to: 'quality@gautamsolar.com',
        subject: 'Enrollment in Gautam Solar Private Limited',
        html: `<div style="position: relative; padding: 5px;">
        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-image: url('https://galo.co.in/wp-content/uploads/2024/01/Galo-Energy-Logo-06.png'); background-size: cover; background-position: center; background-repeat: no-repeat; opacity: 0.3; z-index: -1;"></div>
        <div style="background-color: rgba(255, 255, 255, 0.8); padding: 20px; border-radius: 10px;">
          <h3 style="color: #2f4f4f;">Welcome to Gautam Solar Private Limited!</h3>
          <p style="font-size: 16px;">Dear Admin,</p>      
          <p style="font-size: 16px; margin-bottom: 0px;">Congratulations, ${fullname} is now officially enrolled in ${DepartmentName[0]['Department']} department.</p>      
          <p style="font-size: 16px;">Below are your enrollment details:</p>
          <ul style="font-size: 16px;">
            <li><strong>Login ID:</strong> ${loginid}</li>
            <li><strong>Password:</strong> ${PlainPassword}</li>
          </ul>
          <p style="font-size: 16px; margin-bottom: 0px;">Please keep his Employee ID and Password confidential for security reasons.</p>        
          <p style="font-size: 16px; margin-bottom: 0px;">If you have any questions or need assistance, feel free to contact us at <a href="mailto:quality@gautamsolar.com" style="color: #007bff;">quality@gautamsolar.com</a>.</p>
          <p style="font-size: 16px;">We look forward to working with you!</p>
          <br>
          <p style="font-size: 16px;"><em>Sincerely,</em></p>
          <p style="font-size: 16px;"><strong>Gautam Solar QCM Team</strong></p>
        </div>
      </div>`
      })

      res.send({ msg: 'Employee Registered Succesfully', data })
    }else{
      res.status(400).send({msg:'LoginId is already exists'})
    }
    } catch (err) {
      console.log(err)
      res.status(500).send({ err })
    }

  } else {


    let query = `UPDATE Person p
    set p.EmployeeID = '${employeeid}',
        p.Name = '${fullname}',
        p.LoginID = '${loginid}',
        p.WorkLocation = '${joblocation}',
        p.Department = '${department}',
        p.Desgination = '${designation}',
        p.Status ='Active',
        p.UpdatedBy = '${currentuser}',
        p.UpdatedOn = '${getCurrentDateTime()}'
    WHERE p.PersonID = '${personid}';`

    try {
      const UpdateEmployeeDetail = await new Promise((resolve, reject) => {
        dbConn.query(query, (err, result) => {
          if (err) {
            reject(err)
          } else {
            resolve(result)
          }
        });
      });

      res.send({ msg: 'Update Employee Detail', UpdateEmployeeDetail })
    } catch (err) {
      res.status(400).send(err)
    }


  }


}


/** Controller to Upload Profile Image */
const UploadProfile = async (req, res) => {
  const { personid } = req.body;
  try {

    /** Uploading Profile Image In S3 Bucket */
    const data = await new Promise((resolve, reject) => {
      s3.upload({
        Bucket: process.env.AWS_BUCKET_1,
        Key: personid,
        Body: req.file.buffer,
        ACL: "public-read-write",
        ContentType: req.body.FileFormat
      }, (err, result) => {
        if (err) {
          reject(err)
        } else {
          resolve(result)
        }
      })
    });
    const query = `UPDATE Person SET ProfileImg = '${data.Location}' WHERE PersonID = '${personid}'`

    const SqlData = await new Promise((resolve, reject) => {
      dbConn.query(query, (err, result) => {
        if (err) {
          reject(err)
        } else {
          resolve(result)
        }
      })
    })

    res.send({ msg: 'Profile Image Updated Succesfully' })
  } catch (err) {
    console.log(err)
    res.status(500).send({ err })
  }
}


const Login = async (req, res) => {
  const { loginid, password } = req.body

  const query = `SELECT Password FROM Person Where LoginID = '${loginid}' AND Status = 'Active'`
  try {
    const hashedPassword = await new Promise((resolve, reject) => {
      dbConn.query(query, (err, result) => {
        if (err) {
          reject(err)
        } else {
          resolve(result)
        }
      })
    })
    try {
      console.log(hashedPassword)
      if (hashedPassword[0].Password == password) {

        const getdata = `SELECT p.PersonID,p.ProfileImg,p.Name,d1.Designation,d.Department FROM Person p
      JOIN Department d ON p.Department = d.DepartmentID
      JOIN Designation d1 ON p.Desgination = d1.DesignationID
      WHERE p.LoginID = '${loginid}'`

        const PersonData = await new Promise((resolve, reject) => {
          dbConn.query(getdata, (err, result) => {
            if (err) {
              reject(err)
            } else {
              resolve(result)
            }
          })
        })
        let EnCodeData = PersonData[0];
        const token = JWT.sign({ PersonID: EnCodeData['PersonID'], Designation: EnCodeData['Designation'], Department: EnCodeData['Department'] }, process.env.SecretKey)

        res.send({ status: true, msg: 'Login Successfull', token, PersonData })
      } else {
        res.status(400).send({ msg: 'Wrong Password' })
      }
    } catch (err) {
      console.log(err)
      res.status(400).send({ msg: 'Internal Error' })
    }

  } catch (err) {
    console.log(err)
    res.status(400).send({ msg: 'Wrong EmployeeId' });
  }

}


const EmployeeList = async (req, res) => {

  const query = `SELECT p.PersonID, p.LoginID,p.EmployeeID,p.Name,p.ProfileImg,wl.Location,d.Designation,d1.Department,p.Status  FROM Person p
  JOIN Designation d ON p.Desgination = d.DesignationID
  JOIN Department d1 ON p.Department = d1.DepartmentID
  JOIN WorkLocation wl ON p.WorkLocation = wl.LocationID
  WHERE p.Status = 'Active';`

  try {
    const EmployeeList = await new Promise((resolve, reject) => {
      dbConn.query(query, (err, result) => {
        if (err) {
          reject(err)
        } else {
          resolve(result)
        }
      });
    });

    res.send({ status: true, data: EmployeeList })
  } catch (err) {
    console.log(err);
    res.status(400).send(err)
  }
}

const GetSpecificEmployee = async (req, res) => {

  const { PersonID } = req.body

  const query = `SELECT *FROM Person p WHERE p.PersonID = '${PersonID}'`

  try {
    const GetSpecificEmployee = await new Promise((resolve, reject) => {
      dbConn.query(query, (err, result) => {
        if (err) {
          reject(err)
        } else {
          resolve(result)
        }
      });
    });

    res.send({ status: true, data: GetSpecificEmployee })
  } catch (err) {
    console.log(err);
    res.status(400).send(err)
  }
}


const UpdateStatus = async (req, res) => {
  const { PersonId, Status } = req.body;

  try {
    const UpdateStatusQuery = `UPDATE Person 
                               SET
                                  Status = '${Status}'
                               WHERE PersonID = '${PersonId}'`

    const UpdateStatusEmployee = await new Promise((resolve, reject) => {
      dbConn.query(UpdateStatusQuery, (err, result) => {
        if (err) {
          reject(err)
        } else {
          resolve(result)
        }

      });
    });
    res.send({ status: true, message: 'Status Updated!', UpdateStatusEmployee })
  } catch (err) {
    console.log(err)
    res.status(400).send({ err })
  }
}



module.exports = { PersonRegister, UploadProfile, Login, EmployeeList, GetSpecificEmployee, UpdateStatus }