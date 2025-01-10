const Ledger = require('../../services/clients/ledger.client')
const { ConnectorClient } = require('../../services/clients/connector.client')
const Paginator = require('../../utils/paginator')
const { CONNECTOR_URL } = process.env

const connectorClient = new ConnectorClient(CONNECTOR_URL)

const PAGE_SIZE = 20
const MAX_PAGES = 2

function formatAgreementPages (agreementSearchResponse) {
  const { total, page, results } = agreementSearchResponse
  const paginator = new Paginator(total, PAGE_SIZE, page)
  const hasMultiplePages = paginator.getLast() > 1
  const links = hasMultiplePages && paginator.getNamedCentredRange(MAX_PAGES, true, true)
  return { total, page, links, results }
}

async function agreements (serviceId, live, accountId, page = 1, filters = {}) {
  const agreementSearchResponse = await Ledger.agreements(serviceId, live, accountId, page, { filters })
  return formatAgreementPages(agreementSearchResponse)
}

function agreement (id, serviceId) {
  return Ledger.agreement(id, serviceId)
}

async function cancelAgreement (gatewayAccountId, agreementId, userEmail, userExternalId) {
  const cancelAgreementParams = {
    gatewayAccountId,
    agreementId,
    payload: {
      user_email: userEmail,
      user_external_id: userExternalId
    }
  }
  await connectorClient.postCancelAgreement(cancelAgreementParams)
}

module.exports = {
  agreement,
  agreements,
  cancelAgreement
}
