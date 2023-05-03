'use strict'
const urljoin = require('url-join')
const paths = require('../../paths')
const { response } = require('../../utils/response')
const { ConnectorClient } = require('../../services/clients/connector.client')
const { getSwitchingCredential } = require('../../utils/credentials')
const formatAccountPathsFor = require('../../utils/format-account-paths-for')
const { CREDENTIAL_STATE } = require('../../utils/credentials')
const {
  VERIFY_PSP_INTEGRATION_CHARGE_EXTERNAL_ID_KEY,
  filterNextUrl
} = require('../../utils/verify-psp-integration')
const logger = require('../../utils/logger')(__filename)

const connectorClient = new ConnectorClient(process.env.CONNECTOR_URL)
const selfserviceURL = process.env.SELFSERVICE_URL

const VERIFY_PAYMENT_AMOUNT_IN_PENCE = 200

const stripeTestPaymentStates = [CREDENTIAL_STATE.ENTERED, CREDENTIAL_STATE.VERIFIED, CREDENTIAL_STATE.ACTIVE]

function verifyPSPIntegrationPaymentPage (req, res, next) {
  try {
    const targetCredential = getSwitchingCredential(req.account)
    let allowTestPayment = true
    if (targetCredential.payment_provider === 'stripe') {
      allowTestPayment = stripeTestPaymentStates.includes(targetCredential.state)
    }
    response(req, res, 'switch-psp/verify-psp-integration-payment', { targetCredential, allowTestPayment })
  } catch (error) {
    next(error)
  }
}

async function startPaymentJourney (req, res, next) {
  try {
    const targetCredential = getSwitchingCredential(req.account)
    const charge = await connectorClient.postChargeRequest(req.account.gateway_account_id, {
      amount: VERIFY_PAYMENT_AMOUNT_IN_PENCE,
      description: 'Live payment to verify new PSP',
      reference: 'VERIFY_PSP_INTEGRATION',
      return_url: urljoin(selfserviceURL, formatAccountPathsFor(paths.account.switchPSP.receiveVerifyPSPIntegrationPayment, req.account.external_id)),
      credential_id: targetCredential.external_id
    })

    req.session[VERIFY_PSP_INTEGRATION_CHARGE_EXTERNAL_ID_KEY] = charge.charge_id
    res.redirect(filterNextUrl(charge))
  } catch (error) {
    next(error)
  }
}

async function completePaymentJourney (req, res, next) {
  try {
    const chargeExternalId = req.session[VERIFY_PSP_INTEGRATION_CHARGE_EXTERNAL_ID_KEY]
    delete req.session[VERIFY_PSP_INTEGRATION_CHARGE_EXTERNAL_ID_KEY]
    const targetCredential = getSwitchingCredential(req.account)
    if (!chargeExternalId) {
      throw new Error('No charge found on session')
    }

    const charge = await connectorClient.getCharge(req.account.gateway_account_id, chargeExternalId)
    if (charge.state.status === 'success') {
      await connectorClient.patchAccountGatewayAccountCredentialsState({
        gatewayAccountId: req.account.gateway_account_id,
        gatewayAccountCredentialsId: targetCredential.gateway_account_credential_id,
        state: CREDENTIAL_STATE.VERIFIED,
        userExternalId: req.user && req.user.externalId
      })
      req.flash('verifyIntegrationPaymentSuccess', true)
      res.redirect(formatAccountPathsFor(paths.account.switchPSP.index, req.account.external_id))
    } else {
      logger.info('Live payment to verify PSP integration had a non-success status')
      req.flash('verifyIntegrationPaymentFailed', true)
      res.redirect(formatAccountPathsFor(paths.account.switchPSP.verifyPSPIntegrationPayment, req.account.external_id))
    }
  } catch (error) {
    logger.warn(`Exception raised during very PSP intgration callback: ${error.message}`)
    req.flash('verifyIntegrationPaymentFailed', true)
    res.redirect(formatAccountPathsFor(paths.account.switchPSP.verifyPSPIntegrationPayment, req.account.external_id))
  }
}

module.exports = { verifyPSPIntegrationPaymentPage, startPaymentJourney, completePaymentJourney }
