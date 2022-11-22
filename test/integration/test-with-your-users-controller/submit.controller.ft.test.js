'use strict'

const supertest = require('supertest')
const nock = require('nock')
const csrf = require('csrf')
const cheerio = require('cheerio')
const { expect } = require('chai')

const { getApp } = require('../../../server')
const { getMockSession, getUser, createAppWithSession } = require('../../test-helpers/mock-session')
const paths = require('../../../app/paths')
const { randomUuid } = require('../../../app/utils/random')
const { validCreateProductRequest, validProductResponse } = require('../../fixtures/product.fixtures')
const { validGatewayAccountResponse } = require('../../fixtures/gateway-account.fixtures')
const formatAccountPathsFor = require('../../../app/utils/format-account-paths-for')

const { PUBLIC_AUTH_URL, PRODUCTS_URL, CONNECTOR_URL } = process.env
const EXTERNAL_GATEWAY_ACCOUNT_ID = 'an-external-id'
const GATEWAY_ACCOUNT_ID = '929'
const API_TOKEN = randomUuid()
const VALID_USER = getUser({ gateway_account_ids: [GATEWAY_ACCOUNT_ID], permissions: [{ name: 'transactions:read' }] })
const VALID_PAYLOAD = {
  'csrfToken': csrf().create('123'),
  'payment-amount': '20',
  'payment-description': 'Test service name',
  'confirmation-page': 'https://www.example.com'
}
const VALID_CREATE_TOKEN_REQUEST = {
  account_id: GATEWAY_ACCOUNT_ID,
  created_by: VALID_USER.email,
  description: `Token for Prototype: ${VALID_PAYLOAD['payment-description']}`,
  type: 'PRODUCTS'
}
const VALID_CREATE_PRODUCT_REQUEST = validCreateProductRequest({
  name: VALID_PAYLOAD['payment-description'],
  payApiToken: API_TOKEN,
  price: parseInt(VALID_PAYLOAD['payment-amount']) * 100,
  returnUrl: VALID_PAYLOAD['confirmation-page'],
  serviceName: VALID_USER.serviceRoles[0].service.name,
  gatewayAccountId: GATEWAY_ACCOUNT_ID,
  type: 'PROTOTYPE'
})
const VALID_CREATE_PRODUCT_RESPONSE = validProductResponse(VALID_CREATE_PRODUCT_REQUEST)

function mockConnectorGetAccount (opts = {}) {
  nock(CONNECTOR_URL).get(`/v1/frontend/accounts/external-id/${EXTERNAL_GATEWAY_ACCOUNT_ID}`)
    .reply(200, validGatewayAccountResponse(
      {
        external_id: EXTERNAL_GATEWAY_ACCOUNT_ID,
        gateway_account_id: GATEWAY_ACCOUNT_ID,
        payment_provider: opts.payment_provider || 'sandbox'
      }
    ))
}

describe('test with your users - submit controller', () => {
  describe('when it is called on a gateway account that is from a payment provider other than sandbox', () => {
    let session, response, $
    before(done => {
      session = getMockSession(VALID_USER)
      mockConnectorGetAccount({ payment_provider: 'worldpay' })
      supertest(createAppWithSession(getApp(), session))
        .post(formatAccountPathsFor(paths.account.prototyping.demoService.confirm, EXTERNAL_GATEWAY_ACCOUNT_ID))
        .send(VALID_PAYLOAD)
        .end((err, res) => {
          response = res

          $ = cheerio.load(res.text)
          done(err)
        })
    })
    after(() => {
      nock.cleanAll()
    })

    it('should respond with a code of 404', () => {
      expect(response.statusCode).to.equal(404)
    })

    it('should show the error page', () => {
      expect($('.govuk-heading-l').text()).to.equal('Page not found')
    })
  })
  describe('when it is called with valid inputs', () => {
    describe('and it successfully creates both an API token and a product', () => {
      let session, response, $
      before(done => {
        session = getMockSession(VALID_USER)
        nock(PUBLIC_AUTH_URL).post('', VALID_CREATE_TOKEN_REQUEST)
          .reply(201, { token: API_TOKEN })
        mockConnectorGetAccount()
        nock(PRODUCTS_URL).post('/v1/api/products', VALID_CREATE_PRODUCT_REQUEST)
          .reply(201, VALID_CREATE_PRODUCT_RESPONSE)
        supertest(createAppWithSession(getApp(), session))
          .post(formatAccountPathsFor(paths.account.prototyping.demoService.confirm, EXTERNAL_GATEWAY_ACCOUNT_ID))
          .send(VALID_PAYLOAD)
          .end((err, res) => {
            response = res
            $ = cheerio.load(res.text)
            done(err)
          })
      })
      after(() => {
        nock.cleanAll()
      })

      it('should respond with code 200', () => {
        expect(response.statusCode).to.equal(200)
      })

      it('should show the prototype link returned from the products api', () => {
        const prototypeLink = $('#prototyping__links-link-create-payment')
        const url = VALID_CREATE_PRODUCT_RESPONSE._links.find(link => link.rel === 'pay').href
        expect(prototypeLink.attr('href')).to.equal(url)
        expect(prototypeLink.text()).to.equal(url)
      })

      it('should have a back link and a button that link back to the links page', () => {
        expect($('.govuk-back-link').attr('href')).to.equal(formatAccountPathsFor(paths.account.prototyping.demoService.links, EXTERNAL_GATEWAY_ACCOUNT_ID))
        expect($('#see-prototype-links').attr('href')).to.equal(formatAccountPathsFor(paths.account.prototyping.demoService.links, EXTERNAL_GATEWAY_ACCOUNT_ID))
      })
    })
    describe('but it is unable to create an API token', () => {
      let session, response
      before(done => {
        session = getMockSession(VALID_USER)
        nock(PUBLIC_AUTH_URL).post('', VALID_CREATE_TOKEN_REQUEST)
          .replyWithError('Somet nasty happened')
        mockConnectorGetAccount()
        supertest(createAppWithSession(getApp(), session))
          .post(formatAccountPathsFor(paths.account.prototyping.demoService.confirm, EXTERNAL_GATEWAY_ACCOUNT_ID))
          .send(VALID_PAYLOAD)
          .end((err, res) => {
            response = res
            done(err)
          })
      })
      after(() => {
        nock.cleanAll()
      })

      it('should redirect with code 302', () => {
        expect(response.statusCode).to.equal(302)
      })

      it('should redirect to the create prototype link page', () => {
        expect(response.header).to.have.property('location').to.equal(formatAccountPathsFor(paths.account.prototyping.demoService.create, EXTERNAL_GATEWAY_ACCOUNT_ID))
      })

      it('should add a relevant error message to the session \'flash\'', () => {
        expect(session.flash).to.have.property('genericError')
        expect(session.flash.genericError.length).to.equal(1)
        expect(session.flash.genericError[0]).to.equal('Something went wrong. Please try again or contact support.')
      })
    })
    describe('but it is unable to create a product', () => {
      let session, response
      before(done => {
        session = getMockSession(VALID_USER)
        nock(PUBLIC_AUTH_URL).post('', VALID_CREATE_TOKEN_REQUEST)
          .reply(201, { token: API_TOKEN })
        mockConnectorGetAccount()
        nock(PRODUCTS_URL).post('/v1/api/products', VALID_CREATE_PRODUCT_REQUEST)
          .replyWithError('Somet went wrong')
        supertest(createAppWithSession(getApp(), session))
          .post(formatAccountPathsFor(paths.account.prototyping.demoService.confirm, EXTERNAL_GATEWAY_ACCOUNT_ID))
          .send(VALID_PAYLOAD)
          .end((err, res) => {
            response = res
            done(err)
          })
      })
      after(() => {
        nock.cleanAll()
      })
      it('should redirect with code 302', () => {
        expect(response.statusCode).to.equal(302)
      })

      it('should redirect to the create prototype link page', () => {
        expect(response.header).to.have.property('location').to.equal(formatAccountPathsFor(paths.account.prototyping.demoService.create, EXTERNAL_GATEWAY_ACCOUNT_ID))
      })

      it('should add a relevant error message to the session \'flash\'', () => {
        expect(session.flash).to.have.property('genericError')
        expect(session.flash.genericError.length).to.equal(1)
        expect(session.flash.genericError[0]).to.equal('Something went wrong. Please try again or contact support.')
      })
    })
  })
  describe('when it is called with invalid inputs', () => {
    describe('and the amount is invalid', () => {
      describe('because the value includes text', () => {
        let result, session, app
        before('Arrange', () => {
          mockConnectorGetAccount()
          session = getMockSession(VALID_USER)
          app = createAppWithSession(getApp(), session)
        })

        before('Act', done => {
          supertest(app)
            .post(formatAccountPathsFor(paths.account.prototyping.demoService.confirm, EXTERNAL_GATEWAY_ACCOUNT_ID))
            .send(Object.assign({}, VALID_PAYLOAD, {
              'payment-amount': 'One Hundred and Eighty Pounds and No Pence'
            }))
            .end((err, res) => {
              result = res
              done(err)
            })
        })

        after(() => {
          nock.cleanAll()
        })

        it('should redirect with a statusCode of 302', () => {
          expect(result.statusCode).to.equal(302)
        })
        it('should redirect to the create prototype link page', () => {
          expect(result.header).to.have.property('location').to.equal(formatAccountPathsFor(paths.account.prototyping.demoService.create, EXTERNAL_GATEWAY_ACCOUNT_ID))
        })
        it('should add a relevant error message to the session \'flash\'', () => {
          expect(session.flash).to.have.property('genericError')
          expect(session.flash.genericError.length).to.equal(1)
          expect(session.flash.genericError[0]).to.equal('Enter an amount in pounds and pence using digits and a decimal point. For example “10.50”')
        })
      })
      describe('because the value has too many digits to the right of the decimal point', () => {
        let result, session, app
        before('Arrange', () => {
          mockConnectorGetAccount()
          session = getMockSession(VALID_USER)
          app = createAppWithSession(getApp(), session)
        })

        before('Act', done => {
          supertest(app)
            .post(formatAccountPathsFor(paths.account.prototyping.demoService.confirm, EXTERNAL_GATEWAY_ACCOUNT_ID))
            .send(Object.assign({}, VALID_PAYLOAD, {
              'payment-amount': '£1234.567'
            }))
            .end((err, res) => {
              result = res
              done(err)
            })
        })

        after(() => {
          nock.cleanAll()
        })

        it('should redirect with a statusCode of 302', () => {
          expect(result.statusCode).to.equal(302)
        })
        it('should redirect to the create prototype link page', () => {
          expect(result.header).to.have.property('location').to.equal(formatAccountPathsFor(paths.account.prototyping.demoService.create, EXTERNAL_GATEWAY_ACCOUNT_ID))
        })
        it('should add a relevant error message to the session \'flash\'', () => {
          expect(session.flash).to.have.property('genericError')
          expect(session.flash.genericError.length).to.equal(1)
          expect(session.flash.genericError[0]).to.equal('Enter an amount in pounds and pence using digits and a decimal point. For example “10.50”')
        })
      })
      describe('because the value exceeds 100,000', () => {
        let result, session, app
        before('Arrange', () => {
          mockConnectorGetAccount()
          session = getMockSession(VALID_USER)
          app = createAppWithSession(getApp(), session)
        })

        before('Act', done => {
          supertest(app)
            .post(formatAccountPathsFor(paths.account.prototyping.demoService.confirm, EXTERNAL_GATEWAY_ACCOUNT_ID))
            .send(Object.assign({}, VALID_PAYLOAD, {
              'payment-amount': '10000000.01'
            }))
            .end((err, res) => {
              result = res
              done(err)
            })
        })

        after(() => {
          nock.cleanAll()
        })

        it('should redirect with a statusCode of 302', () => {
          expect(result.statusCode).to.equal(302)
        })
        it('should redirect to the create prototype link page', () => {
          expect(result.header).to.have.property('location').to.equal(formatAccountPathsFor(paths.account.prototyping.demoService.create, EXTERNAL_GATEWAY_ACCOUNT_ID))
        })
        it('should add a relevant error message to the session \'flash\'', () => {
          expect(session.flash).to.have.property('genericError')
          expect(session.flash.genericError.length).to.equal(1)
          expect(session.flash.genericError[0]).to.equal('Enter an amount under £100,000')
        })
      })
    })
    describe('and the confirmation page link is not https://', () => {
      let session, response
      before(done => {
        session = getMockSession(VALID_USER)
        const app = createAppWithSession(getApp(), session)
        mockConnectorGetAccount()
        supertest(app)
          .post(formatAccountPathsFor(paths.account.prototyping.demoService.confirm, EXTERNAL_GATEWAY_ACCOUNT_ID))
          .send(Object.assign({}, VALID_PAYLOAD, { 'confirmation-page': 'http://example.com' }))
          .end((err, res) => {
            response = res
            done(err)
          })
      })

      it('should redirect with code 302', () => {
        expect(response.statusCode).to.equal(302)
      })

      it('should redirect to the create prototype link page', () => {
        expect(response.header).to.have.property('location').to.equal(formatAccountPathsFor(paths.account.prototyping.demoService.create, EXTERNAL_GATEWAY_ACCOUNT_ID))
      })

      it('should add a relevant error message to the session \'flash\'', () => {
        expect(session.flash).to.have.property('genericError')
        expect(session.flash.genericError.length).to.equal(1)
        expect(session.flash.genericError[0]).to.equal('URL must begin with https://')
      })
    })
    describe('and the description is empty', () => {
      let session, response
      before(done => {
        session = getMockSession(VALID_USER)
        const app = createAppWithSession(getApp(), session)
        const payload = Object.assign({}, VALID_PAYLOAD)
        delete payload['payment-description']
        mockConnectorGetAccount()
        supertest(app)
          .post(formatAccountPathsFor(paths.account.prototyping.demoService.confirm, EXTERNAL_GATEWAY_ACCOUNT_ID))
          .send(payload)
          .end((err, res) => {
            response = res
            done(err)
          })
      })
      after(() => {
        nock.cleanAll()
      })

      it('should redirect with code 302', () => {
        expect(response.statusCode).to.equal(302)
      })

      it('should redirect to the create prototype link page', () => {
        expect(response.header).to.have.property('location').to.equal(formatAccountPathsFor(paths.account.prototyping.demoService.create, EXTERNAL_GATEWAY_ACCOUNT_ID))
      })

      it('should add a relevant error message to the session \'flash\'', () => {
        expect(session.flash).to.have.property('genericError')
        expect(session.flash.genericError.length).to.equal(1)
        expect(session.flash.genericError[0]).to.equal('Enter a description')
      })
    })
  })
})
