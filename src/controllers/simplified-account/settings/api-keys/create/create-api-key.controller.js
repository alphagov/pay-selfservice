const { response } = require('@utils/response')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')
const { TOKEN_SOURCE, createApiKey } = require('@services/api-keys.service')
const { validationResult } = require('express-validator')
const formatValidationErrors = require('@utils/simplified-account/format/format-validation-errors')
const DESCRIPTION_VALIDATION = require('@controllers/simplified-account/settings/api-keys/validations')

async function get (req, res) {
  return response(req, res, 'simplified-account/settings/api-keys/api-key-name', {
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

  const description = req.body.description
  const newApiKey = await createApiKey(req.account, description, req.user.email, TOKEN_SOURCE.API)
  response(req, res, 'simplified-account/settings/api-keys/new-api-key-details', {
    description,
    apiKey: newApiKey,
    backToApiKeysLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.apiKeys.index, req.service.externalId, req.account.type)
  })
}

module.exports = { get, post }
