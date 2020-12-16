'use strict'

const logger = require('../../utils/logger')
const MetadataForm = require('./metadata/metadata-form')
const { getPaymentLinksContext, metadata } = require('../../utils/payment-links')
const { keys } = require('@govuk-pay/pay-js-commons').logging

const { response } = require('../../utils/response.js')

function addMetadata (req, res, next) {
  try {
    const paymentLinksContext = getPaymentLinksContext(req)
    const pageData = {
      self: paymentLinksContext.addMetadataPageUrl,
      cancelRoute: paymentLinksContext.listMetadataPageUrl,
      createLink: paymentLinksContext.isCreatingPaymentLink
    }
    const form = new MetadataForm(req.body, paymentLinksContext.sessionData && paymentLinksContext.sessionData.metadata)
    const validated = form.validate()

    if (validated.errors.length) {
      pageData.tested = validated
      pageData.form = form
      response(req, res, 'payment-links/reporting-columns/edit-reporting-columns', pageData)
      return
    }

    metadata.addMetadata(
      paymentLinksContext.sessionData,
      form.values[form.fields.metadataKey.id],
      form.values[form.fields.metadataValue.id]
    )

    const logContext = {
      is_internal_user: req.user && req.user.internal_user,
      reporting_column_key: form.values[form.fields.metadataKey.id],
      product_external_id: req.params && req.params.productExternalId
    }
    logContext[keys.USER_EXTERNAL_ID] = req.user && req.user.externalId
    logContext[keys.GATEWAY_ACCOUNT_TYPE] = req.account && req.account.type
    logContext[keys.GATEWAY_ACCOUNT_ID] = req.account && req.account.gateway_account_id
    logger.info('Reporting column added', logContext)

    res.redirect(paymentLinksContext.listMetadataPageUrl)
  } catch (error) {
    next(error)
  }
}

function editMetadata (req, res, next) {
  try {
    const paymentLinksContext = getPaymentLinksContext(req)
    const key = req.params.metadataKey

    const existingMetadata = { ...paymentLinksContext.sessionData.metadata }
    delete existingMetadata[key]
    const form = new MetadataForm(req.body, existingMetadata)

    const pageData = {
      self: paymentLinksContext.editMetadataPageUrl,
      cancelRoute: paymentLinksContext.listMetadataPageUrl,
      isEditing: true,
      canEditKey: true,
      createLink: paymentLinksContext.isCreatingPaymentLink
    }
    const validated = form.validate()

    if (validated.errors.length) {
      pageData.tested = validated
      pageData.form = form
      response(req, res, 'payment-links/reporting-columns/edit-reporting-columns', pageData)
      return
    }

    metadata.updateMetadata(
      paymentLinksContext.sessionData,
      key,
      form.values[form.fields.metadataKey.id],
      form.values[form.fields.metadataValue.id]
    )

    const logContext = {
      is_internal_user: req.user && req.user.internal_user,
      original_reporting_column_key: key,
      reporting_column_key: form.values[form.fields.metadataKey.id],
      product_external_id: req.params && req.params.productExternalId
    }
    logContext[keys.USER_EXTERNAL_ID] = req.user && req.user.externalId
    logContext[keys.GATEWAY_ACCOUNT_TYPE] = req.account && req.account.type
    logContext[keys.GATEWAY_ACCOUNT_ID] = req.account && req.account.gateway_account_id
    logger.info('Reporting column updated', logContext)

    res.redirect(paymentLinksContext.listMetadataPageUrl)
  } catch (error) {
    next(error)
  }
}

function deleteMetadata (req, res, next) {
  try {
    const paymentLinksContext = getPaymentLinksContext(req)
    const key = req.params.metadataKey

    metadata.removeMetadata(paymentLinksContext.sessionData, key)

    const logContext = {
      is_internal_user: req.user && req.user.internal_user,
      reporting_column_key: key,
      product_external_id: req.params && req.params.productExternalId
    }
    logContext[keys.USER_EXTERNAL_ID] = req.user && req.user.externalId
    logContext[keys.GATEWAY_ACCOUNT_TYPE] = req.account && req.account.type
    logContext[keys.GATEWAY_ACCOUNT_ID] = req.account && req.account.gateway_account_id
    logger.info('Reporting column deleted', logContext)

    res.redirect(paymentLinksContext.listMetadataPageUrl)
  } catch (error) {
    next(error)
  }
}

module.exports = {
  addMetadata,
  editMetadata,
  deleteMetadata
}
