'use strict'

const lodash = require('lodash')

const { response } = require('../../utils/response.js')
const { index } = require('../../paths').account.prototyping.demoPayment
const { validateMandatoryField } = require('../../utils/validation/server-side-form-validations')
const formatAccountPathsFor = require('../../utils/format-account-paths-for')
const { isCurrency, isAboveMaxAmount } = require('../../utils/validation/field-validation-checks')
const { safeConvertPoundsStringToPence } = require('../../utils/currency-formatter')

const DESCRIPTION_MAX_LENGTH = 255

function getEditDescription (req, res) {
  const demoPaymentDetails = lodash.get(req, 'session.pageData.makeADemoPayment', {})
  response(req, res, 'dashboard/demo-payment/edit-description', {
    paymentDescription: demoPaymentDetails.paymentDescription
  })
}

function updateDescription (req, res, next) {
  const sessionData = req.session && req.session.pageData && req.session.pageData.makeADemoPayment
  if (!sessionData) {
    return next(new Error('Demo payment details not found on session cookie'))
  }
  const paymentDescription = req.body['payment-description']
  const validateResult = validateMandatoryField(paymentDescription, DESCRIPTION_MAX_LENGTH, 'payment description', true)
  if (!validateResult.valid) {
    return response(req, res, 'dashboard/demo-payment/edit-description', {
      errors: {
        description: validateResult.message
      },
      paymentDescription
    })
  }

  sessionData.paymentDescription = paymentDescription
  res.redirect(formatAccountPathsFor(index, req.account && req.account.external_id))
}

function getEditAmount (req, res) {
  const demoPaymentDetails = lodash.get(req, 'session.pageData.makeADemoPayment', {})
  response(req, res, 'dashboard/demo-payment/edit-amount', {
    paymentAmount: demoPaymentDetails.paymentAmount
  })
}

function updateAmount (req, res, next) {
  const sessionData = req.session && req.session.pageData && req.session.pageData.makeADemoPayment
  if (!sessionData) {
    return next(new Error('Demo payment details not found on session cookie'))
  }
  const paymentAmount = req.body['payment-amount']
  const amountInPence = safeConvertPoundsStringToPence(paymentAmount)

  let error = isCurrency(paymentAmount)
  if (!error) {
    error = isAboveMaxAmount(paymentAmount)
  }
  if (error) {
    return response(req, res, 'dashboard/demo-payment/edit-amount', {
      errors: {
        amount: error
      },
      // set back to exiting payment amount as text input will try to transform invalid input into a number
      paymentAmount: sessionData.paymentAmount
    })
  }

  sessionData.paymentAmount = amountInPence
  res.redirect(formatAccountPathsFor(index, req.account && req.account.external_id))
}

module.exports = {
  getEditDescription,
  updateDescription,
  getEditAmount,
  updateAmount
}
