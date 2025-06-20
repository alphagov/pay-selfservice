const paths = require('@root/paths')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const { response } = require('@utils/response')
const { getKeyByTokenLink, revokeKey } = require('@services/api-keys.service')
const { body, validationResult } = require('express-validator')
const { formatValidationErrors } = require('@utils/simplified-account/format/format-validation-errors')

async function get (req, res) {
  const tokenLink = req.params.tokenLink
  const apiKey = await getKeyByTokenLink(req.account.id, tokenLink)
  return response(req, res, 'simplified-account/settings/api-keys/revoke/index', {
    name: apiKey.description,
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.apiKeys.index, req.service.externalId, req.account.type)
  })
}

async function post (req, res) {
  const tokenLink = req.params.tokenLink
  const apiKey = await getKeyByTokenLink(req.account.id, tokenLink)
  const validation = body('revokeKey')
    .isIn(['yes', 'no'])
    .withMessage(`Confirm if you want to revoke ${apiKey.description}`)
  await validation.run(req)
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const formattedErrors = formatValidationErrors(errors)
    return response(req, res, 'simplified-account/settings/api-keys/revoke/index', {
      errors: {
        summary: formattedErrors.errorSummary,
        formErrors: formattedErrors.formErrors
      },
      name: apiKey.description,
      backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.apiKeys.index, req.service.externalId, req.account.type)
    })
  }
  if (req.body.revokeKey === 'yes') { // pragma: allowlist secret
    await revokeKey(req.account.id, req.params.tokenLink)
    req.flash('messages', { state: 'success', icon: '&check;', heading: `${apiKey.description} was successfully revoked` })
  }
  res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.apiKeys.index, req.service.externalId, req.account.type))
}

module.exports = { get, post }
