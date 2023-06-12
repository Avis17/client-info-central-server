const mongoose = require('mongoose');

// Define the connection options
const dbOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true
};

// Store the connections in an object or map
const connections = {};

// Example request handling
const connection = (async (dbName) => {
    try {
        // Check if a connection for the requested database already exists
        if (!connections[dbName]) {
            const dbUrl = `mongodb://localhost:27017/${dbName}`; // Construct the database URL dynamically
            connections[dbName] = mongoose.createConnection(dbUrl, dbOptions);
            console.log(`Connected to database: ${dbName}`);
        }

        // Use the connection for the requested database
        // const Model = connections[dbName].model('ModelName', new mongoose.Schema({ /* Define schema here */ }));
        // const data = await Model.find({ /* Query for the requested database */ });

        // Send the response
        // res.json(data);
        return connections[dbName]
    } catch {
        return "connection err"
    }
})


const fs = require('fs');
const mongoose = require('mongoose');

const configFile = 'utils/config.json';

// Function to save connection details to the configuration file
function saveConnectionDetails(dbName, dbUrl) {
  const config = loadConfig();
    if (!config[dbName]) {
        config[dbName] = `mongodb://localhost:27017/${dbName}`; // Construct the database URL dynamically
        fs.writeFileSync(configFile, JSON.stringify(config));
    }
}

// Function to load the configuration file
function loadConfig() {
  try {
    const data = fs.readFileSync(configFile);
    return JSON.parse(data);
  } catch (error) {
    // Handle file not found or invalid JSON
    return {};
  }
}

// Function to establish connections using the saved connection details
function establishConnections() {
  const config = loadConfig();
  for (const dbName in config) {
    const dbUrl = config[dbName];
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true
    };
    const connection = mongoose.createConnection(dbUrl, options);
    console.log(`Connected to ${dbName} using ${dbUrl}`);
  }
}

// Example usage
saveConnectionDetails('db1', 'mongodb://localhost:27017/db1');
saveConnectionDetails('db2', 'mongodb://localhost:27017/db2');
establishConnections();



module.export = connection