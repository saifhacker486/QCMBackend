const { v4: uuidv4, v4 } = require('uuid');
const { getCurrentDateTime, s3 } = require('../Utilis/PreLamUtilis');
const util = require('util');
const { dbConn } = require('../db.config/db.config');


/** Making Sync To Query */
const queryAsync = util.promisify(dbConn.query).bind(dbConn);

// const data = {
//      'PreLamDetailId':'',
//     'CurrentUser':'',
//     'Status':'Inprogress',
//     'DocNo':'GSPL/IPQC/AF/011',
//     'RevNo':'1.0/12.08.2023',
//     'Date': dateController.text,
//     'Shift': shiftController.text,
//     'samples': [
//       {
//         'Sample': Sample1Controller.text,
//         'FramingObservation': Sample1GlueController.text,
//         'FramingDimension': {
//           'x1': Sample1x1Controller.text,
//           'x2': Sample1x2Controller.text,
//           'y1': Sample1y1Controller.text,
//           'y2': Sample1y2Controller.text,
//           'l1': Sample1L1Controller.text,
//           'l2': Sample1L2Controller.text,
//           'w1': Sample1W1Controller.text,
//           'w2': Sample1W2Controller.text
//         }
//       },
//       {
//         'Sample': Sample2Controller.text,
//         'FramingObservation': Sample2GlueController.text,
//         'FramingDimension': {
//           'x1': Sample2x1Controller.text,
//           'x2': Sample2x2Controller.text,
//           'y1': Sample2y1Controller.text,
//           'y2': Sample2y2Controller.text,
//           'l1': Sample2L1Controller.text,
//           'l2': Sample2L2Controller.text,
//           'w1': Sample2W1Controller.text,
//           'w2': Sample2W2Controller.text
//         }
//       },
//       {
//         'Sample': Sample3Controller.text,
//         'FramingObservation': Sample3GlueController.text,
//         'FramingDimension': {
//           'x1': Sample3x1Controller.text,
//           'x2': Sample3x2Controller.text,
//           'y1': Sample3y1Controller.text,
//           'y2': Sample3y2Controller.text,
//           'l1': Sample3L1Controller.text,
//           'l2': Sample3L2Controller.text,
//           'w1': Sample3W1Controller.text,
//           'w2': Sample3W2Controller.text
//         }
//       },
//       {
//         'Sample': Sample4Controller.text,
//         'FramingObservation': Sample4GlueController.text,
//         'FramingDimension': {
//           'x1': Sample4x1Controller.text,
//           'x2': Sample4x2Controller.text,
//           'y1': Sample4y1Controller.text,
//           'y2': Sample4y2Controller.text,
//           'l1': Sample4L1Controller.text,
//           'l2': Sample4L2Controller.text,
//           'w1': Sample4W1Controller.text,
//           'w2': Sample4W2Controller.text
//         }
//       },
//       {
//         'Sample': Sample5Controller.text,
//         'FramingObservation': Sample5GlueController.text,
//         'FramingDimension': {
//           'x1': Sample5x1Controller.text,
//           'x2': Sample5x2Controller.text,
//           'y1': Sample5y1Controller.text,
//           'y2': Sample5y2Controller.text,
//           'l1': Sample5L1Controller.text,
//           'l2': Sample5L2Controller.text,
//           'w1': Sample5W1Controller.text,
//           'w2': Sample5W2Controller.text
//         }
//       },
//     ],
//   }


const AddFraming = async(req,res)=>{
  const {DocNo,RevNo,Shift,Date,CurrentUser,Status,PreLamDetailId} = req.body;
  const Samples = req.body['samples'];
  const UUID = v4();
  if(!PreLamDetailId){
  try{
    const PreLamDetailQuery = `INSERT INTO PreLamDetail(PreLamDetailId,Type,DocNo,RevNo,Date,Shift,Status,CheckedBy,CreatedOn)
                                    VALUES('${UUID}','Framing Dimension','${DocNo}','${RevNo}','${Date}','${Shift}','${Status}','${CurrentUser}','${getCurrentDateTime()}');`;
    await queryAsync(PreLamDetailQuery);

    Samples.forEach(async(sample)=>{
        const query = `INSERT INTO Framing(FramingId,PreLamDetailId,Sample,FramingObservation,FramingDimension)
                           VALUES('${v4()}','${UUID}','${sample['Sample']}','${sample['FramingObservation']}','${JSON.stringify(sample['FramingDimension'])}');`;
       await queryAsync(query);
    })
    res.send({ msg: 'Data Inserted Succesfully !', UUID });
  }catch(err){
  console.log(err)
  res.status(400).send({ err });
  }
}else{
 try{
    const PreLamDetailQuery = `UPDATE PreLamDetail
                               SET
                                 DocNo = '${DocNo}',
                                 RevNo = '${RevNo}',
                                 Date  = '${Date}',
                                 Shift = '${Shift}',
                                 Status = '${Status}',
                                 CheckedBy = '${CurrentUser}'
                               WHERE PreLamDetailId = '${PreLamDetailId}';`;
    await queryAsync(PreLamDetailQuery);
   Samples.forEach(async(sample)=>{
    const query = `UPDATE Framing
                   SET
                     FramingObservation = '${sample['FramingObservation']}',
                     FramingDimension = '${JSON.stringify(sample['FramingDimension'])}'
                   WHERE PreLamDetailId = '${PreLamDetailId}' AND Sample = '${sample['Sample']}';
                     `;
    await queryAsync(query);

   })
   res.send({ msg: 'Data Inserted Succesfully !', UUID:PreLamDetailId });
 }catch(err){
    console.log(err)
    res.status(400).send({ err });
 }
}
}







module.exports = {AddFraming};