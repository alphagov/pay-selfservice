const paths = require('@root/paths')
const { validationResult } = require('express-validator')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const formatValidationErrors = require('@utils/simplified-account/format/format-validation-errors')
const { response } = require('@utils/response')
const { getKeyByTokenLink, changeApiKeyName } = require('@services/api-keys.service')
const DESCRIPTION_VALIDATION = require('@controllers/simplified-account/settings/api-keys/validations')

async function get (req, res) {
  const { description } = await getKeyByTokenLink(req.account.id, req.params.tokenLink)
  return response(req, res, 'simplified-account/settings/api-keys/api-key-name', {
    description,
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.apiKeys.index, req.service.externalId, req.account.type)
  })
}

async function post (req, res) {
  await Promise.all(DESCRIPTION_VALIDATION.map(validation => validation.run(req)))
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    const formattedErrors = formatValidationErrors(errors)
    return response(req, res, 'simplified-account/settings/api-keys/api-key-name', {
      errors: {
        summary: formattedErrors.errorSummary,
        formErrors: formattedErrors.formErrors
      },
      backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.apiKeys.index, req.service.externalId, req.account.type)
    })
  }

  const tokenLink = req.params.tokenLink
  const description = req.body.description
  await changeApiKeyName(tokenLink, description)
  res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.apiKeys.index, req.service.externalId, req.account.type))
}

module.exports = { get, post }
