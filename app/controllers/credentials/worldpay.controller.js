const paths = require('../../paths')
const logger = require('../../utils/logger')(__filename)
const { response } = require('../../utils/response')
const formatAccountPathsFor = require('../../utils/format-account-paths-for')
const { isSwitchingCredentialsRoute, getCredentialByExternalId } = require('../../utils/credentials')
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
  try {
    const credential = getCredentialByExternalId(req.account, req.params.credentialId)
    const form = credentialsForm.from(credential.credentials)
    const switchingToCredentials = isSwitchingCredentialsRoute(req)
    response(req, res, 'credentials/worldpay', { form, switchingToCredentials, credential })
  } catch (error) {
    next(error)
  }
}

async function updateWorldpayCredentials (req, res, next) {
  const gatewayAccountId = req.account.gateway_account_id
  const switchingToCredentials = isSwitchingCredentialsRoute(req)
  const correlationId = req.correlationId || ''

  try {
    const credential = getCredentialByExternalId(req.account, req.params.credentialId)
    const results = credentialsForm.validate(req.body)

    if (results.errorSummaryList.length) {
      return response(req, res, 'credentials/worldpay', { form: results, switchingToCredentials, credential })
    }

    if (SKIP_PSP_CREDENTIAL_CHECKS !== 'true') {
      const checkCredentialsWithWorldpay = await connectorClient.postCheckWorldpayCredentials({ correlationId, gatewayAccountId, payload: results.values })
      if (checkCredentialsWithWorldpay.result !== 'valid') {
        logger.warn('Provided credentials failed validation with Worldpay')
        results.errorSummaryList = formatErrorsForSummaryList({ 'merchantId': 'Check your Worldpay credentials, failed to link your account to Worldpay with credentials provided' })
        return response(req, res, 'credentials/worldpay', { form: results, switchingToCredentials, credential })
      }

      logger.info('Successfully validated credentials with Worldpay')
    }

    // @TODO(PP-8273) only use future strategy when backend no longer relies on top level credentials
    const useFutureCredentialsUpdateStategy = req.account.gateway_account_credentials.length > 1
    if (useFutureCredentialsUpdateStategy) {
      await connectorClient.patchAccountGatewayAccountCredentials({
        correlationId,
        gatewayAccountId,
        gatewayAccountCredentialsId: credential.gateway_account_credential_id,
        credentials: results.values,
        userExternalId: req.user.externalId
      })
      logger.info('Successfully updated credentials for pending Worldpay credentials on account')
    } else {
      await connectorClient.legacyPatchAccountCredentials({
        correlationId,
        gatewayAccountId,
        payload: { credentials: results.values }
      })
      logger.info('Successfully updated credentials for Worldpay account')
    }

    if (switchingToCredentials) {
      return res.redirect(303, formatAccountPathsFor(paths.account.switchPSP.index, req.account.external_id))
    } else {
      return res.redirect(303, formatAccountPathsFor(paths.account.yourPsp.index, req.account.external_id, credential.external_id))
    }
  } catch (error) {
    next(error)
  }
}

module.exports = { showWorldpayCredentialsPage, updateWorldpayCredentials }
