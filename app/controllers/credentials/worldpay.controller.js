const paths = require('../../paths')
const { response } = require('../../utils/response')
const { CORRELATION_HEADER } = require('../../utils/correlation-header')
const formatAccountPathsFor = require('../../utils/format-account-paths-for')
const { ConnectorClient } = require('../../services/clients/connector.client')
const connectorClient = new ConnectorClient(process.env.CONNECTOR_URL)
const { CredentialsForm, isNotEmpty, formatErrorsForSummaryList } = require('./credentials-form')

const credentialsForm = new CredentialsForm([
  { id: 'merchant_id', valid: [{ method: isNotEmpty, message: 'Enter a merchant code' }] },
  { id: 'username', valid: [{ method: isNotEmpty, message: 'Enter a username' }] },
  { id: 'password', valid: [{ method: isNotEmpty, message: 'Enter a password' }] }
])

function showWorldpayCredentialsPage (req, res, next) {
  const form = credentialsForm.from(req.account.credentials)
  response(req, res, 'credentials/worldpay', { form })
}

async function updateWorldpayCredentials (req, res, next) {
  const gatewayAccountId = req.account.gateway_account_id
  const correlationId = req.headers[CORRELATION_HEADER] || ''

  const results = credentialsForm.validate(req.body)

  if (results.errorSummaryList.length) {
    return response(req, res, 'credentials/worldpay', { form: results })
  }

  try {
    const checkCredentialsWithWorldpay = await connectorClient.postCheckWorldpayCredentials({ correlationId, gatewayAccountId, payload: results.values })
    if (checkCredentialsWithWorldpay.result !== 'valid') {
      results.errorSummaryList = formatErrorsForSummaryList({ 'merchant_id': 'Unable to use credentials with Worldpay, check entered credentials' })
      return response(req, res, 'credentials/worldpay', { form: results })
    }
    await connectorClient.patchAccountCredentials({
      correlationId,
      gatewayAccountId,
      payload: { credentials: results.values }
    })

    return res.redirect(303, formatAccountPathsFor(paths.account.yourPsp.index, req.account.external_id, 'worldpay'))
  } catch (error) {
    next(error)
  }
}

module.exports = { showWorldpayCredentialsPage, updateWorldpayCredentials }
