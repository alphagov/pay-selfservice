'use strict'

require('../../test-helpers/serialize-mock.js')
const request = require('supertest')
const sinon = require('sinon')
const { getUser, getMockSession, getAppWithSessionAndGatewayAccountCookies } = require('../../test-helpers/mock-session.js')
const directDebitClient = require('../../../app/services/clients/direct-debit-connector.client')

const paths = require('../../../app/paths.js')
const server = require('../../../server.js')

const REDIRECT_URI = process.env.SELFSERVICE_URL + '/oauth/complete'
const CLIENT_ID = process.env.GOCARDLESS_LIVE_CLIENT_ID
const GOCARDLESS_URL = process.env.GOCARDLESS_TEST_OAUTH_BASE_URL + '/oauth/authorize'

let app

describe('GET /link/account - GoCardless Connect partner app', () => {
  const stateParam = 'some-test-state'
  const expectedUrl = `${GOCARDLESS_URL}?client_id=${CLIENT_ID}&initial_view=login&redirect_uri=${REDIRECT_URI}&response_type=code&scope=read_write&access_type=offline&state=${stateParam}`

  beforeEach(() => {
    let stubbedCreateState = directDebitClient.partnerApp.createState = sinon.stub()
    stubbedCreateState.resolves({ state: stateParam })
    const user = getUser({
      external_id: 'DIRECT_DEBIT:121391373c1844dd99cb3416b70785c8',
      permissions: [{ name: 'connected-gocardless-account:update' }]
    })
    const mockSession = getMockSession(user)
    app = getAppWithSessionAndGatewayAccountCookies(server.getApp(), mockSession, user)
  })
  afterEach(() => {
    app = null
  })

  it(
    'allows access if authenticated and DIRECT_DEBIT account (redirects to GoCardless Connect)',
    done => {
      request(app)
        .get(paths.partnerApp.linkAccount)
        .expect(302)
        .expect('Location', expectedUrl)
        .end(done)
    }
  )
})

describe('GET /link/account - GoCardless Connect partner app', () => {
  beforeEach(() => {
    const user = getUser({ permissions: [{ name: 'connected-gocardless-account:update' }] })
    const mockSession = getMockSession(user)
    app = getAppWithSessionAndGatewayAccountCookies(server.getApp(), mockSession, user)
  })
  afterEach(() => {
    app = null
  })

  it(
    'does not allow access if authenticated and NOT DIRECT_DEBIT account',
    done => {
      request(app)
        .get(paths.partnerApp.linkAccount)
        .expect(404)
        .end(done)
    }
  )
})

describe('GET /link/account - GoCardless Connect partner app', () => {
  beforeEach(() => {
    app = getAppWithSessionAndGatewayAccountCookies(server.getApp(), {})
  })
  afterEach(() => {
    app = null
  })

  it('redirects to /login if not authenticated', done => {
    request(app)
      .get(paths.partnerApp.linkAccount)
      .expect(302)
      .expect('Location', paths.user.logIn)
      .end(done)
  })
})
