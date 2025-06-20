import { response } from '@utils/response'
import paths from '@root/paths'
import { body, validationResult } from 'express-validator'
import { Errors, formatValidationErrors } from '@utils/simplified-account/format/format-validation-errors'
import WorldpayCredential from '@models/gateway-account-credential/WorldpayCredential.class'
import worldpayDetailsService from '@services/worldpay-details.service'
import WorldpayTasks from '@models/WorldpayTasks.class'
import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'

function get(req: ServiceRequest, res: ServiceResponse) {
  const credential = req.account.findCredentialByExternalId(req.params.credentialExternalId)

  return response(req, res, 'simplified-account/settings/worldpay-details/recurring-customer-initiated-credentials', {
    backLink: formatServiceAndAccountPathsFor(
      req.url.includes('switch-psp')
        ? paths.simplifiedAccount.settings.switchPsp.switchToWorldpay.index
        : paths.simplifiedAccount.settings.worldpayDetails.index,
      req.service.externalId,
      req.account.type
    ),
    credentials: credential.credentials.recurringCustomerInitiated ?? {},
  })
}

const credentialsValidations = [
  body('merchantCode').not().isEmpty().withMessage('Enter your merchant code'),
  body('username').not().isEmpty().withMessage('Enter your username'),
  body('password').not().isEmpty().withMessage('Enter your password'),
]

interface RecurringCustomerInitiatedBody {
  merchantCode: string
  username: string
  password: string
}

async function post(req: ServiceRequest<RecurringCustomerInitiatedBody>, res: ServiceResponse) {
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

  await worldpayDetailsService.updateRecurringCustomerInitiatedCredentials(
    req.service.externalId,
    req.account.type,
    credential.externalId,
    req.user.externalId,
    updatedCredential
  )

  // if this is the last task to be completed
  // show a success banner
  const previousTasks = new WorldpayTasks(req.account, req.service.externalId, credential)
  if (previousTasks.incompleteTasks()) {
    const recalculatedTasks = await WorldpayTasks.recalculate(
      req.service.externalId,
      req.account.type,
      credential,
      req.url.includes('switch-psp') ? 'SWITCHING' : 'CREATING'
    )
    if (!recalculatedTasks.incompleteTasks()) {
      req.flash('messages', {
        state: 'success',
        icon: '&check;',
        heading: 'Service connected to Worldpay',
        body: 'This service can now take payments',
      })
    }
  }

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

const errorResponse = (req: ServiceRequest<RecurringCustomerInitiatedBody>, res: ServiceResponse, errors: Errors) => {
  return response(req, res, 'simplified-account/settings/worldpay-details/recurring-customer-initiated-credentials', {
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

module.exports = {
  get,
  post,
}
