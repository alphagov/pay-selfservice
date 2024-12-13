const { response } = require('@utils/response')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')
const { body, validationResult } = require('express-validator')
const formatValidationErrors = require('@utils/simplified-account/format/format-validation-errors')
const worldpayDetailsService = require('@services/worldpay-details.service')
const { WorldpayCredential } = require('@models/gateway-account-credential/GatewayAccountCredential.class')

function get (req, res) {
  return response(req, res, 'simplified-account/settings/worldpay-details/credentials', {
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.worldpayDetails.index,
      req.service.externalId, req.account.type)
  })
}

const worldpayCredentialsValidations = [
  body('merchantCode').not().isEmpty().withMessage('Enter your merchant code').bail()
    .custom((value, { req }) => {
      if (req.account.allowMoto && !value.endsWith('MOTO') && !value.endsWith('MOTOGBP')) {
        throw new Error('Enter a MOTO merchant code. MOTO payments are enabled for the account')
      }
      return true
    }),
  body('username').not().isEmpty().withMessage('Enter your username'),
  body('password').not().isEmpty().withMessage('Enter your password')
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

  try {
    await worldpayDetailsService.checkCredential(req.service.externalId, req.account.type, credential)
  } catch (e) {
    return errorResponse(req, res, {
      summary: [
        {
          text: 'Check your Worldpay credentials, failed to link your account to Worldpay with credentials provided',
          href: '#merchantCode'
        }
      ]
    })
  }

  return res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.worldpayDetails.index,
    req.service.externalId, req.account.type))
}

const errorResponse = (req, res, errors) => {
  return response(req, res, 'simplified-account/settings/worldpay-details/credentials', {
    errors,
    merchantCode: req.body.merchantCode,
    username: req.body.username,
    password: req.body.password,
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.worldpayDetails.index,
      req.service.externalId, req.account.type)
  })
}

module.exports = {
  get,
  post
}
