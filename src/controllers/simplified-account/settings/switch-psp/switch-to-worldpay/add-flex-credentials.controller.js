const { response } = require('@utils/response')
const formatSimplifiedAccountPathsFor = require('../../../../../utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')
const { THREE_DS_FLEX_VALIDATION } = require('@utils/simplified-account/validation/worldpay/validations.schema')
const { validationResult } = require('express-validator')
const formatValidationErrors = require('@utils/simplified-account/format/format-validation-errors')
const Worldpay3dsFlexCredential = require('@models/gateway-account-credential/Worldpay3dsFlexCredential.class')
const worldpayDetailsService = require('@services/worldpay-details.service')

function get (req, res) {
  const context = {
    credentials: {
      organisationalUnitId: req.account?.worldpay3dsFlex?.organisationalUnitId,
      issuer: req.account?.worldpay3dsFlex?.issuer
    },
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.switchPsp.switchToWorldpay.index,
      req.service.externalId, req.account.type)
  }
  return response(req, res, 'simplified-account/settings/switch-psp/switch-to-worldpay/add-3ds-flex-credentials', context)
}

async function post (req, res) {
  await Promise.all(THREE_DS_FLEX_VALIDATION.map(validation => validation.run(req)))
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
  await worldpayDetailsService.updateIntegrationVersion3ds(req.service.externalId, req.account.type)
  res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.switchPsp.switchToWorldpay.index,
    req.service.externalId, req.account.type))
}

const errorResponse = (req, res, errors) => {
  return response(req, res,
    'simplified-account/settings/switch-psp/switch-to-worldpay/add-3ds-flex-credentials',
    {
      errors,
      credentials: {
        organisationalUnitId: req.body.organisationalUnitId,
        issuer: req.body.issuer,
        jwtMacKey: req.body.jwtMacKey
      },
      backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.switchPsp.switchToWorldpay.index,
        req.service.externalId, req.account.type)
    })
}

module.exports = {
  get, post
}
