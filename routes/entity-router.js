const express = require('express');
const entitiesRouter = express.Router();
const ConnectionManager = require('../utils/connection-manager');
const mongoose = require('mongoose');
const crypto = require("./crypro");

// Create an instance of the ConnectionManager
const connectionManager = new ConnectionManager();

// Create an entity
entitiesRouter.post('/', async (req, res) => {
  try {
    const dbName = req.body.dbName;
    const collectionName = req.body.collectionName;
    const entitySchema = req.body.schema;
    const collectionData = req.body.collectionData;
    const dbUrl = `mongodb://127.0.0.1:27017/${dbName}`;
    const options = {
      //   useNewUrlParser: true,
      //   useUnifiedTopology: true
    };
    connectionManager.getConnection(dbName, dbUrl, options).then(async (connection) => {
      const Entity = connection.model(collectionName, new mongoose.Schema({}, { strict: false, timestamps: true }));
      // console.log(Entity)
      const newEntity = new Entity(collectionData);
      try {
        const savedEntity = await newEntity.save();
        // Release the connection
        connectionManager.releaseConnection(dbName);
        res.status(200).json({ status: 200, data: crypto.encrypt(JSON.stringify(savedEntity)) });
      } catch (error) {
        // Handle specific error types
        connectionManager.releaseConnection(dbName);
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
    }).catch((err) => {
      res.status(500).json({
        status: 500, message: error
      });
    })

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
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true
    };
    const connection = await connectionManager.getConnection(dbName, dbUrl, options);
    const Entity = connection.model(collectionName, new mongoose.Schema(entitySchema, { timestamps: true }));
    const resData = await Entity.find(querydata);

    // Release the connection
    connectionManager.releaseConnection(dbName);

    res.status(200).json({ status: 200, data: crypto.encrypt(JSON.stringify(resData)) });
  } catch (error) {
    res.status(500).json({ status: 500, message:error });
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
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true
    };
    const connection = await connectionManager.getConnection(dbName, dbUrl, options);
    const Entity = connection.model(collectionName, new mongoose.Schema(entitySchema, { timestamps: true }));
    const resData = await Entity.findByIdAndUpdate(req.params.id, collectionData, { new: true });
    // Release the connection
    connectionManager.releaseConnection(dbName);
    if (!resData) {
      return res.status(404).json({ status: 409, error: 'Entity not found' });
    }
    res.status(200).json({ status: 200, data: crypto.encrypt(JSON.stringify(resData)) });
  } catch (error) {
    res.status(500).json({ status: 500, message:error });
  }
});

// Delete an entity
entitiesRouter.delete('/delete-entity-by-id/:id', async (req, res) => {
  try {
    const dbName = req.body.dbName;
    const collectionName = req.body.collectionName;
    const entitySchema = req.body.schema;
    const dbUrl = `mongodb://127.0.0.1:27017/${dbName}`;
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true
    };
    const connection = await connectionManager.getConnection(dbName, dbUrl, options);
    const Entity = connection.model(collectionName, new mongoose.Schema(entitySchema, { timestamps: true }));
    const resData = await Entity.findByIdAndDelete(req.params.id);
    // Release the connection
    connectionManager.releaseConnection(dbName);
    if (!resData) {
      return res.status(404).json({ status: 404, error: 'Entity not found' });
    }
    res.status(200).json({ status: 200, data: crypto.encrypt('Entity deleted successfully') });
  } catch (error) {
    res.status(500).json({ status: 500, message:error });
  }
});

module.exports = entitiesRouter;
