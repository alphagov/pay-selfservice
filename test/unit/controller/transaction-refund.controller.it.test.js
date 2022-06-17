'use strict'

const sinon = require('sinon')
const nock = require('nock')

const refundController = require('../../../app/controllers/transactions/transaction-refund.controller.js')
const transactionFixtures = require('../../fixtures/refund.fixtures')

const ACCOUNT_ID = '123'
const CHARGE_ID = '123456'
const connectorRefundUrl = `/v1/api/accounts/${ACCOUNT_ID}/charges/${CHARGE_ID}/refunds`
const connectorMock = nock(process.env.CONNECTOR_URL)

let req, res

describe('Refund scenario:', function () {
  afterEach(function () {
    nock.cleanAll()
  })

  beforeEach(function () {
    req = {
      headers: {
        'x-request-id': '1234'
      },
      user: {
        externalId: '92734386',
        email: 'test@example.com'
      },
      account: {
        gateway_account_id: ACCOUNT_ID,
        external_id: 'an-external-id'
      },
      params: {
        chargeId: CHARGE_ID
      },
      flash: sinon.spy()
    }
    res = {
      redirect: sinon.spy()
    }
  })

  it('should show refund sucess message for a full refund', async () => {
    req.body = {
      'refund-type': 'full',
      'refund-amount-available-in-pence': '5000',
      'full-amount': '50.00'
    }

    const request = transactionFixtures.validTransactionRefundRequest({
      user_external_id: req.user.externalId,
      user_email: req.user.email,
      amount: 5000,
      refund_amount_available: 5000
    })
    connectorMock.post(connectorRefundUrl, request)
      .reply(202)

    await refundController(req, res)
    sinon.assert.calledWith(res.redirect, '/account/an-external-id/transactions/123456')
    sinon.assert.calledWith(req.flash, 'refundSuccess', 'true')
  })

  it('should show refund success message for a partial refund', async () => {
    req.body = {
      'refund-type': 'partial',
      'refund-amount-available-in-pence': '5000',
      'full-amount': '50.00',
      'refund-amount': '19.90'
    }

    const request = transactionFixtures.validTransactionRefundRequest({
      user_external_id: req.user.externalId,
      user_email: req.user.email,
      amount: 1990,
      refund_amount_available: 5000
    })
    connectorMock.post(connectorRefundUrl, request)
      .reply(202)

    await refundController(req, res)
    sinon.assert.calledWith(res.redirect, '/account/an-external-id/transactions/123456')
    sinon.assert.calledWith(req.flash, 'refundSuccess', 'true')
  })

  it('should show error message if partial refund amount is invalid', async () => {
    req.body = {
      'refund-type': 'partial',
      'refund-amount-available-in-pence': '5000',
      'full-amount': '5000',
      'refund-amount': '6.000'
    }

    await refundController(req, res)
    sinon.assert.calledWith(res.redirect, '/account/an-external-id/transactions/123456')
    sinon.assert.calledWith(req.flash, 'refundError', 'Enter an amount to refund in pounds and pence using digits and a decimal point. For example “10.50”')
  })

  it('should show error message if partial refund amount is greater than initial charge', async () => {
    req.body = {
      'refund-type': 'partial',
      'refund-amount-available-in-pence': '5000',
      'full-amount': '5000',
      'refund-amount': '60.00'
    }

    const request = transactionFixtures.validTransactionRefundRequest({
      user_external_id: req.user.externalId,
      user_email: req.user.email,
      amount: 6000,
      refund_amount_available: 5000
    })
    const response = transactionFixtures.invalidTransactionRefundResponse({
      error_identifier: 'REFUND_NOT_AVAILABLE',
      reason: 'amount_not_available'
    })

    connectorMock.post(connectorRefundUrl, request)
      .reply(400, response)

    await refundController(req, res)
    sinon.assert.calledWith(res.redirect, '/account/an-external-id/transactions/123456')
    sinon.assert.calledWith(req.flash, 'refundError', 'The amount you tried to refund is greater than the amount available to be refunded. Please try again.')
  })

  it('should show error message if the partial refund amount is smaller than minimum accepted', async () => {
    req.body = {
      'refund-type': 'partial',
      'refund-amount-available-in-pence': '5000',
      'full-amount': '5000',
      'refund-amount': '00.01'
    }

    const request = transactionFixtures.validTransactionRefundRequest({
      user_external_id: req.user.externalId,
      user_email: req.user.email,
      amount: 1,
      refund_amount_available: 5000
    })
    const response = transactionFixtures.invalidTransactionRefundResponse({
      error_identifier: 'REFUND_NOT_AVAILABLE',
      reason: 'amount_min_validation'
    })

    connectorMock.post(connectorRefundUrl, request)
      .reply(400, response)

    await refundController(req, res)
    sinon.assert.calledWith(res.redirect, '/account/an-external-id/transactions/123456')
    sinon.assert.calledWith(req.flash, 'refundError', 'The amount you tried to refund is too low. Please try again.')
  })

  it('should show error message if the partial refund request has already been submitted', async () => {
    req.body = {
      'refund-type': 'partial',
      'refund-amount-available-in-pence': '5000',
      'full-amount': '5000',
      'refund-amount': '19.90'
    }

    const request = transactionFixtures.validTransactionRefundRequest({
      user_external_id: req.user.externalId,
      user_email: req.user.email,
      amount: 1990,
      refund_amount_available: 5000
    })
    const response = transactionFixtures.invalidTransactionRefundResponse({
      error_identifier: 'REFUND_AMOUNT_AVAILABLE_MISMATCH'
    })

    connectorMock.post(connectorRefundUrl, request)
      .reply(400, response)

    await refundController(req, res)
    sinon.assert.calledWith(res.redirect, '/account/an-external-id/transactions/123456')
    sinon.assert.calledWith(req.flash, 'refundError', 'This refund request has already been submitted.')
  })

  it('should show error message if refund request has already been fully refunded', async () => {
    req.body = {
      'refund-type': 'full',
      'refund-amount-available-in-pence': '5000',
      'full-amount': '50.00'
    }

    const request = transactionFixtures.validTransactionRefundRequest({
      user_external_id: req.user.externalId,
      user_email: req.user.email,
      amount: 5000,
      refund_amount_available: 5000
    })
    const response = transactionFixtures.invalidTransactionRefundResponse({
      error_identifier: 'REFUND_NOT_AVAILABLE',
      reason: 'full'
    })

    connectorMock.post(connectorRefundUrl, request)
      .reply(400, response)

    await refundController(req, res)
    sinon.assert.calledWith(res.redirect, '/account/an-external-id/transactions/123456')
    sinon.assert.calledWith(req.flash, 'refundError', 'This refund request has already been submitted.')
  })

  it('should show error message if the gateway account is disabled', async () => {
    req.body = {
      'refund-type': 'full',
      'refund-amount-available-in-pence': '5000',
      'full-amount': '50.00'
    }

    const request = transactionFixtures.validTransactionRefundRequest({
      user_external_id: req.user.externalId,
      user_email: req.user.email,
      amount: 5000,
      refund_amount_available: 5000
    })
    const response = transactionFixtures.invalidTransactionRefundResponse({
      error_identifier: 'ACCOUNT_DISABLED'
    })

    connectorMock.post(connectorRefundUrl, request)
      .reply(400, response)

    await refundController(req, res)
    sinon.assert.calledWith(res.redirect, '/account/an-external-id/transactions/123456')
    sinon.assert.calledWith(req.flash, 'refundError', 'GOV.UK Pay has disabled payment and refund creation on this account. Please contact support.')
  })

  it('should show error message if unexpected error has occurred', async () => {
    req.body = {
      'refund-type': 'full',
      'refund-amount-available-in-pence': '5000',
      'full-amount': '50.00'
    }

    const request = transactionFixtures.validTransactionRefundRequest({
      user_external_id: req.user.externalId,
      user_email: req.user.email,
      amount: 5000,
      refund_amount_available: 5000
    })
    const response = transactionFixtures.invalidTransactionRefundResponse({
      error_identifier: 'UNKNOWN_ERROR_IDENTIFIER'
    })

    connectorMock.post(connectorRefundUrl, request)
      .reply(400, response)

    await refundController(req, res)
    sinon.assert.calledWith(res.redirect, '/account/an-external-id/transactions/123456')
    sinon.assert.calledWith(req.flash, 'refundError', 'We couldn’t process this refund. Please try again or contact support.')
  })
})
