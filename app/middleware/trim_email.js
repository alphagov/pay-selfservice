"use strict";
// FINE
module.exports = function (req, res, next) {
  if (!req.body.email) return next();
  req.body.email = req.body.email.trim();
  next();
};
