'use strict'

const supertest = require('supertest')
const lodash = require('lodash')
const nock = require('nock')
const csrf = require('csrf')

const { getApp } = require('../../../../server')
const { getMockSession, createAppWithSession, getUser } = require('../../../test-helpers/mock-session')
const paths = require('../../../../app/paths')
const { randomUuid } = require('../../../../app/utils/random')
const { validCreateProductRequest, validProductResponse } = require('../../../fixtures/product.fixtures')

const { PUBLIC_AUTH_URL, PRODUCTS_URL, CONNECTOR_URL } = process.env
const GATEWAY_ACCOUNT_ID = '929'
const PAYMENT_TITLE = 'Payment title'
const PAYMENT_DESCRIPTION = 'Payment description'
const PAYMENT_LINK_AMOUNT = 500
const VALID_PAYLOAD = {
  'csrfToken': csrf().create('123')
}
const VALID_USER = getUser({
  gateway_account_ids: [GATEWAY_ACCOUNT_ID],
  permissions: [{ name: 'tokens:create' }]
})
const VALID_CREATE_TOKEN_REQUEST = {
  account_id: GATEWAY_ACCOUNT_ID,
  created_by: VALID_USER.email,
  type: 'PRODUCTS',
  description: `Token for “${PAYMENT_TITLE}” payment link`
}
const VALID_MINIMAL_GATEWAY_ACCOUNT_RESPONSE = {
  payment_provider: 'sandbox'
}
const VALID_CREATE_TOKEN_RESPONSE = { token: randomUuid() }

const buildCreateProductRequest = (language) => {
  return validCreateProductRequest({
    name: PAYMENT_TITLE,
    description: PAYMENT_DESCRIPTION,
    gatewayAccountId: GATEWAY_ACCOUNT_ID,
    payApiToken: VALID_CREATE_TOKEN_RESPONSE.token,
    serviceName: VALID_USER.serviceRoles[0].service.name,
    price: PAYMENT_LINK_AMOUNT,
    type: 'ADHOC',
    reference_enabled: false,
    language: language
  }).getPlain()
}

describe('Create payment link review controller', () => {
  describe('successfull submission', () => {
    let result, session, app
    beforeAll(() => {
      const expectedProductRequest = buildCreateProductRequest('en')
      const productResponse = validProductResponse(expectedProductRequest).getPlain()
      nock(PUBLIC_AUTH_URL).post('', VALID_CREATE_TOKEN_REQUEST).reply(201, VALID_CREATE_TOKEN_RESPONSE)
      nock(PRODUCTS_URL).post('/v1/api/products', expectedProductRequest).reply(201, productResponse)
      nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`).reply(200, VALID_MINIMAL_GATEWAY_ACCOUNT_RESPONSE)
      session = getMockSession(VALID_USER)
      lodash.set(session, 'pageData.createPaymentLink', {
        paymentLinkTitle: PAYMENT_TITLE,
        paymentLinkDescription: PAYMENT_DESCRIPTION,
        paymentLinkAmount: PAYMENT_LINK_AMOUNT,
        isWelsh: false
      })
      app = createAppWithSession(getApp(), session)
    })
    beforeAll(done => {
      supertest(app)
        .post(paths.paymentLinks.review)
        .send(VALID_PAYLOAD)
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

    it('should redirect to the manage page with a success message', () => {
      expect(session.flash).toHaveProperty('createPaymentLinkSuccess')
      expect(result.headers).to.have.property('location').toBe(paths.paymentLinks.manage)
    })
  })
  describe('successful submission for a Welsh payment link', () => {
    let result, session, app
    beforeAll(() => {
      const expectedProductRequest = buildCreateProductRequest('cy')
      const productResponse = validProductResponse(expectedProductRequest).getPlain()
      nock(PUBLIC_AUTH_URL).post('', VALID_CREATE_TOKEN_REQUEST).reply(201, VALID_CREATE_TOKEN_RESPONSE)
      nock(PRODUCTS_URL).post('/v1/api/products', expectedProductRequest).reply(201, productResponse)
      nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`).reply(200, VALID_MINIMAL_GATEWAY_ACCOUNT_RESPONSE)
      session = getMockSession(VALID_USER)
      lodash.set(session, 'pageData.createPaymentLink', {
        paymentLinkTitle: PAYMENT_TITLE,
        paymentLinkDescription: PAYMENT_DESCRIPTION,
        paymentLinkAmount: PAYMENT_LINK_AMOUNT,
        isWelsh: true
      })
      app = createAppWithSession(getApp(), session)
    })
    beforeAll(done => {
      supertest(app)
        .post(paths.paymentLinks.review)
        .send(VALID_PAYLOAD)
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

    it('should redirect to the manage page', () => {
      expect(result.headers).to.have.property('location').toBe(paths.paymentLinks.manage)
    })
  })
  describe('the product creation fails', () => {
    let result, session, app

    beforeAll(() => {
      const expectedProductRequest = buildCreateProductRequest('en')
      nock(PUBLIC_AUTH_URL).post('', VALID_CREATE_TOKEN_REQUEST).reply(201, VALID_CREATE_TOKEN_RESPONSE)
      nock(PRODUCTS_URL).post('/v1/api/products', expectedProductRequest).replyWithError('Something went wrong')
      nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`).reply(200, VALID_MINIMAL_GATEWAY_ACCOUNT_RESPONSE)
      session = getMockSession(VALID_USER)
      lodash.set(session, 'pageData.createPaymentLink', {
        paymentLinkTitle: PAYMENT_TITLE,
        paymentLinkDescription: PAYMENT_DESCRIPTION,
        paymentLinkAmount: PAYMENT_LINK_AMOUNT,
        isWelsh: false
      })
      app = createAppWithSession(getApp(), session)
    })
    beforeAll(done => {
      supertest(app)
        .post(paths.paymentLinks.review)
        .send(VALID_PAYLOAD)
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

    it('should redirect back to the review page', () => {
      expect(result.headers).to.have.property('location').toBe(paths.paymentLinks.review)
    })

    it('should add a relevant error message to the session \'flash\'', () => {
      expect(session.flash).toHaveProperty('genericError')
      expect(session.flash.genericError.length).toBe(1)
      expect(session.flash.genericError[0]).toBe('Something went wrong. Please try again or contact support.')
    })
  })
  describe('when the API token creation fails', () => {
    let result, session, app
    beforeAll(() => {
      nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`).reply(200, VALID_MINIMAL_GATEWAY_ACCOUNT_RESPONSE)
      nock(PUBLIC_AUTH_URL).post('', VALID_CREATE_TOKEN_REQUEST).replyWithError('Something went wrong')
      session = getMockSession(VALID_USER)
      lodash.set(session, 'pageData.createPaymentLink', {
        paymentLinkTitle: PAYMENT_TITLE,
        paymentLinkDescription: PAYMENT_DESCRIPTION,
        isWelsh: false
      })
      app = createAppWithSession(getApp(), session)
    })
    beforeAll(done => {
      supertest(app)
        .post(paths.paymentLinks.review)
        .send({
          'csrfToken': csrf().create('123')
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

    it('should redirect back to the index page', () => {
      expect(result.headers).to.have.property('location').toBe(paths.paymentLinks.review)
    })

    it('should add a relevant error message to the session \'flash\'', () => {
      expect(session.flash).toHaveProperty('genericError')
      expect(session.flash.genericError.length).toBe(1)
      expect(session.flash.genericError[0]).toBe('Something went wrong. Please try again or contact support.')
    })
  })
  describe('when paymentDescription in missing from the session', () => {
    let result, session, app
    beforeAll(() => {
      const expectedProductRequest = buildCreateProductRequest('en')
      const productResponse = validProductResponse(expectedProductRequest).getPlain()
      nock(PUBLIC_AUTH_URL).post('', VALID_CREATE_TOKEN_REQUEST).reply(201, VALID_CREATE_TOKEN_RESPONSE)
      nock(PRODUCTS_URL).post('/v1/api/products', lodash.omit(expectedProductRequest, 'description')).reply(201, productResponse)
      nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`).reply(200, VALID_MINIMAL_GATEWAY_ACCOUNT_RESPONSE)
      session = getMockSession(VALID_USER)
      lodash.set(session, 'pageData.createPaymentLink', {
        paymentLinkTitle: PAYMENT_TITLE,
        paymentLinkAmount: PAYMENT_LINK_AMOUNT,
        isWelsh: false
      })
      app = createAppWithSession(getApp(), session)
    })
    beforeAll(done => {
      supertest(app)
        .post(paths.paymentLinks.review)
        .send(VALID_PAYLOAD)
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

    it('should redirect to the manage page with a success message', () => {
      expect(session.flash).toHaveProperty('createPaymentLinkSuccess')
      expect(result.headers).to.have.property('location').toBe(paths.paymentLinks.manage)
    })
  })
  describe('when paymentLinkTitle is missing from the session', () => {
    let result, app

    beforeAll(() => {
      nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`).reply(200, VALID_MINIMAL_GATEWAY_ACCOUNT_RESPONSE)
      const session = getMockSession(VALID_USER)
      lodash.set(session, 'pageData.createPaymentLink.paymentLinkDescription', PAYMENT_DESCRIPTION)
      app = createAppWithSession(getApp(), session)
    })
    beforeAll(done => {
      supertest(app)
        .post(paths.paymentLinks.review)
        .send({
          'csrfToken': csrf().create('123')
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

    it('should redirect back to the start page', () => {
      expect(result.headers).to.have.property('location').toBe(paths.paymentLinks.start)
    })
  })
})
