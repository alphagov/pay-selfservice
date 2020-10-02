'use strict'

const _ = require('lodash')
const sinon = require('sinon')

const gatewayAccountFixtures = require('../../fixtures/gateway-account.fixtures')

// Constants
const correlationId = 'correlationId'

const gatewayAccountId1 = '1'
const gatewayAccountId2 = '2'
const nonExistentId = '3'
const directDebitAccountId1 = 'DIRECT_DEBIT:adashdkjlq3434lk'
const directDebitAccountId2 = 'DIRECT_DEBIT:sadasdkasjdlkjlkeuo2'
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

const getDDGatewayAccounts = function (obj) {
  return new Promise(function (resolve) {
    resolve({
      accounts: obj.gatewayAccountIds.filter(fil => fil !== nonExistentDirectDebitId).map(iter => gatewayAccountFixtures.validDirectDebitGatewayAccountResponse({
        gateway_account_id: iter,
        gateway_account_external_id: iter,
        service_name: `account ${iter}`,
        type: _.sample(['test', 'live'])
      }).getPlain())
    })
  })
}

jest.mock('../services/clients/connector.client', () => connectorClientStub);

jest.mock(
  '../services/clients/direct-debit-connector.client',
  () => directDebitClientStub
);

describe('service service', () => {
  describe('when getting gateway accounts', () => {
    it('should return gateway accounts for the valid ids', done => {
      directDebitClientStub = {
        gatewayAccounts: {
          get: getDDGatewayAccounts
        }
      }

      connectorClientStub = {
        ConnectorClient: getGatewayAccounts
      }

      serviceService = require('../../../app/services/service.service')

      serviceService.getGatewayAccounts([gatewayAccountId1, gatewayAccountId2, nonExistentId, directDebitAccountId1, nonExistentDirectDebitId], correlationId).then(gatewayAccounts => {
        expect(gatewayAccounts).toHaveLength(3)
        expect(gatewayAccounts.map(accountObj => accountObj.id || accountObj.gateway_account_external_id)).toEqual(expect.arrayContaining(['1', '2', 'DIRECT_DEBIT:adashdkjlq3434lk']))
        done()
      })
    })

    it(
      'should not call connector for retrieving direct debit accounts',
      done => {
        directDebitClientStub = {
          gatewayAccounts: {
            get: getDDGatewayAccounts
          },
          isADirectDebitAccount: () => true
        }

        connectorClientStub = {
          ConnectorClient: function () {
            return {
              getAccounts: () => {
                return new Promise(() => {
                  done('connector should not be called')
                })
              }
            }
          }
        }

        serviceService = proxyquire('../../../app/services/service.service',
          {
            '../services/clients/connector.client': connectorClientStub,
            '../services/clients/direct-debit-connector.client': directDebitClientStub
          })

        serviceService.getGatewayAccounts([directDebitAccountId1, directDebitAccountId2], correlationId).then(gatewayAccounts => {
          expect(gatewayAccounts).toHaveLength(2)
          expect(gatewayAccounts.map(accountObj => accountObj.external_id)).toEqual(
            expect.arrayContaining(['DIRECT_DEBIT:sadasdkasjdlkjlkeuo2', 'DIRECT_DEBIT:adashdkjlq3434lk'])
          )
          done()
        })
      }
    )

    it('should not call direct debit connector for card accounts', () => {
      directDebitClientStub = {
        gatewayAccounts: {
          get: Promise.reject(new Error('dd connector should not be called'))
        },
        isADirectDebitAccount: () => false
      }

      connectorClientStub = {
        ConnectorClient: getGatewayAccounts
      }

      serviceService = proxyquire('../../../app/services/service.service',
        {
          '../services/clients/connector.client': connectorClientStub,
          '../services/clients/direct-debit-connector.client': directDebitClientStub
        })

      return serviceService.getGatewayAccounts([gatewayAccountId1, gatewayAccountId2], correlationId)
        .then(gatewayAccounts => {
          expect(gatewayAccounts).toHaveLength(2)
          expect(gatewayAccounts.map(accountObj => accountObj.id)).toEqual(expect.arrayContaining(['1', '2']))
        });
    })
  })

  describe('when editing service name', () => {
    it('should not call direct debit connector for card accounts', () => {
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
        gatewayAccount: {
          create: () => Promise.reject(new Error('dd connector should not be called')),
          get: () => Promise.reject(new Error('dd connector should not be called'))
        },
        isADirectDebitAccount: () => false
      }

      serviceService = proxyquire('../../../app/services/service.service',
        {
          '../services/clients/connector.client': connectorClientStub,
          '../services/clients/direct-debit-connector.client': directDebitClientStub,
          './clients/adminusers.client': adminusersClientStub
        })

      return serviceService.updateServiceName(externalServiceId, newServiceName, correlationId)
        .then((service) => {
          expect(JSON.stringify(service)).toEqual('{"gatewayAccountIds":[1]}')
        });
    })
    it('should not call connector for direct debit accounts', () => {
      const externalServiceId = 'sdfjksdnfkjn'
      const newServiceName = 'blabla'
      connectorClientStub = {
        ConnectorClient: function () {
          return {
            patchServiceName: () => Promise.reject(new Error('dd connector should not be called'))
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
        gatewayAccount: {
          create: () => Promise.reject(new Error('dd connector should not be called')),
          get: () => Promise.reject(new Error('dd connector should not be called'))
        },
        isADirectDebitAccount: () => true
      }

      serviceService = proxyquire('../../../app/services/service.service',
        {
          '../services/clients/connector.client': connectorClientStub,
          '../services/clients/direct-debit-connector.client': directDebitClientStub,
          './clients/adminusers.client': adminusersClientStub
        })

      return serviceService.updateServiceName(externalServiceId, newServiceName, correlationId)
        .then((service) => {
          expect(JSON.stringify(service)).toEqual('{"gatewayAccountIds":[10]}')
        });
    })
  })

  describe('update current go live stage', () => {
    it('should update current go live stage', () => {
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
      return serviceService.updateCurrentGoLiveStage(serviceExternalId, newStage, correlationId)
        .then((updatedStage) => {
          expect(JSON.stringify(updatedStage)).toEqual('{"current_go_live_stage":"CHOSEN_PSP_STRIPE"}')
        });
    })
  })

  describe('when editing service name with multiple gateway accounts', () => {
    it(
      'should call connector 2 times and not call direct debit connector at all',
      () => {
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
        directDebitClientStub = {
          gatewayAccount: {
            create: () => Promise.reject(new Error('dd connector should not be called')),
            get: () => Promise.reject(new Error('dd connector should not be called'))
          }
        }

        serviceService = proxyquire('../../../app/services/service.service',
          {
            '../services/clients/connector.client': connectorClientStub,
            '../services/clients/direct-debit-connector.client': directDebitClientStub,
            './clients/adminusers.client': adminusersClientStub
          })

        return serviceService.updateServiceName(externalServiceId, newServiceName, correlationId)
          .then((service) => {
            setTimeout(() => {
              expect(patchServiceName.callCount).toBe(2)
            }, 250)
            expect(JSON.stringify(service)).toEqual('{"gatewayAccountIds":[10,9,"DIRECT_DEBIT:adashdkjlq3434lk"]}')
          });
      }
    )
  })
})
