const logger    = require('winston');
const _         = require('lodash');
const errorView = require('../utils/response.js').renderErrorView;

module.exports = function (req, res, next) {

  const services = _.get(req, "user.services");

  if ((!services) || (services.length === 0)) {
    logger.info('User does not belong to any service user_external_id=', _.get(req, "user.externalId"));
    return errorView(req, res, "User does not belong to any service", 200);
  }

  return next();
};
