const { response } = require('@utils/response')
const { getAvailableRolesForService } = require('@utils/roles')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')
const { body, validationResult } = require('express-validator')
const formatValidationErrors = require('@utils/simplified-account/format/format-validation-errors')
const userService = require('@services/user.service')
const lodash = require('lodash')

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

  const validations = [
    body('invitedUserRole')
      .not().isEmpty().withMessage('Select a permission level'),
    body('invitedUserEmail').isEmail().withMessage('Enter a valid email address')
  ]
  await Promise.all(validations.map(validation => validation.run(req)))
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    const formattedErrors = formatValidationErrors(errors)

    return response(req, res, 'simplified-account/settings/team-members/invite', {
      errors: {
        summary: formattedErrors.errorSummary,
        formErrors: formattedErrors.formErrors
      },
      invitedUserEmail,
      checkedRole: invitedUserRole,
      availableRoles: getAvailableRolesForService(req.service.agentInitiatedMotoEnabled ?? false),
      backLink: teamMembersIndexPath
    })
  }

  try {
    await userService.createInviteToJoinService(invitedUserEmail, adminUserExternalId, externalServiceId, invitedUserRole)
    if (lodash.has(req, 'session.pageData.invitee')) {
      delete req.session.pageData.invitee
    }
    // send email
    req.flash('messages', { state: 'success', icon: '&check;', heading: 'Team member invitation sent to ' + req.body.invitedUserEmail })
    res.redirect(teamMembersIndexPath)
  } catch (err) {
    // TODO - handle 412 (user already invited or already a team member)
    next(err)
  }
}

module.exports = {
  get,
  post
}
