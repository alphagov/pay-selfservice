const lodash = require('lodash')
const { response } = require('../utils/response.js')
const userService = require('../services/user.service.js')
const paths = require('../paths.js')
const rolesModule = require('../utils/roles')
const emailValidator = require('../utils/email-tools.js')

const formatServicePathsFor = require('../utils/format-service-paths-for')

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
        link: formatServicePathsFor(paths.service.teamMembers.index, externalServiceId),
        text: 'View all team members'
      },
      enable_link: true
    }
  }
}

function index (req, res) {
  const roles = rolesModule.roles
  const externalServiceId = req.service.externalId
  const teamMemberIndexLink = formatServicePathsFor(paths.service.teamMembers.index, externalServiceId)
  const teamMemberInviteSubmitLink = formatServicePathsFor(paths.service.teamMembers.invite, externalServiceId)
  const serviceHasAgentInitiatedMotoEnabled = req.service.agentInitiatedMotoEnabled
  const invitee = lodash.get(req, 'session.pageData.invitee', '')
  const data = {
    teamMemberIndexLink: teamMemberIndexLink,
    teamMemberInviteSubmitLink: teamMemberInviteSubmitLink,
    serviceHasAgentInitiatedMotoEnabled: serviceHasAgentInitiatedMotoEnabled,
    admin: { id: roles.admin.extId },
    viewAndRefund: { id: roles['view-and-refund'].extId },
    view: { id: roles['view-only'].extId },
    viewAndInitiateMoto: { id: roles['view-and-initiate-moto'].extId },
    viewRefundAndInitiateMoto: { id: roles['view-refund-and-initiate-moto'].extId },
    invitee
  }

  return response(req, res, 'team-members/team-member-invite', data)
}

async function invite (req, res, next) {
  const correlationId = req.correlationId
  const senderId = req.user.externalId
  const externalServiceId = req.service.externalId
  const invitee = req.body['invitee-email'].trim()
  const roleId = parseInt(req.body['role-input'])

  const role = rolesModule.getRoleByExtId(roleId)

  if (!emailValidator(invitee)) {
    req.flash('genericError', 'Enter a valid email address')
    lodash.set(req, 'session.pageData', { invitee })
    res.redirect(303, formatServicePathsFor(paths.service.teamMembers.invite, externalServiceId))
  } else if (!role) {
    next(new Error(`Cannot identify role from user input ${roleId}`))
  } else {
    try {
      await userService.inviteUser(invitee, senderId, externalServiceId, role.name, correlationId)
      if (lodash.has(req, 'session.pageData.invitee')) {
        delete req.session.pageData.invitee
      }
      req.flash('generic', `Invite sent to ${invitee}`)
      res.redirect(303, formatServicePathsFor(paths.service.teamMembers.index, externalServiceId))
    } catch (err) {
      switch (err.errorCode) {
        case 412:
          response(req, res, 'error-with-link', messages.emailConflict(invitee, externalServiceId))
          break
        default:
          next(err)
      }
    }
  }
}

module.exports = {
  index,
  invite
}
