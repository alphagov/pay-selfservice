'use strict'

const request = require('supertest')
const nock = require('nock')

require('../test-helpers/serialize-mock.js')
const userCreator = require('../test-helpers/user-creator.js')
const getApp = require('../../server.js').getApp
const session = require('../test-helpers/mock-session.js')

const connectorMock = nock(process.env.CONNECTOR_URL)

const { validGatewayAccountsResponse } = require('../fixtures/gateway-account.fixtures')

const user = session.getUser()
const app = session.getAppWithLoggedInUser(getApp(), session.getUser())

describe('Service dashboard redirect to live account controller', () => {
  afterEach(() => nock.cleanAll())

  beforeEach(() => {
    userCreator.mockUserResponse(user.toJson())

    const accountsResponse = validGatewayAccountsResponse({
      accounts: [{
        payment_provider: 'stripe',
        type: 'live'
      }]
    })
    connectorMock.get('/v1/frontend/accounts?accountIds=540')
      .reply(200, accountsResponse.getPlain())
  })

  it('correctly redirects to the dashboard page', () => {
    const externalServiceId = '193'
    return request(app).get(`/service/${externalServiceId}/dashboard/live`)
      .expect(302)
  })
})
