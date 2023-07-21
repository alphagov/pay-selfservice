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
  { id: 'merchantId', key: 'merchant_code', valid: [{ method: isNotEmpty, message: 'Enter your merchant code' }] },
  { id: 'username', valid: [{ method: isNotEmpty, message: 'Enter your username' }] },
  { id: 'password', valid: [{ method: isNotEmpty, message: 'Enter your password' }] }
])

function showWorldpayCredentialsPage (req, res, next) {
  try {
    const credential = getCredentialByExternalId(req.account, req.params.credentialId)
    const form = credentialsForm.from(credential.credentials && credential.credentials.one_off_customer_initiated)
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

    if (!results.errorSummaryList.length) {
      const merchantId = req.body.merchantId
      if (req.account.allow_moto && !merchantId.endsWith('MOTO')) {
        results.errors.merchantId = 'Enter a MOTO merchant code. MOTO payments are enabled for the account'
      } else if (!req.account.allow_moto && merchantId.endsWith('MOTO')) {
        results.errors.merchantId = 'MOTO merchant code not allowed. Please contact support if you would like MOTO payments enabled'
      }
      results.errorSummaryList = formatErrorsForSummaryList(results.errors)
    }

    if (results.errorSummaryList.length) {
      return response(req, res, 'credentials/worldpay', { form: results, isSwitchingCredentials, credential })
    }

    if (SKIP_PSP_CREDENTIAL_CHECKS !== 'true') {
      const checkCredentialsPayload = {
        merchant_id: results.values.merchant_code,
        username: results.values.username,
        password: results.values.password
      }
      const checkCredentialsWithWorldpay = await connectorClient.postCheckWorldpayCredentials({
        gatewayAccountId,
        payload: checkCredentialsPayload
      })
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
      userExternalId: req.user.externalId,
      credentials: {
        merchant_id: results.values.merchant_code,
        username: results.values.username,
        password: results.values.password
      }
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
