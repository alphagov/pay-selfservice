'use strict'

// NPM dependencies
const supertest = require('supertest')
const {expect} = require('chai')
const cheerio = require('cheerio')
const nock = require('nock')
const lodash = require('lodash')


// Local dependencies
const app = require('../../../../server').getApp()
const paths = require('../../../../app/paths')
const {CookieBuilder, decryptCookie} = require('../../../test_helpers/cookie-helper')
const userFixtures = require('../../../fixtures/user_fixtures')


const {CONNECTOR_URL, ADMINUSERS_URL} = process.env
const VALID_GATEWAY_ACCOUNT = {
  id: 929,
  payment_provider: 'sandbox'
}

describe('test with your users - create controller', () => {
  let result, $, sessionCookie
  before(done => {
    const user = userFixtures.validUserResponse().getPlain()
    lodash.set(user, 'service_roles[0].role.permissions', [{name:'transactions:read'}])
    lodash.set(user, 'service_roles[0].service.gateway_account_ids', [VALID_GATEWAY_ACCOUNT.id])

    const cookieHeader = new CookieBuilder()
      .withUser(user)
      .withSecondFactor('totp')
      .withCookie('session', {
        pageData: {
          createPrototypeLink: {
            paymentDescription: 'An example prototype payment',
            paymentAmount: '10.50',
            confirmationPage: 'example.gov.uk/payment-complete'
          }
        }
      })
      .build()

    nock(ADMINUSERS_URL)
      .get(`/v1/api/users/${user.external_id}`)
      .reply(200, user)

    nock(CONNECTOR_URL)
      .get(`/v1/frontend/accounts/${VALID_GATEWAY_ACCOUNT.id}`)
      .reply(200, VALID_GATEWAY_ACCOUNT)

    supertest(app)
      .get(paths.prototyping.demoService.create)
      .set('Cookie', cookieHeader)
      .end((err, res) => {
        result = res
        $ = cheerio.load(res.text)
        sessionCookie = decryptCookie(res.header['set-cookie']).session
        done(err)
      })
  })
  after(() => {
    nock.cleanAll()
  })

  it('should return a statusCode of 200', () => {
    expect(result.statusCode).to.equal(200)
  })

  it(`should include a back link linking to the demoservice links page`, () => {
    expect($('.link-back').attr('href')).to.equal(paths.prototyping.demoService.links)
  })

  it(`should have the confirm page as the form action`, () => {
    expect($('form').attr('action')).to.equal(paths.prototyping.demoService.confirm)
  })

  it(`should pre-set the value of the 'payment-description' input to pre-existing data if present in the session`, () =>
    expect($(`input[name='payment-description']`).val()).to.equal(sessionCookie.content.pageData.createPrototypeLink.paymentDescription)
  )

  it(`should pre-set the value of the 'payment-amount' input to pre-existing data if present in the session`, () =>
    expect($(`input[name='payment-amount']`).val()).to.equal(sessionCookie.content.pageData.createPrototypeLink.paymentAmount)
  )

  it(`should pre-set the value of the 'confirmation-page' input to pre-existing data if present in the session`, () =>
    expect($(`input[name='confirmation-page']`).val()).to.equal(sessionCookie.content.pageData.createPrototypeLink.confirmationPage)
  )
})
