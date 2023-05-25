
const router = require("express").Router();
const bcrypt = require('bcrypt');
const saltRounds = 10;
const jwt = require('jsonwebtoken');
const secretKey = 'clent-info-central-secret-key'; 

const authentiaction = require("../models/credentials");

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
                        await user.save()
                        res.send({status : 200, message : "success", data: user})
                        return;
                    }else{
                        res.send({
                            status:404,
                            message : "Invalid"
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
            message : 'Invalid'
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