const { response } = require('@utils/response')
const { getAvailableRolesForService } = require('@utils/roles')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')
const { body, validationResult } = require('express-validator')
const formatValidationErrors = require('@utils/simplified-account/format/format-validation-errors')
const userService = require('@services/user.service')

async function get (req, res) {
  const serviceId = req.service.externalId
  const accountType = req.account.type
  response(req, res, 'simplified-account/settings/team-members/invite',
    {
      availableRoles: getAvailableRolesForService(req.service.agentInitiatedMotoEnabled ?? false),
      backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.teamMembers.index, serviceId, accountType)
    })
}

async function post (req, res, next) {
  const externalServiceId = req.service.externalId
  const accountType = req.account.type
  const adminUserExternalId = req.user.externalId
  const invitedUserEmail = req.body.invitedUserEmail
  const invitedUserRole = req.body.invitedUserRole
  const teamMembersIndexPath = formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.teamMembers.index, externalServiceId, accountType)

  const responseWithErrors = (errors) => {
    return response(req, res, 'simplified-account/settings/team-members/invite', {
      errors: {
        summary: errors.errorSummary,
        formErrors: errors.formErrors
      },
      invitedUserEmail,
      checkedRole: invitedUserRole,
      availableRoles: getAvailableRolesForService(req.service.agentInitiatedMotoEnabled ?? false),
      backLink: teamMembersIndexPath
    })
  }

  const validations = [
    body('invitedUserEmail')
      .isEmail().withMessage('Enter a valid email address'),
    body('invitedUserRole')
      .not().isEmpty().withMessage('Select a permission level')
  ]
  await Promise.all(validations.map(validation => validation.run(req)))
  const validationErrors = validationResult(req)
  if (!validationErrors.isEmpty()) {
    const formattedValidationErrors = formatValidationErrors(validationErrors)
    return responseWithErrors(formattedValidationErrors)
  }

  try {
    await userService.createInviteToJoinService(invitedUserEmail, adminUserExternalId, externalServiceId, invitedUserRole)
    req.flash('messages', { state: 'success', icon: '&check;', heading: `Team member invitation sent to ${req.body.invitedUserEmail}` })
    res.redirect(teamMembersIndexPath)
  } catch (err) {
    if (err.errorCode === 412) {
      const personAlreadyInvitedError = {
        errorSummary: [{ text: 'This person has already been invited', href: '#invited-user-email' }],
        formErrors: { invitedUserEmail: `You cannot send an invitation to ${req.body.invitedUserEmail} because they have received one already, or may be an existing team member` }
      }
      return responseWithErrors(personAlreadyInvitedError)
    }
    next(err)
  }
}

module.exports = {
  get,
  post
}
