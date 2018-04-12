'use strict'

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const nock = require('nock')
chai.use(chaiAsPromised)

// Local Dependencies
const serviceService = require('../../../app/services/service_service')
const gatewayAccountFixtures = require('../../fixtures/gateway_account_fixtures')

const connectorMock = nock(process.env.CONNECTOR_URL)
const productsMock = nock(process.env.PRODUCTS_URL)
const directDebitConnectorMock = nock(process.env.DIRECT_DEBIT_CONNECTOR_URL)
const adminusersMock = nock(process.env.ADMINUSERS_URL)
const ADMINUSERS_SERVICE_NAME_URL = '/v1/api/services'
const CONNECTOR_ACCOUNT_PATH = '/v1/frontend/accounts'
const CONNECTOR_SERVICE_NAME_PATH = '/v1/frontend/accounts/{accountId}/servicename'
const DIRECT_DEBIT_CONNECTOR_ACCOUNT_PATH = '/v1/api/accounts'
const PRODUCTS_SERVICE_NAME_PATH = '/v1/api/gateway-account'
const expect = chai.expect
const correlationId = 'correlationId'

describe('service service', function () {
  afterEach(function () {
    nock.cleanAll()
  })

  describe('when getting gateway accounts', function () {
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

    it('should not call connector for retrieving direct debit accounts', function (done) {
      const directDebitAccountId = 'DIRECT_DEBIT:adashdkjlq3434lk'
      const directDebitAccountId2 = 'DIRECT_DEBIT:sadasdkasjdlkjlkeuo2'
      const testAccount1 = gatewayAccountFixtures.validDirectDebitGatewayAccountResponse({
        gateway_account_id: directDebitAccountId,
        service_name: 'ga 1'
      }).getPlain()
      const testAccount2 = gatewayAccountFixtures.validDirectDebitGatewayAccountResponse({
        gateway_account_id: directDebitAccountId2,
        service_name: 'ga 2'
      }).getPlain()

      connectorMock.get(`${CONNECTOR_ACCOUNT_PATH}/${directDebitAccountId}`)
        .reply(404)
      connectorMock.get(`${CONNECTOR_ACCOUNT_PATH}/${directDebitAccountId2}`)
        .reply(404)
      directDebitConnectorMock.get(`${DIRECT_DEBIT_CONNECTOR_ACCOUNT_PATH}/${directDebitAccountId}`)
        .reply(200, testAccount1)
      directDebitConnectorMock.get(`${DIRECT_DEBIT_CONNECTOR_ACCOUNT_PATH}/${directDebitAccountId2}`)
        .reply(200, testAccount2)
      serviceService.getGatewayAccounts([directDebitAccountId, directDebitAccountId2], correlationId).should.be.fulfilled.then(gatewayAccounts => {
        expect(connectorMock.isDone()).to.be.false // eslint-disable-line no-unused-expressions
        expect(directDebitConnectorMock.isDone()).to.be.true // eslint-disable-line no-unused-expressions
        expect(gatewayAccounts).to.have.lengthOf(2)
        expect(gatewayAccounts.map(accountObj => accountObj.id)).to.include('DIRECT_DEBIT:sadasdkasjdlkjlkeuo2', 'DIRECT_DEBIT:adashdkjlq3434lk')
      }).should.notify(done)
    })

    it('should not call direct debit connector for card accounts', function (done) {
      const gatewayAccountId1 = '1'
      const gatewayAccountId2 = '2'
      const testAccount1 = gatewayAccountFixtures.validGatewayAccountResponse({
        gateway_account_id: gatewayAccountId1,
        service_name: 'ga 1'
      }).getPlain()
      const testAccount2 = gatewayAccountFixtures.validGatewayAccountResponse({
        gateway_account_id: gatewayAccountId2,
        service_name: 'ga 2'
      }).getPlain()
      connectorMock.get(`${CONNECTOR_ACCOUNT_PATH}/${gatewayAccountId1}`)
        .reply(200, testAccount1)
      connectorMock.get(`${CONNECTOR_ACCOUNT_PATH}/${gatewayAccountId2}`)
        .reply(200, testAccount2)
      directDebitConnectorMock.get(`${DIRECT_DEBIT_CONNECTOR_ACCOUNT_PATH}/${gatewayAccountId1}`)
        .reply(404)
      directDebitConnectorMock.get(`${DIRECT_DEBIT_CONNECTOR_ACCOUNT_PATH}/${gatewayAccountId2}`)
        .reply(404)
      serviceService.getGatewayAccounts([gatewayAccountId1, gatewayAccountId2], correlationId).should.be.fulfilled.then(gatewayAccounts => {
        expect(directDebitConnectorMock.isDone()).to.be.false // eslint-disable-line no-unused-expressions
        expect(connectorMock.isDone()).to.be.true // eslint-disable-line no-unused-expressions
        expect(gatewayAccounts).to.have.lengthOf(2)
        expect(gatewayAccounts.map(accountObj => accountObj.id)).to.include('1', '2')
      }).should.notify(done)
    })
  })

  describe('when editing service name', function () {
    it('should not call direct debit connector for card accounts', function (done) {
      const externalServiceId = 'sdfjksdnfkjn'
      const newServiceName = 'blabla'
      const gatewayAccountId1 = '1'
      const gatewayAccountId2 = '2'
      const connectorServiceNameUrl1 = CONNECTOR_SERVICE_NAME_PATH.replace('{accountId}', gatewayAccountId1)
      const connectorServiceNameUrl2 = CONNECTOR_SERVICE_NAME_PATH.replace('{accountId}', gatewayAccountId2)
      adminusersMock.patch(`${ADMINUSERS_SERVICE_NAME_URL}/${externalServiceId}`).reply(200, {
        gateway_account_ids: [gatewayAccountId1, gatewayAccountId2]
      })
      productsMock.patch(`${PRODUCTS_SERVICE_NAME_PATH}/${gatewayAccountId1}`).reply(200)
      productsMock.patch(`${PRODUCTS_SERVICE_NAME_PATH}/${gatewayAccountId2}`).reply(200)
      connectorMock.patch(connectorServiceNameUrl1).reply(200)
      connectorMock.patch(connectorServiceNameUrl2).reply(200)
      directDebitConnectorMock.get(`${DIRECT_DEBIT_CONNECTOR_ACCOUNT_PATH}/${gatewayAccountId1}`)
        .reply(404)
      directDebitConnectorMock.get(`${DIRECT_DEBIT_CONNECTOR_ACCOUNT_PATH}/${gatewayAccountId2}`)
        .reply(404)
      serviceService.updateServiceName(externalServiceId, newServiceName, correlationId).should.be.fulfilled.then(() => {
        expect(directDebitConnectorMock.isDone()).to.be.false // eslint-disable-line no-unused-expressions
        expect(connectorMock.isDone()).to.be.true // eslint-disable-line no-unused-expressions
        expect(productsMock.isDone()).to.be.true // eslint-disable-line no-unused-expressions
      }).should.notify(done)
    })
    it('should not call producs nor connector for direct debit accounts', function (done) {
      const externalServiceId = 'sdfjksdnfkjn'
      const newServiceName = 'blabla'
      const gatewayAccountId1 = 'DIRECT_DEBIT:adashdkjlq3434lk'
      const gatewayAccountId2 = 'DIRECT_DEBIT:sadasdkasjdlkjlkeuo2'
      const connectorServiceNameUrl1 = CONNECTOR_SERVICE_NAME_PATH.replace('{accountId}', gatewayAccountId1)
      const connectorServiceNameUrl2 = CONNECTOR_SERVICE_NAME_PATH.replace('{accountId}', gatewayAccountId2)
      adminusersMock.patch(`${ADMINUSERS_SERVICE_NAME_URL}/${externalServiceId}`).reply(200, {
        gateway_account_ids: [gatewayAccountId1, gatewayAccountId2]
      })
      productsMock.patch(`${PRODUCTS_SERVICE_NAME_PATH}/${gatewayAccountId1}`).reply(404)
      productsMock.patch(`${PRODUCTS_SERVICE_NAME_PATH}/${gatewayAccountId2}`).reply(404)
      connectorMock.patch(connectorServiceNameUrl1).reply(404)
      connectorMock.patch(connectorServiceNameUrl2).reply(404)
      directDebitConnectorMock.get(`${DIRECT_DEBIT_CONNECTOR_ACCOUNT_PATH}/${gatewayAccountId1}`)
        .reply(200)
      directDebitConnectorMock.get(`${DIRECT_DEBIT_CONNECTOR_ACCOUNT_PATH}/${gatewayAccountId2}`)
        .reply(200)
      serviceService.updateServiceName(externalServiceId, newServiceName, correlationId).should.be.fulfilled.then(() => {
        expect(connectorMock.isDone()).to.be.false // eslint-disable-line no-unused-expressions
        expect(productsMock.isDone()).to.be.false // eslint-disable-line no-unused-expressions
      }).should.notify(done)
    })
  })
})
