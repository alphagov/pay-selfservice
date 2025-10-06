import { response } from '@utils/response'
import { createToken } from '@services/tokens.service'
import paths from '@root/paths'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import { ServiceRequest, ServiceResponse } from '@utils/types/express'

import { validationResult } from 'express-validator'
import formatValidationErrors from '@utils/simplified-account/format/format-validation-errors'
import _ from 'lodash'
import { FORM_STATE_KEY } from '@controllers/simplified-account/settings/api-keys/create/constants'
import { apiKeySchema } from '@utils/simplified-account/validation/api-key.schema'
import { CreateTokenRequest } from '@models/public-auth/CreateTokenRequest.class'
import TokenUsageType from '@models/public-auth/token-usage-type'

function get(req: ServiceRequest, res: ServiceResponse) {
  return response(req, res, 'simplified-account/settings/api-keys/create/index', {
    backLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.apiKeys.index,
      req.service.externalId,
      req.account.type
    ),
  })
}

interface CreateTokenBody {
  keyName: string
}

async function post(req: ServiceRequest<CreateTokenBody>, res: ServiceResponse) {
  await apiKeySchema.keyName.validate.run(req)
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const formattedErrors = formatValidationErrors(errors)
    return response(req, res, 'simplified-account/settings/api-keys/create/index', {
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

  const name = req.body.keyName
  const createTokenRequest = new CreateTokenRequest()
    .withGatewayAccountId(`${req.account.id}`)
    .withServiceExternalId(req.service.externalId)
    .withServiceMode(req.account.type)
    .withDescription(name)
    .withCreatedBy(req.user.email)
    .withTokenUsageType(TokenUsageType.API)
    .withTokenType('CARD')
    .withTokenAccountType(req.account.type)

  const key = await createToken(createTokenRequest)

  _.set(req, FORM_STATE_KEY, {
    details: {
      name,
      key,
    },
  })

  return res.redirect(
    formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.apiKeys.create.newKeyDetails,
      req.service.externalId,
      req.account.type
    )
  )
}

module.exports = { get, post }
