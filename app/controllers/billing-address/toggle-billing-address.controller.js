'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const logger = require('../../utils/logger')(__filename)
const { response } = require('../../utils/response')
const router = require('../../routes')
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
    logger.info(`[${correlationId}] - Updated collect billing address enabled(${req.body['billing-address-toggle']}). user=${req.session.passport.user}`)
    res.redirect(router.paths.toggleBillingAddress.index)
  } catch (error) {
    renderErrorView(req, res, error.message)
  }
}

module.exports = {
  getIndex,
  postIndex
}
