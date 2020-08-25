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
      }
    }
    res = {
      render: sinon.spy(),
      setHeaders: sinon.spy(),
      status: sinon.spy()
    }
    next = sinon.spy()
  })

  it('should pass an error to next when session data not found', () => {
    getEditAmountController(req, res, next)
    sinon.assert.calledWith(next, sinon.match.instanceOf(Error))
  })

  it('should send field values from session when rendering page for fixed amount', () => {
    lodash.set(req, 'session.editPaymentLinkData', {
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
