let response = require('../utils/response.js');
let userService = require('../services/user_service.js');
var paths = require('../paths.js');
let successResponse = response.response;
let errorResponse = response.renderErrorView;
let roles = require('../utils/roles').roles;

let mapByRoles = function (users, currentUser) {
  let userRolesMap = {};
  for (let role in roles) {
    userRolesMap[roles[role].name] = [];
  }
  users.map((user) => {
    if (roles[user.role.name]) {
      let mappedUsername = {username: user.username};
      if (currentUser.email == user.email) {
        mappedUsername.is_current = true;
        mappedUsername.link = paths.user.profile;
      } else {
        mappedUsername.link = paths.teamMembers.show.replace(':username', user.username);
      }
      userRolesMap[user.role.name].push(mappedUsername);
    }
  });
  return userRolesMap;
};

module.exports = {

  /**
   * Team members list view
   * @param req
   * @param res
   */
  index: (req, res) => {

    let onSuccess = function (data) {
      let team_members = mapByRoles(data, req.user);
      let numberOfAdminMembers = team_members.admin.length;
      let numberOfViewOnlyMembers = team_members[roles['view-only'].name].length;
      let numberOfViewAndRefundMembers = team_members[roles['view-and-refund'].name].length;
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
      .catch(() => errorResponse(req, res, 'Unable to retrieve the services users'));
  },

  /**
   * Show Team member details
   * @param req
   * @param res
   */
  show: (req, res) => {

    let username = req.params.username;
    if (username == req.user.username) {
      res.redirect(paths.user.profile);
    }

    let onSuccess = (user) => {
      let hasSameService = user.serviceIds[0] == req.user.serviceIds[0];
      let roleInList = roles[user._role.name];
      let editPermissionsLink = paths.teamMembers.permissions.replace(':username', user.username);

      if (roleInList && hasSameService) {
        successResponse(req, res, 'services/team_member_details', {
          username: user.username,
          email: user.email,
          role: roles[user.role.name].description,
          editPermissionsLink: editPermissionsLink
        });
      } else {
        errorResponse(req, res, 'Error displaying this user of the current service');
      }
    };

    return userService.findByUsername(username)
      .then(onSuccess)
      .catch(() => errorResponse(req, res, 'Unable to retrieve user'));
  },

  /**
   * Show 'My profile'
   * @param req
   * @param res
   */
  profile: (req, res) => {

    let onSuccess = (user) => {
      successResponse(req, res, 'services/team_member_profile', {
        username: user.username,
        email: user.email,
        telephone_number: user.telephoneNumber
      });
    };

    return userService.findByUsername(req.user.username)
      .then(onSuccess)
      .catch(() => errorResponse(req, res, 'Unable to retrieve user'));
  }
};
