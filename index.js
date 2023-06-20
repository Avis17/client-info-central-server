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
  });
  app.get('/reset-password', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'resetpassword.html'));
  });

  app.use((req, res, next) => {
    if(req.path === '/dashboard' || req.path === '/forgot-password') {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }else {
      app.use(authMiddleware);
      next(); // Pass control to the next middleware/route handler
    }
  });

  app.use('/app-meta-creation', appMetaCreaton);
  app.use('/app/wfm/v1/entities', wfmEntityRouter);
  app.use('/entities', entitiesRouter);

  app.listen(PORT, () => {
    console.log(`Worker ${process.pid} is running on PORT ${PORT}`);
  });
}
