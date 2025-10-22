import { response } from '@utils/response'
import paths from '@root/paths'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { body, validationResult } from 'express-validator'
import formatValidationErrors from '@utils/simplified-account/format/format-validation-errors'
import { getTokenByTokenLink } from '@services/tokens.service'
import { revokeKey } from '@services/api-keys.service'

async function get(req: ServiceRequest, res: ServiceResponse) {
  const tokenLink = req.params.tokenLink
  const token = await getTokenByTokenLink(req.account.id, tokenLink)
  return response(req, res, 'simplified-account/settings/api-keys/revoke/index', {
    name: token.description,
    backLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.apiKeys.index,
      req.service.externalId,
      req.account.type
    ),
  })
}

interface RevokeTokenBody {
  revokeKey: string
}

async function post(req: ServiceRequest<RevokeTokenBody>, res: ServiceResponse) {
  const tokenLink = req.params.tokenLink
  const apiKey = await getTokenByTokenLink(req.account.id, tokenLink)
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
        formErrors: formattedErrors.formErrors,
      },
      name: apiKey.description,
      backLink: formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.apiKeys.index,
        req.service.externalId,
        req.account.type
      ),
    })
  }
  if (req.body.revokeKey === 'yes') {
    // pragma: allowlist secret
    await revokeKey(`${req.account.id}`, req.params.tokenLink)
    req.flash('messages', {
      state: 'success',
      icon: '&check;',
      heading: `${apiKey.description} was successfully revoked`,
    })
  }
  res.redirect(
    formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.apiKeys.index,
      req.service.externalId,
      req.account.type
    )
  )
}

module.exports = { get, post }
