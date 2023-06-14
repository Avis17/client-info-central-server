require('dotenv').config(); // Load environmental variables from .env file

const express = require('express');
const wfmEntitiesRouter = express.Router();
const mongoose = require('mongoose');
const crypto = require("../crypro");
const { ObjectId } = require('mongoose').Types;
const moment = require('moment');
const multer = require('multer');
const agg_options = { maxTimeMS: 30000 }; // Increase the timeout to 30 seconds

// Create a multer storage instance
// const storage = multer.memoryStorage();
const upload = multer();

// Create a connection pool
const poolSize = 10; // Maximum number of connections in the pool
const poolOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
};
// const DBURL = process.env.DB_URL_LOCAL || 'mongodb://127.0.0.1:27017/';
const DBURL = process.env.DB_URL_PROD || "mongodb+srv://pvadivelsiva:client-info-central2023@cluster0.ucunosj.mongodb.net/?retryWrites=true&w=majority";

const connectionPool = mongoose.createConnection(DBURL, poolOptions);


// Create an entity
wfmEntitiesRouter.post('/', async (req, res) => {
    try {
        const dbName = req.body.dbName;
        const collectionName = req.body.collectionName;
        const entitySchema = req.body.schema;
        const collectionData = req.body.collectionData;
        const db = connectionPool.useDb(dbName);
        const Entity = db.model(collectionName, new mongoose.Schema({}, { strict: false, timestamps: true }));
        const newEntity = new Entity(collectionData);
        try {
            const savedEntity = await newEntity.save();
            res.status(200).json({ status: 200, data: crypto.encrypt(JSON.stringify(savedEntity)) });
        } catch (error) {
            if (error.code === 11000) {
                // Duplicate key error
                return res.status(409).json({
                    status: 409,
                    message: error
                });
            }
            // Handle other errors
            res.status(400).json({ status: 400, message: error });
        }
    } catch (error) {
        res.status(500).json({
            status: 500, message: error
        });
    }
});

// Read all entities
wfmEntitiesRouter.post('/get-all-entities', async (req, res) => {
    try {
        const dbName = req.body.dbName;
        const collectionName = req.body.collectionName;
        const entitySchema = req.body.schema;
        var queryData = req.body.queryData || {}; // Assuming queryData is an object containing the query conditions
        if (queryData?.createdAt) {
            let startDate = new Date(queryData.createdAt.startDate);
            let endDate = new Date(queryData.createdAt.endDate);
            queryData.createdAt = {
                $gte: startDate,
                $lte: endDate
            };
        }
        const db = connectionPool.useDb(dbName);

        const Entity = db.model(collectionName, new mongoose.Schema({}, { strict: false, timestamps: true }));

        try {
            const resData = await Entity.find(queryData).sort({ createdAt: -1 });
            res.status(200).json({ status: 200, data: crypto.encrypt(JSON.stringify(resData)) });
        } catch (error) {
            console.log(error)
        }

    } catch (error) {
        res.status(500).json({ status: 500, message: error });
    }
});

wfmEntitiesRouter.put('/update-entity-by-id/:id', async (req, res) => {
    try {
        const dbName = req.body.dbName;
        const collectionName = req.body.collectionName;
        const entitySchema = req.body.schema;
        const collectionData = req.body.collectionData;
        const db = connectionPool.useDb(dbName);

        const Entity = db.model(collectionName, new mongoose.Schema({}, { strict: false, timestamps: true }));
        const resData = await Entity.findByIdAndUpdate(req.params.id, collectionData, { new: true });
        if (!resData) {
            return res.status(404).json({ status: 409, error: 'Entity not found' });
        }
        res.status(200).json({ status: 200, data: crypto.encrypt(JSON.stringify(resData)) });
    } catch (error) {
        res.status(500).json({ status: 500, message: error });
    }
});

// Delete an entity
wfmEntitiesRouter.post('/delete-entity-by-id/:id', async (req, res) => {
    try {
        const dbName = req.body.dbName;
        const collectionName = req.body.collectionName;
        const entitySchema = req.body.schema;
        const db = connectionPool.useDb(dbName);

        const Entity = db.model(collectionName, new mongoose.Schema({}, { strict: false, timestamps: true }));

        Entity.findByIdAndDelete(req.params.id)
            .then((deletedEntity) => {
                if (!deletedEntity) {
                    return res.status(404).json({ status: 404, error: 'Entity not found' });
                }
                res.status(200).json({ status: 200, message: 'Entity deleted successfully' });
            })
            .catch((error) => {
                console.log(error);
                res.status(500).json({ status: 500, message: 'Error deleting entity' });
            });
    } catch (error) {
        console.log(error)
        res.status(500).json({ status: 500, message: error });
    }
});

module.exports = wfmEntitiesRouter;
