'use strict'

const lodash = require('lodash')

const logger = require('../../utils/logger')(__filename)
const { response } = require('../../utils/response')
const paths = require('../../paths')
const formatAccountPathsFor = require('../../utils/format-account-paths-for')
const { renderErrorView } = require('../../utils/response')
const serviceService = require('../../services/service.service')
const { CORRELATION_HEADER } = require('../../utils/correlation-header')

const getIndex = (req, res) => {
  const model = {
    collectBillingAddress: req.service.collectBillingAddress
  }
  response(req, res, 'billing-address/index', model)
}

const postIndex = async (req, res) => {
  const correlationId = lodash.get(req, 'headers.' + CORRELATION_HEADER, '')
  const serviceExternalId = lodash.get(req, 'service.externalId')
  const isEnabled = req.body['billing-address-toggle'] === 'on'
  const result = await serviceService.toggleCollectBillingAddress(serviceExternalId, isEnabled, correlationId)

  try {
    if (result.collect_billing_address) {
      req.flash('generic', 'Billing address is turned on for this service')
    } else {
      req.flash('generic', 'Billing address is turned off for this service')
    }
    logger.info(`Updated collect billing address enabled(${req.body['billing-address-toggle']})`)
    res.redirect(formatAccountPathsFor(paths.account.toggleBillingAddress.index, req.account && req.account.external_id))
  } catch (error) {
    renderErrorView(req, res, error.message)
  }
}

module.exports = {
  getIndex,
  postIndex
}
