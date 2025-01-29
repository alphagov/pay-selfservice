const { response } = require('@utils/response')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')
const { body, validationResult } = require('express-validator')
const formatValidationErrors = require('@utils/simplified-account/format/format-validation-errors')

function get (req, res) {
  return response(req, res, 'simplified-account/settings/worldpay-details/flex-credentials', {
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.worldpayDetails.index,
      req.service.externalId, req.account.type)
  })
}

const worldpayCredentialsValidations = [
  body('organisationalUnitId')
    .not().isEmpty().withMessage('Enter your organisational unit ID').bail()
    .isHexadecimal().withMessage('Enter your organisational unit ID in the format you received it').bail()
    .isLength({ min: 24, max: 24 }).withMessage('Enter your organisational unit ID in the format you received it').bail(),
  body('issuer')
    .not().isEmpty().withMessage('Enter your issuer').bail()
    .isHexadecimal().withMessage('Enter your issuer in the format you received it').bail()
    .isLength({ min: 24, max: 24 }).withMessage('Enter your issuer in the format you received it').bail(),
  body('jwtMacKey')
    .not().isEmpty().withMessage('Enter your JWT MAC key').bail()
    .isUUID().withMessage('Enter your JWT MAC key in the format you received it').bail()
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

  return res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.worldpayDetails.index,
    req.service.externalId, req.account.type))
}

const errorResponse = (req, res, errors) => {
  return response(req, res, 'simplified-account/settings/worldpay-details/flex-credentials', {
    errors,
    credentials: {
      organisationalUnitId: req.body.organisationalUnitId,
      issuer: req.body.issuer,
      jwtMacKey: req.body.jwtMacKey
    },
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.worldpayDetails.index,
      req.service.externalId, req.account.type)
  })
}

module.exports = {
  get,
  post
}
