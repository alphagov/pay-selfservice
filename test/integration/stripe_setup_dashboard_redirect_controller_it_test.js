'use strict'

const request = require('supertest')
const nock = require('nock')

require('../test_helpers/serialize_mock.js')
const userCreator = require('../test_helpers/user_creator.js')
const getApp = require('../../server.js').getApp
const session = require('../test_helpers/mock_session.js')

const connectorMock = nock(process.env.CONNECTOR_URL)

const { validGatewayAccountsResponse } = require('../fixtures/gateway_account_fixtures')

const user = session.getUser()
const app = session.getAppWithLoggedInUser(getApp(), session.getUser())

describe('Service dashboard redirect to live account controller', function () {
  afterEach(() => nock.cleanAll())

  beforeEach(function () {
    userCreator.mockUserResponse(user.toJson())

    const accountsResponse = validGatewayAccountsResponse({
      accounts: [{
        payment_provider: 'stripe'
      }]
    })
    connectorMock.get('/v1/frontend/accounts')
      .reply(200, accountsResponse.getPlain())
  })

  it('correctly redirects to the dashboard page', () => {
    const externalServiceId = 'some-external-service-id'
    return request(app).get(`/service/${externalServiceId}/dashboard/live`)
      .set('Accept', 'application/json')
      .expect(302)
  })
})
