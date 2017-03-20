let response            = require('../utils/response.js').response;
let userService         = require('../services/user_service.js');
let renderErrorView     = require('../utils/response.js').renderErrorView;
let logger = require('winston');

const CORRELATION_HEADER  = require('../utils/correlation_header.js').CORRELATION_HEADER;

let mapByRoles = function (users, currentUser) {
  let userRolesMap = {'admin': [], 'view-only': [], 'view-and-refund': []};
  users.map((user) => {
    if (user.role.name in userRolesMap) {
      let mappedUsername = {username: user.username};
      if (currentUser.email == user.email) {
        mappedUsername.is_current = true
      }
      userRolesMap[user.role.name].push(mappedUsername);
    }
  });
  return userRolesMap;
};

module.exports.index = function (req, res) {

  let correlationId = req.headers[CORRELATION_HEADER] || '';

  let onSuccess = function (data) {
    let team_members = mapByRoles(data, req.user);
    let model = {
      team_members: team_members,
      number_active_members: team_members.admin.length + team_members['view-only'].length + team_members['view-and-refund'].length,
      number_admin_members: team_members.admin.length,
      'number_view-only_members': team_members['view-only'].length,
      'number_view-and-refund_members': team_members['view-and-refund'].length
    };
    response(req, res, 'services/team_members', model);
  };

  let onError = function (err) {
    logger.error(`[${correlationId}] Calling adminusers to get users from service failed -`, {
      service: 'adminusers',
      method: 'GET',
      error: err
    });
    renderErrorView(req, res, 'Unable to retrieve the services users.');
  };

  return userService.getServiceUsers(req.user.serviceIds[0], correlationId)
    .then(onSuccess)
    .catch(onError);
};
