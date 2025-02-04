const { response } = require('@utils/response')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')
const { body, validationResult } = require('express-validator')
const formatValidationErrors = require('@utils/simplified-account/format/format-validation-errors')
const Worldpay3dsFlexCredential = require('@models/gateway-account-credential/Worldpay3dsFlexCredential.class')
const worldpayDetailsService = require('@services/worldpay-details.service')

const INTEGRATION_VERSION_3DS = 2

function get (req, res) {
  return response(req, res, 'simplified-account/settings/worldpay-details/flex-credentials', {
    credentials: {
      organisationalUnitId: req.account?.worldpay3dsFlex?.organisationalUnitId,
      issuer: req.account?.worldpay3dsFlex?.issuer
    },
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.worldpayDetails.index,
      req.service.externalId, req.account.type)
  })
}

const worldpayCredentialsValidations = [
  body('organisationalUnitId')
    .notEmpty().withMessage('Enter your organisational unit ID').bail()
    .isHexadecimal().withMessage('Enter your organisational unit ID in the format you received it').bail()
    .isLength({ min: 24, max: 24 }).withMessage('Enter your organisational unit ID in the format you received it').bail(),
  body('issuer')
    .notEmpty().withMessage('Enter your issuer').bail()
    .isHexadecimal().withMessage('Enter your issuer in the format you received it').bail()
    .isLength({ min: 24, max: 24 }).withMessage('Enter your issuer in the format you received it').bail(),
  body('jwtMacKey')
    .notEmpty().withMessage('Enter your JWT MAC key').bail()
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

  const flexCredential = new Worldpay3dsFlexCredential()
    .withOrganisationalUnitId(req.body.organisationalUnitId)
    .withIssuer(req.body.issuer)
    .withJwtMacKey(req.body.jwtMacKey)

  const isValid = await worldpayDetailsService.check3dsFlexCredential(req.service.externalId, req.account.type, flexCredential)
  if (!isValid) {
    return errorResponse(req, res, {
      summary: [
        {
          text: 'Check your 3DS credentials, failed to link your account to Worldpay with credentials provided',
          href: '#organisational-unit-id'
        }
      ]
    })
  }

  await worldpayDetailsService.update3dsFlexCredentials(req.service.externalId, req.account.type, flexCredential)

  await worldpayDetailsService.updateIntegrationVersion3ds(req.service.externalId, req.account.type, INTEGRATION_VERSION_3DS)

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
