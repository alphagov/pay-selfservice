'use strict'

const lodash = require('lodash')
const sinon = require('sinon')
const { expect } = require('chai')
const getEditReferenceController = require('./get-edit-reference.controller')

describe('GET edit reference controller', () => {
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
    getEditReferenceController(req, res, next)
    sinon.assert.calledWith(res.redirect, '/account/some-external-id/create-payment-link/manage')
  })

  it('should return to "Manage payment links" with an error if ID in URL does not match ID in session', () => {
    lodash.set(req, 'session.editPaymentLinkData', {
      externalId: 'a-different-id'
    })
    getEditReferenceController(req, res, next)
    sinon.assert.calledWith(res.redirect, '/account/some-external-id/create-payment-link/manage')
  })

  it('should send field values from session when rendering page', () => {
    const session = {
      externalId: productExternalId,
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
      externalId: productExternalId,
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
