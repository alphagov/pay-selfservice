import { response } from '@utils/response'
import paths from '@root/paths'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { validationResult } from 'express-validator'
import formatValidationErrors from '@utils/simplified-account/format/format-validation-errors'
import { changeTokenName, getTokenByTokenLink } from '@services/tokens.service'
import { apiKeySchema } from '@utils/simplified-account/validation/api-key.schema'

async function get(req: ServiceRequest, res: ServiceResponse) {
  const tokenLink = req.params.tokenLink
  const apiToken = await getTokenByTokenLink(req.account.id, tokenLink)
  return response(req, res, 'simplified-account/settings/api-keys/edit/change-name', {
    currentKeyName: apiToken.description,
    backLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.apiKeys.index,
      req.service.externalId,
      req.account.type
    ),
  })
}

interface ChangeNameBody {
  keyName: string
}

async function post(req: ServiceRequest<ChangeNameBody>, res: ServiceResponse) {
  await apiKeySchema.keyName.validate.run(req)
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const formattedErrors = formatValidationErrors(errors)
    return response(req, res, 'simplified-account/settings/api-keys/edit/change-name', {
      errors: {
        summary: formattedErrors.errorSummary,
        formErrors: formattedErrors.formErrors,
      },
      currentKeyName: req.body.keyName,
      backLink: formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.apiKeys.index,
        req.service.externalId,
        req.account.type
      ),
    })
  }

  const tokenLink = req.params.tokenLink
  const name = req.body.keyName
  await changeTokenName(tokenLink, name)
  res.redirect(
    formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.apiKeys.index,
      req.service.externalId,
      req.account.type
    )
  )
}

module.exports = { get, post }
