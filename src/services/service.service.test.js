const proxyquire = require('proxyquire')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
const sinon = require('sinon')
const { validServiceResponse } = require('@test/fixtures/service.fixtures')

const expect = chai.expect

let connectorClientStub
let adminusersClientStub
let serviceService

describe('service service', function () {
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
              resolve(validServiceResponse({ gateway_account_ids: ['1'] }))
            })
          }
        }
      }
      serviceService = proxyquire('./service.service',
        {
          '../services/clients/connector.client': connectorClientStub,
          './clients/adminusers.client': adminusersClientStub
        })

      const service = await serviceService.updateServiceName(externalServiceId, newServiceName)
      expect(service).to.have.property('gatewayAccountIds').to.deep.equal(['1'])
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
      const gatewayAccountIds = ['10', '9']
      const patchServiceName = sinon.stub()
      patchServiceName.resolves()
      adminusersClientStub = () => {
        return {
          updateServiceName: () => {
            return new Promise(resolve => {
              return resolve(validServiceResponse({ gateway_account_ids: gatewayAccountIds }))
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
          '../services/clients/connector.client': connectorClientStub,
          './clients/adminusers.client': adminusersClientStub
        })

      const service = await serviceService.updateServiceName(externalServiceId, newServiceName)

      expect(patchServiceName.callCount).to.equal(2)
      expect(service).to.have.property('gatewayAccountIds').to.deep.equal(['10', '9'])
    })
  })
})
