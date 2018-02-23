'use strict'

// NPM dependencies
const supertest = require('supertest')
const {expect} = require('chai')
const lodash = require('lodash')
const nock = require('nock')
const csrf = require('csrf')

// Local dependencies
const {getApp} = require('../../../../server')
const {getMockSession, createAppWithSession, getUser} = require('../../../test_helpers/mock_session')
const paths = require('../../../../app/paths')
const {randomUuid} = require('../../../../app/utils/random')
const {validCreateProductRequest, validCreateProductResponse} = require('../../../fixtures/product_fixtures')

const {PUBLIC_AUTH_URL, PRODUCTS_URL, CONNECTOR_URL} = process.env
const GATEWAY_ACCOUNT_ID = '929'
const PAYMENT_TITLE = 'Payment title'
const PAYMENT_DESCRIPTION = 'Payment description'
const VALID_PAYLOAD = {
  'csrfToken': csrf().create('123')
}
const VALID_USER = getUser({
  gateway_account_ids: [GATEWAY_ACCOUNT_ID],
  permissions: [{name: 'transactions:read'}]
})
const VALID_CREATE_TOKEN_REQUEST = {
  account_id: GATEWAY_ACCOUNT_ID,
  created_by: VALID_USER.email,
  description: 'Token for Adhoc Payment'
}
const VALID_MINIMAL_GATEWAY_ACCOUNT_RESPONSE = {
  payment_provider: 'sandbox'
}
const VALID_CREATE_TOKEN_RESPONSE = {token: randomUuid()}
const VALID_CREATE_PRODUCT_REQUEST = validCreateProductRequest({
  name: PAYMENT_TITLE,
  description: PAYMENT_DESCRIPTION,
  gatewayAccountId: GATEWAY_ACCOUNT_ID,
  payApiToken: VALID_CREATE_TOKEN_RESPONSE.token,
  serviceName: VALID_USER.serviceRoles[0].service.name,
  type: 'ADHOC'
}).getPlain()

const VALID_CREATE_PRODUCT_RESPONSE = validCreateProductResponse(VALID_CREATE_PRODUCT_REQUEST).getPlain()

describe('Create payment link review controller', () => {
  describe(`when both paymentDescription and paymentLinkTitle exist in the session`, () => {
    describe(`when the API token is successfully created`, () => {
      describe(`and the product is successfully created`, () => {
        let result, session, app
        before('Arrange', () => {
          nock(PUBLIC_AUTH_URL).post('', VALID_CREATE_TOKEN_REQUEST).reply(201, VALID_CREATE_TOKEN_RESPONSE)
          nock(PRODUCTS_URL).post('/v1/api/products', VALID_CREATE_PRODUCT_REQUEST).reply(201, VALID_CREATE_PRODUCT_RESPONSE)
          nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`).reply(200, VALID_MINIMAL_GATEWAY_ACCOUNT_RESPONSE)
          session = getMockSession(VALID_USER)
          lodash.set(session, 'pageData.createPaymentLink.paymentLinkTitle', PAYMENT_TITLE)
          lodash.set(session, 'pageData.createPaymentLink.paymentLinkDescription', PAYMENT_DESCRIPTION)
          app = createAppWithSession(getApp(), session)
        })
        before('Act', done => {
          supertest(app)
            .post(paths.paymentLinks.review)
            .send(VALID_PAYLOAD)
            .end((err, res) => {
              result = res
              done(err)
            })
        })
        after(() => {
          nock.cleanAll()
        })

        it('should redirect with status code 302', () => {
          expect(result.statusCode).to.equal(302)
        })

        it('should redirect to the manage page with a success message', () => {
          expect(session.flash).to.have.property('generic')
          expect(session.flash.generic.length).to.equal(1)
          expect(session.flash.generic[0]).to.equal('<h2>Your payment link is now live</h2> Give this link to your users to collect payments for your service.')
          expect(result.headers).to.have.property('location').to.equal(paths.paymentLinks.manage)
        })
      })
      describe(`but the product creation fails`, () => {
        let result, session, app

        before('Arrange', () => {
          nock(PUBLIC_AUTH_URL).post('', VALID_CREATE_TOKEN_REQUEST).reply(201, VALID_CREATE_TOKEN_RESPONSE)
          nock(PRODUCTS_URL).post('/v1/api/products', VALID_CREATE_PRODUCT_REQUEST).replyWithError('Something went wrong')
          nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`).reply(200, VALID_MINIMAL_GATEWAY_ACCOUNT_RESPONSE)
          session = getMockSession(VALID_USER)
          lodash.set(session, 'pageData.createPaymentLink.paymentLinkTitle', PAYMENT_TITLE)
          lodash.set(session, 'pageData.createPaymentLink.paymentLinkDescription', PAYMENT_DESCRIPTION)
          app = createAppWithSession(getApp(), session)
        })
        before('Act', done => {
          supertest(app)
            .post(paths.paymentLinks.review)
            .send(VALID_PAYLOAD)
            .end((err, res) => {
              result = res
              done(err)
            })
        })
        after(() => {
          nock.cleanAll()
        })

        it('should redirect with status code 302', () => {
          expect(result.statusCode).to.equal(302)
        })

        it('should redirect back to the review page', () => {
          expect(result.headers).to.have.property('location').to.equal(paths.paymentLinks.review)
        })

        it('should add a relevant error message to the session \'flash\'', () => {
          expect(session.flash).to.have.property('genericError')
          expect(session.flash.genericError.length).to.equal(1)
          expect(session.flash.genericError[0]).to.equal('<h2>There were errors</h2> Error while creating payment link')
        })
      })
    })
    describe(`when the API token creation fails`, () => {
      let result, session, app
      before('Arrange', () => {
        nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`).reply(200, VALID_MINIMAL_GATEWAY_ACCOUNT_RESPONSE)
        nock(PUBLIC_AUTH_URL).post('', VALID_CREATE_TOKEN_REQUEST).replyWithError('Something went wrong')
        session = getMockSession(VALID_USER)
        lodash.set(session, 'pageData.createPaymentLink.paymentLinkTitle', PAYMENT_TITLE)
        lodash.set(session, 'pageData.createPaymentLink.paymentLinkDescription', PAYMENT_DESCRIPTION)
        app = createAppWithSession(getApp(), session)
      })
      before('Act', done => {
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
      after(() => {
        nock.cleanAll()
      })

      it('should redirect with status code 302', () => {
        expect(result.statusCode).to.equal(302)
      })

      it('should redirect back to the index page', () => {
        expect(result.headers).to.have.property('location').to.equal(paths.paymentLinks.review)
      })

      it('should add a relevant error message to the session \'flash\'', () => {
        expect(session.flash).to.have.property('genericError')
        expect(session.flash.genericError.length).to.equal(1)
        expect(session.flash.genericError[0]).to.equal('<h2>There were errors</h2> Error while creating payment link')
      })
    })
  })
  describe(`when paymentDescription in missing from the session`, () => {
    describe(`when the API token is successfully created`, () => {
      describe(`and the product is successfully created`, () => {
        let result, session, app
        before('Arrange', () => {
          nock(PUBLIC_AUTH_URL).post('', VALID_CREATE_TOKEN_REQUEST).reply(201, VALID_CREATE_TOKEN_RESPONSE)
          nock(PRODUCTS_URL).post('/v1/api/products', lodash.omit(VALID_CREATE_PRODUCT_REQUEST, 'description')).reply(201, VALID_CREATE_PRODUCT_RESPONSE)
          nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`).reply(200, VALID_MINIMAL_GATEWAY_ACCOUNT_RESPONSE)
          session = getMockSession(VALID_USER)
          lodash.set(session, 'pageData.createPaymentLink.paymentLinkTitle', PAYMENT_TITLE)
          app = createAppWithSession(getApp(), session)
        })
        before('Act', done => {
          supertest(app)
            .post(paths.paymentLinks.review)
            .send(VALID_PAYLOAD)
            .end((err, res) => {
              result = res
              done(err)
            })
        })
        after(() => {
          nock.cleanAll()
        })

        it('should redirect with status code 302', () => {
          expect(result.statusCode).to.equal(302)
        })

        it('should redirect to the manage page with a success message', () => {
          expect(session.flash).to.have.property('generic')
          expect(session.flash.generic.length).to.equal(1)
          expect(session.flash.generic[0]).to.equal('<h2>Your payment link is now live</h2> Give this link to your users to collect payments for your service.')
          expect(result.headers).to.have.property('location').to.equal(paths.paymentLinks.manage)
        })
      })
    })
  })
  describe(`when paymentLinkTitle is missing from the session`, () => {
    let result, app

    before('Arrange', () => {
      nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`).reply(200, VALID_MINIMAL_GATEWAY_ACCOUNT_RESPONSE)
      const session = getMockSession(VALID_USER)
        lodash.set(session, 'pageData.createPaymentLink.paymentLinkDescription', PAYMENT_DESCRIPTION)
      app = createAppWithSession(getApp(), session)
    })
    before('Act', done => {
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

    after(() => {
      nock.cleanAll()
    })

    it('should redirect with status code 302', () => {
      expect(result.statusCode).to.equal(302)
    })

    it('should redirect back to the start page', () => {
      expect(result.headers).to.have.property('location').to.equal(paths.paymentLinks.start)
    })
  })
})
