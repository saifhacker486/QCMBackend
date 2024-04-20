const { v4: uuidv4, v4 } = require('uuid');
const { dbConn } = require('../db.config/db.config')
const util = require('util')
const { getCurrentDateTime, s3 } = require('../Utilis/IQCSolarCellUtilis');

require('dotenv').config()


/** Making Sync To Query to Loop */
const queryAsync = util.promisify(dbConn.query).bind(dbConn);

// var params = {
//     "Product": "PV Module",
//     "FqcId": '',
//     "Status": "Inprogress",
//     "CurrentUser": "08326670-ed04-11ee-b439-0ac93defbbf1",
//     "FqcDetails": {
//         "ProductSpecs": "productSpecsController.text",
//         "ProductBatchNo": "productBatchNoController.text",
//         "PartyName": "partyNameController.text",
//         "PackingDate": "packingDate",
//         "ReportNumber": "reportNumberController.text",
//         "DateOfQualityCheck": "dateOfQualityCheck",
//         "DocumentNo": "GSPL/FQC/PDI/002",
//         "RevNo": "Ver1.0/12-08-2023"
//     },
//     "FqcTest": {
//         "S1": {
//             // Visual Checks
//             // 1
//             "visualParametersController930": "visualParametersController930.text",
//             "visualParameterCrietrion1Controller930":
//                 "visualParameterCrietrion1Controller930.text",


//         },
//         "S2": {
//             // Visual Checks
//             // 1
//             "visualParametersController230": "visualParametersController230.text",
//             "visualParameterCrietrion1Controller230":
//                 "visualParameterCrietrion1Controller230.text"
//         },
//         "S3": {
//             // Visual Checks
//             // 1
//             "visualParametersController645": "visualParametersController645.text",
//             "visualParameterCrietrion1Controller645":
//                 "visualParameterCrietrion1Controller645.text"

//         }
//     },
//     "Rejected": {
//         "Result": "result",
//         "CheckTypes": [
//             { "S1": "packagingRejection" },
//             { "S2": "visualRejection" },
//             { "S3": "physicalRejection" },
//         ],
//         "Reason": "rejectionReasonController.text"
//     }
// };

const AddFQC = async (req, res) => {
    const params = req.body
    const FQCDetails = params['FqcDetails']
    const FQCTests = params['FqcTest']
    const Rejected = params['Rejected']
    const UUID = v4();
    console.log(params['FqcId'])

    if (!params['FqcId']) {
        try {
            const FQCDetailsQuery = `INSERT INTO FQCDetails(FQCDetailId,Type,Product,ProductSpecs,ProductBatchNo,PartyName,PackingDate,ReportNumber,DateOfQualityCheck,DocumentNo,RevNo,Status,Result,CheckTypes,Reason,CreatedBy,CreatedOn)
                   VALUES('${UUID}','FQC','${params['Product']}','${FQCDetails['ProductSpecs']}','${FQCDetails['ProductBatchNo']}','${FQCDetails['PartyName']}','${FQCDetails['PackingDate']}','${FQCDetails['ReportNumber']}','${FQCDetails['DateOfQualityCheck']}','${FQCDetails['DocumentNo']}','${FQCDetails['RevNo']}','${params['Status']}','${Rejected['Result']}','${JSON.stringify(Rejected['CheckTypes'])}','${Rejected['Reason']}','${params['CurrentUser']}','${getCurrentDateTime()}');`;
            await queryAsync(FQCDetailsQuery);

            const FQCTestsQuery = `INSERT INTO FQCTest(FQCId,FQCDetailId,Sample1,Sample2,Sample3)
                  VALUES('${v4()}','${UUID}','${JSON.stringify(FQCTests['S1'])}','${JSON.stringify(FQCTests['S2'])}','${JSON.stringify(FQCTests['S3'])}');`;
            await queryAsync(FQCTestsQuery);

            res.send({ msg: 'Data Inserted SuccesFully !', 'FQCDetailId': UUID });

        } catch (err) {
            console.log(err);
            res.status(401).send(err);
        }
    } else {
        try {
            const FQCDetailsQuery = `UPDATE FQCDetails
        SET
            Product = '${params['Product']}',
            ProductSpecs = '${FQCDetails['ProductSpecs']}',
            ProductBatchNo = '${FQCDetails['ProductBatchNo']}',
            PartyName = '${FQCDetails['PartyName']}',
            PackingDate = '${FQCDetails['PackingDate']}',
            ReportNumber = '${FQCDetails['ReportNumber']}',
            DateOfQualityCheck = '${FQCDetails['DateOfQualityCheck']}',
            DocumentNo = '${FQCDetails['DocumentNo']}',
            RevNo = '${FQCDetails['RevNo']}',
            Status = '${params['Status']}',
            Result = '${Rejected['Result']}',
            CheckTypes = '${JSON.stringify(Rejected['CheckTypes'])}',
            Reason = '${Rejected['Reason']}'
        WHERE
            FQCDetailId = '${params['FqcId']}';
        `
            await queryAsync(FQCDetailsQuery);

            const FQCTestsQuery = `UPDATE FQCTest
SET
    Sample1 = '${JSON.stringify(FQCTests['S1'])}',
    Sample2 = '${JSON.stringify(FQCTests['S2'])}',
    Sample3 = '${JSON.stringify(FQCTests['S3'])}'
WHERE
    FQCDetailId = '${params['FqcId']}';
`;
            await queryAsync(FQCTestsQuery);

            res.send({ msg: 'Data Inserted SuccesFully !', 'FQCDetailId': params['FqcId'] });
        } catch (err) {
            console.log(err);
            res.status(401).send(err);
        }

    }
}




const GetFQCList = async (req, res) => {
    const { PersonID, Designation, Department, Status } = req.body

    let query;


    /** Query */
    try {
        if (Designation == 'Admin' || Designation == 'Super Admin') {
            query = `SELECT p.EmployeeID,  p.Name, p.ProfileImg, wl.Location,FD.FQCDetailId,FD.Product,FD.ProductBatchNo,FD.Pdf FROM Person p
    JOIN WorkLocation wl ON wl.LocationID = p.WorkLocation
    JOIN FQCDetails FD ON p.PersonID = FD.CreatedBy
    WHERE FD.Status = '${Status}'
    ORDER BY STR_TO_DATE(FD.CreatedOn, '%d-%m-%Y %H:%i:%s') DESC;`;
        } else {
            query = `SELECT p.EmployeeID,  p.Name, p.ProfileImg, wl.Location,FD.FQCDetailId,FD.Product,FD.ProductBatchNo,FD.Pdf FROM Person p
            JOIN WorkLocation wl ON wl.LocationID = p.WorkLocation
            JOIN FQCDetails FD ON p.PersonID = FD.CreatedBy
            WHERE FD.Status = '${Status}' AND p.PersonID = '${PersonID}'
            ORDER BY STR_TO_DATE(FD.CreatedOn, '%d-%m-%Y %H:%i:%s') DESC;`;
        }

        let data = await queryAsync(query);
        res.send({ status: true, data })
    } catch (err) {
        console.log(err);
        res.status(400).send({ status: false, err });
    }
}


const GetSpecificFQC = async(req,res)=>{
    const {FQCDetailId} = req.body;

 try{
  const query = `SELECT *FROM FQCDetails FD
                 JOIN FQCTest FT ON FT.FQCDetailId = FD.FQCDetailId
                 WHERE FD.FQCDetailId = '${FQCDetailId}'`
  const data = await queryAsync(query);

  data[0]['Sample1'] =  JSON.parse(data[0]['Sample1']);
  data[0]['Sample2'] = JSON.parse(data[0]['Sample2']);
  data[0]['Sample3'] = JSON.parse(data[0]['Sample3']);
  data[0]['CheckTypes'] = JSON.parse(data[0]['CheckTypes']);
  res.send({data})
 }catch(err){
 console.log(err);
 res.send({err});
 }
}

const FQCUpdateStatus = async(req,res)=>{
    const {FQCDetailId,Status,PersonID} = req.body;

    try{
     const query = `UPDATE FQCDetails
                    SET
                       Status = '${Status}',
                       UpdatedBy = '${PersonID}',
                       UpdatedOn = '${getCurrentDateTime()}'
                    WHERE FQCDetailId = '${FQCDetailId}';`;
    
    const FQCApproveStatus = await queryAsync(query);
    res.send({FQCApproveStatus})
    }catch(err){
        console.log(err)
        res.status(500).send({ err })
    }
}
module.exports = { AddFQC, GetFQCList, GetSpecificFQC, FQCUpdateStatus }