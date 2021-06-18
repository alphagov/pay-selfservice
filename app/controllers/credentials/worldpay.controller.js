const paths = require('../../paths')
const logger = require('../../utils/logger')(__filename)
const { response } = require('../../utils/response')
const { CORRELATION_HEADER } = require('../../utils/correlation-header')
const formatAccountPathsFor = require('../../utils/format-account-paths-for')
const { isSwitchingCredentialsRoute, getSwitchingCredential } = require('../../utils/credentials')
const { ConnectorClient } = require('../../services/clients/connector.client')
const { CredentialsForm, isNotEmpty, formatErrorsForSummaryList } = require('./credentials-form')
const { CONNECTOR_URL, SKIP_PSP_CREDENTIAL_CHECKS } = process.env

const connectorClient = new ConnectorClient(CONNECTOR_URL)

const credentialsForm = new CredentialsForm([
  { id: 'merchantId', key: 'merchant_id', valid: [{ method: isNotEmpty, message: 'Enter your merchant code' }] },
  { id: 'username', valid: [{ method: isNotEmpty, message: 'Enter your username' }] },
  { id: 'password', valid: [{ method: isNotEmpty, message: 'Enter your password' }] }
])

function showWorldpayCredentialsPage (req, res, next) {
  const form = credentialsForm.from(req.account.credentials)
  const switchingToCredentials = isSwitchingCredentialsRoute(req)
  response(req, res, 'credentials/worldpay', { form, switchingToCredentials })
}

async function updateWorldpayCredentials (req, res, next) {
  const gatewayAccountId = req.account.gateway_account_id
  const switchingToCredentials = isSwitchingCredentialsRoute(req)
  const correlationId = req.headers[CORRELATION_HEADER] || ''

  const results = credentialsForm.validate(req.body)

  if (results.errorSummaryList.length) {
    return response(req, res, 'credentials/worldpay', { form: results, switchingToCredentials })
  }

  try {
    if (SKIP_PSP_CREDENTIAL_CHECKS !== 'true') {
      const checkCredentialsWithWorldpay = await connectorClient.postCheckWorldpayCredentials({ correlationId, gatewayAccountId, payload: results.values })
      if (checkCredentialsWithWorldpay.result !== 'valid') {
        logger.warn('Provided credentials failed validation with Worldpay')
        results.errorSummaryList = formatErrorsForSummaryList({ 'merchantId': 'Check your Worldpay credentials, failed to link your account to Worldpay with credentials provided' })
        return response(req, res, 'credentials/worldpay', { form: results, switchingToCredentials })
      }

      logger.info('Successfully validated credentials with Worldpay')
    }

    if (switchingToCredentials) {
      // @TODO(PP-8209) when `credentials` are removed from the top level account, this should always use new patch
      const credential = getSwitchingCredential(req.account)
      await connectorClient.patchAccountGatewayAccountCredentials({
        correlationId,
        gatewayAccountId,
        gatewayAccountCredentialsId: credential.gateway_account_credential_id,
        credentials: results.values,
        userExternalId: req.user.externalId
      })
      logger.info('Successfully updated credentials for pending Worldpay credentials on account')
      return res.redirect(303, formatAccountPathsFor(paths.account.switchPSP.index, req.account.external_id))
    } else {
      await connectorClient.legacyPatchAccountCredentials({
        correlationId,
        gatewayAccountId,
        payload: { credentials: results.values }
      })
      logger.info('Successfully updated credentials for Worldpay account')
      return res.redirect(303, formatAccountPathsFor(paths.account.yourPsp.index, req.account.external_id, 'worldpay'))
    }
  } catch (error) {
    next(error)
  }
}

module.exports = { showWorldpayCredentialsPage, updateWorldpayCredentials }
