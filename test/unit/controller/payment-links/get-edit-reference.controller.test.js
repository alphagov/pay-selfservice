'use strict'

const lodash = require('lodash')
const sinon = require('sinon')
const { expect } = require('chai')
const getEditReferenceController = require('../../../../app/controllers/payment-links/get-edit-reference.controller')

describe('GET edit reference controller', () => {
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
    getEditReferenceController(req, res, next)
    sinon.assert.calledWith(next, sinon.match.instanceOf(Error))
  })

  it('should send field values from session when rendering page', () => {
    const session = {
      referenceEnabled: true,
      referenceLabel: 'A label',
      referenceHint: 'A hint',
      language: 'cy'
    }
    lodash.set(req, 'session.editPaymentLinkData', session)

    getEditReferenceController(req, res, next)

    sinon.assert.calledWithMatch(res.render, 'payment-links/edit-reference', {
      referenceEnabled: session.referenceEnabled,
      referenceLabel: session.referenceLabel,
      referenceHint: session.referenceHint,
      isWelsh: true,
      errors: undefined
    })
  })

  it('should send recovered field values when rendering the page with errors', () => {
    const recovered = {
      referenceEnabled: true,
      referenceLabel: 'New label',
      referenceHint: 'New hint',
      errors: {
        label: 'A problem with the label'
      }
    }
    const session = {
      referenceEnabled: false,
      referenceLabel: 'A label',
      referenceHint: 'A hint',
      language: 'cy',
      referencePageRecovered: recovered
    }
    lodash.set(req, 'session.editPaymentLinkData', session)

    getEditReferenceController(req, res, next)

    sinon.assert.calledWithMatch(res.render, 'payment-links/edit-reference', {
      referenceEnabled: recovered.referenceEnabled,
      referenceLabel: recovered.referenceLabel,
      referenceHint: recovered.referenceHint,
      isWelsh: true,
      errors: recovered.errors
    })

    expect(session).to.not.have.property('referencePageRecovered')
  })
})
