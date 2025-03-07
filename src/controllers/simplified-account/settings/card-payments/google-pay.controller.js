const paths = require('@root/paths')
const { response } = require('@utils/response')
const { formatSimplifiedAccountPathsFor, formatValidationErrors } = require('@utils/simplified-account/format')
const { updateAllowGooglePay } = require('@services/card-payments.service')
const { validationResult } = require('express-validator')
const { WORLDPAY } = require('@models/constants/payment-providers')
const { updateGooglePayMerchantId } = require('@services/worldpay-details.service')
const { googlePaySchema, GOOGLE_PAY_TOGGLE_FIELD, GOOGLE_PAY_MERCHANT_ID_FIELD } = require('@utils/simplified-account/validation/google-pay.schema')

/**
 * @param {import('@utils/types/settings/settings-request').SettingsRequest} req
 * @param {import('express').Response} res
 */
function get (req, res) {
  const account = req.account
  const service = req.service
  response(req, res, 'simplified-account/settings/card-payments/google-pay', {
    currentState: account.allowGooglePay ? 'on' : 'off',
    paymentProvider: account.paymentProvider,
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.cardPayments.index, service.externalId, account.type),
    ...(account.paymentProvider === WORLDPAY && {
      currentGooglePayMerchantId: account.getCurrentCredential().credentials?.googlePayMerchantId
    })
  })
}

/**
 * @param {import('@utils/types/settings/settings-request').SettingsRequest} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function post (req, res, next) {
  const account = req.account
  const service = req.service
  const user = req.user

  const validations = [
    googlePaySchema.onOffToggle.validate,
    googlePaySchema.googlePayMerchantId.validate
  ]

  await Promise.all(validations.map(validation => validation.run(req)))
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    const formattedErrors = formatValidationErrors(errors)
    return response(req, res, 'simplified-account/settings/card-payments/google-pay', {
      errors: {
        summary: formattedErrors.errorSummary,
        formErrors: formattedErrors.formErrors
      },
      currentState: req.body[GOOGLE_PAY_TOGGLE_FIELD],
      currentGooglePayMerchantId: req.body[GOOGLE_PAY_MERCHANT_ID_FIELD],
      paymentProvider: account.paymentProvider,
      backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.cardPayments.index, service.externalId, account.type)
    })
  }

  try {
    const isOn = req.body[GOOGLE_PAY_TOGGLE_FIELD] === 'on'
    if (isOn && account.paymentProvider === WORLDPAY) {
      const googlePayMerchantId = req.body[GOOGLE_PAY_MERCHANT_ID_FIELD]
      await updateGooglePayMerchantId(service.externalId, account.type, account.getCurrentCredential().externalId, user.externalId, googlePayMerchantId)
    }
    await updateAllowGooglePay(service.externalId, account.type, isOn)
    res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.cardPayments.index, service.externalId, account.type))
  } catch (error) {
    next(error)
  }
}

/**
 * Worldpay accounts need to have an active credential configured before they can access this setting
 * @param {import('@utils/types/settings/settings-request').SettingsRequest} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const worldpayAccountHasActiveCredential = (req, res, next) => {
  const account = req.account
  const service = req.service
  if (account.paymentProvider === WORLDPAY && account.getActiveCredential() === null) {
    return res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.cardPayments.index, service.externalId, account.type))
  }
  next()
}

module.exports = {
  get: [worldpayAccountHasActiveCredential, get],
  post: [worldpayAccountHasActiveCredential, post]
}
