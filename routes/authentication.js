
const router = require("express").Router();
const bcrypt = require('bcrypt');
const saltRounds = 10;
const jwt = require('jsonwebtoken');
const secretKey = 'clent-info-central-2023-secret-key-siva';
const crypto = require("./crypro");

const authentiaction = require("../models/credentials");
const AppMetaModel = require("../models/appmeta");

router.post("/login", (req, res) => {
    if (req.body) {
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