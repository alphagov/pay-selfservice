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
    const isSwitchingCredentials = isSwitchingCredentialsRoute(req)
    response(req, res, 'credentials/worldpay', { form, isSwitchingCredentials, credential })
  } catch (error) {
    next(error)
  }
}

async function updateWorldpayCredentials (req, res, next) {
  const gatewayAccountId = req.account.gateway_account_id
  const isSwitchingCredentials = isSwitchingCredentialsRoute(req)

  try {
    const credential = getCredentialByExternalId(req.account, req.params.credentialId)
    const results = credentialsForm.validate(req.body)

    if (results.errorSummaryList.length) {
      return response(req, res, 'credentials/worldpay', { form: results, isSwitchingCredentials, credential })
    }

    if (SKIP_PSP_CREDENTIAL_CHECKS !== 'true') {
      const checkCredentialsWithWorldpay = await connectorClient.postCheckWorldpayCredentials({ gatewayAccountId, payload: results.values })
      if (checkCredentialsWithWorldpay.result !== 'valid') {
        logger.warn('Provided credentials failed validation with Worldpay')
        results.errorSummaryList = formatErrorsForSummaryList({ 'merchantId': 'Check your Worldpay credentials, failed to link your account to Worldpay with credentials provided' })
        return response(req, res, 'credentials/worldpay', { form: results, isSwitchingCredentials, credential })
      }

      logger.info('Successfully validated credentials with Worldpay')
    }

    await connectorClient.patchAccountGatewayAccountCredentials({
      gatewayAccountId,
      gatewayAccountCredentialsId: credential.gateway_account_credential_id,
      credentials: results.values,
      userExternalId: req.user.externalId
    })
    logger.info('Successfully updated Worldpay credentials on account')

    if (isSwitchingCredentials) {
      return res.redirect(303, formatAccountPathsFor(paths.account.switchPSP.index, req.account.external_id))
    } else {
      return res.redirect(303, formatAccountPathsFor(paths.account.yourPsp.index, req.account.external_id, credential.external_id))
    }
  } catch (error) {
    next(error)
  }
}

module.exports = { showWorldpayCredentialsPage, updateWorldpayCredentials }
