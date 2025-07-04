'use strict'

const proxyquire = require('proxyquire')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const sinon = require('sinon')
const { CREATED } = require('@models/constants/psp-test-account-stage')
const expect = chai.expect
chai.use(chaiAsPromised)

describe('service service', function () {
  describe('when creating a service', function () {
    const SERVICE_NAME = 'Garden Gnome Removal Service'
    const WELSH_SERVICE_NAME = 'Gwasanaeth Tynnu Corachod Gardd'
    const SERVICE_EXTERNAL_ID = 'service-external-id'
    const createService = sinon.stub().resolves({
      externalId: SERVICE_EXTERNAL_ID
    })
    const addGatewayAccountsToService = sinon.stub().resolves()
    const updatePspTestAccountStage = sinon.stub().resolves()
    const adminUsersStub = () => {
      return {
        createService,
        addGatewayAccountsToService,
        updatePspTestAccountStage
      }
    }

    const createGatewayAccount = sinon.stub().resolves({
      id: '1',
      externalId: 'sandbox-external-id'
    })
    const requestStripeTestAccount = sinon.stub().resolves({
      gateway_account_id: '2',
      gateway_account_external_id: 'stripe-test-external-id'
    })
    const connectorStub = {
      ConnectorClient: function () {
        return {
          createGatewayAccount,
          requestStripeTestAccount
        }
      }
    }
    const serviceService = proxyquire('./service.service',
      {
        './clients/connector.client': connectorStub,
        './clients/adminusers.client': adminUsersStub
      })

    afterEach(() => {
      sinon.resetHistory()
    })

    it('should assign gateway account id of stripe account to service if org type is local', async function () {
      const { service } = await serviceService.createService(SERVICE_NAME, WELSH_SERVICE_NAME, 'local')
      expect(service.externalId).to.equal(SERVICE_EXTERNAL_ID)
      expect(requestStripeTestAccount.callCount).to.equal(1)
      expect(updatePspTestAccountStage.callCount).to.equal(1)
      sinon.assert.calledWith(createService, SERVICE_NAME, WELSH_SERVICE_NAME)
      sinon.assert.calledWith(createGatewayAccount, 'sandbox', 'test', SERVICE_NAME, null, SERVICE_EXTERNAL_ID)
      sinon.assert.calledWith(requestStripeTestAccount, SERVICE_EXTERNAL_ID)
      sinon.assert.calledWith(addGatewayAccountsToService, SERVICE_EXTERNAL_ID, ['2'])
      sinon.assert.calledWith(updatePspTestAccountStage, SERVICE_EXTERNAL_ID, CREATED)
    })

    it('should assign gateway account id of sandbox account to service if org type is central', async function () {
      const { service } = await serviceService.createService(SERVICE_NAME, WELSH_SERVICE_NAME, 'central')
      expect(service.externalId).to.equal(SERVICE_EXTERNAL_ID)
      sinon.assert.calledWith(createService, SERVICE_NAME, WELSH_SERVICE_NAME)
      sinon.assert.calledWith(createGatewayAccount, 'sandbox', 'test', SERVICE_NAME, null, SERVICE_EXTERNAL_ID)
      sinon.assert.calledWith(addGatewayAccountsToService, SERVICE_EXTERNAL_ID, ['1'])
      sinon.assert.notCalled(requestStripeTestAccount)
      sinon.assert.notCalled(updatePspTestAccountStage)
    })
  })
})
