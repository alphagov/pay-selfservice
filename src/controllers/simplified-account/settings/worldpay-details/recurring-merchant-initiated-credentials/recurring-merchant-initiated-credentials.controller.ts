import { response } from '@utils/response'
import paths from '@root/paths'
import { body, validationResult } from 'express-validator'
import { Errors, formatValidationErrors } from '@utils/simplified-account/format/format-validation-errors'
import WorldpayCredential from '@models/gateway-account-credential/WorldpayCredential.class'
import worldpayDetailsService from '@services/worldpay-details.service'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { SESSION_KEY } from '@controllers/simplified-account/settings/worldpay-details/constants'
import _ from 'lodash'

function get(req: ServiceRequest, res: ServiceResponse) {
  const credential = req.account.findCredentialByExternalId(req.params.credentialExternalId)

  return response(req, res, 'simplified-account/settings/worldpay-details/recurring-merchant-initiated-credentials', {
    backLink: formatServiceAndAccountPathsFor(
      req.url.includes('switch-psp')
        ? paths.simplifiedAccount.settings.switchPsp.switchToWorldpay.index
        : paths.simplifiedAccount.settings.worldpayDetails.index,
      req.service.externalId,
      req.account.type
    ),
    credentials: credential.credentials.recurringMerchantInitiated ?? {},
  })
}

const credentialsValidations = [
  body('merchantCode').not().isEmpty().withMessage('Enter your merchant code'),
  body('username').not().isEmpty().withMessage('Enter your username'),
  body('password').not().isEmpty().withMessage('Enter your password'),
]

interface RecurringMerchantInitiatedBody {
  merchantCode: string
  username: string
  password: string
}

async function post(req: ServiceRequest<RecurringMerchantInitiatedBody>, res: ServiceResponse) {
  const credential = req.account.findCredentialByExternalId(req.params.credentialExternalId)

  await Promise.all(credentialsValidations.map((validation) => validation.run(req)))
  const validationErrors = validationResult(req)
  if (!validationErrors.isEmpty()) {
    const formattedErrors = formatValidationErrors(validationErrors)
    return errorResponse(req, res, {
      summary: formattedErrors.errorSummary,
      formErrors: formattedErrors.formErrors,
    })
  }

  const updatedCredential = new WorldpayCredential()
    .withMerchantCode(req.body.merchantCode)
    .withUsername(req.body.username)
    .withPassword(req.body.password)

  const isValid = await worldpayDetailsService.checkCredential(
    req.service.externalId,
    req.account.type,
    updatedCredential
  )
  if (!isValid) {
    return errorResponse(req, res, {
      summary: [
        {
          text: 'Check your Worldpay credentials, failed to link your account to Worldpay with credentials provided',
          href: '#merchant-code',
        },
      ],
    })
  }

  await worldpayDetailsService.updateRecurringMerchantInitiatedCredentials(
    req.service.externalId,
    req.account.type,
    credential.externalId,
    req.user.externalId,
    updatedCredential
  )

  _.set(req, SESSION_KEY, {
    TASK_COMPLETED: true,
  })

  return res.redirect(
    formatServiceAndAccountPathsFor(
      req.url.includes('switch-psp')
        ? paths.simplifiedAccount.settings.switchPsp.switchToWorldpay.index
        : paths.simplifiedAccount.settings.worldpayDetails.index,
      req.service.externalId,
      req.account.type
    )
  )
}

const errorResponse = (req: ServiceRequest<RecurringMerchantInitiatedBody>, res: ServiceResponse, errors: Errors) => {
  return response(req, res, 'simplified-account/settings/worldpay-details/recurring-merchant-initiated-credentials', {
    errors,
    credentials: {
      merchantCode: req.body.merchantCode,
      username: req.body.username,
      password: req.body.password,
    },
    backLink: formatServiceAndAccountPathsFor(
      req.url.includes('switch-psp')
        ? paths.simplifiedAccount.settings.switchPsp.switchToWorldpay.index
        : paths.simplifiedAccount.settings.worldpayDetails.index,
      req.service.externalId,
      req.account.type
    ),
  })
}

export { get, post }
