'use strict'

const lodash = require('lodash')

const logger = require('../../utils/logger')(__filename)
const { response } = require('../../utils/response')
const paths = require('../../paths')
const formatAccountPathsFor = require('../../utils/format-account-paths-for')
const serviceService = require('../../services/service.service')
const { CORRELATION_HEADER } = require('../../utils/correlation-header')

function getIndex (req, res) {
  const model = {
    collectBillingAddress: req.service.collectBillingAddress
  }
  response(req, res, 'billing-address/index', model)
}

async function postIndex (req, res, next) {
  const correlationId = lodash.get(req, 'headers.' + CORRELATION_HEADER, '')
  const serviceExternalId = lodash.get(req, 'service.externalId')
  const isEnabled = req.body['billing-address-toggle'] === 'on'

  try {
    const result = await serviceService.toggleCollectBillingAddress(serviceExternalId, isEnabled, correlationId)
    if (result.collect_billing_address) {
      req.flash('generic', 'Billing address is turned on for this service')
    } else {
      req.flash('generic', 'Billing address is turned off for this service')
    }
    logger.info(`Updated collect billing address enabled(${req.body['billing-address-toggle']})`)
    res.redirect(formatAccountPathsFor(paths.account.settings.index, req.account && req.account.external_id))
  } catch (err) {
    next(err)
  }
}

module.exports = {
  getIndex,
  postIndex
}
