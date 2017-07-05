const q = require('q');
const _ = require('lodash');
const logger = require('winston');
const paths = require('../paths');
const responses = require('../utils/response');

let rolesModule = require('../utils/roles');
const roles = rolesModule.roles;
let getRole = rolesModule.getRoleByExtId;

let userService = require('../services/user_service.js');

let successResponse = responses.response;
let errorResponse = responses.renderErrorView;

let hasSameService = (admin, user, externalServiceId) => {
  return admin.hasService(externalServiceId) && user.hasService(externalServiceId);
};

let serviceIdMismatchView = (req, res, admin, user, correlationId) => {
  logger.error(`[requestId=${correlationId}] mismatching service Ids between admin user [service=${admin.serviceIds[0]}] and user [service=${user.serviceIds[0]}]`);
  errorResponse(req, res, 'Unable to update permissions for this user');
};

const formattedPathFor = require('../utils/replace_params_in_path');

module.exports = {
  /**
   *
   * @param req
   * @param res
   * @path param externalId
   */
  index: (req, res) => {

    let correlationId = req.correlationId;
    let externalUserId = req.params.externalUserId;
    let externalServiceId = req.params.externalServiceId;
    let roleChecked = (roleName, currentRoleName) => {
      if (roleName === currentRoleName) {
        return 'checked';
      }
      return '';
    };

    let viewData = user => {
      let editPermissionsLink = formattedPathFor(paths.teamMembers.permissions, externalServiceId, user.externalId);

      const role = user.getRoleForService(externalServiceId);
      return {
        email: user.email,
        editPermissionsLink: editPermissionsLink,
        admin: {
          id: roles['admin'].extId,
          checked: _.get(role, 'name') === 'admin' ? 'checked' : ''
        },
        viewAndRefund: {
          id: roles['view-and-refund'].extId,
          checked: _.get(role, 'name') === 'view-and-refund' ? 'checked' : ''
        },
        view: {
          id: roles['view-only'].extId,
          checked: _.get(role, 'name') === 'view-only' ? 'checked' : ''
        }
      }
    };

    if (req.user.externalId === externalUserId) {
      errorResponse(req, res, 'Not allowed to update self permission');
      return;
    }

    userService.findByExternalId(externalUserId, correlationId)
      .then(user => {
        if (!hasSameService(req.user, user, externalServiceId)) {
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

    let externalUserId = req.params.externalUserId;
    let serviceExternalId = req.params.externalServiceId;
    let targetRoleExtId = req.body['role-input'];
    let targetRole = getRole(targetRoleExtId);
    let correlationId = req.correlationId;
    let onSuccess = (user) => {
      req.flash('generic', 'Permissions have been updated');
      res.redirect(303, formattedPathFor(paths.teamMembers.show, serviceExternalId, user.externalId));
    };

    if (req.user.externalId === externalUserId) {
      errorResponse(req, res, 'Not allowed to update self permission');
      return;
    }

    if (!targetRole) {
      logger.error(`[requestId=${correlationId}] cannot identify role from user input ${targetRoleExtId}. possible hack`);
      errorResponse(req, res, 'Unable to update user permission');
      return;
    }

    userService.findByExternalId(externalUserId, correlationId)
      .then(user => {
        if (!hasSameService(req.user, user, serviceExternalId)) {
          serviceIdMismatchView(req, res, req.user, user, correlationId);
        } else {
          if (targetRole.name === user.getRoleForService(serviceExternalId)) {
            onSuccess(user);
          } else {
            userService.updateServiceRole(user.externalId, targetRole.name, serviceExternalId, correlationId)
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
