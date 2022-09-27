const express = require("express");
const bcrypt = require("bcrypt");
const { nanoid } = require("nanoid");
const router = express.Router();
const con = require('../../metadata/config');
const checkFunctions = require('../CommonChecks.js');

const config = require('../../config');
const { Client } = require('@duosecurity/duo_universal');

const { clientId, clientSecret, apiHost, redirectUrl } = config;
const duoClient = new Client({ clientId, clientSecret, apiHost, redirectUrl });
router.get("/", (req, res) => {
    var organization_id = req.query.organization_id
    var query = `SELECT * FROM users where organization_id = ${organization_id}`;
    if (!(checkFunctions.checkUndefinedFunction(query))) {
        con.query(query, async (err, result, fields) => {
            if (err) {
                console.log(err);
                res.status(500).json({
                    message: "There was an error fetching the user details",
                    status: "FAILURE"
                })
            } else {
                res.status(200).json({
                    message: "Retrived data successfully",
                    status: "SUCCESS",
                    data: result
                })
            }
        })

    }
    else {
        res.status(500).json({
            message: "organization_id not defined",
            status: "FAILURE"
        })
    }
})



router.post("/register", async (req, res) => {
    var email = req.body.email;
    var first_name = req.body.first_name;
    var last_name = req.body.last_name;
    var user_phone = req.body.user_phone;
    var gender = req.body.gender;
    var profile_photo = req.body.profile_photo;
    const checkIfEmailPresent = `SELECT count(*) as EMAIL FROM users where email = '${email}'`;
    if (!(checkFunctions.checkUndefinedFunction(checkIfEmailPresent))) {
        con.query(checkIfEmailPresent, async (err, result, fields) => {
            if (err) {
                console.log(err);
                res.status(500).json({
                    message: "There was an error while checking if email exists.",
                    status: "FAILURE"
                })
            } else {
                if (result[0]['EMAIL'] == 0) {
                    if (isNaN(req.body.user_phone) || req.body.user_phone.length != 10) {
                        res.status(500).json({
                            message: "The phone number is either not a number or not of length 10.",
                            status: "FAILURE"
                        })
                    } else {
                        const salt = await bcrypt.genSalt(10);
                        const password = await bcrypt.hash(req.body.password, salt);
                        const token = nanoid()
                        var insertQuery = `INSERT INTO users(email, password, role_id, first_name, last_name, user_phone, gender, profile_photo, token, created_at, last_modified)
     values('${email}','${password}','2', '${first_name}', '${last_name}','${user_phone}', '${gender}', '${profile_photo}','${token}', NOW(), NOW())`;

                        if (!(checkFunctions.checkUndefinedFunction(insertQuery))) {
                            con.query(insertQuery, async (err, result, fields) => {
                                if (err) {
                                    console.log(err);
                                    res.status(500).json({
                                        message: "There was an error creating user.",
                                        status: "FAILURE"
                                    })
                                } else {
                                    let resultBody = {
                                        'token': token,
                                        'email': req.body.email,
                                        'user_id': 3,
                                        'first_name': req.body.first_name,
                                        'last_name': req.body.last_name
                                    }
                                    res.status(200).json({
                                        message: "User created successfully.",
                                        status: "SUCCESS",
                                        data: resultBody
                                    })
                                }
                            })
                        }
                        else {
                            res.status(500).json({
                                message: "Undefined/null value was passed.",
                                status: "FAILURE"
                            })
                        }
                    }
                }
                else {
                    res.status(500).json({
                        message: "The email address already exists.",
                        status: "FAILURE"
                    })
                }

            }
        })

    }
    else {
        res.status(500).json({
            message: "Undefined/null value was passed for email.",
            status: "FAILURE"
        })

    }
})

router.post("/login", async (req, res) => {
    var email = req.body.email;
    var query = `SELECT * from users where email = '${email}'`;
    if (!(checkFunctions.checkUndefinedFunction(query))) {
        con.query(query, async (err, result, fields) => {
            if (err) {
                console.log(err);
                res.status(500).json({
                    message: "There was an error fetching email",
                    status: "FAILURE"
                })
            } else {
                if (result.length != 0) {
                    var userData = `SELECT * from users where user_id = '${result[0]['user_id']}'`;
                    con.query(userData, async (err, resultData, fields) => {
                        if (err) {
                            console.log(err);
                            res.status(500).json({
                                message: "There was an error for fetching data user information",
                                status: "FAILURE"
                            })
                        } else {
                            const validPassword = await bcrypt.compare(req.body.password, resultData[0]['password']);
                            if (validPassword) {
                                let token = nanoid()
                                var updateQuery = `UPDATE users set token = '${token}' ,last_modified = NOW() where user_id = '${resultData[0]['user_id']}'`
                                con.query(updateQuery, async (err, result, fields) => {
                                    if (err) {
                                        console.log(err);
                                        res.status(500).json({
                                            message: "There was an error logging in.",
                                            status: "FAILURE"
                                        })
                                    } else {
                                        let resultBody = {
                                            'token': token,
                                            'userID': resultData[0]['user_id'],
                                            'email': req.body.email
                                        }
                                        res.status(200).json({
                                            message: "Retrived data successfully",
                                            status: "SUCCESS",
                                            data: resultBody
                                        })
                                    }
                                })

                            }
                            else {
                                res.status(500).json({
                                    message: "Wrong credentials",
                                    status: "FAILURE"
                                })
                            }
                        }
                    })
                }
                else {
                    res.status(500).json({
                        message: "Email not found.",
                        status: "FAILURE"
                    })

                }
            }
        })
    }
    else {
        res.status(500).json({
            message: "Undefined/null value was passed.",
            status: "FAILURE"
        })
    }
})


router.post('/testlogin', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        res.status(500).json({
            message: "missing value",
            status: "FAILURE"
        })
      return;
    }

    try {
      await duoClient.healthCheck();

      const state = duoClient.generateState();
      req.session.duo = { state, username };
      const url = duoClient.createAuthUrl(username, state);

      res.redirect(302, url);
    } catch (err) {
      console.error(err);
      res.status(500).json({
        message: err,
        status: "FAILURE"
    })
    }
  });

  router.get('/redirect', async (req, res) => {
    const { query, session } = req;
    const { duo_code, state } = query;

    if (!duo_code || typeof duo_code !== 'string') {
      res.render('index.html', { message: `Missing 'duo_code' query parameters` });
      return;
    }

    if (!state || typeof state !== 'string') {
      res.render('index.html', { message: `Missing 'state' query parameters` });
      return;
    }

    const savedState = session.duo?.state;
    const savedUsername = session.duo?.username;

    req.session.destroy();

    if (
      !savedState ||
      typeof savedState !== 'string' ||
      !savedUsername ||
      typeof savedUsername !== 'string'
    ) {
      res.render('index.html', { message: 'Missing user session information' });
      return;
    }

    if (state !== savedState) {
      res.render('index.html', { message: 'Duo state does not match saved state' });
      return;
    }

    try {
      const decodedToken = await duoClient.exchangeAuthorizationCodeFor2FAResult(
        duo_code,
        savedUsername
      );
      res.render('success.html', { message: JSON.stringify(decodedToken, null, '\t') });
    } catch (err) {
      console.error(err);

      res.render('index.html', {
        message: 'Error decoding Duo result. Confirm device clock is correct.',
      });
    }
  });


module.exports = router;