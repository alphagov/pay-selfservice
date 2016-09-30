"use strict";
var csrf = require('csrf'),
  logger = require('winston'),
  errorMsg = require('../utils/response.js').ERROR_MESSAGE,
  errorView = require('../utils/response.js').renderErrorView;


module.exports = function (req, res, next) {
  var csrfToken = req.body.csrfToken,
    session = req.session;
  var init = function () {
      if (session) {
        if (!session.csrfTokens) session.csrfTokens = [];
        if (!session.csrfSecret) return showNoCsrf();
        if (!csrfValid()) return showCsrfInvalid();

        session.csrfTokens.push(csrfToken);
        req.session.save( error => {
          if (error) return showSessionSaveError

          appendCsrf();
          next();
        });
      } else {
        showNoSession();
      }
    },


    csrfValid = function () {
      if (req.route.methods.get) return true;

      if (csrfUsed()) {
        logger.warn('CSRF secret has been already used');
        return false;
      }
      var verify = csrf().verify(session.csrfSecret, csrfToken);
      if (verify === false) return false;

      return true;
    },

    csrfUsed = function () {
      return session.csrfTokens.indexOf(csrfToken) !== -1;
    },

    showNoCsrf = function () {
      logger.warn('CSRF secret is not defined');
      errorView(req, res, errorMsg);
    },

    showNoSession = function () {
      logger.warn('Session is not defined');
      errorView(req, res, errorMsg);
    },

    showSessionSaveError = function (error) {
      logger.warn('CSRF secret can not be stored:', error);
      errorView(req, res, errorMsg);
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
