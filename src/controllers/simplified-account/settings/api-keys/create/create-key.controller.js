const { response } = require('@utils/response')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')
const { TOKEN_SOURCE, createKey } = require('@services/api-keys.service')
const { validationResult } = require('express-validator')
const formatValidationErrors = require('@utils/simplified-account/format/format-validation-errors')
const _ = require('lodash')
const { FORM_STATE_KEY } = require('@controllers/simplified-account/settings/api-keys/create/constants')
const { apiKeySchema } = require('@utils/simplified-account/validation/api-key.schema')

async function get (req, res) {
  return response(req, res, 'simplified-account/settings/api-keys/create/index', {
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.apiKeys.index, req.service.externalId, req.account.type)
  })
}

async function post (req, res) {
  await apiKeySchema.keyName.validate.run(req)
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const formattedErrors = formatValidationErrors(errors)
    return response(req, res, 'simplified-account/settings/api-keys/create/index', {
      errors: {
        summary: formattedErrors.errorSummary,
        formErrors: formattedErrors.formErrors
      },
      currentKeyName: req.body.keyName,
      backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.apiKeys.index, req.service.externalId, req.account.type)
    })
  }

  const name = req.body.keyName
  const key = await createKey(req.account, name, req.user.email, TOKEN_SOURCE.API)

  _.set(req, FORM_STATE_KEY, {
    details: {
      name,
      key
    }
  })

  res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.apiKeys.create.newKeyDetails, req.service.externalId, req.account.type))
}

module.exports = { get, post }
