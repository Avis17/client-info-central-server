// const express = require("express")
// const app = express()
// const bodyParser = require("body-parser");
// const cors = require("cors")
// const authenticationRoute = require("./routes/authentication");
// const appMetaCreaton = require("./routes/app-meta-creation");
// const authMiddleware = require("./middlewares/authMiddleware");
// const PORT = process.env.PORT || 2000;
// const mongo = require("./utils/dao");
// const path = require('path');
// const entitiesRouter = require('./routes/entity-router');

// // middlewares
// app.use(cors())
// app.use(bodyParser({extended:true}))
// app.use(express.static(path.join(__dirname, 'public'))); 
// app.use(authenticationRoute)

// mongo.connect().then((result)=>{
//     console.log(result)
// }).catch((err)=>{
//     console.log(err)
// })

// app.get("/", (req, res)=>{
//     res.sendFile(path.join(public, 'index.html'));
// })
// app.use(authMiddleware);
// app.use("/app-meta-creation", appMetaCreaton)
// app.use('/entities', entitiesRouter);

// app.listen(PORT, ()=>{
//     console.log("CLC server is running on PORT "+PORT)
// })


// for multiple request handling code

const cluster = require('cluster');
const os = require('os');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const authenticationRoute = require('./routes/authentication');
const appMetaCreaton = require('./routes/app-meta-creation');
const authMiddleware = require('./middlewares/authMiddleware');
const PORT = process.env.PORT || 2000;
const mongo = require('./utils/dao');
const path = require('path');
const entitiesRouter = require('./routes/entity-router');

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
  });
} else {
  // Workers share the TCP connection in this case
  app.use(cors());
  app.use(bodyParser({ extended: true }));
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
    res.sendFile(path.join(public, 'index.html'));
  });
  app.use(authMiddleware);
  app.use('/app-meta-creation', appMetaCreaton);
  app.use('/entities', entitiesRouter);

  app.listen(PORT, () => {
    console.log(`Worker ${process.pid} is running on PORT ${PORT}`);
  });
}
