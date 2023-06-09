const express = require('express');
const entitiesRouter = express.Router();
const mongoose = require('mongoose');
const crypto = require("./crypro");
const { ObjectId } = require('mongoose').Types;
const moment = require('moment');
const multer = require('multer');

// Create a multer storage instance
// const storage = multer.memoryStorage();
const upload = multer();

var DBURL = "mongodb+srv://pvadivelsiva:client-info-central2023@cluster0.ucunosj.mongodb.net/"

// Create an entity
entitiesRouter.post('/', async (req, res) => {
  try {
    const dbName = req.body.dbName;
    const collectionName = req.body.collectionName;
    const entitySchema = req.body.schema;
    const collectionData = req.body.collectionData;
    // const DBURL = `mongodb://127.0.0.1:27017/${dbName}`;
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

entitiesRouter.post('/upload-invoice', upload.single('file'), async (req, res) => {
  try {
    const dbName = req.body.dbName;
    const collectionName = req.body.collectionName;
    const entitySchema = req.body.schema;
    const collectionData = JSON.parse(req.body.collectionData);
    // const DBURL = `mongodb://127.0.0.1:27017/${dbName}`;
    DBURL = DBURL+dbName+"?retryWrites=true&w=majority";
    const options = {};
    const connection = mongoose.createConnection(DBURL, options);
    const db = connection.useDb(dbName);
    const Entity = db.model(collectionName, new mongoose.Schema({}, { strict: false, timestamps: true }));
    // Check if a file was uploaded
    if (!req.file) {
      return res.status(400).json({ status: 400, message: 'No file uploaded' });
    }
    // Create a new entity with the file data
    const newEntity = new Entity({
      ...collectionData,
      file: {
        name: req.file.originalname,
        data: req.file.buffer,
        contentType: req.file.mimetype
      }
    });
    try {
      const savedEntity = await newEntity.save();
      // Get the ObjectId of the saved entity
      const entityId = savedEntity._id;
      // Generate the file URL
      const fileURL = `/files/${entityId}/invoice.pdf`; // Customize the file URL path as needed
      res.status(200).json({ status: 200, data: crypto.encrypt(JSON.stringify(savedEntity)), fileURL });
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
    res.status(500).json({ status: 500, message: error });
  }
});

// Backend code to handle file download



// Read all entities
entitiesRouter.post('/get-all-entities', async (req, res) => {
  try {
    const dbName = req.body.dbName;
    const collectionName = req.body.collectionName;
    const entitySchema = req.body.schema;
    var queryData = req.body.queryData || {}; // Assuming queryData is an object containing the query conditions
    // const DBURL = `mongodb://127.0.0.1:27017/${dbName}`;
    DBURL = DBURL+dbName+"?retryWrites=true&w=majority";
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true
    };
    if (queryData?.createdAt) {
      let startDate = new Date(queryData.createdAt.startDate);
      let endDate = new Date(queryData.createdAt.endDate);
      queryData.createdAt = {
        $gte: startDate,
        $lte: endDate
      };
    }
    const connection = mongoose.createConnection(DBURL, options);
    const db = connection.useDb(dbName);
    const Entity = db.model(collectionName, new mongoose.Schema({}, { strict: false, timestamps: true }));
   
    try{
      const resData = await Entity.find(queryData).sort({ _id: -1 });
      res.status(200).json({ status: 200, data: crypto.encrypt(JSON.stringify(resData)) });
    }catch (error){
      console.log(error)
    }

  } catch (error) {
    res.status(500).json({ status: 500, message: error });
  }
});

entitiesRouter.post('/get-all-aggregates-entities', async (req, res) => {
  try {
    const dbName = req.body.dbName;
    const collectionName = req.body.collectionName;
    var queryData = req.body.queryData || {}; // Assuming queryData is an object containing the query conditions
    if (queryData?.createdAt) {
      queryData = {
        createdAt: {
          $gte: new Date(queryData.createdAt.startDate),
          $lte: new Date(queryData.createdAt.endDate)
        }
      }
    }
    // const DBURL = `mongodb://127.0.0.1:27017/${dbName}`;
    DBURL = DBURL+dbName+"?retryWrites=true&w=majority";

    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true
    };
    const connection = mongoose.createConnection(DBURL, options);
    const db = connection.useDb(dbName);
    const Customer = db.model('customers', new mongoose.Schema({}, { strict: false, timestamps: true }));
    const Invoice = db.model('invoices', new mongoose.Schema({}, { strict: false, timestamps: true }));


    const aggregationPipeline = [
      {
        $match: queryData // Add $match stage to filter documents based on queryData
      },
      {
        $lookup: {
          from: "invoices",
          localField: "phone",
          foreignField: "phone",
          as: "invoicesList"
        }
      },
      {
        $unwind: "$invoicesList"
      },
      {
        $group: {
          _id: "$_id",
          customer: { $first: "$$ROOT" },
          invoicesList: { $push: "$invoicesList" }
        }
      },
      {
        $group: {
          _id: null,
          customersList: { $push: "$customer" },
          invoicesList: { $push: "$invoicesList" },
          products: { $push: "$invoicesList.products" },
          totalCustomers: { $sum: 1 },
          totalInvoices: { $sum: { $size: "$invoicesList" } },
          totalRevenue: { $sum: { $sum: "$invoicesList.finalTotal" } }
        }
      },
      {
        $unwind: "$customersList"
      },
      {
        $sort: { "customersList.createdAt": -1 } // Sort customers by the "createdAt" field in descending order
      },
      {
        $group: {
          _id: null,
          customersList: { $push: "$customersList" },
          invoicesList: { $first: "$invoicesList" },
          products: { $first: "$products" },
          totalCustomers: { $first: "$totalCustomers" },
          totalInvoices: { $first: "$totalInvoices" },
          totalRevenue: { $first: "$totalRevenue" }
        }
      },
      {
        $project: {
          _id: 0,
          customersList: 1,
          invoicesList: 1,
          products: 1,
          totalCustomers: 1,
          totalInvoices: 1,
          totalRevenue: 1
        }
      }
    ];


    const customersData = await Customer.aggregate(aggregationPipeline);
    const result = {
      customersList: customersData[0]?.customersList || [],
      invoicesList: customersData[0]?.invoicesList || [],
      products: customersData[0]?.products || [],
      totalCustomers: customersData[0]?.totalCustomers || 0,
      totalInvoices: customersData[0]?.totalInvoices || 0,
      totalRevenue: customersData[0]?.totalRevenue || 0
    };

    res.status(200).json({ status: 200, data: crypto.encrypt(JSON.stringify(result)) });
  } catch (error) {
    res.status(500).json({ status: 500, message: error });
  }
});

entitiesRouter.post('/get-customer-services-entities', async (req, res) => {
  try {
    const dbName = req.body.dbName;
    const collectionName = req.body.collectionName;
    var queryData = req.body.queryData || {}; // Assuming queryData is an object containing the query conditions

    if (queryData?.createdAt) {
      let startDate = new Date(queryData.createdAt.startDate);
      let endDate = new Date(queryData.createdAt.endDate);
      // if (startDate.toDateString() === endDate.toDateString()) {
      // If both dates are the same, add 1 day to the end date
      // endDate.setDate(endDate.getDate() + 1);
      // }  
      queryData.createdAt = {
        $gte: startDate,
        $lte: endDate
      };
    }

    // const DBURL = `mongodb://127.0.0.1:27017/${dbName}`;
    DBURL = DBURL+dbName+"?retryWrites=true&w=majority";

    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true
    };
    const connection = mongoose.createConnection(DBURL, options);
    const db = connection.useDb(dbName);
    const Customer = db.model('customers', new mongoose.Schema({}, { strict: false, timestamps: true }));
    const Invoice = db.model('invoices', new mongoose.Schema({}, { strict: false, timestamps: true }));

    // Execute the two queries simultaneously
    const [customers, invoices] = await Promise.all([
      Customer.aggregate([
        { $match: queryData },
        { $sort: { createdAt: -1 } }, // Sort customers in descending order based on createdAt field
        { $group: { _id: null, customers: { $push: "$$ROOT" }, noOfCustomers: { $sum: 1 } } },
        { $project: { _id: 0, customers: 1, noOfCustomers: 1 } },
      ]).exec(),
      Invoice.aggregate([
        { $match: queryData },
        {
          $group: {
            _id: null,
            invoicesList: { $push: "$$ROOT" },
            productsList: { $push: "$products" },
            noOfProducts: { $sum: "$products" },
            totalRevenue: { $sum: "$finalTotal" }
          }
        },
        { $project: { _id: 0, invoicesList: 1, productsList: 1, noOfProducts: 1, totalRevenue: 1 } }
      ]).exec()
    ]);

    // Construct the final response
    const result = {
      customers: customers[0]?.customers || [],
      noOfCustomers: customers[0]?.noOfCustomers || 0,
      invoicesList: invoices[0]?.invoicesList || [],
      noOfProducts: invoices[0]?.noOfProducts || 0,
      totalRevenue: invoices[0]?.totalRevenue || 0
    };

    res.status(200).json({ status: 200, data: crypto.encrypt(JSON.stringify(result)) });
  } catch (error) {
    res.status(500).json({ status: 500, message: error });
  }
});

entitiesRouter.post('/get-chart-datas-for-services', async (req, res) => {
  try {
    const dbName = req.body.dbName;
    const collectionName = req.body.collectionName;
    let queryData = req.body.queryData; // Assuming queryData is an object containing the query conditions

    if (!queryData.createdAt || !queryData.createdAt.startDate || !queryData.createdAt.endDate) {
      throw new Error("Invalid query data. Missing startDate or endDate.");
    }

    const startDate = new Date(queryData.createdAt.startDate);
    const endDate = new Date(queryData.createdAt.endDate);

    if (isNaN(startDate) || isNaN(endDate)) {
      throw new Error("Invalid startDate or endDate format.");
    }

    // const DBURL = `mongodb://127.0.0.1:27017/${dbName}`;
    DBURL = DBURL+dbName+"?retryWrites=true&w=majority";

    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true
    };
    const connection = mongoose.createConnection(DBURL, options);
    const db = connection.useDb(dbName);
    const Invoice = db.model('invoices', new mongoose.Schema({}, { strict: false, timestamps: true }));

    // Query to get the count of invoices generated on each day
    const invoiceCountPipeline = [
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lte: endDate
          }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            dayOfWeek: { $dayOfWeek: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: {
          count: -1
        }
      },
      {
        $limit: 1
      }
    ];

    try {
      const invoiceCountData = await Invoice.aggregate(invoiceCountPipeline).exec();
      const highestInvoiceDayOfWeek = invoiceCountData.length > 0 ? invoiceCountData[0]._id.dayOfWeek : null;

      // Calculate idle days
      const idleDaysPipeline = [
        {
          $match: {
            createdAt: {
              $gte: startDate,
              $lte: endDate
            }
          }
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
            }
          }
        }
      ];

      const invoiceDates = await Invoice.aggregate(idleDaysPipeline).exec();
      const totalDays = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
      const invoiceDatesSet = new Set(invoiceDates.map((invoice) => invoice._id.date));
      let idleDays = 0;

      for (let i = 0; i < totalDays; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + i);
        const currentDateStr = currentDate.toISOString().split('T')[0];

        if (!invoiceDatesSet.has(currentDateStr)) {
          idleDays++;
        }
      }

      res.status(200).json({ status: 200, data: crypto.encrypt(JSON.stringify({ idleDays, highestInvoiceDayOfWeek })) });
    } catch (error) {
      res.status(500).json({ status: 500, message: error.message });
    }
  } catch (error) {
    res.status(500).json({ status: 500, message: error.message });
  }
});

entitiesRouter.post('/get-expense-profit-datas', async (req, res) => {
  try {
    const dbName = req.body.dbName;
    const collectionName = req.body.collectionName;
    const queryData = req.body.queryData;

    const startDate = queryData?.createdAt?.startDate ? new Date(queryData.createdAt.startDate) : null;
    const endDate = queryData?.createdAt?.endDate ? new Date(queryData.createdAt.endDate) : null;

    // const DBURL = `mongodb://127.0.0.1:27017/${dbName}`;
    DBURL = DBURL+dbName+"?retryWrites=true&w=majority";

    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true
    };
    const connection = mongoose.createConnection(DBURL, options);
    const db = connection.useDb(dbName);
    const Expense = db.model('expenses', new mongoose.Schema({}, { strict: false, timestamps: true }));
    const Invoice = db.model('invoices', new mongoose.Schema({}, { strict: false, timestamps: true }));

    const expensesPipeline = [];
    const invoicesPipeline = [];

    if (startDate && endDate) {
      expensesPipeline.push({
        $match: {
          createdAt: {
            $gte: startDate,
            $lte: endDate
          }
        }
      });

      invoicesPipeline.push({
        $match: {
          createdAt: {
            $gte: startDate,
            $lte: endDate
          }
        }
      });
    }

    expensesPipeline.push({
      $group: {
        _id: null,
        totalExpenses: { $sum: "$expense_price" }
      }
    });

    invoicesPipeline.push({
      $group: {
        _id: null,
        sumOfFinalTotal: { $sum: "$finalTotal" }
      }
    });

    const [expensesResult, invoicesResult] = await Promise.all([
      Expense.aggregate(expensesPipeline),
      Invoice.aggregate(invoicesPipeline)
    ]);

    const totalExpenses = expensesResult.length > 0 ? expensesResult[0].totalExpenses : 0;
    const netProfit = invoicesResult.length > 0 ? invoicesResult[0].sumOfFinalTotal - totalExpenses : 0;

    res.status(200).json({ status: 200, data: crypto.encrypt(JSON.stringify({ totalExpenses, netProfit })) });
  } catch (error) {
    res.status(500).json({ status: 500, message: error.message });
  }
});

entitiesRouter.put('/update-entity-by-id/:id', async (req, res) => {
  try {
    const dbName = req.body.dbName;
    const collectionName = req.body.collectionName;
    const entitySchema = req.body.schema;
    const collectionData = req.body.collectionData;
    // const DBURL = `mongodb://127.0.0.1:27017/${dbName}`;
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
entitiesRouter.post('/delete-entity-by-id/:id', async (req, res) => {
  try {
    const dbName = req.body.dbName;
    const collectionName = req.body.collectionName;
    const entitySchema = req.body.schema;
    // const DBURL = `mongodb://127.0.0.1:27017/${dbName}`;
    DBURL = DBURL+dbName+"?retryWrites=true&w=majority";
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true
    };
    const connection = mongoose.createConnection(DBURL, options);
    const db = connection.useDb(dbName);
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

module.exports = entitiesRouter;
