const express = require('express');
const entitiesRouter = express.Router();
const mongoose = require('mongoose');
const crypto = require("./crypro");
var DBURL = "mongodb+srv://pvadivelsiva:client-info-central2023@cluster0.ucunosj.mongodb.net/"

// Create an entity
entitiesRouter.post('/', async (req, res) => {
  try {
    const dbName = req.body.dbName;
    const collectionName = req.body.collectionName;
    const entitySchema = req.body.schema;
    const collectionData = req.body.collectionData;
    const dbUrl = `mongodb://127.0.0.1:27017/${dbName}`;
    DBURL = DBURL+dbName+"?retryWrites=true&w=majority";
    const options = {
      //   useNewUrlParser: true,
      //   useUnifiedTopology: true
    };
    const connection = mongoose.createConnection(DBURL, options);
    const db = connection.useDb(dbName);
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
entitiesRouter.post('/get-all-entities', async (req, res) => {
  try {
    const dbName = req.body.dbName;
    const collectionName = req.body.collectionName;
    const entitySchema = req.body.schema;
    const querydata = req.body.queryData;
    const dbUrl = `mongodb://127.0.0.1:27017/${dbName}`;
    DBURL = DBURL+dbName+"?retryWrites=true&w=majority";
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true
    };
    const connection = mongoose.createConnection(DBURL, options);
    const db = connection.useDb(dbName);
    const Entity = db.model(collectionName, new mongoose.Schema({}, { strict: false, timestamps: true }));
    const resData = await Entity.find(querydata);
    res.status(200).json({ status: 200, data: crypto.encrypt(JSON.stringify(resData)) });
  } catch (error) {
    res.status(500).json({ status: 500, message: error });
  }
});

// Update an entity
entitiesRouter.put('/update-entity-by-id/:id', async (req, res) => {
  try {
    const dbName = req.body.dbName;
    const collectionName = req.body.collectionName;
    const entitySchema = req.body.schema;
    const collectionData = req.body.collectionData;
    const dbUrl = `mongodb://127.0.0.1:27017/${dbName}`;
    DBURL = DBURL+dbName+"?retryWrites=true&w=majority";

    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true
    };
    const connection = mongoose.createConnection(DBURL, options);
    const db = connection.useDb(dbName);
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
entitiesRouter.delete('/delete-entity-by-id/:id', async (req, res) => {
  try {
    const dbName = req.body.dbName;
    const collectionName = req.body.collectionName;
    const entitySchema = req.body.schema;
    const dbUrl = `mongodb://127.0.0.1:27017/${dbName}`;
    DBURL = DBURL+dbName+"?retryWrites=true&w=majority";

    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true
    };
    const connection = mongoose.createConnection(DBURL, options);
    const db = connection.useDb(dbName);
    const Entity = db.model(collectionName, new mongoose.Schema({}, { strict: false, timestamps: true }));
    const resData = await Entity.findByIdAndDelete(req.params.id);
    if (!resData) {
      return res.status(404).json({ status: 404, error: 'Entity not found' });
    }
    res.status(200).json({ status: 200, data: crypto.encrypt('Entity deleted successfully') });
  } catch (error) {
    res.status(500).json({ status: 500, message: error });
  }
});

module.exports = entitiesRouter;
