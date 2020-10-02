'use strict'

const supertest = require('supertest')
const nock = require('nock')
const csrf = require('csrf')

const { getApp } = require('../../../../server')
const { getMockSession, createAppWithSession, getUser } = require('../../../test-helpers/mock-session')
const paths = require('../../../../app/paths')
const formattedPathFor = require('../../../../app/utils/replace-params-in-path')

const GATEWAY_ACCOUNT_ID = '929'
const PRODUCT_EXTERNAL_ID = '2903e4yohi0we9yho2hio'

const VALID_USER = getUser({
  gateway_account_ids: [GATEWAY_ACCOUNT_ID],
  permissions: [{ name: 'tokens:create' }]
})

describe('POST payment link edit information controller', () => {
  describe('if values are present', () => {
    let result, session, app
    beforeAll(() => {
      session = getMockSession(VALID_USER)
      session.editPaymentLinkData = { externalId: PRODUCT_EXTERNAL_ID }
      app = createAppWithSession(getApp(), session)
    })
    beforeAll(done => {
      supertest(app)
        .post(formattedPathFor(paths.paymentLinks.editInformation, PRODUCT_EXTERNAL_ID))
        .send({
          csrfToken: csrf().create('123'),
          'payment-link-title': 'hello world',
          'payment-link-description': 'some words'
        })
        .end((err, res) => {
          result = res
          done(err)
        })
    })
    afterAll(() => {
      nock.cleanAll()
    })

    it('should redirect with status code 302', () => {
      expect(result.statusCode).toBe(302)
    })

    it('should redirect to edit page', () => {
      expect(result.headers).to.have.property('location').toBe(formattedPathFor(paths.paymentLinks.edit, PRODUCT_EXTERNAL_ID))
    })

    it('should set title in session', () => {
      expect(session.editPaymentLinkData.name).toBe('hello world')
    })

    it('should set details in session', () => {
      expect(session.editPaymentLinkData.description).toBe('some words')
    })

    it('should redirect to the edit page', () => {
      expect(result.headers).to.have.property('location').toBe(formattedPathFor(paths.paymentLinks.edit, PRODUCT_EXTERNAL_ID))
    })
  })
  describe('if title is blank', () => {
    let result, session, app
    beforeAll(() => {
      session = getMockSession(VALID_USER)
      session.editPaymentLinkData = { externalId: PRODUCT_EXTERNAL_ID }
      app = createAppWithSession(getApp(), session)
    })
    beforeAll(done => {
      supertest(app)
        .post(formattedPathFor(paths.paymentLinks.editInformation, PRODUCT_EXTERNAL_ID))
        .send({
          csrfToken: csrf().create('123'),
          'payment-link-title': '',
          'payment-link-description': 'some words'
        })
        .end((err, res) => {
          result = res
          done(err)
        })
    })
    afterAll(() => {
      nock.cleanAll()
    })

    it('should redirect with status code 302', () => {
      expect(result.statusCode).toBe(302)
    })

    it('should redirect to same page', () => {
      expect(result.headers).to.have.property('location').toBe(formattedPathFor(paths.paymentLinks.editInformation, PRODUCT_EXTERNAL_ID))
    })

    it(
      'should have a recovered object stored on the session containing errors and submitted data',
      () => {
        const recovered = session.editPaymentLinkData.informationPageRecovered
        expect(recovered).to.have.property('name').toBe('')
        expect(recovered).to.have.property('description').toBe('some words')
        expect(recovered).toHaveProperty('errors')
        expect(recovered.errors).toHaveProperty('title')
      }
    )
  })
})
