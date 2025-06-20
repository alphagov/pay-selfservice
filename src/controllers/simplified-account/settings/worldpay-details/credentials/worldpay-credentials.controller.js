const { response } = require('@utils/response')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')
const { validationResult } = require('express-validator')
const { formatValidationErrors } = require('@utils/simplified-account/format/format-validation-errors')
const worldpayDetailsService = require('@services/worldpay-details.service')
const WorldpayCredential = require('@models/gateway-account-credential/WorldpayCredential.class')
const WorldpayTasks = require('@models/WorldpayTasks.class')
const { ONE_OFF_CUSTOMER_INITIATED_SCHEMA } = require('@utils/simplified-account/validation/worldpay/validations.schema')

function get (req, res) {
  const credential = req.account.findCredentialByExternalId(req.params.credentialExternalId).credentials.oneOffCustomerInitiated || {}

  return response(req, res, 'simplified-account/settings/worldpay-details/one-off-customer-initiated-credentials', {
    backLink: formatSimplifiedAccountPathsFor(
      req.url.includes('switch-psp')
      ? paths.simplifiedAccount.settings.switchPsp.switchToWorldpay.index
      : paths.simplifiedAccount.settings.worldpayDetails.index,
      req.service.externalId, req.account.type),
    credentials: credential
  })
}

const worldpayCredentialsValidations = [
  ONE_OFF_CUSTOMER_INITIATED_SCHEMA.merchantCode.validate,
  ONE_OFF_CUSTOMER_INITIATED_SCHEMA.username.validate,
  ONE_OFF_CUSTOMER_INITIATED_SCHEMA.password.validate
]

async function post (req, res) {
  await Promise.all(worldpayCredentialsValidations.map(validation => validation.run(req)))
  const validationErrors = validationResult(req)
  if (!validationErrors.isEmpty()) {
    const formattedErrors = formatValidationErrors(validationErrors)
    return errorResponse(req, res, {
      summary: formattedErrors.errorSummary,
      formErrors: formattedErrors.formErrors
    })
  }

  const credential = new WorldpayCredential()
    .withMerchantCode(req.body.merchantCode)
    .withUsername(req.body.username)
    .withPassword(req.body.password)

  const isValid = await worldpayDetailsService.checkCredential(req.service.externalId, req.account.type, credential)
  if (!isValid) {
    return errorResponse(req, res, {
      summary: [
        {
          text: 'Check your Worldpay credentials, failed to link your account to Worldpay with credentials provided',
          href: '#merchant-code'
        }
      ]
    })
  }

  await worldpayDetailsService.updateOneOffCustomerInitiatedCredentials(
    req.service.externalId,
    req.account.type,
    req.account.getCurrentCredential().externalId,
    req.user.externalId,
    credential
  )

  // if this is the last task to be completed
  // show a success banner
  const previousTasks = new WorldpayTasks(req.account, req.service.externalId)
  if (previousTasks.incompleteTasks()) {
    const recalculatedTasks = await WorldpayTasks.recalculate(req.service.externalId, req.account.type)
    if (!recalculatedTasks.incompleteTasks()) {
      req.flash('messages', {
        state: 'success',
        icon: '&check;',
        heading: 'Service connected to Worldpay',
        body: 'This service can now take payments'
      })
    }
  }

  return res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.worldpayDetails.index,
    req.service.externalId, req.account.type))
}

const errorResponse = (req, res, errors) => {
  return response(req, res, 'simplified-account/settings/worldpay-details/one-off-customer-initiated-credentials', {
    errors,
    credentials: {
      merchantCode: req.body.merchantCode,
      username: req.body.username,
      password: req.body.password
    },
    backLink: formatSimplifiedAccountPathsFor(
      req.url.includes('switch-psp')
      ? paths.simplifiedAccount.settings.switchPsp.switchToWorldpay.index
      : paths.simplifiedAccount.settings.worldpayDetails.index,
      req.service.externalId, req.account.type),
  })
}

module.exports = {
  get,
  post
}
