'use strict'

// NPM dependencies
const supertest = require('supertest')
const {expect} = require('chai')
const cheerio = require('cheerio')
const lodash = require('lodash')

// Local dependencies
const {getApp} = require('../../../../server')
const {getMockSession, createAppWithSession, getUser} = require('../../../test_helpers/mock_session')
const paths = require('../../../../app/paths')

describe('test with your users - create controller', () => {
  let result, $, session
  before(done => {
    const user = getUser({
      gateway_account_ids: [929],
      permissions: [{name: 'transactions:read'}]
    })
    session = getMockSession(user)
    lodash.set(session, 'pageData.createPrototypeLink', {
      paymentDescription: 'An example prototype payment',
      paymentAmount: '10.50',
      confirmationPage: 'example.gov.uk/payment-complete'
    })
    supertest(createAppWithSession(getApp(), session))
      .get(paths.prototyping.demoService.create)
      .end((err, res) => {
        result = res
        $ = cheerio.load(res.text)
        done(err)
      })
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
    expect($(`input[name='payment-description']`).val()).to.equal(session.pageData.createPrototypeLink.paymentDescription)
  )

  it(`should pre-set the value of the 'payment-amount' input to pre-existing data if present in the session`, () =>
    expect($(`input[name='payment-amount']`).val()).to.equal(session.pageData.createPrototypeLink.paymentAmount)
  )

  it(`should pre-set the value of the 'confirmation-page' input to pre-existing data if present in the session`, () =>
    expect($(`input[name='confirmation-page']`).val()).to.equal(session.pageData.createPrototypeLink.confirmationPage)
  )
})
