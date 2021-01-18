'use strict'

const lodash = require('lodash')
const sinon = require('sinon')
const { expect } = require('chai')
const getEditAmountController = require('../../../../app/controllers/payment-links/get-edit-amount.controller')

describe('GET edit amount controller', () => {
  const productExternalId = 'a-product-id'
  let req, res, next

  beforeEach(() => {
    req = {
      params: {
        productExternalId
      },
      account: {
        external_id: 'some-external-id'
      },
      flash: sinon.spy()
    }
    res = {
      render: sinon.spy(),
      setHeaders: sinon.spy(),
      status: sinon.spy(),
      redirect: sinon.spy()
    }
    next = sinon.spy()
  })

  it('should return to "Manage payment links" with an error if session data not found', () => {
    getEditAmountController(req, res, next)
    sinon.assert.calledWith(res.redirect, '/account/some-external-id/create-payment-link/manage')
  })

  it('should return to "Manage payment links" with an error if ID in URL does not match ID in session', () => {
    lodash.set(req, 'session.editPaymentLinkData', {
      externalId: 'a-different-id'
    })
    getEditAmountController(req, res, next)
    sinon.assert.calledWith(res.redirect, '/account/some-external-id/create-payment-link/manage')
  })

  it('should send field values from session when rendering page for fixed amount', () => {
    lodash.set(req, 'session.editPaymentLinkData', {
      externalId: productExternalId,
      price: '1050',
      language: 'cy'
    })

    getEditAmountController(req, res, next)

    sinon.assert.calledWithMatch(res.render, 'payment-links/edit-amount', {
      amountType: 'fixed',
      amountInPence: '1050',
      isWelsh: true,
      errors: undefined
    })
  })

  it('should send field values from session when rendering page for variable amount', () => {
    lodash.set(req, 'session.editPaymentLinkData', {
      externalId: productExternalId,
      price: '',
      language: 'en'
    })

    getEditAmountController(req, res, next)

    sinon.assert.calledWithMatch(res.render, 'payment-links/edit-amount', {
      amountType: 'variable',
      amountInPence: '',
      isWelsh: false,
      errors: undefined
    })
  })

  it('should send recovered field values when rendering the page with errors', () => {
    const recovered = {
      type: 'fixed',
      amount: '1050',
      errors: {
        amount: 'A problem with the amount'
      }
    }
    const session = {
      externalId: productExternalId,
      price: '',
      language: 'en',
      amountPageRecovered: recovered
    }
    lodash.set(req, 'session.editPaymentLinkData', session)

    getEditAmountController(req, res, next)

    sinon.assert.calledWithMatch(res.render, 'payment-links/edit-amount', {
      amountType: recovered.type,
      amountInPence: recovered.amount,
      isWelsh: false,
      errors: recovered.errors
    })

    expect(session).to.not.have.property('amountPageRecovered')
  })
})
