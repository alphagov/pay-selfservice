require('@test/test-helpers/serialize-mock.js')

const request = require('supertest')
const nock = require('nock')

const userCreator = require('@test/test-helpers/user-creator.js')
const getApp = require('@root/server').getApp
const session = require('@test/test-helpers/mock-session.js')

const connectorMock = nock(process.env.CONNECTOR_URL)

const { validGatewayAccountsResponse } = require('@test/fixtures/gateway-account.fixtures')

const user = session.getUser()
const app = session.getAppWithLoggedInUser(getApp(), session.getUser())

describe('Service dashboard redirect to live account controller', function () {
  afterEach(() => nock.cleanAll())

  beforeEach(function () {
    userCreator.mockUserResponse(user.toJson())

    const accountsResponse = validGatewayAccountsResponse({
      accounts: [{
        payment_provider: 'stripe',
        type: 'live'
      }]
    })
    connectorMock.get('/v1/frontend/accounts?accountIds=540')
      .reply(200, accountsResponse)
  })

  it('correctly redirects to the dashboard page', () => {
    const externalServiceId = '193'
    return request(app).get(`/service/${externalServiceId}/dashboard/live`)
      .expect(302)
  })
})
