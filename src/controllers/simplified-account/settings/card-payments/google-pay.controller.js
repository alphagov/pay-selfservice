const paths = require('@root/paths')
const { response } = require('@utils/response')
const { formatSimplifiedAccountPathsFor } = require('@utils/simplified-account/format')
const { updateAllowGooglePay } = require('@services/card-payments.service')
const { validateOnOffToggleWithInlineFields } = require('@utils/simplified-account/validation/on-off-toggle')
const { body } = require('express-validator')
const { WORLDPAY } = require('@models/constants/payment-providers')
const { updateGooglePayMerchantId } = require('@services/worldpay-details.service')
const { GOOGLE_PAY_MERCHANT_ID_FIELD } = require('@controllers/simplified-account/settings/card-payments/constants')



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
  const { isValid, isOn, errors } = await validateOnOffToggleWithInlineFields(
    'googlePay',
    [
      ...(account.paymentProvider === WORLDPAY ? [googlePayMerchantIdValidation] : [])
    ],
    req)
  if (!isValid) {
    return postErrorResponse(req, res, {
      errors,
      isOn,
      account,
      service,
      enteredGooglePayMerchantId: req.body[GOOGLE_PAY_MERCHANT_ID_FIELD]
    })
  }
  try {
    if (isOn && account.paymentProvider === WORLDPAY) {
      await updateGooglePayMerchantId(service.externalId, account.type, account.getCurrentCredential().externalId, user.externalId, req.body[GOOGLE_PAY_MERCHANT_ID_FIELD])
    }
    await updateAllowGooglePay(service.externalId, account.type, isOn)
    res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.cardPayments.index, service.externalId, account.type))
  } catch (error) {
    next(error)
  }
}

/**
 * @param {import('@utils/types/settings/settings-request').SettingsRequest} req
 * @param {import('express').Response} res
 * @param {Object} context
 */
function postErrorResponse (req, res, context) {
  return response(req, res, 'simplified-account/settings/card-payments/google-pay', {
    errors: {
      summary: context.errors.errorSummary,
      formErrors: context.errors.formErrors
    },
    currentState: context.isOn ? 'on' : 'off',
    currentGooglePayMerchantId: context.enteredGooglePayMerchantId,
    paymentProvider: context.account.paymentProvider,
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.cardPayments.index, context.service.externalId, context.account.type)
  })
}

const googlePayMerchantIdValidation = body(GOOGLE_PAY_MERCHANT_ID_FIELD)
  .notEmpty()
  .withMessage('Enter a Google Pay merchant ID')
  .bail()
  .matches(/[0-9a-f]{15}/)
  .withMessage('Enter a valid Google Pay merchant ID')

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
