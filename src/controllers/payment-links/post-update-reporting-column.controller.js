'use strict'

const logger = require('../../utils/logger')(__filename)
const MetadataForm = require('./metadata/metadata-form')
const { getPaymentLinksContext, metadata } = require('../../utils/payment-links')

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

    logger.info('Reporting column added', {
      reporting_column_key: form.values[form.fields.metadataKey.id],
      product_external_id: req.params && req.params.productExternalId
    })

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
    logger.info('Reporting column updated', {
      original_reporting_column_key: key,
      reporting_column_key: form.values[form.fields.metadataKey.id],
      product_external_id: req.params && req.params.productExternalId
    })

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

    logger.info('Reporting column deleted', {
      reporting_column_key: key,
      product_external_id: req.params && req.params.productExternalId
    })

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
