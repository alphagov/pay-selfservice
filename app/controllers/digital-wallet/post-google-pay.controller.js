'use strict'

const paths = require('../../paths')
const logger = require('../../utils/logger')(__filename)
const { renderErrorView } = require('../../utils/response')
const { ConnectorClient } = require('../../services/clients/connector.client')
const { CORRELATION_HEADER } = require('../../utils/correlation-header')
const connector = new ConnectorClient(process.env.CONNECTOR_URL)

module.exports = async (req, res) => {
  const gatewayAccountId = req.account.gateway_account_id
  const correlationId = req.headers[CORRELATION_HEADER] || ''
  const enable = req.body['google-pay'] === 'on'
  const gatewayMerchantId = req.body.merchantId

  if (enable && !gatewayMerchantId) {
    req.flash('genericError', 'Enter a valid Merchant ID')
    return res.redirect(paths.digitalWallet.googlePay)
  }

  if (enable) {
    try {
      await connector.setGatewayMerchantId(gatewayAccountId, gatewayMerchantId, correlationId)
      logger.info(`${correlationId} set google pay merchant ID for ${gatewayAccountId}`)
    } catch (error) {
      logger.info(`${correlationId} error setting google pay merchant ID for ${gatewayAccountId}: `, error)
      if (error.errorCode === 400) {
        req.flash('genericError', 'There was an error enabling google pay. Check that the Merchant ID you entered is correct and that your PSP account credentials have been set.')
        return res.redirect(paths.digitalWallet.googlePay)
      } else {
        return renderErrorView(req, res, false, error.errorCode)
      }
    }
  }

  try {
    await connector.toggleGooglePay(gatewayAccountId, enable, correlationId)
    logger.info(`${correlationId} ${enable ? 'enabled' : 'disabled'} google pay boolean for ${gatewayAccountId}`)

    req.flash('generic', `Google Pay successfully ${enable ? 'enabled' : 'disabled'}.`)
    return res.redirect(paths.digitalWallet.googlePay)
  } catch (error) {
    logger.error(`${correlationId} error enabling google pay for ${gatewayAccountId}: ${error}`)
    return renderErrorView(req, res, false, error.errorCode)
  }
}
