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

const {PUBLIC_AUTH_URL, PRODUCTS_URL} = process.env
const GATEWAY_ACCOUNT_ID = 929
const API_TOKEN = randomUuid()
const VALID_USER = getUser({gateway_account_ids: [GATEWAY_ACCOUNT_ID], permissions: [{name: 'transactions:read'}]})
const VALID_PAYLOAD = {
  'csrfToken': csrf().create('123'),
  'payment-amount': '20',
  'payment-description': 'Test service name',
  'confirmation-page': 'https://www.example.com'
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

describe.only('test with your users - submit controller', () => {
  describe('when it is called with valid inputs', () => {
    describe('and it successfully creates both an API token and a product', () => {
      let session, response, $
      before(done => {
        session = getMockSession(VALID_USER)
        nock(PUBLIC_AUTH_URL).post('',VALID_CREATE_TOKEN_REQUEST)
          .reply(201, {token: API_TOKEN})
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
        nock(PUBLIC_AUTH_URL).post('',VALID_CREATE_TOKEN_REQUEST)
          .replyWithError('Somet nasty happened')
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
        nock(PUBLIC_AUTH_URL).post('',VALID_CREATE_TOKEN_REQUEST)
          .reply(201, {token: API_TOKEN})
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
      let session, response
      before(done => {
        const user = getUser({
          gateway_account_ids: [929],
          permissions: [{name: 'transactions:read'}]
        })
        session = getMockSession(user)
        const app = createAppWithSession(getApp(), session)
        supertest(app)
          .post(paths.prototyping.demoService.confirm)
          .send(Object.assign({}, VALID_PAYLOAD, {'payment-amount': 'bad amount'}))
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
        expect(session.flash.genericError[0]).to.equal('<h2>Use valid characters only</h2> Choose an amount in pounds and pence using digits and a decimal point. For example “10.50”')
      })
    })

    describe('and the confirmation page link is not https://', () => {
      let session, response
      before(done => {
        session = getMockSession(VALID_USER)
        const app = createAppWithSession(getApp(), session)
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
        supertest(app)
          .post(paths.prototyping.demoService.confirm)
          .send(payload)
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
        expect(session.flash.genericError[0]).to.equal('<h2>Enter a description</h2> Tell users what they are paying for')
      })
    })
  })
})
