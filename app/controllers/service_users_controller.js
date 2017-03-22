let response        = require('../utils/response.js');
let userService     = require('../services/user_service.js');
let successResponse = response.response;
let errorResponse   = response.renderErrorView;

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

  let onSuccess = function (data) {

    let team_members = mapByRoles(data, req.user);
    let numberOfAdminMembers = team_members.admin.length;
    let numberOfViewOnlyMembers = team_members['view-only'].length;
    let numberOfViewAndRefundMembers = team_members['view-and-refund'].length;
    let numberActiveMembers = numberOfAdminMembers + numberOfViewOnlyMembers + numberOfViewAndRefundMembers;

    successResponse(req, res, 'services/team_members', {
      team_members: team_members,
      number_active_members: numberActiveMembers,
      number_admin_members: numberOfAdminMembers,
      'number_view-only_members': numberOfViewOnlyMembers,
      'number_view-and-refund_members': numberOfViewAndRefundMembers
    });
  };

  return userService.getServiceUsers(req.user.serviceIds[0], req.correlationId)
    .then(onSuccess)
    .catch(() => errorResponse(req, res, 'Unable to retrieve the services users.'));
};
