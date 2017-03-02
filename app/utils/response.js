let logger = require('winston');
let _ = require('lodash');

const ERROR_MESSAGE = 'There is a problem with the payments platform';
const ERROR_VIEW = 'error';

/**
 * converts users permission array of form
 *
 * [
 * 'permission-type:operation',
 * ...
 *
 * ]
 *
 * to object of form
 *
 * {
 *   'permission_type_operation': true,
 *   ...
 *
 * }
 *
 * @param user
 * @returns {object}
 */
const getPermissionsForView = (user) => {
  let permissionMap = {};
  let userPermissions;
  if (user && user.permissions) {
    userPermissions = _.clone(user.permissions);
    _.forEach(userPermissions, x => {
      permissionMap[x.replace(/[-:]/g, '_')] = true;
    });
  }
  return permissionMap;
};

const hasMultipleGatewayAccounts = user => {
  let gatewayAccountIds = _.get(user, 'gatewayAccountIds', false);
  return gatewayAccountIds && gatewayAccountIds.length > 1;
};

function response(req, res, template, data) {
  let user = _.get(req, 'user', null);
  if (hasMultipleGatewayAccounts(req.user)) {
    data.multipleGatewayAccounts = true;
  }
  data.permissions = getPermissionsForView(req.user);
  data.navigation = data.navigation !== undefined ? data.navigation : true;
  render(req, res, template, data);
}

function errorResponse (req, res, msg) {
  if (!msg) msg = ERROR_MESSAGE;
  let correlationId = req.correlationId;
  let data = { 'message': msg };
  logger.error(`[${correlationId}] An error has occurred. Rendering error view -`, {errorMessage: msg});
  render(req, res, ERROR_VIEW, data);
}

function render(req, res, template, data){
  if (_.get(req, 'headers.accept') === "application/json") {
    res.setHeader('Content-Type', 'application/json');
    res.json(data);
  } else {
    res.render(template, data);
  }
}

function healthCheckResponse(accept, res, data) {
  res.setHeader('Content-Type', 'application/json');
  res.json(data);
}

module.exports = {
  response: response,
  healthCheckResponse: healthCheckResponse,
  renderErrorView: errorResponse
};
