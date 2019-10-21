const lodash = require('lodash')
const logger = require('../utils/logger')(__filename)
const response = require('../utils/response.js')
const userService = require('../services/user_service.js')
const paths = require('../paths.js')
const successResponse = response.response
const errorResponse = response.renderErrorView
const rolesModule = require('../utils/roles')
const emailValidator = require('../utils/email_tools.js')

const formattedPathFor = require('../../app/utils/replace_params_in_path')

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
}

module.exports = {

  /**
   * Show 'Invite a team member' page
   * @param req
   * @param res
   */

  index: (req, res) => {
    let roles = rolesModule.roles
    const externalServiceId = req.service.externalId
    const teamMemberIndexLink = formattedPathFor(paths.teamMembers.index, externalServiceId)
    const teamMemberInviteSubmitLink = formattedPathFor(paths.teamMembers.invite, externalServiceId)
    const invitee = lodash.get(req, 'session.pageData.invitee', '')
    let data = {
      teamMemberIndexLink: teamMemberIndexLink,
      teamMemberInviteSubmitLink: teamMemberInviteSubmitLink,
      admin: { id: roles['admin'].extId },
      viewAndRefund: { id: roles['view-and-refund'].extId },
      view: { id: roles['view-only'].extId },
      invitee
    }

    return successResponse(req, res, 'team-members/team_member_invite', data)
  },

  /**
   * Save invite
   * @param req
   * @param res
   */
  invite: (req, res) => {
    const correlationId = req.correlationId
    const senderId = req.user.externalId
    const externalServiceId = req.service.externalId
    const invitee = req.body['invitee-email'].trim()
    const roleId = parseInt(req.body['role-input'])

    const role = rolesModule.getRoleByExtId(roleId)

    if (!emailValidator(invitee)) {
      req.flash('genericError', `Invalid email address`)
      lodash.set(req, 'session.pageData', { invitee })
      res.redirect(303, formattedPathFor(paths.teamMembers.invite, externalServiceId))
    } else if (!role) {
      logger.error(`[requestId=${correlationId}] cannot identify role from user input ${roleId}`)
      errorResponse(req, res, messages.inviteError, 200)
    } else {
      userService.inviteUser(invitee, senderId, externalServiceId, role.name, correlationId)
        .then(() => {
          if (lodash.has(req, 'session.pageData.invitee')) delete req.session.pageData.invitee
          req.flash('generic', `Invite sent to ${invitee}`)
          res.redirect(303, formattedPathFor(paths.teamMembers.index, externalServiceId))
        })
        .catch(err => {
          logger.error(`[requestId=${req.correlationId}]  Unable to send invitation to user - ` + JSON.stringify(err))

          switch (err.errorCode) {
            case 412:
              successResponse(req, res, 'error_logged_in', messages.emailConflict(invitee, externalServiceId))
              break
            default:
              errorResponse(req, res, messages.inviteError, 200)
          }
        })
    }
  }

}
