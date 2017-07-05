const _ = require('lodash');
const {renderErrorView} = require('../utils/response.js');
/**
 * This middleware resolves the current service in context
 *
 */
module.exports = function (req, res, next) {
  const externalServiceId = req.params.externalServiceId;
  const gatewayAccountId = _.get(req, 'gateway_account.currentGatewayAccountId');

  if (externalServiceId) {
    req.service = _.get(req.user.serviceRoles.find(serviceRole => serviceRole.service.externalId === externalServiceId), 'service');
  } else if (gatewayAccountId) {
    req.service = _.get(req.user.serviceRoles.find(serviceRole => serviceRole.service.gatewayAccountIds.includes(gatewayAccountId)), 'service')
  }
  if(!req.service) {
    return renderErrorView(req,res, 'You do not have the rights to access this service.');
  }

  next()
};
