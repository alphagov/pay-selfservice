'use strict'

const supertest = require('supertest')
const { expect } = require('chai')
const lodash = require('lodash')
const nock = require('nock')
const csrf = require('csrf')

const { getApp } = require('../../../server')
const { getMockSession, createAppWithSession, getUser } = require('../../test-helpers/mock-session')
const paths = require('../../../app/paths')
const { randomUuid } = require('../../../app/utils/random')
const { validCreateProductRequest, validProductResponse } = require('../../fixtures/product.fixtures')
const formatAccountPathsFor = require('../../../app/utils/format-account-paths-for')
const { validGatewayAccountResponse } = require('../../fixtures/gateway-account.fixtures')

const { PUBLIC_AUTH_URL, PRODUCTS_URL, CONNECTOR_URL } = process.env
const GATEWAY_ACCOUNT_ID = '929'
const EXTERNAL_GATEWAY_ACCOUNT_ID = 'an-external-id'
const PAYMENT_DESCRIPTION = 'Pay your window tax'
const PAYMENT_AMOUNT = '2000'
const VALID_PAYLOAD = {
  'csrfToken': csrf().create('123')
}
const VALID_USER = getUser({
  gateway_account_ids: [GATEWAY_ACCOUNT_ID],
  permissions: [{ name: 'transactions:read' }]
})
const VALID_CREATE_TOKEN_REQUEST = {
  account_id: GATEWAY_ACCOUNT_ID,
  created_by: VALID_USER.email,
  description: 'Token for Demo Payment',
  type: 'PRODUCTS'
}

const VALID_CREATE_TOKEN_RESPONSE = { token: randomUuid() }
const VALID_CREATE_PRODUCT_REQUEST = validCreateProductRequest({
  name: PAYMENT_DESCRIPTION,
  payApiToken: VALID_CREATE_TOKEN_RESPONSE.token,
  serviceName: VALID_USER.serviceRoles[0].service.name,
  price: PAYMENT_AMOUNT,
  gatewayAccountId: GATEWAY_ACCOUNT_ID,
  type: 'DEMO'
})
const VALID_CREATE_PRODUCT_RESPONSE = validProductResponse(VALID_CREATE_PRODUCT_REQUEST)

function mockConnectorGetAccount () {
  nock(CONNECTOR_URL).get(`/v1/frontend/accounts/external-id/${EXTERNAL_GATEWAY_ACCOUNT_ID}`)
    .reply(200, validGatewayAccountResponse(
      {
        external_id: EXTERNAL_GATEWAY_ACCOUNT_ID,
        gateway_account_id: GATEWAY_ACCOUNT_ID
      }
    ))
}

describe('make a demo payment - go to payment controller', () => {
  describe(`when both paymentDescription and paymentAmount exist in the session`, () => {
    describe(`when the API token is successfully created`, () => {
      describe(`and the product is successfully created`, () => {
        let result, session, app
        before('Arrange', () => {
          nock(PUBLIC_AUTH_URL).post('', VALID_CREATE_TOKEN_REQUEST).reply(201, VALID_CREATE_TOKEN_RESPONSE)
          nock(PRODUCTS_URL).post('/v1/api/products', VALID_CREATE_PRODUCT_REQUEST).reply(201, VALID_CREATE_PRODUCT_RESPONSE)

          mockConnectorGetAccount()

          session = getMockSession(VALID_USER)
          lodash.set(session, 'pageData.makeADemoPayment.paymentDescription', PAYMENT_DESCRIPTION)
          lodash.set(session, 'pageData.makeADemoPayment.paymentAmount', PAYMENT_AMOUNT)
          app = createAppWithSession(getApp(), session)
        })
        before('Act', done => {
          supertest(app)
            .post(formatAccountPathsFor(paths.account.prototyping.demoPayment.goToPaymentScreens, EXTERNAL_GATEWAY_ACCOUNT_ID))
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

        it('should redirect to the products pay link', () => {
          const paylink = VALID_CREATE_PRODUCT_RESPONSE._links.find(link => link.rel === 'pay').href
          expect(result.headers).to.have.property('location').to.equal(paylink)
        })
      })
      describe(`but the product creation fails`, () => {
        let result, session, app

        before('Arrange', () => {
          nock(PUBLIC_AUTH_URL).post('', VALID_CREATE_TOKEN_REQUEST).reply(201, VALID_CREATE_TOKEN_RESPONSE)
          nock(PRODUCTS_URL).post('/v1/api/products', VALID_CREATE_PRODUCT_REQUEST).replyWithError('Something went wrong')

          mockConnectorGetAccount()

          session = getMockSession(VALID_USER)
          lodash.set(session, 'pageData.makeADemoPayment.paymentDescription', PAYMENT_DESCRIPTION)
          lodash.set(session, 'pageData.makeADemoPayment.paymentAmount', PAYMENT_AMOUNT)
          app = createAppWithSession(getApp(), session)
        })
        before('Act', done => {
          supertest(app)
            .post(formatAccountPathsFor(paths.account.prototyping.demoPayment.goToPaymentScreens, EXTERNAL_GATEWAY_ACCOUNT_ID))
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

        it('should redirect back to the index page', () => {
          expect(result.headers).to.have.property('location').to.equal(formatAccountPathsFor(paths.account.prototyping.demoPayment.index, EXTERNAL_GATEWAY_ACCOUNT_ID))
        })

        it('should add a relevant error message to the session \'flash\'', () => {
          expect(session.flash).to.have.property('genericError')
          expect(session.flash.genericError.length).to.equal(1)
          expect(session.flash.genericError[0]).to.equal('Something went wrong. Please try again.')
        })
      })
    })
    describe(`when the API token creation fails`, () => {
      let result, session, app
      before('Arrange', () => {
        mockConnectorGetAccount()

        nock(PUBLIC_AUTH_URL).post('', VALID_CREATE_TOKEN_REQUEST).replyWithError('Something went wrong')
        session = getMockSession(VALID_USER)
        lodash.set(session, 'pageData.makeADemoPayment.paymentDescription', PAYMENT_DESCRIPTION)
        lodash.set(session, 'pageData.makeADemoPayment.paymentAmount', PAYMENT_AMOUNT)
        app = createAppWithSession(getApp(), session)
      })
      before('Act', done => {
        supertest(app)
          .post(formatAccountPathsFor(paths.account.prototyping.demoPayment.goToPaymentScreens, EXTERNAL_GATEWAY_ACCOUNT_ID))
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
        expect(result.headers).to.have.property('location').to.equal(formatAccountPathsFor(paths.account.prototyping.demoPayment.index, EXTERNAL_GATEWAY_ACCOUNT_ID))
      })

      it('should add a relevant error message to the session \'flash\'', () => {
        expect(session.flash).to.have.property('genericError')
        expect(session.flash.genericError.length).to.equal(1)
        expect(session.flash.genericError[0]).to.equal('Something went wrong. Please try again.')
      })
    })
  })
  describe(`when paymentDescription is missing from the session`, () => {
    let result, app

    before('Arrange', () => {
      mockConnectorGetAccount()

      const session = getMockSession(VALID_USER)
      lodash.set(session, 'pageData.makeADemoPayment.paymentAmount', PAYMENT_AMOUNT)
      app = createAppWithSession(getApp(), session)
    })
    before('Act', done => {
      supertest(app)
        .post(formatAccountPathsFor(paths.account.prototyping.demoPayment.goToPaymentScreens, EXTERNAL_GATEWAY_ACCOUNT_ID))
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
      expect(result.headers).to.have.property('location').to.equal(formatAccountPathsFor(paths.account.prototyping.demoPayment.index, EXTERNAL_GATEWAY_ACCOUNT_ID))
    })
  })
  describe(`when paymentAmount is missing from the session`, () => {
    let result, app

    before('Arrange', () => {
      mockConnectorGetAccount()

      const session = getMockSession(VALID_USER)
      lodash.set(session, 'pageData.makeADemoPayment.paymentDescription', PAYMENT_DESCRIPTION)
      app = createAppWithSession(getApp(), session)
    })
    before('Act', done => {
      supertest(app)
        .post(formatAccountPathsFor(paths.account.prototyping.demoPayment.goToPaymentScreens, EXTERNAL_GATEWAY_ACCOUNT_ID))
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
      expect(result.headers).to.have.property('location').to.equal(formatAccountPathsFor(paths.account.prototyping.demoPayment.index, EXTERNAL_GATEWAY_ACCOUNT_ID))
    })
  })
})
