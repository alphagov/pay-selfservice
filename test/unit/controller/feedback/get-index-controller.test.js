'use strict'

const supertest = require('supertest')
const { expect } = require('chai')
const cheerio = require('cheerio')
const nock = require('nock')

const { getApp } = require('../../../../server')
const { getMockSession, createAppWithSession, getUser } = require('../../../test_helpers/mock_session')
const paths = require('../../../../app/paths')
const { CONNECTOR_URL } = process.env
const GATEWAY_ACCOUNT_ID = '929'

describe('Feedback page GET', () => {
  let result, $, session
  before(done => {
    const user = getUser({
      gateway_account_ids: [GATEWAY_ACCOUNT_ID],
      permissions: [{ name: 'transactions:read' }]
    })
    nock(CONNECTOR_URL)
      .get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`)
      .reply(200, {
        payment_provider: 'sandbox'
      })

    session = getMockSession(user)
    supertest(createAppWithSession(getApp(), session))
      .get(paths.feedback)
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

  it(`should have itself as the form action`, () => {
    expect($('form').attr('action')).to.equal(paths.feedback)
  })

  it(`should have a button with “Send feedback”`, () => {
    expect($('.govuk-button').text()).to.contain('Send feedback')
  })
})
