'use strict'
const crypto = require('crypto')
const urljoin = require('url-join')
const paths = require('../../paths')
const formatAccountPathsFor = require('../../utils/format-account-paths-for')
const { response } = require('../../utils/response')
const { ConnectorClient } = require('../../services/clients/connector.client')
const { CONNECTOR_URL } = process.env
const connectorClient = new ConnectorClient(CONNECTOR_URL)

module.exports = async (req, res) => {
  const requestLivePayment = req.body.request_live_payment === 'true'
  const userDidConfirm = req.body.confirmed

  if (requestLivePayment) {
    try {
      // @TODO(sfount) fixed to the services sandbox account for now as local env doesn't connect to psp
      const gatewayAccountId = req.account.gateway_account_id
      // const gatewayAccountId = 8
      const result = await connectorClient.postChargeRequest(gatewayAccountId, {
        amount: 100,
        description: `Live payment to test Worldpay PSP`,
        reference: crypto.randomBytes(12).toString('hex'),
        return_url: urljoin(req.headers.origin, formatAccountPathsFor(paths.account.yourPsp.completeTestPayment, req.account.external_id)),
        metadata: {
          'role': 'PSP_CREDENTIAL_VALIDATION'
        }
      })
      // req.session.prototype = req.session.prototype || {}
      req.currentAccountPrototype.testPaymentChargeId = result.charge_id
      res.redirect(result.links[2].href)
    } catch (error) {
      console.log(error)
      res.redirect(formatAccountPathsFor(paths.account.yourPsp.switch, req.account.external_id))
    }
  } else {
    // req.session.prototype = req.session.prototype || {}
    req.currentAccountPrototype.livePaymentCompleted = true
    res.redirect(formatAccountPathsFor(paths.account.yourPsp.switch, req.account.external_id))
  }
}
