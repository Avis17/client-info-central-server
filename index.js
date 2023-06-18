const cluster = require('cluster');
const os = require('os');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const authenticationRoute = require('./routes/authentication');
const appMetaCreaton = require('./routes/app-meta-creation');
const wfmEntityRouter = require("./routes/workforce/wfm-entity")
const authMiddleware = require('./middlewares/authMiddleware');
const PORT = process.env.PORT || 2000;
const mongo = require('./utils/dao');
const path = require('path');
const entitiesRouter = require('./routes/entity-router');
const mongoose = require('mongoose');
const { Readable } = require('stream');

const numCPUs = os.cpus().length;

// Check if the current process is the master process
if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    // Restart the worker process if it exits
    cluster.fork();
  });
} else {
  // Workers share the TCP connection in this case
  app.use(cors());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(authenticationRoute);

  mongo
    .connect()
    .then((result) => {
      console.log(result);
    })
    .catch((err) => {
      console.log(err);
    });

  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  app.get('/files/:dbName/:collectionName/:entityId/download', async (req, res) => {
    try {
      const dbName = req.params.dbName;
      const collectionName = req.params.collectionName;
      const entityId = req.params.entityId;

      // Connect to the MongoDB database
      const connection = mongoose.createConnection(`mongodb://127.0.0.1:27017/${dbName}`);
      const db = connection.useDb(dbName);
      const Entity = db.model(collectionName, new mongoose.Schema({}, { strict: false, timestamps: true }));

      // Retrieve the entity from the collection using the entityId
      const entity = await Entity.findById({ _id: entityId });

      if (!entity) {
        return res.status(404).json({ status: 404, message: 'Entity not found' });
      }

      const fileData = entity.file;

      // Set the appropriate headers for the file download
      res.set({
        'Content-Disposition': `attachment; filename=${fileData.name}`,
        'Content-Type': fileData.contentType,
      });

      // Send the file buffer as the response
      res.send(fileData.data.buffer);
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ status: 500, message: 'Internal server error' });
    }
  });

  app.use((req, res, next) => {
    if (req.path === '/dashboard') {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }else {
      next(); // Pass control to the next middleware/route handler
    }
  });

  app.use(authMiddleware);
  app.use('/app-meta-creation', appMetaCreaton);
  app.use('/app/wfm/v1/entities', wfmEntityRouter);
  app.use('/entities', entitiesRouter);
  
  app.listen(PORT, () => {
    console.log(`Worker ${process.pid} is running on PORT ${PORT}`);
  });
}
