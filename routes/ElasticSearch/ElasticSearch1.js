const express = require("express");
const router = express.Router();
var axios = require("axios");
const checkFunctions = require('../CommonChecks');
const con = require('../../metadata/config');

router.post("/search", async (req, res) => {
    const keyword = req.body.keyword;
    let options = {
        method: 'POST',
        url: `http://localhost:9200/finalwebproject1/figure_segmented_nipseval_test2007/_search`,
        data: {
          "query": {
          "bool": {
            "must": [
              {
                "multi_match": {
                  "type": "best_fields",
                  "query": "caption "+ keyword,
                  "lenient": true
                }
              }
            ],
            "filter": [],
            "should": [],
            "must_not": []
          }
        },
        "size": 1998
      }
        // headers: {authorization: `Bearer ${MANAGEMENT_TOKEN}`}
      };
      


        await axios.request(options).then(function (userResponse1) {
          var nihuTest = JSON.parse(JSON.stringify(userResponse1.data))

          for(var i = 0; i<nihuTest['hits']['hits'].length; i++){
            nihuTest['hits']['hits'][i]['_source']['nihukey'] = 10
          }
          res.status(200).json({
            message: "Inserted data successfully",
            status: "SUCCESS",
            data: nihuTest
        })
        }).catch(function (e) {
          console.error(e);
        });
})

router.get("/annotatedsearch", async (req, res) => {
  const user_id = req.query.user_id;
  var query = `SELECT DISTINCT groupID from user_group_relation where user_id = ${user_id}`;
  var annotateFigQuery = `SELECT figure_file from user_figure_relation where user_id = ${user_id}`;
  var annotatedFigures = [];

  if(!(checkFunctions.checkUndefinedFunction(annotateFigQuery))){
    con.query(annotateFigQuery, async (err, annotateResult, fields) => {
        if (err) {
            console.log(err);
            res.status(500).json({
                message: "There was an error inserting role information",
                status: "FAILURE"
            })
        } else {
            for(var index = 0; index< annotateResult.length; index++){
                annotatedFigures.push(annotateResult[index]['figure_file'])
            }
            console.log(annotateResult)
        }
    })
}
else{
    res.status(500).json({
        message: "Undefined/null value was passed for role name.",
        status: "FAILURE"
    })
}

    if(!(checkFunctions.checkUndefinedFunction(query))){
        con.query(query, async (err, result, fields) => {
            if (err) {
                console.log(err);
                res.status(500).json({
                    message: "There was an error inserting role information",
                    status: "FAILURE"
                })
            } else {
                var finalResult = []
                for(var index = 0; index< result.length; index++){
                  var val = await compoundFigureFunc(result[index]['groupID'])
                  val = val.filter(eachFig => !(annotatedFigures.includes(eachFig['figure_file'])));
                // console.log(annotatedFigures.includes(['figure_file']))
                  finalResult = finalResult.concat(val)
                }
                res.status(200).json({
                    message: "User group information",
                    status: "SUCCESS",
                    data: finalResult
                })
            }
        })
    }
    else{
        res.status(500).json({
            message: "Undefined/null value was passed for role name.",
            status: "FAILURE"
        })
    }
})

router.get("/annotationpanelsearch", async (req, res) => {
  const user_id = req.query.user_id;
  var query = `SELECT DISTINCT groupID from user_group_relation where user_id = ${user_id}`;
    if(!(checkFunctions.checkUndefinedFunction(query))){
        con.query(query, async (err, result, fields) => {
            if (err) {
                console.log(err);
                res.status(500).json({
                    message: "There was an error inserting role information",
                    status: "FAILURE"
                })
            } else {
                console.log("Inserted data successfully");
                var finalResult = {}
                for(var index = 0; index< result.length; index++){
                  var val = await distinctCompoundFigureFunc(result[index]['groupID'])
                  finalResult = Object.assign({}, val, finalResult)
                }
                res.status(200).json({
                    message: "User group information",
                    status: "SUCCESS",
                    data: finalResult
                })
            }
        })
    }
    else{
        res.status(500).json({
            message: "Undefined/null value was passed for role name.",
            status: "FAILURE"
        })
    }
})

router.get("/annotationpanelsearch1", async (req, res) => {
  const fig_file = req.query.fig_file;
  var query = `select * from figure_segmented_nipseval_test2007 where figure_file = '${fig_file}'`;
    if(!(checkFunctions.checkUndefinedFunction(query))){
        con.query(query, async (err, result, fields) => {
            if (err) {
                console.log(err);
                res.status(500).json({
                    message: "There was an error inserting role information",
                    status: "FAILURE"
                })
            } else {
                console.log("Inserted data successfully");
                var finalResult = {}
                finalResult[fig_file] = result;
                res.status(200).json({
                    message: "User group information",
                    status: "SUCCESS",
                    data: finalResult
                })
            }
        })
    }
    else{
        res.status(500).json({
            message: "Undefined/null value was passed for role name.",
            status: "FAILURE"
        })
    }
})

router.post("/annotateValue", async (req, res) => {
  const fig_file = req.query.fig_file;
  const user = req.query.user_id;
  var query = `INSERT INTO user_figure_relation(user_id, figure_file, created_at, last_modified) VALUES(${user}, '${fig_file}',NOW(), NOW() )`;

    if(!(checkFunctions.checkUndefinedFunction(query))){
        con.query(query, async (err, result, fields) => {
            if (err) {
                console.log(err);
                res.status(500).json({
                    message: "There was an error inserting role information",
                    status: "FAILURE"
                })
            } else {
                console.log("Inserted data successfully");
                res.status(200).json({
                    message: "Annotation successful!",
                    status: "SUCCESS",
                    data: []
                })
            }
        })
    }
    else{
        res.status(500).json({
            message: "Undefined/null value was passed for role name.",
            status: "FAILURE"
        })
    }
})


async function compoundFigureFunc(groupID) {
  return new Promise((resolve, reject) => {
      var insertQuery = `select * from figure_segmented_nipseval_test2007 where groupID = ${groupID}`;
      if (!(checkFunctions.checkUndefinedFunction(insertQuery))) {
          con.query(insertQuery, async (err, internalResult, fields) => {
              if (err) {
                  console.log(err)
                  reject(err)
              } else {
                  resolve(internalResult)
              }
          })
      }
      else {
          reject('false')
      }
  })
}

async function distinctCompoundFigureFunc(groupID) {
  return new Promise((resolve, reject) => {
      var insertQuery = `select distinct figure_file from figure_segmented_nipseval_test2007 where groupID = ${groupID}`;
      if (!(checkFunctions.checkUndefinedFunction(insertQuery))) {
          con.query(insertQuery, async (err, internalResult, fields) => {
              if (err) {
                  console.log(err)
                  reject(err)
              } else {
                console.log("the distinct values are")
                var temp = {}
                for(var index = 0; index< internalResult.length; index++){
                  var val = await eachSubfigure(internalResult[index]['figure_file'])
                  temp[internalResult[index]['figure_file']] = val
                }
                  resolve(temp)
              }
          })
      }
      else {
          reject('false')
      }
  })
}


async function eachSubfigure(figure_file) {
  return new Promise((resolve, reject) => {
      var insertQuery = `select * from figure_segmented_nipseval_test2007 where figure_file = '${figure_file}'`;
      if (!(checkFunctions.checkUndefinedFunction(insertQuery))) {
          con.query(insertQuery, async (err, internalResult1, fields) => {
              if (err) {
                  console.log(err)
                  reject(err)
              } else {
                  resolve(internalResult1)
              }
          })
      }
      else {
          reject('false')
      }
  })
}


module.exports = router;