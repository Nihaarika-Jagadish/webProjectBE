const express = require("express");
const bcrypt = require("bcrypt");
const { nanoid } = require("nanoid");
const router = express.Router();
const con = require('../../metadata/config');
const checkFunctions = require('../CommonChecks.js');
const email = require('../../helper/email')
const config = require('../../config');
const { Client } = require('@duosecurity/duo_universal');

const { clientId, clientSecret, apiHost, redirectUrl } = config;
const duoClient = new Client({ clientId, clientSecret, apiHost, redirectUrl });

router.get("/profile", (req, res) => {
    var token = req.query.token
    var query = `SELECT * FROM users where token = '${token}'`;
    console.log(query)
    if (!(checkFunctions.checkUndefinedFunction(query))) {
        con.query(query, async (err, result, fields) => {
            if (err) {
                console.log(err);
                res.status(500).json({
                    message: "There was an error fetching the user details",
                    status: "FAILURE"
                })
            } else {
                console.log(result)
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
            message: "token not defined",
            status: "FAILURE"
        })
    }
})



router.post("/register", async (req, res) => {
    var email = req.body.email;
    var first_name = req.body.first_name;
    var last_name = req.body.last_name;
    var phoneNumber = req.body.phoneNumber;
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
                    console.log(isNaN(phoneNumber), phoneNumber)
                    if (isNaN(phoneNumber) || req.body.phoneNumber.length != 10) {
                        res.status(500).json({
                            message: "The phone number is either not a number or not of length 10.",
                            status: "FAILURE"
                        })
                    } else {
                        const salt = await bcrypt.genSalt(10);
                        const password = await bcrypt.hash(req.body.password, salt);
                        const token = nanoid()
                        var insertQuery = `INSERT INTO users(email, password, role_id, first_name, last_name, user_phone, profile_photo, token, created_at, last_modified)
     values('${email}','${password}','2', '${first_name}', '${last_name}','${phoneNumber}', '${profile_photo}','${token}', NOW(), NOW())`;

                        if (!(checkFunctions.checkUndefinedFunction(insertQuery))) {
                            con.query(insertQuery, async (err, result, fields) => {
                                if (err) {
                                    console.log(err);
                                    res.status(500).json({
                                        message: "There was an error creating user.",
                                        status: "FAILURE"
                                    })
                                } else {
                                    try {
                                        await duoClient.healthCheck();

                                        const state = duoClient.generateState();
                                        req.session.duo = { state, email };
                                        const url = duoClient.createAuthUrl(email, state);
                                        console.log(url)

                                        let resultBody = {
                                            'token': token,
                                            'email': req.body.email,
                                            'first_name': req.body.first_name,
                                            'last_name': req.body.last_name,
                                            'phone_num': req.body.phoneNumber,
                                            'url': url
                                        }
                                        res.status(200).json({
                                            message: "User registered successfully. Please wait for the admin to approve your request.",
                                            status: "SUCCESS",
                                            data: resultBody
                                        })
                                        // res.redirect(302, url);
                                    } catch (err) {
                                        console.error(err);
                                        res.status(500).json({
                                            message: err,
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
                    console.log(result)
                            const validPassword = await bcrypt.compare(req.body.password, result[0]['password']);
                            if (validPassword) {
                                let token = nanoid()
                                var updateQuery = `UPDATE users set token = '${token}' ,last_modified = NOW() where email = '${email}'`
                                console.log(updateQuery)
                                con.query(updateQuery, async (err, result1, fields) => {
                                    if (err) {
                                        console.log(err);
                                        res.status(500).json({
                                            message: "There was an error logging in.",
                                            status: "FAILURE"
                                        })
                                    } else {
                                        try {
                                            await duoClient.healthCheck();
    
                                            const state = duoClient.generateState();
                                            req.session.duo = { state, email };
                                            const url = duoClient.createAuthUrl(email, state);
                                            console.log(url)
                                            let resultBody = {
                                                'token': token,
                                                'email': req.body.email,
                                                'first_name': result[0]['first_name'],
                                                'last_name': result[0]['last_name'],
                                                'phoneNumber': result[0]['user_phone'],
                                                'user_id': result[0]['user_id'],
                                                'role_id': result[0]['role_id'],
                                                'profile_photo': result[0]['profile_photo'],
                                                'approved': result[0]['approved'],
                                                'url': url
                                            }
                                            console.log(resultBody)
                                            res.status(200).json({
                                                message: "User successfully logged in.",
                                                status: "SUCCESS",
                                                data: resultBody
                                            })
                                        } catch (err) {
                                            console.error(err);
                                            res.status(500).json({
                                                message: err,
                                                status: "FAILURE"
                                            })
                                        }
                                    }
                                })

                            }
                            else {
                                res.status(500).json({
                                    message: "Wrong Username/Password",
                                    status: "FAILURE"
                                })
                            }
                }
                else {
                    res.status(500).json({
                        message: "Wrong Username/Password",
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



router.post("/profile", async (req, res) => {
    var email = req.body.email;
    var updateQuery = `UPDATE users set first_name = '${req.body.first_name}', last_name = '${req.body.last_name}', user_phone = '${req.body.user_phone}', profile_photo = '${req.body.profile_photo}', last_modified = NOW() where email = '${email}'`

    if (!(checkFunctions.checkUndefinedFunction(updateQuery))) {
        con.query(updateQuery, async (err, result, fields) => {
            if (err) {
                console.log(err);
                res.status(500).json({
                    message: "There was an error fetching email",
                    status: "FAILURE"
                })
            } else {
                res.status(200).json({
                    message: "User info successfully updated.",
                    status: "SUCCESS",
                    data: result
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
})

router.post("/changePassword", async (req, res) => {
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
                    console.log(result)

                            const validPassword = await bcrypt.compare(req.body.oldPassword, result[0]['password']);
                            console.log(validPassword)
                            if (validPassword) {
                                const salt = await bcrypt.genSalt(10);
                        const newPassword = await bcrypt.hash(req.body.newPassword, salt);
                                var updateQuery = `UPDATE users set password = '${newPassword}' ,last_modified = NOW() where email = '${email}'`
                                con.query(updateQuery, async (err, result1, fields) => {
                                    if (err) {
                                        console.log(err);
                                        res.status(500).json({
                                            message: "There was an error updating password.",
                                            status: "FAILURE"
                                        })
                                    } else {
                                        res.status(200).json({
                                            message: "Password updated successfully.",
                                            status: "SUCCESS",
                                            data: result1
                                        })
                                    }
                                })

                            }
                            else {

                                res.status(500).json({
                                    message: "Wrong old password",
                                    status: "FAILURE"
                                })
                            }
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


router.get('/redirect', async (req, res) => {
    console.log("inside redirect")
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


router.post("/forgotPswd", (req, res) => {
    var query = `SELECT * FROM users WHERE email = '${req.body.email}'`;
    con.query(query, async (err, result) => {
        if(err){
            console.log(err)
            res.status(500).json({
                message: "There was a problem finding the user.",
                status: "FAILURE"
            })
        } else {
            if(result.length != 0){
                // var samplePassword = otp.generate(8, { upperCase: false, specialChars: false, alphabets: false });
                // const characters ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                // var samplePassword = 'W_j';
                // for ( let i = 0; i < 10; i++ ) {
                //     samplePassword += characters.charAt(Math.floor(Math.random() * characters.length));
                // }
                var samplePassword = 'XdtHnbh_1jn'
                const salt = await bcrypt.genSalt(10);
                const hashPass = await bcrypt.hash(samplePassword, salt);
                query = `UPDATE users SET password = '${hashPass}' WHERE email = '${req.body.email}'`;
                con.query(query, async (err, results) => {
                    if(err){
                        console.log(err);
                        res.status(500).json({
                            message: "There was an error updating the password",
                            status: "FAILURE"
                        });
                    }else{
                        var emailSent = await email.frgtpass(`Please use the temporary password ${samplePassword} to login and change the password.\n\nThanks,\nFigure Annotation UI Team.`, req.body.email);
                        if(emailSent){
                            res.status(200).json({
                                message: "A temporary password has been sent to your email address. Please use it to login and update your password.",
                                status: "SUCCESS"
                            });
                        }else{
                            res.status(500).json({
                                message: "There was an error sending the email.",
                                status: "FAILURE"
                            });
                        }
                    }
                })
            } else {
                res.status(400).json({
                    message: "There was an error finding the user with the given email address.",
                    status: "FAILURE"
                })
            }
        }
    })
})

router.get("/allUsers", (req, res) => {
    var query = `SELECT * FROM users WHERE role_id = 2`;
    //2 is the role id for users and 1 is for admin
    con.query(query, async (err, result) => {
        if(err){
            console.log(err)
            res.status(500).json({
                message: "There was a problem getting all users.",
                status: "FAILURE"
            })
        } else {
            res.status(200).json({
                message: "All user information retrieved",
                status: "SUCCESS",
                data: result
            });
        }
    })
})

router.put("/approveUser", (req, res) => {
    var query = `UPDATE users SET approved = 1 WHERE email = '${req.body.email}'`;
    //2 is the role id for users and 1 is for admin
    con.query(query, async (err, result) => {
        if(err){
            console.log(err)
            res.status(500).json({
                message: "There was a problem updating user information.",
                status: "FAILURE"
            })
        } else {
            res.status(200).json({
                message: `${req.body.email} user approved.`,
                status: "SUCCESS",
                data: result
            });
        }
    })
})


module.exports = router;