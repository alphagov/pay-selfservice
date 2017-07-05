const _ = require('lodash');
const logger = require('winston');
const response = require('../utils/response.js');
const userService = require('../services/user_service.js');
const paths = require('../paths.js');
const successResponse = response.response;
const errorResponse = response.renderErrorView;
const roles = require('../utils/roles').roles;

const formattedPathFor = require('../utils/replace_params_in_path');

const mapByRoles = function (users, externalServiceId, currentUser) {
  const userRolesMap = {};
  for (const role in roles) {
    userRolesMap[roles[role].name] = [];
  }
  users.map((user) => {
    const userRoleName = _.get(user.getRoleForService(externalServiceId), 'name');
    if (roles[userRoleName]) {
      const mappedUser = {
        username: user.username,
        external_id: user.externalId
      };
      if (currentUser.externalId === user.externalId) {
        mappedUser.is_current = true;
        mappedUser.link = paths.user.profile;
      } else {
        mappedUser.link = formattedPathFor(paths.teamMembers.show, externalServiceId, user.externalId);
      }
      userRolesMap[userRoleName].push(mappedUser);
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
    const externalServiceId = req.params.externalServiceId;

    const onSuccess = function (data) {
      const team_members = mapByRoles(data, externalServiceId, req.user);
      const numberOfAdminMembers = team_members.admin.length;
      const numberOfViewOnlyMembers = team_members[roles['view-only'].name].length;
      const numberOfViewAndRefundMembers = team_members[roles['view-and-refund'].name].length;
      const numberActiveMembers = numberOfAdminMembers + numberOfViewOnlyMembers + numberOfViewAndRefundMembers;
      const inviteTeamMemberLink = formattedPathFor(paths.teamMembers.invite, externalServiceId);

      successResponse(req, res, 'services/team_members', {
        team_members: team_members,
        number_active_members: numberActiveMembers,
        number_admin_members: numberOfAdminMembers,
        inviteTeamMemberLink: inviteTeamMemberLink,
        'number_view-only_members': numberOfViewOnlyMembers,
        'number_view-and-refund_members': numberOfViewAndRefundMembers,
      });
    };

    return userService.getServiceUsers(externalServiceId, req.correlationId)
      .then(onSuccess)
      .catch((err) => {
        logger.error(`[requestId=${req.correlationId}] error retrieving users for service ${externalServiceId}. [${err}]`);
        errorResponse(req, res, 'Unable to retrieve the services users')
      });
  },

  /**
   * Show Team member details
   * @param req
   * @param res
   */
  show: (req, res) => {

    const externalServiceId = req.params.externalServiceId;
    const externalUserId = req.params.externalUserId;
    if (externalUserId === req.user.externalId) {
      res.redirect(paths.user.profile);
    }

    const onSuccess = (user) => {
      const hasSameService = user.hasService(externalServiceId) && req.user.hasService(externalServiceId);
      const roleInList = roles[_.get(user.getRoleForService(externalServiceId), 'name')];
      const editPermissionsLink = formattedPathFor(paths.teamMembers.permissions, externalServiceId, externalUserId);
      const removeTeamMemberLink = formattedPathFor(paths.teamMembers.delete, externalServiceId, externalUserId);

      if (roleInList && hasSameService) {
        successResponse(req, res, 'services/team_member_details', {
          username: user.username,
          email: user.email,
          role: roleInList.description,
          editPermissionsLink: editPermissionsLink,
          removeTeamMemberLink: removeTeamMemberLink
        });
      } else {
        errorResponse(req, res, 'Error displaying this user of the current service');
      }
    };

    return userService.findByExternalId(externalUserId)
      .then(onSuccess)
      .catch(() => errorResponse(req, res, 'Unable to retrieve user'));
  },

  /**
   * Delete a Team member
   * @param req
   * @param res
   */
  delete: (req, res) => {

    const userToRemoveId = req.params.externalUserId;
    const externalServiceId = req.params.externalServiceId;
    const removerId = req.user.externalId;
    const correlationId = req.correlationId;

    if (userToRemoveId === removerId) {
      errorResponse(req, res, 'Not allowed to delete a user itself');
      return;
    }

    const onSuccess = (username) => {
      req.flash('generic', username + ' was successfully removed');
      res.redirect(formattedPathFor(paths.teamMembers.index, externalServiceId));
    };

    const onError = () => {
      const messageUserHasBeenDeleted = {
        error: {
          title: 'This person has already been removed',
          message: 'This person has already been removed by another administrator.'
        },
        link: {
          link: '/team-members',
          text: 'View all team members'
        },
        enable_link: true
      };
      successResponse(req, res, 'error_logged_in', messageUserHasBeenDeleted)
    };

    return userService.findByExternalId(userToRemoveId, correlationId)
      .then(user => userService.delete(externalServiceId, removerId, userToRemoveId, correlationId).then(() => user.username))
      .then((username) => onSuccess(username))
      .catch(onError);
  },

  /**
   * Show 'My profile'
   * @param req
   * @param res
   */
  profile: (req, res) => {

    const onSuccess = (user) => {
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
