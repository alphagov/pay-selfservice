const logger = require('winston');
let response = require('../utils/response.js');
let userService = require('../services/user_service.js');
let paths = require('../paths.js');
let successResponse = response.response;
let errorResponse = response.renderErrorView;
let rolesModule = require('../utils/roles');
let emailTools = require('../utils/email_tools')();

const formattedPathFor = require('../../app/utils/replace_params_in_path');

const messages = {
  emailAlreadyInUse: 'Email already in use',
  inviteError: 'Unable to send invitation at this time',
  emailConflict: (email, externalServiceId) => {
    return {
      error: {
        title: 'This person has already been invited',
        message: `You cannot send an invitation to ${email} because they have received one already, or may be an existing team member.`
      },
      link: {
        link: formattedPathFor(paths.teamMembers.index, externalServiceId),
        text: 'View all team members'
      },
      enable_link: true
    }
  }
};

module.exports = {

  /**
   * Show 'Invite a team member' page
   * @param req
   * @param res
   */

  index: (req, res) => {
    let roles = rolesModule.roles;
    const externalServiceId = req.params.externalServiceId;
    const teamMemberIndexLink = formattedPathFor(paths.teamMembers.index, externalServiceId);
    const teamMemberInviteSubmitLink = formattedPathFor(paths.teamMembers.invite, externalServiceId);
    let data = {
      teamMemberIndexLink: teamMemberIndexLink,
      teamMemberInviteSubmitLink: teamMemberInviteSubmitLink,
      admin: {id: roles['admin'].extId},
      viewAndRefund: {id: roles['view-and-refund'].extId},
      view: {id: roles['view-only'].extId}
    };

    return successResponse(req, res, 'services/team_member_invite', data);
  },

  /**
   * Save invite
   * @param req
   * @param res
   */
  invite: (req, res) => {
    let correlationId = req.correlationId;
    let senderId = req.user.externalId;
    let externalServiceId = req.params.externalServiceId;
    let invitee = req.body['invitee-email'];
    let roleId = req.body['role-input'];

    let role = rolesModule.getRoleByExtId(roleId);

    let onSuccess = () => {
      req.flash('generic', `Invite sent to ${invitee}`);
      res.redirect(303, formattedPathFor(paths.teamMembers.index, externalServiceId));
    };

    let onError = (err) => {
      logger.error(`[requestId=${req.correlationId}]  Unable to send invitation to user - ` + JSON.stringify(err.message));

      switch (err.errorCode) {
        case 409:
          successResponse(req, res, 'error_logged_in', messages.emailConflict(invitee, externalServiceId));
          break;
        default:
          errorResponse(req, res, messages.inviteError, 200);
      }
    };


    if (!emailTools.validateEmail(invitee)) {
      req.flash('genericError', `Invalid email address`);
      res.redirect(303, formattedPathFor(paths.teamMembers.invite, externalServiceId));
      return;
    }

    if (!role) {
      logger.error(`[requestId=${correlationId}] cannot identify role from user input ${roleId}`);
      errorResponse(req, res, messages.inviteError, 200);
      return;
    }

    return userService.inviteUser(invitee, senderId, externalServiceId, role.name, correlationId)
      .then(onSuccess)
      .catch(onError);
  }

};
