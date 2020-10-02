'use strict'

const supertest = require('supertest')
const csrf = require('csrf')
const nock = require('nock')

const { getApp } = require('../../../../server')
const { getMockSession, createAppWithSession, getUser } = require('../../../test-helpers/mock-session')
const paths = require('../../../../app/paths')
const ZENDESK_URL = 'https://govuk.zendesk.com/api/v2'
const GATEWAY_ACCOUNT_ID = '929'
const VALID_USER = getUser({
  gateway_account_ids: [GATEWAY_ACCOUNT_ID],
  permissions: [{ name: 'transactions:read' }]
})

describe('Feedback page POST', () => {
  let result, session, app
  beforeAll(() => {
    session = getMockSession(VALID_USER)
    app = createAppWithSession(getApp(), session)

    nock(ZENDESK_URL)
      .post(`/tickets`)
      .reply(200)
  })

  beforeAll(done => {
    supertest(app)
      .post(paths.feedback)
      .send({
        csrfToken: csrf().create('123'),
        'feedback-rating': 'Very satisfied',
        'feedback-suggestion': 'I love GOV.UK Pay.'
      })
      .end((err, res) => {
        result = res
        done(err)
      })
  })
  afterAll(() => {
    nock.cleanAll()
  })

  it('should return a statusCode of 302', () => {
    expect(result.statusCode).toBe(302)
  })

  it('should redirect to the profile page', () => {
    expect(result.headers).to.have.property('location').toBe(paths.feedback)
  })
})
