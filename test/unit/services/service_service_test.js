'use strict'

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const nock = require('nock')
chai.use(chaiAsPromised)

// Local Dependencies
const serviceService = require('../../../app/services/service_service')
const gatewayAccountFixtures = require('../../fixtures/gateway_account_fixtures')

const connectorMock = nock(process.env.CONNECTOR_URL)
const directDebitConnectorMock = nock(process.env.DIRECT_DEBIT_CONNECTOR_URL)
const CONNECTOR_ACCOUNT_PATH = '/v1/frontend/accounts'
const DIRECT_DEBIT_CONNECTOR_ACCOUNT_PATH = '/v1/api/accounts'

const expect = chai.expect
const correlationId = 'correlationId'

describe('service service', function () {
  afterEach(function () {
    nock.cleanAll()
  })

  it('should return gateway accounts for the valid ids', function (done) {
    const gatewayAccountId1 = '1'
    const gatewayAccountId2 = '2'
    const nonExistentId = '3'
    const directDebitAccountId = 'DIRECT_DEBIT:adashdkjlq3434lk'
    const nonExistentDirectDebitId = 'DIRECT_DEBIT:sadasdkasjdlkjlkeuo2'
    const testConnectorAccount1 = gatewayAccountFixtures.validGatewayAccountResponse({
      gateway_account_id: gatewayAccountId1,
      service_name: 'ga 1'
    }).getPlain()
    const testConnectorAccount2 = gatewayAccountFixtures.validGatewayAccountResponse({
      gateway_account_id: gatewayAccountId2,
      service_name: 'ga 2'
    }).getPlain()
    const testDirectDebitAccount = gatewayAccountFixtures.validDirectDebitGatewayAccountResponse({
      gateway_account_id: gatewayAccountId1,
      service_name: 'ga dd'
    }).getPlain()
    connectorMock.get(`${CONNECTOR_ACCOUNT_PATH}/${gatewayAccountId1}`)
      .reply(200, testConnectorAccount1)
    connectorMock.get(`${CONNECTOR_ACCOUNT_PATH}/${gatewayAccountId2}`)
      .reply(200, testConnectorAccount2)
    connectorMock.get(`${CONNECTOR_ACCOUNT_PATH}/${nonExistentId}`)
      .reply(404) // NOT FOUND

    directDebitConnectorMock.get(`${DIRECT_DEBIT_CONNECTOR_ACCOUNT_PATH}/${directDebitAccountId}`)
      .reply(200, testDirectDebitAccount)
    directDebitConnectorMock.get(`${DIRECT_DEBIT_CONNECTOR_ACCOUNT_PATH}/${nonExistentDirectDebitId}`)
      .reply(404)
    serviceService.getGatewayAccounts([gatewayAccountId1, gatewayAccountId2, nonExistentId, directDebitAccountId, nonExistentDirectDebitId], correlationId).should.be.fulfilled.then(gatewayAccounts => {
      expect(gatewayAccounts).to.have.lengthOf(3)
      expect(gatewayAccounts.map(accountObj => accountObj.id)).to.include('1', '2', 'DIRECT_DEBIT:adashdkjlq3434lk')
    }).should.notify(done)
  })
})
