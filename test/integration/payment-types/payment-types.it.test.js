'use strict'

const request = require('supertest')
const nock = require('nock')
const chai = require('chai')
const csrf = require('csrf')

require('../../test-helpers/serialize-mock.js')
const { expect } = chai
const getApp = require('../../../server.js').getApp
const paths = require('../../../app/paths.js')
const session = require('../../test-helpers/mock-session.js')
const userCreator = require('../../test-helpers/user-creator.js')
const cardFixtures = require('../../fixtures/card.fixtures')
const gatewayAccountFixtures = require('../../fixtures/gateway-account.fixtures')
const formatAccountPathsFor = require('../../../app/utils/format-account-paths-for')

const gatewayAccountId = '15486734'
const gatewayAccountExternalId = 'account-external-id'
const connectorMock = nock(process.env.CONNECTOR_URL)
const CONNECTOR_ACCOUNT_CARD_TYPES_PATH = `/v1/frontend/accounts/${gatewayAccountId}/card-types`
const CONNECTOR_ACCOUNT_BY_EXTERNAL_ID = `/v1/frontend/accounts/external-id/${gatewayAccountExternalId}`

let app

function whenGetPaymentTypes (baseApp) {
  return request(baseApp)
    .get(formatAccountPathsFor(paths.account.paymentTypes.index, gatewayAccountExternalId))
}

function whenPaymentTypesUpdated (baseApp, payload) {
  payload = {
    ...payload,
    csrfToken: csrf().create('123')
  }
  return request(baseApp)
    .post(formatAccountPathsFor(paths.account.paymentTypes.index, gatewayAccountExternalId))
    .send(payload)
}

describe('Payment types', function () {
  afterEach(function () {
    nock.cleanAll()
    app = null
  })

  beforeEach(function (done) {
    let user = session.getUser({
      gateway_account_ids: [gatewayAccountId],
      permissions: [{ name: 'payment-types:read' }, { name: 'payment-types:update' }]
    })
    app = session.getAppWithLoggedInUser(getApp(), user)

    connectorMock.get('/v1/api/card-types')
      .reply(200, cardFixtures.validCardTypesResponse())

    connectorMock.get(CONNECTOR_ACCOUNT_BY_EXTERNAL_ID)
      .reply(200, gatewayAccountFixtures.validGatewayAccountResponse({
        gateway_account_id: gatewayAccountId,
        external_id: gatewayAccountExternalId
      }))

    userCreator.mockUserResponse(user.toJson(), done)
  })

  describe('get payment types', function () {
    it('should return 200 for get payment types when connector returns card types', async () => {
      connectorMock.get(CONNECTOR_ACCOUNT_CARD_TYPES_PATH)
        .reply(200, cardFixtures.validCardTypesResponse())

      return whenGetPaymentTypes(app).expect(200)
    })
    it('should return error for get payment types when connector errors', async () => {
      connectorMock.get(CONNECTOR_ACCOUNT_CARD_TYPES_PATH)
        .reply(500)

      return whenGetPaymentTypes(app)
        .expect(500)
        .expect(response => expect(response.text).to.contain('Unable to fetch payment types. Please try again or contact support team.'))
    })
  })
  describe('update payment types', function () {
    it('should update payment types successfully and redirect when connector returns 200', async () => {
      connectorMock.post(CONNECTOR_ACCOUNT_CARD_TYPES_PATH, { card_types: ['mastercard-id-1234'] })
        .reply(200)

      return whenPaymentTypesUpdated(app, { debit: 'mastercard-id-1234' })
        .expect(302)
    })
    it('should redirect when no card is selected to update', async () => {
      return whenPaymentTypesUpdated(app, {})
        .expect(302)
        .expect(response => expect(response.text).to.contains('Found. Redirecting to /account/account-external-id/payment-types'))
        .expect('Location', '/account/account-external-id/payment-types')
    })
    it('should return error for get payment types when connector errors', async () => {
      connectorMock.post(CONNECTOR_ACCOUNT_CARD_TYPES_PATH, { card_types: ['visa-id-1234'] })
        .reply(500)

      return whenPaymentTypesUpdated(app, { debit: 'visa-id-1234' })
        .expect(500)
        .expect(response => expect(response.text).to.contain('Unable to update payment types. Please try again or contact support team.'))
    })
  })
})
