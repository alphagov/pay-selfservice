'use strict'

const supertest = require('supertest')
const { expect } = require('chai')
const cheerio = require('cheerio')
const nock = require('nock')
const lodash = require('lodash')

const { getApp } = require('../../../server')
const { getMockSession, createAppWithSession, getUser } = require('../../test-helpers/mock-session')
const paths = require('../../../app/paths')
const { penceToPounds } = require('../../../app/utils/currency-formatter')
const formatAccountPathsFor = require('../../../app/utils/format-account-paths-for')
const { validGatewayAccountResponse } = require('../../fixtures/gateway-account.fixtures')

const { CONNECTOR_URL } = process.env
const GATEWAY_ACCOUNT_ID = '929'
const EXTERNAL_GATEWAY_ACCOUNT_ID = 'an-external-id'

function mockConnectorGetAccount () {
  nock(CONNECTOR_URL).get(`/v1/frontend/accounts/external-id/${EXTERNAL_GATEWAY_ACCOUNT_ID}`)
    .reply(200, validGatewayAccountResponse(
      {
        external_id: EXTERNAL_GATEWAY_ACCOUNT_ID,
        gateway_account_id: GATEWAY_ACCOUNT_ID
      }
    ))
}

describe('test with your users - create controller', () => {
  let result, $, session
  before(done => {
    const user = getUser({
      gateway_account_ids: [GATEWAY_ACCOUNT_ID],
      permissions: [{ name: 'transactions:read' }]
    })
    mockConnectorGetAccount()
    session = getMockSession(user)
    lodash.set(session, 'pageData.createPrototypeLink', {
      paymentDescription: 'An example prototype payment',
      paymentAmount: '1050',
      confirmationPage: 'example.gov.uk/payment-complete'
    })
    supertest(createAppWithSession(getApp(), session))
      .get(formatAccountPathsFor(paths.account.prototyping.demoService.create, EXTERNAL_GATEWAY_ACCOUNT_ID))
      .end((err, res) => {
        result = res
        $ = cheerio.load(res.text)
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
    expect($('.govuk-back-link').attr('href')).to.equal(formatAccountPathsFor(paths.account.prototyping.demoService.links, EXTERNAL_GATEWAY_ACCOUNT_ID))
  })

  it(`should have the confirm page as the form action`, () => {
    expect($('form').attr('action')).to.equal(formatAccountPathsFor(paths.account.prototyping.demoService.confirm, EXTERNAL_GATEWAY_ACCOUNT_ID))
  })

  it(`should pre-set the value of the 'payment-description' input to pre-existing data if present in the session`, () =>
    expect($(`input[name='payment-description']`).val()).to.equal(session.pageData.createPrototypeLink.paymentDescription)
  )

  it(`should pre-set the value of the 'payment-amount' input to pre-existing data if present in the session`, () =>
    expect($(`input[name='payment-amount']`).val()).to.equal(penceToPounds(session.pageData.createPrototypeLink.paymentAmount))
  )

  it(`should pre-set the value of the 'confirmation-page' input to pre-existing data if present in the session`, () =>
    expect($(`input[name='confirmation-page']`).val()).to.equal(session.pageData.createPrototypeLink.confirmationPage)
  )
})
