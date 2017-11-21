'use strict'

// NPM dependencies
const supertest = require('supertest')
const nock = require('nock')
const csrf = require('csrf')
const cheerio = require('cheerio')
const {expect} = require('chai')

// Local dependencies
const {getApp} = require('../../../../server')
const {getMockSession, getUser, createAppWithSession} = require('../../../test_helpers/mock_session')
const paths = require('../../../../app/paths')
const {randomUuid} = require('../../../../app/utils/random')
const {validCreateProductRequest, validCreateProductResponse} = require('../../../fixtures/product_fixtures')

const {PUBLIC_AUTH_URL, PRODUCTS_URL, CONNECTOR_URL} = process.env
const GATEWAY_ACCOUNT_ID = 929
const API_TOKEN = randomUuid()
const VALID_USER = getUser({gateway_account_ids: [GATEWAY_ACCOUNT_ID], permissions: [{name: 'transactions:read'}]})
const VALID_PAYLOAD = {
  'csrfToken': csrf().create('123'),
  'payment-amount': '20',
  'payment-description': 'Test service name',
  'confirmation-page': 'https://www.example.com'
}
const VALID_MINIMAL_GATEWAY_ACCOUNT_RESPONSE = {
  payment_provider: 'sandbox'
}
const VALID_CREATE_TOKEN_REQUEST = {
  account_id: GATEWAY_ACCOUNT_ID,
  created_by: VALID_USER.email,
  description: `Token for Prototype: ${VALID_PAYLOAD['payment-description']}`
}
const VALID_CREATE_PRODUCT_REQUEST = validCreateProductRequest({
  name: VALID_PAYLOAD['payment-description'],
  payApiToken: API_TOKEN,
  price: parseInt(VALID_PAYLOAD['payment-amount']) * 100,
  returnUrl: VALID_PAYLOAD['confirmation-page'],
  gatewayAccountId: GATEWAY_ACCOUNT_ID
}).getPlain()
const VALID_CREATE_PRODUCT_RESPONSE = validCreateProductResponse(VALID_CREATE_PRODUCT_REQUEST).getPlain()

describe('test with your users - submit controller', () => {
  describe('when it is called on a gateway account that is from a payment provider other than sandbox', () => {
    let session, response, $
    before(done => {
      session = getMockSession(VALID_USER)
      nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`).reply(200, {
        payment_provider: 'worldpay'
      })
      supertest(createAppWithSession(getApp(), session))
        .post(paths.prototyping.demoService.confirm)
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

    it('should respond with a code of 403: forbidden', () => {
      expect(response.statusCode).to.equal(403)
    })

    it('should show the error page', () => {
      expect($('.page-title').text()).to.equal('An error occurred:')
    })

    it('should inform the user that this page is only available via sandbox', () => {
      expect($('#errorMsg').text()).to.equal('This page is only available on Sandbox accounts')
    })
  })
  describe('when it is called with valid inputs', () => {
    describe('and it successfully creates both an API token and a product', () => {
      let session, response, $
      before(done => {
        session = getMockSession(VALID_USER)
        nock(PUBLIC_AUTH_URL).post('', VALID_CREATE_TOKEN_REQUEST)
          .reply(201, {token: API_TOKEN})
        nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`).reply(200, {
          payment_provider: 'sandbox'
        })
        nock(PRODUCTS_URL).post('/v1/api/products', VALID_CREATE_PRODUCT_REQUEST)
          .reply(201, VALID_CREATE_PRODUCT_RESPONSE)
        supertest(createAppWithSession(getApp(), session))
          .post(paths.prototyping.demoService.confirm)
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
        const prototypeLink = $('.prototype-link')
        const url = VALID_CREATE_PRODUCT_RESPONSE._links.find(link => link.rel === 'pay').href
        expect(prototypeLink.attr('href')).to.equal(url)
        expect(prototypeLink.text()).to.equal(url)
      })

      it('should have a back link and a button that link back to the links page', () => {
        expect($('.link-back').attr('href')).to.equal(paths.prototyping.demoService.links)
        expect($('.links-page').attr('href')).to.equal(paths.prototyping.demoService.links)
      })
    })
    describe('but it is unable to create an API token', () => {
      let session, response
      before(done => {
        session = getMockSession(VALID_USER)
        nock(PUBLIC_AUTH_URL).post('', VALID_CREATE_TOKEN_REQUEST)
          .replyWithError('Somet nasty happened')
        nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`).reply(200, {
          payment_provider: 'sandbox'
        })
        supertest(createAppWithSession(getApp(), session))
          .post(paths.prototyping.demoService.confirm)
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
        expect(response.header).to.have.property('location').to.equal(paths.prototyping.demoService.create)
      })

      it('should add a relevant error message to the session \'flash\'', () => {
        expect(session.flash).to.have.property('genericError')
        expect(session.flash.genericError.length).to.equal(1)
        expect(session.flash.genericError[0]).to.equal('<h2>There were errors</h2> Error while creating product')
      })
    })
    describe('but it is unable to create a product', () => {
      let session, response
      before(done => {
        session = getMockSession(VALID_USER)
        nock(PUBLIC_AUTH_URL).post('', VALID_CREATE_TOKEN_REQUEST)
          .reply(201, {token: API_TOKEN})
        nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`)
          .reply(200, {
            payment_provider: 'sandbox'
          })
        nock(PRODUCTS_URL).post('/v1/api/products', VALID_CREATE_PRODUCT_REQUEST)
          .replyWithError('Somet went wrong')
        supertest(createAppWithSession(getApp(), session))
          .post(paths.prototyping.demoService.confirm)
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
        expect(response.header).to.have.property('location').to.equal(paths.prototyping.demoService.create)
      })

      it('should add a relevant error message to the session \'flash\'', () => {
        expect(session.flash).to.have.property('genericError')
        expect(session.flash.genericError.length).to.equal(1)
        expect(session.flash.genericError[0]).to.equal('<h2>There were errors</h2> Error while creating product')
      })
    })
  })
  describe('when it is called with invalid inputs', () => {
    describe('and the amount is invalid', () => {
      describe('because the value includes text', () => {
        let result, session, app
        before('Arrange', () => {
          nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`).reply(200, VALID_MINIMAL_GATEWAY_ACCOUNT_RESPONSE)
          session = getMockSession(VALID_USER)
          app = createAppWithSession(getApp(), session)
        })

        before('Act', done => {
          supertest(app)
            .post(paths.prototyping.demoService.confirm)
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
          expect(result.header).to.have.property('location').to.equal(paths.prototyping.demoService.create)
        })
        it('should add a relevant error message to the session \'flash\'', () => {
          expect(session.flash).to.have.property('genericError')
          expect(session.flash.genericError.length).to.equal(1)
          expect(session.flash.genericError[0]).to.equal('<h2>Use valid characters only</h2> Choose an amount in pounds and pence using digits and a decimal point. For example “10.50”')
        })
      })
      describe('because the value has too many digits to the right of the decimal point', () => {
        let result, session, app
        before('Arrange', () => {
          nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`).reply(200, VALID_MINIMAL_GATEWAY_ACCOUNT_RESPONSE)
          session = getMockSession(VALID_USER)
          app = createAppWithSession(getApp(), session)
        })

        before('Act', done => {
          supertest(app)
            .post(paths.prototyping.demoService.confirm)
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
          expect(result.header).to.have.property('location').to.equal(paths.prototyping.demoService.create)
        })
        it('should add a relevant error message to the session \'flash\'', () => {
          expect(session.flash).to.have.property('genericError')
          expect(session.flash.genericError.length).to.equal(1)
          expect(session.flash.genericError[0]).to.equal('<h2>Use valid characters only</h2> Choose an amount in pounds and pence using digits and a decimal point. For example “10.50”')
        })
      })
      describe('because the value exceeds 10,000,000', () => {
        let result, session, app
        before('Arrange', () => {
          nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`).reply(200, VALID_MINIMAL_GATEWAY_ACCOUNT_RESPONSE)
          session = getMockSession(VALID_USER)
          app = createAppWithSession(getApp(), session)
        })

        before('Act', done => {
          supertest(app)
            .post(paths.prototyping.demoService.confirm)
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
          expect(result.header).to.have.property('location').to.equal(paths.prototyping.demoService.create)
        })
        it('should add a relevant error message to the session \'flash\'', () => {
          expect(session.flash).to.have.property('genericError')
          expect(session.flash.genericError.length).to.equal(1)
          expect(session.flash.genericError[0]).to.equal('<h2>Enter a valid amount</h2> Choose an amount under £10,000,000')
        })
      })
    })
    describe('and the confirmation page link is not https://', () => {
      let session, response
      before(done => {
        session = getMockSession(VALID_USER)
        const app = createAppWithSession(getApp(), session)
        nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`)
          .reply(200, {
            payment_provider: 'sandbox'
          })
        supertest(app)
          .post(paths.prototyping.demoService.confirm)
          .send(Object.assign({}, VALID_PAYLOAD, {'confirmation-page': 'http://example.com'}))
          .end((err, res) => {
            response = res
            done(err)
          })
      })

      it('should redirect with code 302', () => {
        expect(response.statusCode).to.equal(302)
      })

      it('should redirect to the create prototype link page', () => {
        expect(response.header).to.have.property('location').to.equal(paths.prototyping.demoService.create)
      })

      it('should add a relevant error message to the session \'flash\'', () => {
        expect(session.flash).to.have.property('genericError')
        expect(session.flash.genericError.length).to.equal(1)
        expect(session.flash.genericError[0]).to.equal('<h2>Enter a valid secure URL</h2>URL must begin with https://')
      })
    })
    describe('and the description is empty', () => {
      let session, response
      before(done => {
        session = getMockSession(VALID_USER)
        const app = createAppWithSession(getApp(), session)
        const payload = Object.assign({}, VALID_PAYLOAD)
        delete payload['payment-description']
        nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`)
          .reply(200, {
            payment_provider: 'sandbox'
          })
        supertest(app)
          .post(paths.prototyping.demoService.confirm)
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
        expect(response.header).to.have.property('location').to.equal(paths.prototyping.demoService.create)
      })

      it('should add a relevant error message to the session \'flash\'', () => {
        expect(session.flash).to.have.property('genericError')
        expect(session.flash.genericError.length).to.equal(1)
        expect(session.flash.genericError[0]).to.equal('<h2>Enter a description</h2> Tell users what they are paying for')
      })
    })
  })
})
