'use strict';
const errorView          = require('../utils/response.js').renderErrorView;
const Email              = require('../models/email.js');
const _                  = require('lodash');
const CORRELATION_HEADER = require('../utils/correlation_header.js').CORRELATION_HEADER;

module.exports = function (req, res, next) {
  return Email(req.headers[CORRELATION_HEADER]).get(req.account.gateway_account_id)
    .then(emailData => {
      req.account = _.merge(req.account, emailData);
      next();
    })
    .catch(() => errorView(req, res));
};
