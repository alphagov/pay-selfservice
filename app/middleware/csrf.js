"use strict";
var csrf = require('csrf'),
  logger = require('winston'),
  errorView = require('../utils/response.js').renderErrorView,

  csrfValid = function (req) {
    return  csrf().verify(req.session.csrfSecret, req.body.csrfToken);
  };

module.exports = function (req, res, next) {
  var session = req.session;

  if (!session) {
    logger.warn('Session is not defined');
    return errorView(req, res);
  }

  if (!session.csrfSecret) {
    logger.warn('CSRF secret is not defined for session');
    return errorView(req, res);
  }

  if (!req.route.methods.get && !csrfValid(req)) {
    logger.warn('CSRF secret provided is invalid');
    return errorView(req, res);
  }

  res.locals.csrf = csrf().create(session.csrfSecret);
  next();
};
