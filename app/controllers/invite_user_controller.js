let response = require('../utils/response.js');
let userService = require('../services/user_service.js');
let paths = require('../paths.js');
let successResponse = response.response;
let errorResponse = response.renderErrorView;
let roles = require('../utils/roles').roles;


module.exports = {

  /**
   * Show 'Invite a team member' page
   * @param req
   * @param res
   */

  index: (req, res) => {

    let data = {
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
    let invitee = req.body['invitee-email'];
    let serviceId = req.user.serviceIds[0];
    let roleName = req.body['role-input'];

    let onSuccess = () => {
      console.log('is it coming here ???');
      req.flash('generic', `Invite sent to ${invitee}`);
      res.redirect(303, paths.teamMembers.index);
    };

    return userService.inviteUser(invitee, senderId, serviceId, roleName, correlationId)
      .then(onSuccess)
      .catch(() => {
        errorResponse(req, res, 'Unable to create invitation', 200)
      });
  }

};
