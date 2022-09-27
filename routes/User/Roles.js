const express = require("express");
const router = express.Router();
const con = require('../../metadata/config');
const checkFunctions = require('../CommonChecks.js');


router.post("/", (req, res) => {
    var role_name = req.body.role_name
    var query = `INSERT INTO role_information(role_name) values('${role_name}')`;
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
                    message: "Inserted data successfully",
                    status: "SUCCESS",
                    data: result
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


module.exports = router;