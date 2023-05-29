const router = require("express").Router();
const crypto = require("./crypro");
const AppCategoryModel = require("../models/appcategories");
const AppMetaModel = require("../models/appmeta");

router.get("/get-app-categories", (req, res) => {
    AppCategoryModel.find({}).then((result) => {
        if (result) {
            res.send({ status: 200, message: "success", data: crypto.encrypt(JSON.stringify(result)) })
            return;
        } else {
            res.send({
                status: 404,
                message: "No data found"
            })
            return;
        }
    }).catch((err) => {
        res.status(500).send({status : 500,  message: err });
        return;
    })
})

router.post("/add-app-new-category", (req, res) => {
    const appCategoryModel = new AppCategoryModel(req.body);
    appCategoryModel.save().then((response) => {
        res.send({
            status: 200,
            message: 'success',
            data: response
        })
        return;
    }).catch((err) => {
        if (err.code == 11000) {
            res.send({
                status: 401,
                message: 'Dublicate'
            })
            return;
        } else {
            res.send({
                status: 400,
                message: 'Invalid'
            })
            return;
        }
    })
})

router.post("/create-new-app-meta", (req, res) => {
    const appMetaModel = new AppMetaModel(req.body);
    appMetaModel.save().then((result) => {
        res.send({
            status: 200,
            message: 'success',
            data: crypto.encrypt(JSON.stringify(result))
        })
        return;
    }).catch((err) => {
        console.log(err)
        console.log(err.code)
        if (err.code == 11000) {
            res.send({
                status: 401,
                message: 'Dublicate'
            })
            return;
        } else {
            res.send({
                status: 400,
                message: 'Invalid'
            })
            return;
        }
    })
})

router.get("/get-app-metas", (req, res) => {
    AppMetaModel.find({}).then((result) => {
        if(result){
            res.send({
                status: 200,
                message: 'success',
                data: crypto.encrypt(JSON.stringify(result))
            })
            return;
        }
        else {
            res.send({
                status: 404,
                message: "No data found"
            })
            return;
        }
    }).catch((err) => {
        res.status(500).send({status : 500,  message: err });
        return;
    })
})

router.post("/delete-app-meta", (req, res) => {
    let deleteId = req.body._id;
    if (deleteId) {
        const appMetaModel = new AppMetaModel(req.body);
        appMetaModel.deleteOne({ _id: deleteId }).then((result) => {
            res.send({
                status: 200,
                message: 'success',
                data: crypto.encrypt(JSON.stringify(result))
            })
            return;
        }).catch((err) => {
            console.log(err)
            console.log(err.code)
            if (err.code == 11000) {
                res.send({
                    status: 400,
                    message: 'Dublicate'
                })
                return;
            } else {
                res.send({
                    status: 500,
                    message: 'Invalid'
                })
                return;
            }
        })
    }else{
        res.send({
            status: 400,
            message: 'Invalid'
        })
        return;
    }
})

module.exports = router;