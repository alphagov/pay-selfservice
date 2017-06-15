let response = require('../utils/response.js');
let userService = require('../services/user_service.js');
let paths = require('../paths.js');
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
      let mappedUser = {
        username: user.username,
        external_id: user.external_id
      };
      if (currentUser.externalId === user.external_id) {
        mappedUser.is_current = true;
        mappedUser.link = paths.user.profile;
      } else {
        mappedUser.link = paths.teamMembers.show.replace(':externalId', user.external_id);
      }
      userRolesMap[user.role.name].push(mappedUser);
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
        'number_view-and-refund_members': numberOfViewAndRefundMembers,
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

    let externalId = req.params.externalId;
    if (externalId === req.user.externalId) {
      res.redirect(paths.user.profile);
    }

    let onSuccess = (user) => {
      let hasSameService = user.serviceIds[0] === req.user.serviceIds[0];
      let roleInList = roles[user._role.name];
      let editPermissionsLink = paths.teamMembers.permissions.replace(':externalId', user.externalId);
      let removeTeamMemberLink = paths.teamMembers.delete.replace(':externalId', user.externalId);

      if (roleInList && hasSameService) {
        successResponse(req, res, 'services/team_member_details', {
          username: user.username,
          email: user.email,
          role: roles[user.role.name].description,
          editPermissionsLink: editPermissionsLink,
          removeTeamMemberLink: removeTeamMemberLink
        });
      } else {
        errorResponse(req, res, 'Error displaying this user of the current service');
      }
    };

    return userService.findByExternalId(externalId)
      .then(onSuccess)
      .catch(() => errorResponse(req, res, 'Unable to retrieve user'));
  },

  /**
   * Delete a Team member
   * @param req
   * @param res
   */
  delete: (req, res) => {

    let userToRemoveId = req.params.externalId;
    let removerId = req.user.externalId;
    let serviceId = req.user.serviceIds[0];
    let correlationId = req.correlationId;

    if (userToRemoveId === removerId) {
      errorResponse(req, res, 'Not allowed to delete a user itself');
      return;
    }

    let onSuccess = (username) => {
      req.flash('generic', username + ' was successfully removed');
      res.redirect(303, paths.teamMembers.index);
    };

    return userService.findByExternalId(userToRemoveId, correlationId)
      .then((user) => user.username)
      .then((username) => userService.delete(serviceId, removerId, userToRemoveId, correlationId)
        .then(onSuccess(username))
        .catch(() => errorResponse(req, res, 'Unable to delete user')))
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

    return userService.findByExternalId(req.user.externalId)
      .then(onSuccess)
      .catch(() => errorResponse(req, res, 'Unable to retrieve user'));
  }
};
