
const router = require("express").Router();
const bcrypt = require('bcrypt');
const saltRounds = 10;
const jwt = require('jsonwebtoken');
const secretKey = 'clent-info-central-2023-secret-key-siva';
const crypto = require("./crypro");
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');

const authentiaction = require("../models/credentials");
const AppMetaModel = require("../models/appmeta");
const activeUsers = new Set(); // Set to store active user emails

router.post("/login", (req, res) => {
    if (req.body) {
        // Check if the user is already logged in
        if (activeUsers.has(req.body.email)) {
            return res.status(403).json({ status: 403, message: 'User is already logged in.' });
        }

        authentiaction.find({ email: req.body.email }).then((result) => {
            if (result.length > 0) {
                bcrypt.compare(req.body.password, result[0].password, async (err, result1) => {
                    if (result1) {
                        // Generate a JWT token
                        const token = jwt.sign({ email: authentiaction.email }, secretKey);
                        // Store the token in the database
                        let user = new authentiaction(result[0]);
                        user.token = token;
                        await user.save();
                        activeUsers.add(req.body.email);
                        const app_meta_details = await authentiaction.aggregate([
                            {
                                $match: { email: user.email }
                            },
                            {
                                $lookup: {
                                    from: 'app_meta_objects',
                                    localField: 'companyEmail',
                                    foreignField: 'company_email',
                                    as: 'app_meta_details'
                                }
                            },
                            {
                                $unwind: {
                                    path: '$app_meta_details',
                                    preserveNullAndEmptyArrays: true
                                }
                            },
                            {
                                $project: {
                                    _id: 0,
                                    token: 1,
                                    email: 1,
                                    authorizeTo: 1,
                                    permission: 1,
                                    'app_meta_details': 1
                                }
                            }
                        ]);
                        res.send({ status: 200, message: "success", data: crypto.encrypt(JSON.stringify(app_meta_details[0])) })
                        return;
                    } else {
                        res.send({
                            status: 404,
                            message: "No data found"
                        })
                        return;
                    }
                });
            } else {
                res.status(401).send({ status: 401, message: "Invalid user" });
                return;
            }
        }).catch((err) => {
            res.status(400).send({ status: 500, message: err });
            return;
        })
    } else {
        res.send({
            status: 400,
            message: 'Invalid reqest'
        })
        return;
    }
})

router.post("/logout", (req, res) => {
    if (req.body) {
        const { email } = req.body;
        // Remove the user from the active users list
        activeUsers.delete(email);
        // Send a response indicating successful logout
        res.json({ message: 'Logout successful.' });
    }
})

router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        // Check if the email exists in the database
        const user = await authentiaction.findOne({ email });
        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found' });
        }

        // Generate a unique reset token
        const resetToken = uuidv4();

        // Save the reset token and its expiration time in the user's document
        user.resetToken = resetToken;
        user.resetTokenExpires = Date.now() + 3600000; // Token expires in 1 hour
        await user.save();

        // Create a password reset URL with the token
        const resetUrl = `https://customer-info-central.onrender.com/reset-password?token=${resetToken}`;

        // Send the password reset email
        const transporter = nodemailer.createTransport({
            // Configure the email transport options (SMTP, API, etc.)
            // Example using Gmail SMTP:
            service: 'Gmail',
            auth: {
                user: 'kuattechnologies@gmail.com',
                pass: 'qhksexsftiuwexsq',
            },
        });

        const mailOptions = {
            from: 'kuattechnologies@gmail.com',
            to: email,
            subject: 'Password Reset',
            text: `To reset your password, click on the following link: ${resetUrl}`,
        };

        transporter.sendMail(mailOptions, (error) => {
            if (error) {
                console.error('Error sending password reset email:', error);
                return res.status(500).json({ status: 500, message: 'Error sending email' });
            }

            // Return a success response
            res.status(200).json({ status: 200, message: 'Password reset email sent' });
        });
    } catch (error) {
        console.error('Error handling forgot password request:', error);
        res.status(500).json({ status: 500, message: 'Internal server error' });
    }
});

router.post('/api/reset-password', async (req, res) => {
    try {
        const { token, password } = req.body;
        // Find the user with the provided reset token
        const user = await authentiaction.findOne({
            resetToken: token,
            resetTokenExpires: { $gt: Date.now() },
        });
        if (!user) {
            return res.status(400).json({ status: 400, message: 'Invalid or expired token' });
        }
        bcrypt.genSalt(saltRounds, function (err, salt) {
            bcrypt.hash(req.body.password, salt, function (err, hash) {
                // Set the new password
                user.password = hash;
                user.resetToken = undefined;
                user.resetTokenExpires = undefined; 
                user.save().then((response) => {
                    res.status(200).json({ status: 200, message: 'Password reset successful' });
                    return;
                }).catch((err) => {
                    if (err.code == 11000) {
                        res.send({
                            status: 409,
                            message: err
                        })
                        return;
                    } else {
                        res.send({
                            status: 500,
                            message: err
                        })
                        return;
                    }
                })
            });
        });

        // Return a success response
    } catch (error) {
        console.error('Error handling password reset:', error);
        res.status(500).json({ status: 500, message: 'Internal server error' });
    }
});


router.post("/app/cic/users/v1/signin", async (req, res) => {
    if (req.body) {
        bcrypt.genSalt(saltRounds, function (err, salt) {
            bcrypt.hash(req.body.password, salt, function (err, hash) {
                req.body.password = hash;
                const authModel = new authentiaction(req.body);
                authModel.save().then((response) => {
                    res.send({
                        status: 200,
                        message: 'success',
                        data: response
                    })
                    return;
                }).catch((err) => {
                    if (err.code == 11000) {
                        res.send({
                            status: 409,
                            message: err
                        })
                        return;
                    } else {
                        res.send({
                            status: 500,
                            message: err
                        })
                        return;
                    }
                })
            });
        });
    } else {
        res.send({
            status: 400,
            message: 'Invalid'
        })
    }


})

router.post("/app/cic/users/get-all-users", (req, res) => {
    if (req.body) {
        authentiaction.find(req.body.query).sort({ _id: -1 }).then((result) => {
            if (result.length > 0) {
                res.status(200).send({ status: 200, message: "success", data: crypto.encrypt(JSON.stringify(result)) })
                return;
            } else {
                res.status(404).send({ status: 404, message: "no users found" });
                return;
            }
        }).catch((err) => {
            res.status(400).send({ status: 500, message: err });
            return;
        })
    } else {
        res.send({
            status: 400,
            message: 'Invalid reqest'
        })
        return;
    }
})

router.post('/app/cic/users/delete-user-by-id', async (req, res) => {
    try {
        authentiaction.findByIdAndDelete(req.body._id)
            .then((deletedEntity) => {
                if (!deletedEntity) {
                    return res.status(404).json({ status: 404, error: 'User not found' });
                }
                res.status(200).json({ status: 200, message: 'User deleted successfully' });
            })
            .catch((error) => {
                console.log(error);
                res.status(500).json({ status: 500, message: 'Error deleting user' });
            });
    } catch (error) {
        console.log(error)
        res.status(500).json({ status: 500, message: error });
    }
});

module.exports = router;