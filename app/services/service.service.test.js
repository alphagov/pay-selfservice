'use strict'

const _ = require('lodash')
const proxyquire = require('proxyquire')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
const sinon = require('sinon')

const gatewayAccountFixtures = require('@test/fixtures/gateway-account.fixtures')

const expect = chai.expect

const gatewayAccountId1 = '1'
const gatewayAccountId2 = '2'
const nonExistentId = '3'

let connectorClientStub
let adminusersClientStub
let serviceService

const getGatewayAccounts = function () {
  return {
    getAccounts: function (obj) {
      return new Promise(function (resolve) {
        resolve({
          accounts: obj.gatewayAccountIds.filter(fil => fil !== nonExistentId).map(iter => gatewayAccountFixtures.validGatewayAccountResponse({
            gateway_account_id: iter,
            service_name: `account ${iter}`,
            type: _.sample(['test', 'live'])
          }))
        })
      })
    }
  }
}

describe('service service', function () {
  describe('when getting gateway accounts', function () {
    it('should return card gateway accounts only for the valid ids', async function () {
      connectorClientStub = {
        ConnectorClient: getGatewayAccounts
      }

      serviceService = proxyquire('./service.service',
        {
          './clients/connector.client': connectorClientStub
        })

      const gatewayAccounts = await serviceService.getGatewayAccounts([gatewayAccountId1, gatewayAccountId2, nonExistentId])

      expect(gatewayAccounts).to.have.lengthOf(2)
      expect(gatewayAccounts.map(accountObj => accountObj.id || accountObj.gateway_account_external_id))
        .to.have.all.members(['1', '2'])
    })
  })

  describe('when editing service name', function () {
    it('should update service name', async function () {
      const externalServiceId = 'sdfjksdnfkjn'
      const newServiceName = 'blabla'

      connectorClientStub = {
        ConnectorClient: function () {
          return {
            patchServiceName: () => {
              return new Promise(resolve => {
                resolve()
              })
            }
          }
        }
      }
      adminusersClientStub = () => {
        return {
          updateServiceName: () => {
            return new Promise(resolve => {
              resolve({ gateway_account_ids: [1] })
            })
          }
        }
      }
      serviceService = proxyquire('./service.service',
        {
          './clients/connector.client': connectorClientStub,
          './clients/adminusers.client': adminusersClientStub
        })

      const service = await serviceService.updateServiceName(externalServiceId, newServiceName)
      expect(JSON.stringify(service)).to.deep.equal('{"gatewayAccountIds":[1]}')
    })
  })

  describe('update current go live stage', function () {
    it('should update current go live stage', async () => {
      const serviceExternalId = 'fjdjsf33onesdf'
      const newStage = 'CHOSEN_PSP_STRIPE'
      adminusersClientStub = () => {
        return {
          updateCurrentGoLiveStage: () => {
            return new Promise(resolve => {
              resolve({ current_go_live_stage: newStage })
            })
          }
        }
      }
      serviceService = proxyquire('./service.service',
        {
          './clients/adminusers.client': adminusersClientStub
        })

      const updatedStage = await serviceService.updateCurrentGoLiveStage(serviceExternalId, newStage)

      expect(JSON.stringify(updatedStage)).to.deep.equal('{"current_go_live_stage":"CHOSEN_PSP_STRIPE"}')
    })
  })

  describe('when editing service name with multiple gateway accounts', function () {
    it('should call connector 2 times', async function () {
      const externalServiceId = 'ext3rnalserv1ce1d'
      const newServiceName = 'New Name'
      const gatewayAccountIds = [10, 9]
      const patchServiceName = sinon.stub()
      patchServiceName.resolves()
      adminusersClientStub = () => {
        return {
          updateServiceName: () => {
            return new Promise(resolve => {
              return resolve({ gateway_account_ids: gatewayAccountIds })
            })
          }
        }
      }
      connectorClientStub = {
        ConnectorClient: function () {
          return {
            patchServiceName
          }
        }
      }
      serviceService = proxyquire('./service.service',
        {
          './clients/connector.client': connectorClientStub,
          './clients/adminusers.client': adminusersClientStub
        })

      const service = await serviceService.updateServiceName(externalServiceId, newServiceName)

      expect(patchServiceName.callCount).to.equal(2)
      expect(JSON.stringify(service)).to.deep.equal('{"gatewayAccountIds":[10,9]}')
    })
  })
})
