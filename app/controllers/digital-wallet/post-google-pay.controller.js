'use strict'

const paths = require('../../paths')
const formatAccountPathsFor = require('../../utils/format-account-paths-for')
const logger = require('../../utils/logger')(__filename)
const { ConnectorClient } = require('../../services/clients/connector.client')
const { getCurrentCredential } = require('../../utils/credentials')
const connector = new ConnectorClient(process.env.CONNECTOR_URL)

module.exports = async (req, res, next) => {
  const gatewayAccountId = req.account.gateway_account_id
  const enable = req.body['google-pay'] === 'on'
  const gatewayMerchantId = req.body.merchantId
  const googlePayPath = formatAccountPathsFor(paths.account.digitalWallet.googlePay, req.account && req.account.external_id)

  if (enable && !gatewayMerchantId) {
    req.flash('genericError', 'Enter a valid Merchant ID')
    return res.redirect(googlePayPath)
  }

  if (enable) {
    try {
      const credential = getCurrentCredential(req.account)
      await connector.patchGooglePayGatewayMerchantId(gatewayAccountId, credential.gateway_account_credential_id, gatewayMerchantId, req.user && req.user.externalId)
      logger.info('Set google pay merchant ID')
    } catch (error) {
      logger.info('Error setting google pay merchant ID', { error })
      if (error.errorCode === 400) {
        req.flash('genericError', 'There was an error enabling google pay. Check that the Merchant ID you entered is correct and that your PSP account credentials have been set.')
        return res.redirect(googlePayPath)
      } else {
        next(error)
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
