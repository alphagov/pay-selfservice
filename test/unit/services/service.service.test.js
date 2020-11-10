'use strict'

const _ = require('lodash')
const proxyquire = require('proxyquire')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
const sinon = require('sinon')

const gatewayAccountFixtures = require('../../fixtures/gateway-account.fixtures')

const expect = chai.expect

// Constants
const correlationId = 'correlationId'

const gatewayAccountId1 = '1'
const gatewayAccountId2 = '2'
const nonExistentId = '3'
const directDebitAccountId1 = 'DIRECT_DEBIT:adashdkjlq3434lk'
const nonExistentDirectDebitId = 'DIRECT_DEBIT:XXXsadasdkasjdlkjlkeuo2'

let directDebitClientStub
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
          }).getPlain())
        })
      })
    }
  }
}

describe('service service', function () {
  describe('when getting gateway accounts', function () {
    it('should return card gateway accounts only for the valid ids', function (done) {
      connectorClientStub = {
        ConnectorClient: getGatewayAccounts
      }

      serviceService = proxyquire('../../../app/services/service.service',
        {
          '../services/clients/connector.client': connectorClientStub
        })

      serviceService.getGatewayAccounts([gatewayAccountId1, gatewayAccountId2, nonExistentId, directDebitAccountId1, nonExistentDirectDebitId], correlationId).then(gatewayAccounts => {
        expect(gatewayAccounts).to.have.lengthOf(2)
        expect(gatewayAccounts.map(accountObj => accountObj.id || accountObj.gateway_account_external_id))
          .to.have.all.members(['1', '2'])
        done()
      })
    })

    it('should not call direct debit connector for card accounts', function (done) {
      connectorClientStub = {
        ConnectorClient: getGatewayAccounts
      }

      serviceService = proxyquire('../../../app/services/service.service',
        {
          '../services/clients/connector.client': connectorClientStub
        })

      serviceService.getGatewayAccounts([gatewayAccountId1, gatewayAccountId2], correlationId).should.be.fulfilled.then(gatewayAccounts => {
        expect(gatewayAccounts).to.have.lengthOf(2)
        expect(gatewayAccounts.map(accountObj => accountObj.id)).to.have.all.members(['1', '2'])
      }).should.notify(done)
    })
  })

  describe('when editing service name', function () {
    it('should not call direct debit connector for card accounts', function (done) {
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
      directDebitClientStub = {
        isADirectDebitAccount: () => false
      }

      serviceService = proxyquire('../../../app/services/service.service',
        {
          '../services/clients/connector.client': connectorClientStub,
          '../services/clients/direct-debit-connector.client': directDebitClientStub,
          './clients/adminusers.client': adminusersClientStub
        })

      serviceService.updateServiceName(externalServiceId, newServiceName, correlationId).should.be.fulfilled.then((service) => {
        expect(JSON.stringify(service)).to.deep.equal('{"gatewayAccountIds":[1]}')
      }).should.notify(done)
    })
    it('should not call connector for direct debit accounts', function (done) {
      const externalServiceId = 'sdfjksdnfkjn'
      const newServiceName = 'blabla'
      connectorClientStub = {
        ConnectorClient: function () {
          return {
            patchServiceName: () => {
              return new Promise(() => {
                console.log('---> connector should not be called')
                done('should not be called')
              })
            }
          }
        }
      }
      adminusersClientStub = () => {
        return {
          updateServiceName: () => {
            return new Promise(resolve => {
              resolve({ gateway_account_ids: [10] })
            })
          }
        }
      }
      directDebitClientStub = {
        isADirectDebitAccount: () => true
      }

      serviceService = proxyquire('../../../app/services/service.service',
        {
          '../services/clients/connector.client': connectorClientStub,
          '../services/clients/direct-debit-connector.client': directDebitClientStub,
          './clients/adminusers.client': adminusersClientStub
        })

      serviceService.updateServiceName(externalServiceId, newServiceName, correlationId).should.be.fulfilled.then((service) => {
        expect(JSON.stringify(service)).to.deep.equal('{"gatewayAccountIds":[10]}')
      }).should.notify(done)
    })
  })

  describe('update current go live stage', function () {
    it('should update current go live stage', (done) => {
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
      serviceService = proxyquire('../../../app/services/service.service',
        {
          './clients/adminusers.client': adminusersClientStub
        })
      serviceService.updateCurrentGoLiveStage(serviceExternalId, newStage, correlationId).should.be.fulfilled.then((updatedStage) => {
        expect(JSON.stringify(updatedStage)).to.deep.equal('{"current_go_live_stage":"CHOSEN_PSP_STRIPE"}')
      }).should.notify(done)
    })
  })

  describe('when editing service name with multiple gateway accounts', function () {
    it('should call connector 2 times and not call direct debit connector at all', function (done) {
      const externalServiceId = 'ext3rnalserv1ce1d'
      const newServiceName = 'New Name'
      const gatewayAccountIds = [10, 9, directDebitAccountId1]
      const patchServiceName = sinon.stub()
      patchServiceName.resolves()
      adminusersClientStub = () => {
        return {
          updateServiceName: () => {
            return new Promise(resolve => {
              resolve({ gateway_account_ids: gatewayAccountIds })
            })
          }
        }
      }
      connectorClientStub = {
        ConnectorClient: function () {
          return {
            patchServiceName: patchServiceName
          }
        }
      }

      serviceService = proxyquire('../../../app/services/service.service',
        {
          '../services/clients/connector.client': connectorClientStub,
          '../services/clients/direct-debit-connector.client': directDebitClientStub,
          './clients/adminusers.client': adminusersClientStub
        })

      serviceService.updateServiceName(externalServiceId, newServiceName, correlationId).should.be.fulfilled
        .then((service) => {
          setTimeout(() => {
            expect(patchServiceName.callCount).to.equal(2)
          }, 250)
          expect(JSON.stringify(service)).to.deep.equal('{"gatewayAccountIds":[10,9,"DIRECT_DEBIT:adashdkjlq3434lk"]}')
        }).should.notify(done)
    })
  })
})
