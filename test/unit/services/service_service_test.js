"use strict";

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const nock = require('nock');
chai.use(chaiAsPromised);
const GatewayAccount = require('../../../app/models/GatewayAccount.class');

// Local Dependencies
const serviceService = require('../../../app/services/service_service');
const gatewayAccountFixtures = require('../../fixtures/gateway_account_fixtures');

const connectorMock = nock(process.env.CONNECTOR_URL);
const CONNECTOR_ACCOUNT_PATH = "/v1/frontend/accounts";

const expect = chai.expect;
const correlationId = 'correlationId';

describe('service service', function () {

  afterEach(function () {
    nock.cleanAll();
  });

  it('should return gateway accounts for the valid ids', function (done) {
    const gatewayAccountId1 = '1', gatewayAccountId2 = '2', nonExistentId = '3';
    const testConnectorAccount1 = gatewayAccountFixtures.validGatewayAccountResponse({
      gateway_account_id: gatewayAccountId1,
      service_name: 'ga 1'
    }).getPlain();
    const testConnectorAccount2 = gatewayAccountFixtures.validGatewayAccountResponse({
      gateway_account_id: gatewayAccountId2,
      service_name: 'ga 2'
    }).getPlain();

    connectorMock.get(`${CONNECTOR_ACCOUNT_PATH}/${gatewayAccountId1}`)
      .reply(200, testConnectorAccount1);
    connectorMock.get(`${CONNECTOR_ACCOUNT_PATH}/${gatewayAccountId2}`)
      .reply(200, testConnectorAccount2);
    connectorMock.get(`${CONNECTOR_ACCOUNT_PATH}/${nonExistentId}`)
      .reply(404); //NOT FOUND

    serviceService.getGatewayAccounts([gatewayAccountId1, gatewayAccountId2], correlationId).should.be.fulfilled.then(gatewayAccounts => {
      expect(gatewayAccounts).to.have.lengthOf(2);
      expect(gatewayAccounts.map(accountObj => accountObj.id)).to.include("1", "2");
    }).should.notify(done);

  });

});
