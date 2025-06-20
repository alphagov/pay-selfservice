const { findByExternalId } = require('@services/user.service')
const { response, renderErrorView } = require('@utils/response')
const { body, validationResult } = require('express-validator')
const paths = require('@root/paths')
const userService = require('@services/user.service')
const { formatValidationErrors } = require('@utils/simplified-account/format/format-validation-errors')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')

async function get (req, res, next) {
  if (req.user.externalId === req.params.externalUserId) {
    return renderErrorView(req, res, 'You cannot remove yourself from a service', 403)
  }
  const externalServiceId = req.service.externalId
  const accountType = req.account.type
  try {
    const { email } = await findByExternalId(req.params.externalUserId)
    response(req, res, 'simplified-account/settings/team-members/remove-user',
      {
        email,
        backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.teamMembers.index, externalServiceId, accountType)
      })
  } catch (err) {
    next(err)
  }
}

async function post (req, res, next) {
  const userToRemoveExternalId = req.params.externalUserId
  const userToRemoveEmail = req.body.email
  const removerExternalId = req.user.externalId
  const externalServiceId = req.service.externalId
  const accountType = req.account.type

  if (removerExternalId === userToRemoveExternalId) {
    return renderErrorView(req, res, 'You cannot remove yourself from a service', 403)
  }

  const validation = body('confirmRemoveUser').not().isEmpty().withMessage(`Confirm if you want to remove ${userToRemoveEmail}`)
  await validation.run(req)
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    const formattedErrors = formatValidationErrors(errors)

    return response(req, res, 'simplified-account/settings/team-members/remove-user', {
      errors: {
        summary: formattedErrors.errorSummary,
        formErrors: formattedErrors.formErrors
      },
      email: userToRemoveEmail,
      backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.teamMembers.index, externalServiceId, accountType)
    })
  }

  if (req.body.confirmRemoveUser !== 'yes') {
    res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.teamMembers.index, externalServiceId, accountType))
    return
  }

  try {
    await userService.delete(externalServiceId, removerExternalId, userToRemoveExternalId)
    req.flash('messages', { state: 'success', icon: '&check;', heading: 'Successfully removed ' + userToRemoveEmail })
    res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.teamMembers.index, externalServiceId, accountType))
  } catch (err) {
    if (err.errorCode === 404) {
      // user must have just been deleted by another admin, but we'll just show they have been successfully removed
      req.flash('messages', { state: 'success', icon: '&check;', heading: 'Successfully removed ' + userToRemoveEmail })
      res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.teamMembers.index, externalServiceId, accountType))
    } else {
      next(err)
    }
  }
}

module.exports = {
  get,
  post
}
