'use strict'

const paths = require('../../paths')
const formatAccountPathsFor = require('../../utils/format-account-paths-for')
const logger = require('../../utils/logger')(__filename)
const { ConnectorClient } = require('../../services/clients/connector.client')
const { getCurrentCredential } = require('../../utils/credentials')
const connector = new ConnectorClient(process.env.CONNECTOR_URL)
const { response } = require('../../utils/response')

module.exports = async function updateGooglePaySettings (req, res, next) {
  const gatewayAccountId = req.account.gateway_account_id
  const enable = req.body['google-pay'] === 'on'
  const gatewayMerchantId = req.body.merchantId

  const updateGatewayMerchantId = enable && req.account.payment_provider === 'worldpay'
  if (updateGatewayMerchantId && !gatewayMerchantId) {
    return response(req, res, 'digital-wallet/google-pay', {
      errors: { merchantId: 'Enter a valid Merchant ID' },
      enabled: enable
    })
  }

  if (updateGatewayMerchantId) {
    try {
      const credential = getCurrentCredential(req.account)
      await connector.patchGooglePayGatewayMerchantId(gatewayAccountId, credential.gateway_account_credential_id, gatewayMerchantId, req.user && req.user.externalId)
      logger.info('Set google pay merchant ID')
    } catch (error) {
      logger.info('Error setting google pay merchant ID', { error })
      if (error.errorCode === 400) {
        return response(req, res, 'digital-wallet/google-pay', {
          errors: { merchantId: 'There was an error enabling google pay. Check that the Merchant ID you entered is correct and that your PSP account credentials have been set.' },
          enabled: enable
        })
      } else {
        return next(error)
      }
    }
  }

  try {
    await connector.toggleGooglePay(gatewayAccountId, enable)
    logger.info(`${enable ? 'enabled' : 'disabled'} google pay boolean}`)

    req.flash('generic', `Google Pay successfully ${enable ? 'enabled' : 'disabled'}`)
    return res.redirect(formatAccountPathsFor(paths.account.settings.index, req.account && req.account.external_id))
  } catch (error) {
    next(error)
  }
}
