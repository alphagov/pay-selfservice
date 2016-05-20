"use strict";
var csrf = require('csrf'),
  logger = require('winston'),
  errorMsg = require('../utils/response.js').ERROR_MESSAGE,
  errorView = require('../utils/response.js').renderErrorView;


module.exports = function (req, res, next) {
  var csrfToken = req.body.csrfToken,
    session = req.session;
  var init = function () {
      if (!sessionAvailable()) return showNoSession();
      if (!csrfValid()) return showCsrfInvalid();

      appendCsrf();
      next();
    },

    sessionAvailable = function () {
      return session && session.csrfSecret;
    },

    showNoSession = function () {
      logger.warn('CSRF secret is not defined');
      errorView(req, res, errorMsg);
    },

    csrfValid = function () {
      if (req.route.methods.get) return true;
      if (!session.csrfTokens) session.csrfTokens = [];


      if (csrfUsed()) {
        logger.warn('CSRF secret has been already used');
        return false;
      }
      var verify = csrf().verify(session.csrfSecret, csrfToken);
      if (verify === false) return false;

      session.csrfTokens.push(csrfToken);
      return true;
    },

    csrfUsed = function () {
      return session.csrfTokens.indexOf(csrfToken) !== -1;
    },

    showCsrfInvalid = function () {
      logger.warn('CSRF secret provided is invalid');
      errorView(req, res, errorMsg);
    },

    appendCsrf = function () {
      res.locals.csrf = csrf().create(session.csrfSecret);
    };

  init();
};
