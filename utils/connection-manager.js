const mongoose = require('mongoose');

class ConnectionManager {
  constructor() {
    this.connections = new Map();
  }

  async getConnection(dbName, dbUrl, options) {
    let connection = this.connections.get(dbName);

    if (!connection) {
      connection = await mongoose.createConnection(dbUrl, options);
      this.connections.set(dbName, connection);
      // console.log(`Connected to database: ${dbName}`);
    }

    return connection;
  }

  releaseConnection(dbName) {
    const connection = this.connections.get(dbName);

    if (connection) {
      // Close the connection
      connection.close();
      // Remove the connection from the cache
      this.connections.delete(dbName);
      // console.log(`Connection closed for database: ${dbName}`);
    }
  }
}

module.exports = ConnectionManager;