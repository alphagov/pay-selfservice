const paths = require('@root/paths')
const { validationResult } = require('express-validator')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const { formatValidationErrors } = require('@utils/simplified-account/format/format-validation-errors')
const { response } = require('@utils/response')
const { changeKeyName, getKeyByTokenLink } = require('@services/api-keys.service')
const { apiKeySchema } = require('@utils/simplified-account/validation/api-key.schema')

async function get (req, res) {
  const tokenLink = req.params.tokenLink
  const apiToken = await getKeyByTokenLink(req.account.id, tokenLink)
  return response(req, res, 'simplified-account/settings/api-keys/edit/change-name', {
    currentKeyName: apiToken.description,
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.apiKeys.index, req.service.externalId, req.account.type)
  })
}

async function post (req, res) {
  await apiKeySchema.keyName.validate.run(req)
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const formattedErrors = formatValidationErrors(errors)
    return response(req, res, 'simplified-account/settings/api-keys/edit/change-name', {
      errors: {
        summary: formattedErrors.errorSummary,
        formErrors: formattedErrors.formErrors
      },
      currentKeyName: req.body.keyName,
      backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.apiKeys.index, req.service.externalId, req.account.type)
    })
  }

  const tokenLink = req.params.tokenLink
  const name = req.body.keyName
  await changeKeyName(tokenLink, name)
  res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.apiKeys.index, req.service.externalId, req.account.type))
}

module.exports = { get, post }
