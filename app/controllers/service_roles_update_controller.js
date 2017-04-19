const q = require('q');
const logger = require('winston');
const paths = require('../paths');
const responses = require('../utils/response');

let rolesModule = require('../utils/roles');
const roles = rolesModule.roles;
let getRole = rolesModule.getRoleByExtId;

let userService = require('../services/user_service.js');

let successResponse = responses.response;
let errorResponse = responses.renderErrorView;

let hasSameService = (admin, user) => {
  return admin.serviceIds[0] === user.serviceIds[0];
};

let serviceIdMismatchView = (req, res, admin, user, correlationId) => {
  logger.error(`[requestId=${correlationId}] mismatching service Ids between admin user [service=${admin.serviceIds[0]}] and user [service=${user.serviceIds[0]}]`);
  errorResponse(req, res, 'Unable to update permissions for this user');
};

module.exports = {
  /**
   *
   * @param req
   * @param res
   * @path param externalId
   */
  index: (req, res) => {

    let correlationId = req.correlationId;
    let externalId = req.params.externalId;
    let roleChecked = (roleName, currentRoleName) => {
      if (roleName === currentRoleName) {
        return 'checked';
      }
      return '';
    };

    let viewData = user => {
      let editPermissionsLink = paths.teamMembers.permissions.replace(':externalId', user.externalId);

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

    if (req.user.externalId === externalId) {
      errorResponse(req, res, 'Not allowed to update self permission');
      return;
    }

    userService.findByExternalId(externalId, correlationId)
      .then(user => {
        if (!hasSameService(req.user, user)) {
          serviceIdMismatchView(req, res, req.user, user, correlationId);
        } else {
          successResponse(req, res, 'services/team_member_permissions', viewData(user));
        }
      })
      .catch(err => {
        logger.error(`[requestId=${correlationId}] error displaying user permission view [${err}]`);
        errorResponse(req, res, 'Unable to locate the user')
      });
  },

  /**
   *
   * @param req
   * @param res
   * @path param externalId
   */
  update: (req, res) => {

    let externalId = req.params.externalId;
    let targetRoleExtId = req.body['role-input'];
    let targetRole = getRole(targetRoleExtId);
    let correlationId = req.correlationId;
    let onSuccess = (user) => {
      req.flash('generic', 'Permissions have been updated');
      res.redirect(303, paths.teamMembers.show.replace(':externalId', user.externalId));
    };

    if (req.user.externalId === externalId) {
      errorResponse(req, res, 'Not allowed to update self permission');
      return;
    }

    if (!targetRole) {
      logger.error(`[requestId=${correlationId}] cannot identify role from user input ${targetRoleExtId}. possible hack`);
      errorResponse(req, res, 'Unable to update user permission');
      return;
    }

    userService.findByExternalId(externalId, correlationId)
      .then(user => {
        if (!hasSameService(req.user, user)) {
          serviceIdMismatchView(req, res, req.user, user, correlationId);
        } else {
          if (targetRole.name === user.role.name) {
            onSuccess(user);
          } else {
            userService.updateServiceRole(user.externalId, targetRole.name, user.serviceIds[0], correlationId)
              .then(onSuccess)
              .catch(err => {
                logger.error(`[requestId=${correlationId}] error updating user service role [${err}]`);
                errorResponse(req, res, 'Unable to update user permission')
              });
          }
        }
      })
      .catch(err => {
        logger.error(`[requestId=${correlationId}] error locating user when updating user service role [${err}]`);
        errorResponse(req, res, 'Unable to locate the user')
      });
  }
};
