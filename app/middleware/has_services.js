const logger    = require('winston');
const _         = require('lodash');
const paths = require('../paths');

module.exports = function (req, res, next) {

  const serviceRoles = _.get(req, "user.serviceRoles", []);
  if (req.url !== paths.serviceSwitcher.index && serviceRoles.length === 0) {
    logger.info('User does not belong to any service user_external_id=', _.get(req, "user.externalId"));
    res.redirect(paths.serviceSwitcher.index);
  } else {
    next()
  }
};
