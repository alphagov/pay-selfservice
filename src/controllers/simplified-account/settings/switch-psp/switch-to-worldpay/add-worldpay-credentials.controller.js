const { response } = require('@utils/response')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')
const { validationResult } = require('express-validator')
const formatValidationErrors = require('@utils/simplified-account/format/format-validation-errors')
const WorldpayCredential = require('@models/gateway-account-credential/WorldpayCredential.class')
const worldpayDetailsService = require('@services/worldpay-details.service')
const { oneOffCustomerInitiatedSchema } = require('@utils/simplified-account/validation/worldpay/one-off-customer-initiated.schema')

function get (req, res) {
  const account = req.account
  const service = req.service
  const existingCredentials = account.getSwitchingCredential().credentials?.oneOffCustomerInitiated || {}
  const context = {
    credentials: existingCredentials,
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.switchPsp.switchToWorldpay.index,
      service.externalId, account.type)
  }
  return response(req, res, 'simplified-account/settings/switch-psp/switch-to-worldpay/add-worldpay-credentials', context)
}

async function post (req, res, next) {
  const account = req.account
  const service = req.service
  const user = req.user
  const switchingCredential = account.getSwitchingCredential()
  const validations = [
    oneOffCustomerInitiatedSchema.merchantCode.validate,
    oneOffCustomerInitiatedSchema.username.validate,
    oneOffCustomerInitiatedSchema.password.validate
  ]

  await Promise.all(validations.map(validation => validation.run(req)))
  const validationErrors = validationResult(req)
  if (!validationErrors.isEmpty()) {
    const formattedErrors = formatValidationErrors(validationErrors)
    return postErrorResponse(req, res, {
      summary: formattedErrors.errorSummary,
      formErrors: formattedErrors.formErrors
    })
  }

  const newOneOffCustomerInitiatedCredential = new WorldpayCredential()
    .withMerchantCode(req.body.merchantCode)
    .withUsername(req.body.username)
    .withPassword(req.body.password)

  try {
    const isValid = await worldpayDetailsService.checkCredential(req.service.externalId, req.account.type, newOneOffCustomerInitiatedCredential)
    if (!isValid) {
      return postErrorResponse(req, res, {
        summary: [
          {
            text: 'Check your Worldpay credentials, failed to link your account to Worldpay with credentials provided',
            href: '#merchant-code'
          }
        ]
      })
    }
    await worldpayDetailsService.updateOneOffCustomerInitiatedCredentials(
      service.externalId,
      account.type,
      switchingCredential.externalId,
      user.externalId,
      newOneOffCustomerInitiatedCredential
    )
    res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.switchPsp.switchToWorldpay.index, service.externalId, account.type))
  } catch (err) {
    return next(err)
  }
}

const postErrorResponse = (req, res, errors) => {
  const account = req.account
  const service = req.service
  return response(req, res, 'simplified-account/settings/switch-psp/switch-to-worldpay/add-worldpay-credentials', {
    errors,
    credentials: {
      merchantCode: req.body.merchantCode,
      username: req.body.username,
      password: req.body.password
    },
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.switchPsp.switchToWorldpay.index,
      service.externalId, account.type)
  })
}

module.exports = {
  get,
  post
}
