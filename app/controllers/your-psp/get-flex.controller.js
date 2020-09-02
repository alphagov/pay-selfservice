'use strict'

const lodash = require('lodash')

const { response } = require('../../utils/response')

module.exports = (req, res) => {
  const { change } = req.query || {}

  const isFlexConfigured = req.account.worldpay_3ds_flex &&
    req.account.worldpay_3ds_flex.organisational_unit_id !== undefined &&
    req.account.worldpay_3ds_flex.organisational_unit_id.length > 0

  let errors = false
  let orgUnitId = lodash.get(req, 'account.worldpay_3ds_flex.organisational_unit_id' || '')
  let issuer = lodash.get(req, 'account.worldpay_3ds_flex.issuer' || '')

  let worldpay3dsFlexPageData = lodash.get(req, 'session.pageData.worldpay3dsFlex')
  if (worldpay3dsFlexPageData) {
    delete req.session.pageData.worldpay3dsFlex

    if (worldpay3dsFlexPageData.errors) {
      errors = worldpay3dsFlexPageData.errors

      if (worldpay3dsFlexPageData.orgUnitId) {
        orgUnitId = worldpay3dsFlexPageData.orgUnitId
      }

      if (worldpay3dsFlexPageData.issuer) {
        issuer = worldpay3dsFlexPageData.issuer
      }
    }
  }

  return response(req, res, 'your-psp/flex', { errors, change, isFlexConfigured, orgUnitId, issuer })
}
