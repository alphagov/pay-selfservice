'use strict'

const lodash = require('lodash')

const paths = require('../../paths')
const { renderErrorView } = require('../../utils/response')
const { ConnectorClient } = require('../../services/clients/connector.client')
const { correlationHeader } = require('../../utils/correlation-header')
const worldpay3dsFlexValidations = require('./worldpay-3ds-flex-validations')

// Constants
const ORGANISATIONAL_UNIT_ID_FIELD = 'organisational-unit-id'
const ISSUER_FIELD = 'issuer'
const JWT_MAC_KEY_FIELD = 'jwt-mac-key'

module.exports = async (req, res) => {
  const connector = new ConnectorClient(process.env.CONNECTOR_URL)

  const correlationId = req.headers[correlationHeader] || ''

  const accountId = req.account.gateway_account_id

  const removeCredentials = req.body['remove-credentials'] === 'true'

  const orgUnitId = lodash.get(req.body, ORGANISATIONAL_UNIT_ID_FIELD, '').trim()
  const issuer = lodash.get(req.body, ISSUER_FIELD, '').trim()
  const jwtMacKey = lodash.get(req.body, JWT_MAC_KEY_FIELD, '').trim()

  if (!removeCredentials) {
    const errors = validate3dsFlexCredentials(orgUnitId, issuer, jwtMacKey)

    if (!lodash.isEmpty(errors)) {
      lodash.set(req, 'session.pageData.worldpay3dsFlex', {
        errors: errors,
        orgUnitId: orgUnitId,
        issuer: issuer
      })
      return res.redirect(303, paths.yourPsp.flex)
    }
  }

  try {
    const flexParams = {
      correlationId: correlationId,
      gatewayAccountId: accountId,
      payload: {
        organisational_unit_id: removeCredentials ? '' : orgUnitId,
        issuer: removeCredentials ? '' : issuer,
        jwt_mac_key: removeCredentials ? '' : jwtMacKey
      }
    }

    // if someone is adding the flex creds, we should make sure 3DS is enabled too and if not enable it
    if (!req.account.requires3ds) {
      const threeDsParams = {
        gatewayAccountId: accountId,
        payload: {
          toggle_3ds: true
        },
        correlationId: correlationId
      }
      await connector.update3dsEnabled(threeDsParams)
    }

    await connector.post3dsFlexAccountCredentials(flexParams)
    req.flash('generic', removeCredentials
      ? 'Credentials deleted. 3DS Flex has been removed from your account. Your payments will now use 3DS only.'
      : 'Your Worldpay 3DS Flex settings have been updated')
    return res.redirect(paths.yourPsp.index)
  } catch (error) {
    return renderErrorView(req, res, false, error.errorCode)
  }
}

function validate3dsFlexCredentials (orgUnitId, issuer, jwtMacKey) {
  const errors = {}

  const orgUnitIdValidationResult = worldpay3dsFlexValidations.validateOrgUnitId(orgUnitId)
  if (!orgUnitIdValidationResult.valid) {
    errors[ORGANISATIONAL_UNIT_ID_FIELD] = orgUnitIdValidationResult.message
  }

  const issuerValidationResult = worldpay3dsFlexValidations.validateIssuer(issuer)
  if (!issuerValidationResult.valid) {
    errors[ISSUER_FIELD] = issuerValidationResult.message
  }

  const jwtMacKeyValidationResult = worldpay3dsFlexValidations.validateJwtMacKey(jwtMacKey)
  if (!jwtMacKeyValidationResult.valid) {
    errors[JWT_MAC_KEY_FIELD] = jwtMacKeyValidationResult.message
  }

  return errors
}
