const q = require('q');
const logger = require('winston');
const paths = require('../paths');
const responses = require('../utils/response');

let rolesModule = require('../utils/roles');
const roles = rolesModule.roles;
let getRole = rolesModule.getRoleByExtId;

let userService = require('../services/user_service.js');

var successResponse = responses.response;
var errorResponse = responses.renderErrorView;

module.exports = {
  /**
   *
   * @param req
   * @param res
   * @path param username
   */
  index: (req, res) => {

    let correlationId = req.correlationId;
    let username = req.params.username;
    let roleChecked = (roleName, currentRoleName) => {
      if (roleName == currentRoleName) {
        return 'checked';
      }
      return '';
    };

    let viewData = user => {
      let editPermissionsLink = paths.teamMembers.permissions.replace(':username', user.username);

      return {
        email: user.email,
        editPermissionsLink: editPermissionsLink,
        admin: {
          id: roles['admin'].extId,
          checked: roleChecked(roles['admin'].name, user.role.name)
        },
        viewAndRefund: {
          id: roles['view-and-refund'].extId,
          checked: roleChecked(roles['view-and-refund'].name, user.role.name)
        },
        view: {
          id: roles['view-only'].extId,
          checked: roleChecked(roles['view-only'].name, user.role.name)
        }
      }
    };

    if (req.user.username == username) {
      errorResponse(req, res, 'Not allowed to update self permission');
      return;
    }

    userService.findByUsername(username, correlationId)
      .then(user => {
        successResponse(req, res, 'services/team_member_permissions', viewData(user));
      })
      .catch(() => errorResponse(req, res, 'Unable to locate the user'));
  },

  /**
   *
   * @param req
   * @param res
   * @path param username
   */
  update: (req, res) => {

    let username = req.params.username;
    let targetRoleExtId = req.body['role-input'];
    let targetRole = getRole(targetRoleExtId);
    let correlationId = req.correlationId;
    let onSuccess = (user) => {
      req.flash('generic', 'Permissions have been updated');
      res.redirect(303, paths.teamMembers + `/${user.username}`);
    };

    if (req.user.username == username) {
      errorResponse(req, res, 'Not allowed to update self permission');
      return;
    }

    if (!targetRole) {
      logger.error(`[requestId=${correlationId}] cannot identify role from user input ${targetRoleExtId}. possible hack`);
      errorResponse(req, res, 'Unable to update user permission');
      return;
    }

    userService.findByUsername(username, correlationId)
      .then(user => {
        if (targetRole.name == user.role.name) {
          onSuccess(user);
        } else {
          userService.updateServiceRole(user.username, targetRole.name, user.serviceIds[0], correlationId)
            .then(onSuccess)
            .catch(() => errorResponse(req, res, 'Unable to update user permission'));
        }
      })
      .catch(() => errorResponse(req, res, 'Unable to locate the user'));
  }
};
