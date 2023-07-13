const jwt = require('jsonwebtoken');
const secretKey = process.env.DB_SECRET_KEY;
const authentiaction = require("../models/credentials");

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ message: 'No token provided.' });
  }

  jwt.verify(token, secretKey, async (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Failed to authenticate token.' });
    }
    // Token is valid. You can perform authorization checks here based on the decoded token.
    const { email } = decoded;
    try {
      const user = await authentiaction.findOne({ email: email });

      if (!user || user.token !== token) {
        return res.status(401).json({ message: 'Invalid token.' });
      }
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(500).json({                  
        status: 500,
        message: error.message 
      });
    }
  });
};

module.exports = authMiddleware;
