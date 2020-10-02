'use strict'

const lodash = require('lodash')
const sinon = require('sinon')
const getEditInformationController = require('../../../../app/controllers/payment-links/get-edit-information.controller')

describe('GET edit information controller', () => {
  const productExternalId = 'a-product-id'
  let req, res, next

  beforeEach(() => {
    req = {
      params: {
        productExternalId
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

  it(
    'should return to "Manage payment links" with an error if session data not found',
    () => {
      getEditInformationController(req, res, next)
      sinon.assert.calledWith(res.redirect, '/create-payment-link/manage')
    }
  )

  it(
    'should return to "Manage payment links" with an error if ID in URL does not match ID in session',
    () => {
      lodash.set(req, 'session.editPaymentLinkData', {
        externalId: 'a-different-id'
      })
      getEditInformationController(req, res, next)
      sinon.assert.calledWith(res.redirect, '/create-payment-link/manage')
    }
  )

  it('should send field values from session when rendering page', () => {
    const session = {
      externalId: productExternalId,
      name: 'a payment link',
      description: 'a description',
      language: 'cy'
    }
    lodash.set(req, 'session.editPaymentLinkData', session)

    getEditInformationController(req, res, next)

    sinon.assert.calledWithMatch(res.render, 'payment-links/edit-information', {
      paymentLinkTitle: session.name,
      paymentLinkDescription: session.description,
      isWelsh: true,
      errors: undefined
    })
  })

  it(
    'should send recovered field values when rendering the page with errors',
    () => {
      const recovered = {
        name: 'new name',
        description: 'new description',
        errors: {
          title: 'A problem with the title'
        }
      }
      const session = {
        externalId: productExternalId,
        name: 'a payment link',
        description: 'a description',
        language: 'cy',
        informationPageRecovered: recovered
      }
      lodash.set(req, 'session.editPaymentLinkData', session)

      getEditInformationController(req, res, next)

      sinon.assert.calledWithMatch(res.render, 'payment-links/edit-information', {
        paymentLinkTitle: recovered.name,
        paymentLinkDescription: recovered.description,
        isWelsh: true,
        errors: recovered.errors
      })

      expect(session).not.toHaveProperty('informationPageRecovered')
    }
  )
})
