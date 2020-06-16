'use strict'

const lodash = require('lodash')

const logger = require('../../../../utils/logger')(__filename)
const { renderErrorView } = require('../../../../utils/response')
const { updateCompany } = require('../../../../services/clients/stripe/stripe_client')
const { ConnectorClient } = require('../../../../services/clients/connector_client')
const connector = new ConnectorClient(process.env.CONNECTOR_URL)
const paths = require('../../../../paths')

module.exports = (req, res) => {
  const sessionVatNumber = lodash.get(req, 'session.pageData.stripeSetup.vatNumberData.vatNumber', '')
  const sanitisedVatNumber = sessionVatNumber.replace(/\s/g, '').toUpperCase()
  const sessionCompanyNumber = lodash.get(req, 'session.pageData.stripeSetup.companyNumberData.companyNumber', '')
  const sanitisedCompanyNumber = sessionCompanyNumber.replace(/\s/g, '').toUpperCase()

  const stripeCompanyBody = {
    vat_id: sanitisedVatNumber
  }
  if (sanitisedCompanyNumber) {
    stripeCompanyBody.tax_id = sanitisedCompanyNumber
  }
  return updateCompany(res.locals.stripeAccount.stripeAccountId, stripeCompanyBody)
    .then(() => {
      return connector.setStripeAccountSetupFlag(req.account.gateway_account_id, 'vat_number_company_number', req.correlationId)
    })
    .then(() => {
      delete req.session.pageData.stripeSetup.vatNumberData
      delete req.session.pageData.stripeSetup.companyNumberData
      return res.redirect(303, paths.dashboard.index)
    })
    .catch(error => {
      logger.error(`[${req.correlationId}] Error submitting "VAT number / company number" details, error = `, error)
      return renderErrorView(req, res, 'Please try again or contact support team')
    })
}
