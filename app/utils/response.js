var logger = require('winston');
var _ = require('lodash');

const ERROR_MESSAGE = 'There is a problem with the payments platform';
const NOT_FOUND = 'Page cannot be found';

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

function response(req, res, template, data) {
  data.permissions = getPermissionsForView(req.user);
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
  ERROR_MESSAGE: ERROR_MESSAGE,
  ERROR_VIEW: 'error',
  PAGE_NOT_FOUND_ERROR_MESSAGE: NOT_FOUND,

  response: response,
  healthCheckResponse: healthCheckResponse,

  renderErrorView: function (req, res, msg) {
    if (!msg) msg = ERROR_MESSAGE;
    let correlationId = req.correlationId;
    let data = { 'message': msg };
    logger.error(`[${correlationId}] An error has occurred. Rendering error view -`, {errorMessage: msg});
    if (_.get(req, 'headers.accept') === "application/json") {
      res.setHeader('Content-Type', 'application/json');
      res.json(data);
    } else {
      res.render('error', data);
    }
  }
};
