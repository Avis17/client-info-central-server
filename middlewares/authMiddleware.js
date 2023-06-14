// authMiddleware.js

const jwt = require('jsonwebtoken');
const secretKey = 'clent-info-central-2023-secret-key-siva'; 

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ message: 'No token provided.' });
    // return res.redirect('/');
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Failed to authenticate token.' });
    }

    // Token is valid. You can perform authorization checks here based on the decoded token.
    req.user = decoded;
    next();
  });
};

module.exports = authMiddleware;
