'use strict'
module.exports = function (req, res, next) {
  if (!req.body.username) return next()
  req.body.username = req.body.username.trim()
  next()
}
