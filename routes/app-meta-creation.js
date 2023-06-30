const router = require("express").Router();
const crypto = require("./crypro");
const AppCategoryModel = require("../models/appcategories");
const AppMetaModel = require("../models/appmeta");
const mongoose = require('mongoose');
const poolOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  };
// const DBURL = process.env.DB_URL_LOCAL || 'mongodb://127.0.0.1:27017/';
const DBURL = process.env.DB_URL_PROD || "mongodb+srv://pvadivelsiva:client-info-central2023@cluster0.ucunosj.mongodb.net/cic?retryWrites=true&w=majority";

const connectionPool = mongoose.createConnection(DBURL, poolOptions);
const DBNAME = "cic";

router.get("/get-app-categories", (req, res) => {
    AppCategoryModel.find({}).sort({ _id: -1 }).then((result) => {
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
        res.status(500).send({ status: 500, message: err });
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
})


router.post("/create-new-app-meta", (req, res) => {

    const db = connectionPool.useDb(DBNAME);
    const Entity = db.model('app_meta_objects', new mongoose.Schema({}, { strict: false, timestamps: true }));
    const newEntity = new Entity(req.body);
    newEntity.save().then((result) => {
        res.send({
            status: 200,
            message: 'success',
            data: crypto.encrypt(JSON.stringify(result))
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
})


router.post("/update-app-meta-by-id", (req, res) => {
    const appMetaModel = req.body.data;
    const filter = { _id: req.body._id };
    const db = connectionPool.useDb(DBNAME);
    const Entity = db.model('app_meta_objects', new mongoose.Schema({}, { strict: false, timestamps: true }));

    Entity.findOneAndUpdate(filter, appMetaModel, { new: true })
        .then((result) => {
            res.send({
                status: 200,
                message: 'success',
                data: crypto.encrypt(JSON.stringify(result))
            });
        })
        .catch((err) => {
            if (err.code === 11000) {
                res.send({
                    status: 409,
                    message: err.message
                });
            } else {
                res.send({
                    status: 500,
                    message: err.message
                });
            }
        });
});



router.post("/get-app-metas", (req, res) => {
    const querydata = req.body.query;
    const db = connectionPool.useDb(DBNAME);
    const Entity = db.model('app_meta_objects', new mongoose.Schema({}, { strict: false, timestamps: true }));
    Entity.find(querydata).sort({ _id: -1 }).then((result) => {
        if (result) {
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
        res.status(500).send({ status: 500, message: err });
        return;
    })
})

router.post("/delete-app-meta", (req, res) => {
    let deleteId = req.body._id;
    if (deleteId) {
        const db = connectionPool.useDb(DBNAME);
        const Entity = db.model('app_meta_objects', new mongoose.Schema({}, { strict: false, timestamps: true }));
        Entity.deleteOne({ _id: deleteId }).then((result) => {
            res.send({
                status: 200,
                message: 'success',
                data: crypto.encrypt(JSON.stringify(result))
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
    } else {
        res.send({
            status: 400,
            message: 'Invalid'
        })
        return;
    }
})

module.exports = router;