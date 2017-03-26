const q = require('q');
const logger = require('winston');
const paths = require('../paths');
const responses = require('../utils/response');

let rolesModule = require('../utils/roles');
const roles = rolesModule.roles;
let getRole = rolesModule.getRole;

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
    let roleChecked = (roleId, currentRoleId) => {
      if (roleId == currentRoleId) {
        return 'checked';
      }
      return '';
    };

    let viewData = user => {
      return {
        email: user.email,
        admin: {
          id: roles['admin'].id,
          checked: roleChecked(roles['admin'].id, user.role.id)
        },
        viewAndRefund: {
          id: roles['view-and-refund'].id,
          checked: roleChecked(roles['view-and-refund'].id, user.role.id)
        },
        view: {
          id: roles['view-only'].id,
          checked: roleChecked(roles['view-only'].id, user.role.id)
        }
      }
    };

    if (req.user.username == username) {
      errorResponse(req, res, 'Not allowed to update self permission');
      return;
    }

    userService.findByUsername(username, correlationId)
      .then(user => {
        successResponse(req, res, 'services/service_roles', viewData(user));
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
    let targetRoleId = req.body['role-input'];
    let targetRole = getRole(targetRoleId);
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
      logger.error(`[requestId=${correlationId}] cannot identify role-id from user input ${targetRoleId}`);
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
