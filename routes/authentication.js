
const router = require("express").Router();
const bcrypt = require('bcrypt');
const saltRounds = 10;
const jwt = require('jsonwebtoken');
const secretKey = 'clent-info-central-2023-secret-key-siva'; 
const crypto = require("./crypro");

const authentiaction = require("../models/credentials");
const AppMetaModel = require("../models/appmeta");

router.post("/login", (req, res)=>{
    if(req.body){
        authentiaction.find({email : req.body.email}).then((result)=>{
              if (result.length > 0) {
                bcrypt.compare(req.body.password, result[0].password, async (err, result1)=> {
                    if(result1){
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
                                from: 'app_meta_objects', // Collection name of appMetaModel
                                localField: 'email',
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
                                token : 1,
                                email: 1,
                                password: 1,
                                authorizeTo: 1,
                                app_meta_details: 1
                              }
                            }
                          ]);
                        res.send({status : 200, message : "success", data: crypto.encrypt(JSON.stringify(app_meta_details[0]))})
                        return;
                    }else{
                        res.send({
                            status:404,
                            message : "No data found"
                        })
                        return;
                    }
                });
              }else{
                    res.status(401).send({ message: "Invalid user" });
                    return;
              }
        }).catch((err)=>{
                    res.status(400).send({ message: err });
                    return;
        })
    }else{
        res.send({
            status : 400,
            message : 'Invalid reqest'
        })
        return;
    }
})

router.post("/signin", async (req, res)=>{
    if(req.body){
        bcrypt.genSalt(saltRounds, function(err, salt) {
            bcrypt.hash(req.body.password, salt, function(err, hash) {
               req.body.password = hash;
               const authModel = new authentiaction(req.body);
               authModel.save().then((response)=>{
                   res.send({
                       status : 200,
                       message : 'success',
                       data : response
                   })
                   return;
               }).catch((err)=>{
                   if(err.code == 11000){
                       res.send({
                           status : 400,
                           message : 'Dublicate'
                       })
                       return;
                   }else{
                       res.send({
                           status : 500,
                           message : 'Invalid'
                       })
                       return;
                   }
               })
            });
        });
    }else{
        res.send({
            status : 400,
            message : 'Invalid'
        })
    }

    
})

module.exports = router;