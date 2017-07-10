const logger    = require('winston');
const _         = require('lodash');
const errorView = require('../utils/response.js').renderErrorView;

module.exports = function (req, res, next) {

  const serviceRoles = _.get(req, "user.serviceRoles");

  if ((!serviceRoles) || (serviceRoles.length === 0)) {
    logger.info('User does not belong to any service user_external_id=', _.get(req, "user.externalId"));
    return errorView(req, res, "This user does not belong to any service. Ask your service administrator to invite you to GOV.UK Pay.", 200);
  }

  return next();
};
